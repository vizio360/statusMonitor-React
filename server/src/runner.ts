import server from '@server/server';

let port: number = 3333;
server.listen(port);
console.log('Listening to ' + port);
