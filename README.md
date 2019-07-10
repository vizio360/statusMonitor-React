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
