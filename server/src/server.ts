import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import WebSocket from 'ws';
import {URL} from 'url';
import bodyParser from 'body-parser';
import expressWS from 'express-ws';
import axios from 'axios';
import * as DataTypes from '@dataTypes';
import ObjectMatcher from '@server/ObjectMatcher';
import _ from 'underscore';
const enableDestroy = require('server-destroy');

enum Reply {
  SERVICES = 'SERVICES',
  CONNECTIONS = 'CONNECTIONS',
  UPDATE = 'UPDATE',
  CURRENT_STATES = 'CURRENT_STATES',
  NOT_RECOGNIZED = 'COMMAND NOT RECOGNIZED',
}

enum Command {
  GET_SERVICES = 'GET_SERVICES',
  GET_CONNECTIONS = 'GET_CONNECTIONS',
  GET_CURRENT_STATES = 'GET_CURRENT_STATES',
}

enum ConfigPaths {
  SERVICES = '/services',
  CONNECTIONS = '/connections',
}

interface IMessage {
  reply: Reply;
  content?:
    | DataTypes.IService[]
    | DataTypes.IConnection[]
    | DataTypes.IServiceStatus
    | DataTypes.IServiceStatus[];
}

class StatusMonitoringServer {
  app: express.Application;
  serverInstance: any;
  appws: expressWS.Application;
  websocketServer: WebSocket.Server;
  services: DataTypes.IService[] = [];
  servicesStatus: DataTypes.IServiceStatus[] = [];
  timeouts: {[serviceId: string]: NodeJS.Timer} = {};
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
    this.listen(listeningPort);
    this.setUpWebSockets();
  }

  private listen(listeningPort: number) {
    this.port = listeningPort;
    this.serverInstance = this.app.listen(this.port);
    enableDestroy(this.serverInstance);
  }

  public start(configApiUrl: string): Promise<any> {
    this.configApiUrl = configApiUrl;
    return axios
      .all([
        axios.get(this.configApiUrl + ConfigPaths.SERVICES),
        axios.get(this.configApiUrl + ConfigPaths.CONNECTIONS),
      ])
      .then((values: any[]) => {
        this.services = values[0].data;
        this.connections = values[1].data;
        this.setupWatchdogs(this.services);
      });
  }

  public getServicesStatus(): DataTypes.IServiceStatus[] {
    return _.map(this.servicesStatus, _.clone);
  }

  public getServicesStatusById(id: string): DataTypes.IServiceStatus {
    const index: number = _.findIndex(this.servicesStatus, {serviceId: id});
    return Object.assign({}, this.servicesStatus[index]);
  }

  private notifyIfServiceStatusUpdated(
    id: string,
    healthy: DataTypes.Status,
    responseBody: string,
  ) {
    const ss: DataTypes.IServiceStatus = _.findWhere(this.servicesStatus, {
      serviceId: id,
    });
    if (ss.status != healthy) {
      const statusReport: DataTypes.IServiceStatus = {
        serviceId: id,
        status: healthy,
        responseBody: responseBody,
      };
      let msg: IMessage = {
        reply: Reply.UPDATE,
        content: statusReport,
      };
      const index: number = _.findIndex(this.servicesStatus, {serviceId: id});
      this.servicesStatus[index] = statusReport;
      this.broadcastMessage(msg);
    }
  }

  private pollHealthcheck(service: DataTypes.IService): void {
    let t: NodeJS.Timer = setTimeout(() => {
      axios
        .get(service.uri)
        .then(response => {
          const responseBody = response.data;
          const state: DataTypes.Status = ObjectMatcher(
            responseBody,
            service.matcher,
          )
            ? DataTypes.Status.HEALTHY
            : DataTypes.Status.UNHEALTHY;
          this.notifyIfServiceStatusUpdated(service.id, state, responseBody);
        })
        .catch(error => {
          this.notifyIfServiceStatusUpdated(
            service.id,
            DataTypes.Status.UNHEALTHY,
            error,
          );
        })
        .finally(() => {
          this.pollHealthcheck(service);
        });
    }, service.timeout * 1000);
    this.timeouts[service.id] = t;
  }

  private setupWatchdogs(services: DataTypes.IService[]): void {
    services.forEach(service => {
      const statusReport: DataTypes.IServiceStatus = {
        serviceId: service.id,
        status: DataTypes.Status.HEALTHY,
        responseBody: 'NOT YET VERIFIED',
      };
      this.servicesStatus.push(statusReport);
      this.pollHealthcheck(service);
    });
  }

  public broadcastMessage(msg: IMessage): void {
    this.websocketServer.clients.forEach(client => {
      client.send(JSON.stringify(msg));
    });
  }

  private disconnectAllClients(): void {
    this.websocketServer.clients.forEach(client => {
      client.removeAllListeners();
      client.close();
    });
  }

  private setUpWebSockets(): void {
    this.appws.ws('/channel', (ws: WebSocket, req: any) => {
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
          case Command.GET_CURRENT_STATES:
            msg = {
              reply: Reply.CURRENT_STATES,
              content: this.getServicesStatus(),
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

  private clearAnyRunningTimeouts() {
    for (let key in this.timeouts) {
      clearTimeout(this.timeouts[key]);
    }
    this.timeouts = {};
  }

  public destroy(cb: any): void {
    this.clearAnyRunningTimeouts();
    this.disconnectAllClients();
    if (this.serverInstance) {
      this.serverInstance.destroy(cb);
    }
  }
}

export {StatusMonitoringServer, IMessage, Reply};
