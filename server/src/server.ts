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
}

interface IMessage {
  reply: Reply;
  content?: DataTypes.IService[] | DataTypes.IConnection[];
}

class StatusMonitoringServer {
  app: express.Application;
  serverInstance: any;
  appws: expressWS.Application;
  services: DataTypes.IService[] = [];
  connections: DataTypes.IConnection[] = [];
  private configApiUrl: string;
  private port: number;
  constructor() {
    this.app = express();
    this.appws = expressWS(this.app).app;
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
        axios.get(this.configApiUrl + '/services'),
        axios.get(this.configApiUrl + '/connections'),
      ])
      .then((values: any[]) => {
        this.services = values[0].data;
        this.connections = values[1].data;
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
          case 'GET_SERVICES':
            msg = {
              reply: Reply.SERVICES,
              content: this.services,
            };
            break;
          case 'GET_CONNECTIONS':
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

export default new StatusMonitoringServer();
