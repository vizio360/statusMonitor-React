# statusMonitor-React

Learning React. Building a visual APIs status monitor.

# npm install ts-node typescript json-server -g

# yarn install

# build

yarn build --watch

# webserver

ts-node -r tsconfig-paths/register server/src/runner.ts

#mock apis server
json-server --watch mocks/hc.json

# Status Monitor

Implemented WebSocket server using ExpressWS. On start it will consume an api to retrieve the configuration of services and connections from a different provider.

WebSocket Clients can connect to `ws://localhost:PORT/channel` and follow this protocol:

cmd: `GET_SERVICES`
response:

```json
{
  "content": [
    {
      "categories": [],
      "id": "1",
      "matcher": {
        "status": "Healthy",
      },
      "name": "serviceTest",
      "timeout": 0.5,
      "type": "",
      "uiProps": {
        "left": 7,
        "top": 68,
      },
      "uri": "http://service1/healthcheck",
    }
  ],
  "reply": "SERVICES",
}
```

cmd: `GET_CONNECTIONS`
response:

```json
{
  "content": [
    {
      "sourceId": "3",
      "targetId": "5",
    }
  ],
  "reply": "CONNECTIONS",
}
```

cmd: `GET_CURRENT_STATES`
response:

```json
{
  "content": [
    {
      "responseBody": "NOT YET VERIFIED",
      "serviceId": "1",
      "status": 0,
    }
  ],
  "reply": "CURRENT_STATES",
}
```

If a service changes status the server will broadcast the following message to all connected clients:

```json
{
  "reply": "UPDATE",
  "content": {
    "responseBody": "NOT YET VERIFIED",
    "serviceId": "1",
    "status": 0
  }
}
```

it is also possible to force a reload of the services and connections configuration by issuing a POST request to the following endpoint:

`http://yourstatusmonitoringserver/reload`

once the configuration has been reloaded the server will broadcast the following message to all connected clients:

```json
{
  "reply": "RELOADED"
}
```
