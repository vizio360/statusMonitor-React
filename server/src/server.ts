import express from 'express';
import http from 'http';
import httpProxy from 'http-proxy';
import path from 'path';
import fs from 'fs';
import WebSocket from 'ws';
import {URL} from 'url';
import bodyParser from 'body-parser';
import expressWS from 'express-ws';

let app: express.Application = express();
let appws: expressWS.Application = expressWS(app).app;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../dist')));

let getFileContent = function(def: string, path: string) {
  if (fs.existsSync(path)) {
    def = fs.readFileSync(path, {encoding: 'utf8'});
  }
  return JSON.parse(def);
};

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

enum Reply {
  SERVICES = 'SERVICES',
  CONNECTIONS = 'CONNECTIONS',
  NOT_RECOGNIZED = 'COMMAND NOT RECOGNIZED',
}
interface IMessage {
  reply: Reply;
  content?: string;
}
appws.ws('/channel', function(ws: WebSocket, req: any) {
  ws.on('connection', () => {
    console.log('connected!');
  });
  ws.on('message', (command: string) => {
    let msg: IMessage;
    switch (command) {
      case 'GET_SERVICES':
        msg = {
          reply: Reply.SERVICES,
          content: getFileContent(
            '[]',
            path.resolve(__dirname, '../../config/services.json'),
          ),
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

//read config services and connections
//store config in data structure
//set up timers for services
//on service status changed broadcast message to clients
//

export default app;
