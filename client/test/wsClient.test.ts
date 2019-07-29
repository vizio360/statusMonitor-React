import {StatusMonitorClient, IStatusMonitorClient} from '@app/wsClient';
import WS from 'jest-websocket-mock';
import servicesMock from '@mocks/services.json';
import connectionsMock from '@mocks/connections.json';
import {
  Status,
  IServiceStatus,
  Reply,
  IMessage,
  IService,
  IConnection,
} from '@dataTypes';

describe('Status Monitor WebSocket Client', () => {
  let ws: WS;
  let client: IStatusMonitorClient;
  const serverUri: string = 'ws://localhost:1234';

  const manageMessages = (msg: string) => {
    let response: IMessage;
    switch (msg) {
      case 'GET_SERVICES':
        response = {
          reply: Reply.SERVICES,
          content: servicesMock as IService[],
        };
        break;
      case 'GET_CONNECTIONS':
        response = {
          reply: Reply.CONNECTIONS,
          content: connectionsMock,
        };
        break;
    }

    ws.nextMessage.then(manageMessages);
    ws.send(JSON.stringify(response));
  };
  const setupServerMocks = () => {
    ws = new WS(serverUri);
  };

  beforeEach(() => {
    setupServerMocks();
    ws.nextMessage.then(manageMessages);
    client = StatusMonitorClient.getInstance();
  });

  afterEach(() => {
    WS.clean();
  });

  it('can get all the services and connections configuration monitored', async () => {
    await client.connect(serverUri);
    expect(client.getServices()).toEqual(servicesMock);
    expect(client.getConnections()).toEqual(connectionsMock);
  });

  it('throws an error if trying to connect more than once', async () => {
    await client.connect(serverUri);
    expect(() => client.connect(serverUri)).toThrow();
  });

  it('emits an update event if a service has changed status', done => {
    const statusReport: IServiceStatus = {
      serviceId: servicesMock[0].id,
      status: Status.UNHEALTHY,
      responseBody: 'some body here',
    };
    let msg: IMessage;
    msg = {
      reply: Reply.UPDATE,
      content: statusReport,
    };
    client.on('update', serviceStatus => {
      expect(serviceStatus).toEqual(statusReport);
      done();
    });
    client.connect(serverUri).then(() => {
      ws.send(JSON.stringify(msg));
    });
  });

  it('emits a reload event if a service has changed status after getting services and connections again', done => {
    client.on('reloaded', () => {
      done();
    });
    client.connect(serverUri).then(() => {
      let msg: IMessage;
      msg = {
        reply: Reply.RELOADED,
      };
      ws.send(JSON.stringify(msg));
    });
  });

  it('emits an error event if reload fails', done => {
    client.on('error', error => {
      done();
    });
    client.connect(serverUri).then(() => {
      let msg: IMessage;
      msg = {
        reply: Reply.RELOAD_ERROR,
      };
      ws.send(JSON.stringify(msg));
    });
  });
});
