import express from 'express';
import http from 'http';
import httpProxy from 'http-proxy';
import path from 'path';
import fs from 'fs';
import WebSocket from 'ws';
import {URL} from 'url';
import bodyParser from 'body-parser';
import expressWS from 'express-ws';
import axios from 'axios';
import * as DataTypes from '@dataTypes';
const enableDestroy = require('server-destroy');

enum Reply {
  SERVICES = 'SERVICES',
  CONNECTIONS = 'CONNECTIONS',
  NOT_RECOGNIZED = 'COMMAND NOT RECOGNIZED',
}

enum Command {
  GET_SERVICES = 'GET_SERVICES',
  GET_CONNECTIONS = 'GET_CONNECTIONS',
}

enum ConfigPaths {
  SERVICES = '/services',
  CONNECTIONS = '/connections',
}

interface IMessage {
  reply: Reply | string;
  content?: DataTypes.IService[] | DataTypes.IConnection[] | string;
}

class StatusMonitoringServer {
  app: express.Application;
  serverInstance: any;
  appws: expressWS.Application;
  websocketServer: WebSocket.Server;
  services: DataTypes.IService[] = [];
  connections: DataTypes.IConnection[] = [];
  private configApiUrl: string;
  private port: number;
  constructor() {
    this.app = express();
    const expWS = expressWS(this.app);
    this.websocketServer = expWS.getWss();
    this.appws = expWS.app;
    this.app.use(bodyParser.json());
    this.app.use(express.static(path.join(__dirname, '../../dist')));
  }

  init(listeningPort: number) {
    this.port = listeningPort;
    this.listen();
    this.setUpWebSockets();
  }

  private listen() {
    this.serverInstance = this.app.listen(this.port);
    enableDestroy(this.serverInstance);
  }

  start(configApiUrl: string): Promise<any> {
    this.configApiUrl = configApiUrl;
    return axios
      .all([
        axios.get(this.configApiUrl + ConfigPaths.SERVICES),
        axios.get(this.configApiUrl + ConfigPaths.CONNECTIONS),
      ])
      .then((values: any[]) => {
        this.services = values[0].data;
        this.connections = values[1].data;
      });
  }

  private setupWatchdog(services: DataTypes.IService[]) {
    //for each service
    //setup interval
    //
    //
  }

  public broadcastMessage(msg: IMessage) {
    this.websocketServer.clients.forEach(client => {
      client.send(JSON.stringify(msg));
    });
  }

  private setUpWebSockets() {
    this.appws.ws('/channel', (ws: WebSocket, req: any) => {
      ws.on('connection', () => {
        console.log('connected!');
      });
      ws.on('message', (command: string) => {
        let msg: IMessage;
        switch (command) {
          case Command.GET_SERVICES:
            msg = {
              reply: Reply.SERVICES,
              content: this.services,
            };
            break;
          case Command.GET_CONNECTIONS:
            msg = {
              reply: Reply.CONNECTIONS,
              content: this.connections,
            };
            break;
          default:
            msg = {
              reply: Reply.NOT_RECOGNIZED,
            };
        }
        ws.send(JSON.stringify(msg));
      });
    });
  }
  destroy() {
    if (this.serverInstance) this.serverInstance.destroy();
  }
}
const server = new StatusMonitoringServer();
export {server, IMessage};
