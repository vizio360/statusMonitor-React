import {StatusMonitoringServer, IMessage, Reply} from '@server/server';
import WebSocket from 'ws';
import * as express from 'express';
import * as DataTypes from '@dataTypes';
import nock from 'nock';
import fs from 'fs';
import path from 'path';

describe('Status Monitoring Server', () => {
  const CONFIG_URI: string = 'http://configapi';
  const listeningPort: number = 4000;
  const connectionString: string = `ws://localhost:${listeningPort}/channel`;

  let getFileContentAsJSON = function(file: string) {
    let content: string = 'File does not exist';
    let fullPath: string = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
      content = fs.readFileSync(fullPath, {encoding: 'utf8'});
    }
    return JSON.parse(content);
  };

  let setupMockConfigAPI = function(
    resource: string,
    statusCode: number,
    responseBody: object,
  ) {
    nock(CONFIG_URI)
      .get(resource)
      .reply(statusCode, responseBody);
  };

  let server: StatusMonitoringServer = null;
  let activeWebSocketClients: WebSocketClient[] = [];

  beforeEach(() => {
    activeWebSocketClients = [];
    server = new StatusMonitoringServer();
    server.init(listeningPort);
  });

  afterEach(done => {
    activeWebSocketClients.forEach(wsc => {
      wsc.destroy();
    });
    server.destroy(done);
  });

  let setupServicesAndConnectionsMocks = (
    servicesStatus: number = 200,
    connectionsStatus: number = 200,
  ) => {
    setupMockConfigAPI(
      '/services',
      servicesStatus,
      getFileContentAsJSON('./mocks/services.json'),
    );

    setupMockConfigAPI(
      '/connections',
      connectionsStatus,
      getFileContentAsJSON('./mocks/connections.json'),
    );
  };

  class WebSocketClient {
    ws: WebSocket;
    onMessage: (data: string) => void;
    public connect(connection: string) {
      this.ws = new WebSocket(connection);
      activeWebSocketClients.push(this);

      return new Promise((resolve, reject) => {
        this.ws.on('open', () => {
          resolve('open');
        });
        this.ws.on('message', (data: string) => {
          if (this.onMessage) this.onMessage(data);
        });
      });
    }

    public send(command: string) {
      this.ws.send(command);
    }

    public destroy() {
      this.ws.removeAllListeners();
    }
  }

  let connectAndSendCommand = (command: string) => {
    return new Promise((resolve, reject) => {
      server
        .start(CONFIG_URI)
        .then(() => {
          const wsc: WebSocketClient = new WebSocketClient();
          wsc.onMessage = (data: string) => {
            resolve(JSON.parse(data));
          };
          wsc.connect(connectionString).then(result => wsc.send(command));
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  test('throws an error if initialised more than once', () => {
    expect(() => server.init(1234)).toThrow();
  });

  test('it can broadcast a message to all connected clients', done => {
    let numberOfCalls: number = 2;
    let callback = (data: string) => {
      numberOfCalls--;
      if (numberOfCalls == 0) {
        done();
      }
    };

    const wsc1: WebSocketClient = new WebSocketClient();
    wsc1.onMessage = callback;

    const wsc2: WebSocketClient = new WebSocketClient();
    wsc2.onMessage = callback;

    Promise.all([
      wsc1.connect(connectionString),
      wsc2.connect(connectionString),
    ]).then(values => {
      let s: DataTypes.IService[] = [];
      let msg = {
        reply: Reply.SERVICES,
        content: s,
      };
      server.broadcastMessage(msg);
    });
  });

  test('sends services config', done => {
    setupServicesAndConnectionsMocks();
    connectAndSendCommand('GET_SERVICES')
      .then((data: string) => {
        expect(data).toMatchSnapshot();
        done();
      })
      .catch(error => {
        fail(error);
        done();
      });
  });

  test('sends connections config', done => {
    setupServicesAndConnectionsMocks();
    connectAndSendCommand('GET_CONNECTIONS')
      .then((data: string) => {
        expect(data).toMatchSnapshot();
        done();
      })
      .catch(error => {
        fail(error);
        done();
      });
  });

  test('start fails if cannot get services data', done => {
    setupServicesAndConnectionsMocks(500);
    connectAndSendCommand('GET_SERVICES').catch(error => {
      done();
    });
  });

  test('start fails if cannot get connections data', done => {
    setupServicesAndConnectionsMocks(200, 500);
    connectAndSendCommand('GET_CONNECTIONS')
      .then((data: string) => {
        fail();
        done();
      })
      .catch(error => {
        done();
      });
  });

  test('handles not existing commands', done => {
    setupServicesAndConnectionsMocks();
    connectAndSendCommand('SOME_UNKNOWN_COMMAND')
      .then((data: string) => {
        expect(data).toMatchSnapshot();
        done();
      })
      .catch(error => {
        fail();
        done();
      });
  });

  let setupServiceHealthcheckMock = (
    url: URL,
    statusCode: number,
    responseBody: any,
  ) => {
    nock(url.origin)
      .persist()
      .get(url.pathname)
      .reply(statusCode, responseBody);
  };

  let setMocksForServices = (
    services: DataTypes.IService[],
    responseBody: any,
  ) => {
    services.forEach((service: DataTypes.IService) => {
      let url: URL = new URL(service.uri);
      setupServiceHealthcheckMock(url, 200, responseBody);
    });
  };

  test('broadcasts message if one of the services has changed state', done => {
    setupServicesAndConnectionsMocks();

    let services: DataTypes.IService[] = getFileContentAsJSON(
      './mocks/services.json',
    );

    setMocksForServices(services, {status: 'Healthy'});

    let firstService: DataTypes.IService = services[0];

    server
      .start(CONFIG_URI)
      .then(result => {
        const wsc1: WebSocketClient = new WebSocketClient();
        wsc1.onMessage = data => {
          let msg: IMessage = JSON.parse(data);
          if (msg.reply == 'UPDATE') {
            expect(server.getServicesStatus()[firstService.id]).toBe(
              DataTypes.Status.UNHEALTHY,
            );
            done();
          }
        };
        wsc1.connect(connectionString).then(result => {
          nock.cleanAll();
          setMocksForServices(services, {status: 'Unhealthy'});
        });
      })
      .catch(error => {
        fail(error);
        done();
      });
  });

  test('marks service as unhealthy if healthcheck request fails', done => {
    setupServicesAndConnectionsMocks();

    let services: DataTypes.IService[] = getFileContentAsJSON(
      './mocks/services.json',
    );

    let firstService: DataTypes.IService = services[0];

    server
      .start(CONFIG_URI)
      .then(result => {
        const wsc1: WebSocketClient = new WebSocketClient();
        wsc1.onMessage = data => {
          let msg: IMessage = JSON.parse(data);
          if (msg.reply == 'UPDATE') {
            expect(server.getServicesStatus()[firstService.id]).toBe(
              DataTypes.Status.UNHEALTHY,
            );
            done();
          }
        };
        wsc1.connect(connectionString);
      })
      .catch(error => {
        fail(error);
        done();
      });
  });

  test('returns a readonly copy of the services statuses', () => {
    let services: DataTypes.IService[] = getFileContentAsJSON(
      './mocks/services.json',
    );
    let servicesStatus = server.getServicesStatus();
    expect(servicesStatus).not.toBe(server.getServicesStatus());
  });
});
