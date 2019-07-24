import {StatusMonitoringServer} from '@server/server';

let port: number = 3333;
const server: StatusMonitoringServer = new StatusMonitoringServer();
server.init(port);
server.start('http://localhost:3000').then(result => {
  console.log('Listening to ' + port);
});
