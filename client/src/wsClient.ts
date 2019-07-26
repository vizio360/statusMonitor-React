import {Command, Reply, IService, IConnection, IMessage} from '@dataTypes';
export default class StatusMonitorClient {
  ws: WebSocket;

  _services: IService[];
  _connections: IConnection[];
  resolveConnection: any;
  gotServices: boolean;
  gotConnections: boolean;
  connected: boolean;

  private constructor() {
    this.connected = false;
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

        //update
        //reloaded
      }
      if (!this.connected && this.gotServices && this.gotConnections) {
        this.gotServices = this.gotConnections = false;
        this.connected = true;
        this.resolveConnection();
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

  static getInstance() {
    return new StatusMonitorClient();
  }
}
