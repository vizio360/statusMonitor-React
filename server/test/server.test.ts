import server from '@server/server';
import WebSocket from 'ws';
import * as express from 'express';
import * as DataTypes from '@dataTypes';
const enableDestroy = require('server-destroy');

const connectionString: string = 'ws://localhost:4000/channel';
let instance: any = null;
beforeEach(done => {
  instance = server.listen(4000, () => {
    done();
  });
  enableDestroy(instance);
});

afterEach(() => {
  instance.destroy();
});

test('sends services config on websocket connection', done => {
  const ws: WebSocket = new WebSocket(connectionString);
  ws.on('message', (data: string) => {
    expect(JSON.parse(data)).toMatchSnapshot();
    done();
  });
  ws.on('open', () => {
    ws.send('GET_SERVICES');
  });
});
