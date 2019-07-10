import express from 'express';
import http from 'http';
import httpProxy from 'http-proxy';
import path from 'path';
import fs from 'fs';
import WebSocket from 'ws';
import {URL} from 'url';
import bodyParser from 'body-parser';
import expressWS from 'express-ws';
let apiProxy = httpProxy.createProxyServer();

let app: express.Application = express();
let appws: expressWS.Application = expressWS(app).app;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../dist')));

app.get('/forward', (req: any, res: any) => {
  let targetUrl: URL = new URL(req.query.uri);
  console.log('forwarding ' + targetUrl.pathname);
  req.url = targetUrl.pathname;

  let target: string = targetUrl.protocol + '//' + targetUrl.host;

  apiProxy.web(req, res, {target: target}, function(e: any) {
    console.log('proxying went wrong');
    console.log(e);
    res.sendStatus(500);
  });
});

let getFileContent = function(def: string, path: string) {
  if (fs.existsSync(path)) {
    def = fs.readFileSync(path, {encoding: 'utf8'});
  }
  return JSON.parse(def);
};

app.get('/services', (req: any, res: any) => {
  let path: string = './config/services.json';
  let returnData = getFileContent('{"services":[]}', path);
  res.json(returnData.services);
});

app.get('/connections', (req: any, res: any) => {
  let path: string = './config/connections.json';
  let returnData = getFileContent('{"connections":[]}', path);
  res.json(returnData.connections);
});

app.post('/services', (req: any, res: any) => {
  console.log(req.body);
  let data = req.body;
  console.log(data);
  fs.writeFileSync('./config/services.json', JSON.stringify(data), {
    flag: 'w+',
  });
  res.sendStatus(200);
});

app.post('/connections', (req: any, res: any) => {
  console.log(req.body);
  let data = req.body;
  console.log(data);
  fs.writeFileSync('./config/connections.json', JSON.stringify(data), {
    flag: 'w+',
  });
  res.sendStatus(200);
});

appws.ws('/channel', function(ws: WebSocket, req: any) {
  ws.on('connection', () => {
    console.log('connected!');
  });
  ws.on('message', (msg: string) => {
    ws.send(msg);
  });
});

//read config services and connections
//store config in data structure
//set up timers for services
//on service status changed broadcast message to clients
//

export default app;
