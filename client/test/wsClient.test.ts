import ServiceMonitorClient from '@app/wsClient';
import WS from 'jest-websocket-mock';
import servicesMock from '@mocks/services.json';
import connectionsMock from '@mocks/connections.json';
import {Reply, IMessage, IService, IConnection} from '@dataTypes';

describe('Status Monitor WebSocket Client', () => {
  let ws: WS;
  let client: ServiceMonitorClient;
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
    ws.send(JSON.stringify(response));
  };
  const setupServerMocks = () => {
    ws = new WS(serverUri);
  };

  beforeEach(() => {
    setupServerMocks();
    client = ServiceMonitorClient.getInstance();
  });

  afterEach(() => {
    WS.clean();
  });

  it('can get all the services and connections configuration monitored', async () => {
    ws.nextMessage.then(manageMessages);
    ws.nextMessage.then(manageMessages);
    await client.connect(serverUri);
    expect(client.getServices()).toEqual(servicesMock);
    expect(client.getConnections()).toEqual(connectionsMock);
  });

  it('throws an error if trying to connect more than once', async () => {
    ws.nextMessage.then(manageMessages);
    ws.nextMessage.then(manageMessages);
    await client.connect(serverUri);
    expect(() => client.connect(serverUri)).toThrow();
  });
});
