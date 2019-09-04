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
import {
  Command,
  IMessage,
  Reply,
  IService,
  IServiceLastKnownState,
  IConnection,
  Status,
} from '@dataTypes';
import ObjectMatcher from '@server/ObjectMatcher';
import _ from 'underscore';
const enableDestroy = require('server-destroy');

enum ConfigPaths {
  SERVICES = '/services',
  CONNECTIONS = '/connections',
}

class StatusMonitoringServer {
  app: express.Application;
  serverInstance: any;
  appws: expressWS.Application;
  websocketServer: WebSocket.Server;
  services: IService[] = [];
  servicesStatus: IServiceLastKnownState[] = [];
  timeouts: {[serviceId: string]: NodeJS.Timer} = {};
  connections: IConnection[] = [];
  private configApiUrl: string;
  private port: number;
  private proxyServer: httpProxy;

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
    this.setupWebSockets();
    this.setupRestAPI();
  }

  private setupProxy(target: string) {
    this.proxyServer = httpProxy.createProxyServer({target: target});
    this.app.post(ConfigPaths.SERVICES, (req, res) => {
      this.proxyServer.web(req, res);
    });
    this.app.post(ConfigPaths.CONNECTIONS, (req, res) => {
      this.proxyServer.web(req, res);
    });
  }

  private setupRestAPI() {
    this.app.post('/reload', (req, res) => {
      this.start(this.configApiUrl)
        .then(result => {
          const msg: IMessage = {
            reply: Reply.RELOADED,
          };
          this.broadcastMessage(msg);
        })
        .catch(error => {
          const msg: IMessage = {
            reply: Reply.RELOAD_ERROR,
          };
          this.broadcastMessage(msg);
        });
      res.sendStatus(200);
    });
  }

  private listen(listeningPort: number) {
    this.port = listeningPort;
    this.serverInstance = this.app.listen(this.port);
    enableDestroy(this.serverInstance);
  }

  public start(configApiUrl: string): Promise<any> {
    this.configApiUrl = configApiUrl;
    this.setupProxy(configApiUrl);
    this.clearAnyRunningTimeouts();
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

  public getServicesStatus(): IServiceLastKnownState[] {
    return _.map(this.servicesStatus, _.clone);
  }

  public getServicesStatusById(id: string): IServiceLastKnownState {
    const index: number = _.findIndex(this.servicesStatus, {serviceId: id});
    return Object.assign({}, this.servicesStatus[index]);
  }

  private notifyIfServiceStatusUpdated(
    serviceId: string,
    newStatus: Status,
    responseBody: string,
  ) {
    const ss: IServiceLastKnownState = _.findWhere(this.servicesStatus, {
      serviceId: serviceId,
    });
    if (ss.status != newStatus) {
      const statusReport: IServiceLastKnownState = {
        serviceId: serviceId,
        status: newStatus,
        responseBody: responseBody,
      };
      let msg: IMessage = {
        reply: Reply.UPDATE,
        content: statusReport,
      };
      const index: number = _.findIndex(this.servicesStatus, {
        serviceId: serviceId,
      });
      this.servicesStatus[index] = statusReport;
      this.broadcastMessage(msg);
    }
  }

  private pollHealthcheck(service: IService): void {
    let t: NodeJS.Timer = setTimeout(() => {
      axios
        .get(service.uri)
        .then(response => {
          const responseBody = response.data;
          const state: Status = ObjectMatcher(responseBody, service.matcher)
            ? Status.HEALTHY
            : Status.UNHEALTHY;
          this.notifyIfServiceStatusUpdated(service.id, state, responseBody);
        })
        .catch(error => {
          this.notifyIfServiceStatusUpdated(
            service.id,
            Status.UNHEALTHY,
            error,
          );
        })
        .finally(() => {
          this.pollHealthcheck(service);
        });
    }, service.timeout * 1000);
    this.timeouts[service.id] = t;
  }

  private setupWatchdogs(services: IService[]): void {
    services.forEach(service => {
      const statusReport: IServiceLastKnownState = {
        serviceId: service.id,
        status: Status.HEALTHY,
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

  private setupWebSockets(): void {
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
