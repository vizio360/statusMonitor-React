import {
  IServiceStatus,
  Command,
  Reply,
  IService,
  IConnection,
  IMessage,
} from '@dataTypes';
interface Callback {
  (service: IServiceStatus): void;
}

interface IStatusMonitorClient {
  getServices(): IService[];
  getConnections(): IConnection[];
  connect(url: string): Promise<any>;
  on(eventName: string, callback: Callback): void;
}

class StatusMonitorClient implements IStatusMonitorClient {
  ws: WebSocket;

  _services: IService[];
  _connections: IConnection[];
  resolveConnection: any;
  gotServices: boolean;
  gotConnections: boolean;
  connected: boolean;
  reloaded: boolean;
  updateListeners: Callback[];
  reloadListeners: Callback[];
  errorListeners: Callback[];

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
        case Reply.UPDATE:
          const statusReport: IServiceStatus = msg.content as IServiceStatus;
          this.updateListeners.forEach((callback: Callback) => {
            callback.call(null, statusReport);
          });
          break;
        case Reply.RELOADED:
          this.ws.send(Command.GET_SERVICES);
          this.ws.send(Command.GET_CONNECTIONS);
          this.reloaded = true;
          break;
        case Reply.RELOAD_ERROR:
          this.errorListeners.forEach((callback: Callback) => {
            callback.call(null, 'An error occurred while reloading');
          });
          break;
      }

      if (this.gotServices && this.gotConnections) {
        if (this.reloaded) {
          this.gotServices = this.gotConnections = false;
          this.reloaded = false;
          this.reloadListeners.forEach((callback: Callback) => {
            callback.call(null);
          });
        }

        if (!this.connected) {
          this.gotServices = this.gotConnections = false;
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
      };
      this.ws.onerror = error => {
        reject(error);
      };
    });
  }

  public getServices(): IService[] {
    return this._services;
  }

  public getConnections(): IConnection[] {
    return this._connections;
  }

  public on(eventName: string, callback: Callback) {
    switch (eventName) {
      case 'update':
        this.updateListeners.push(callback);
        break;
      case 'reloaded':
        this.reloadListeners.push(callback);
        break;
      case 'error':
        this.errorListeners.push(callback);
        break;
    }
  }

  static getInstance(): IStatusMonitorClient {
    return new StatusMonitorClient();
  }
}

export {StatusMonitorClient, IStatusMonitorClient};
