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
  req.url = targetUrl.pathname;

  let target: string = targetUrl.protocol + '//' + targetUrl.host;

  apiProxy.web(req, res, {target: target});
});

app.get('/services', (req: any, res: any) => {
  let data = fs.readFileSync('./config/services.json', {encoding: 'utf8'});
  data = JSON.parse(data);
  res.json(data.services);
});
app.put('/services', (req: any, res: any) => {
  console.log(req.body);
  let data = req.body;
  console.log(data);
  fs.writeFileSync('./config/services.json', JSON.stringify(data));
  res.sendStatus(200);
});

let port: number = 3333;
app.listen(port);
console.log('Listening to ' + port);
