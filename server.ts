let express = require('express');
let httpProxy = require('http-proxy');
let path = require('path');
let fs = require('fs');
const url = require('url');
var bodyParser = require('body-parser');

let apiProxy = httpProxy.createProxyServer();

let app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/forward', (req: any, res: any) => {
  let targetUrl: URL = url.parse(req.query.uri);
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

//read config services and connections
//store config in data structure
//set up timers for services
//on service status changed broadcast message to clients
//

let port: number = 3333;
app.listen(port);
console.log('Listening to ' + port);
