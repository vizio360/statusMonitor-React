import server from '@server/server';
import WebSocket from 'ws';
import * as express from 'express';
const enableDestroy = require('server-destroy');

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

test('sends services and connections config on websocket connection', done => {
  const ws: WebSocket = new WebSocket('ws://localhost:4000/channel');
  ws.on('message', (data: string) => {
    expect(data).toBe('hello');
    done();
  });
  ws.on('open', () => {
    ws.send('hello');
  });
});
