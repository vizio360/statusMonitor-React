import {
  IServiceLastKnownState,
  Command,
  Reply,
  IService,
  IConnection,
  IMessage,
} from '@dataTypes';
import _ from 'underscore';

interface UpdateCallback {
  (service: IServiceLastKnownState): void;
}
interface ErrorCallback {
  (error: string): void;
}
interface ReloadCallback {
  (): void;
}
interface IStatusMonitorClient {
  getServices(): IService[];
  getConnections(): IConnection[];
  getServicesLastKnownState(): IServiceLastKnownState[];
  connect(url: string): Promise<any>;
  onUpdate(callback: UpdateCallback): void;
  onError(callback: ErrorCallback): void;
  onReload(callback: ReloadCallback): void;
}

class StatusMonitorClient implements IStatusMonitorClient {
  ws: WebSocket;

  _services: IService[];
  _connections: IConnection[];
  _lastKnownStates: IServiceLastKnownState[];
  resolveConnection: any;
  gotServices: boolean;
  gotConnections: boolean;
  gotLastKnownStates: boolean;
  connected: boolean;
  reloaded: boolean;
  updateListeners: UpdateCallback[];
  reloadListeners: ReloadCallback[];
  errorListeners: ErrorCallback[];

  private constructor() {
    this.connected = false;
    this.reloaded = false;
    this.updateListeners = [];
    this.reloadListeners = [];
    this.errorListeners = [];
  }

  public connect(uri: string) {
    if (this.connected) throw new Error('Client already connected!');

    this.gotConnections = false;
    this.gotServices = false;
    this.gotLastKnownStates = false;
    this.ws = new WebSocket(uri);
    this.ws.onmessage = event => {
      const msg: IMessage = JSON.parse(event.data);
      switch (msg.reply) {
        case Reply.SERVICES:
          this._services = msg.content as IService[];
          this.gotServices = true;
          break;
        case Reply.CONNECTIONS:
          this._connections = msg.content as IConnection[];
          this.gotConnections = true;
          break;
        case Reply.CURRENT_STATES:
          this._lastKnownStates = msg.content as IServiceLastKnownState[];
          this.gotLastKnownStates = true;
          break;
        case Reply.UPDATE:
          if (this.connected) {
            const statusReport: IServiceLastKnownState = msg.content as IServiceLastKnownState;
            this.updateListeners.forEach((callback: UpdateCallback) => {
              callback(statusReport);
            });
          }
          break;
        case Reply.RELOADED:
          this.ws.send(Command.GET_SERVICES);
          this.ws.send(Command.GET_CONNECTIONS);
          this.ws.send(Command.GET_CURRENT_STATES);
          this.reloaded = true;
          break;
        case Reply.RELOAD_ERROR:
          this.errorListeners.forEach((callback: ErrorCallback) => {
            callback('An error occurred while reloading');
          });
          break;
      }

      if (this.gotServices && this.gotConnections && this.gotLastKnownStates) {
        if (this.reloaded) {
          this.gotServices = this.gotConnections = this.gotLastKnownStates = false;
          this.reloaded = false;
          this.reloadListeners.forEach((callback: ReloadCallback) => {
            callback();
          });
        }

        if (!this.connected) {
          this.gotServices = this.gotConnections = this.gotLastKnownStates = false;
          this.connected = true;
          this.resolveConnection();
        }
      }
    };
    return new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.ws.onopen = () => {
        this.ws.send(Command.GET_SERVICES);
        this.ws.send(Command.GET_CONNECTIONS);
        this.ws.send(Command.GET_CURRENT_STATES);
      };
      this.ws.onerror = error => {
        reject(error);
      };
    });
  }

  public getServices(): IService[] {
    return JSON.parse(JSON.stringify(this._services));
  }

  public getConnections(): IConnection[] {
    return JSON.parse(JSON.stringify(this._connections));
  }

  public getServicesLastKnownState(): IServiceLastKnownState[] {
    return JSON.parse(JSON.stringify(this._lastKnownStates));
  }

  public onUpdate(callback: UpdateCallback) {
    this.updateListeners.push(callback);
  }
  public onError(callback: ErrorCallback) {
    this.errorListeners.push(callback);
  }
  public onReload(callback: ReloadCallback) {
    this.reloadListeners.push(callback);
  }

  static getInstance(): IStatusMonitorClient {
    return new StatusMonitorClient();
  }
}

export {StatusMonitorClient, IStatusMonitorClient};
