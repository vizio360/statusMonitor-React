let express = require('express');
let httpProxy = require('http-proxy');
let path = require('path');
const url = require('url');

let apiProxy = httpProxy.createProxyServer();

let app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/forward', (req: any, res: any) => {
  let targetUrl: URL = url.parse(req.query.uri);
  req.url = targetUrl.pathname;

  let target: string = targetUrl.protocol + '//' + targetUrl.host;

  apiProxy.web(req, res, {target: target});
});

let port: number = 3333;
app.listen(port);
console.log('Listening to ' + port);
