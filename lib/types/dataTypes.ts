import {DragEventCallbackOptions, jsPlumbInstance} from 'jsPlumb';

export enum ServiceType {
  CRM = 'CRM',
  API = 'API',
  DB = 'DB',
  EMPTY = 'EMPTY',
}

export interface IService {
  id: string;
  name: string;
  uri: string;
  timeout: number;
  categories: string[];
  type: ServiceType;
  uiProps: {top: number; left: number};
  matcher?: {[key: string]: any};
}

export interface IConnection {
  sourceId: number;
  targetId: number;
}

export interface IServiceStatus {
  serviceId: string;
  status: Status;
  responseBody: string;
}

export enum Status {
  HEALTHY,
  UNHEALTHY,
}

export interface INodeEvents {
  stopDrag: (params: DragEventCallbackOptions) => void;
  onDoubleClick: (id: string) => void;
}

export interface INodeProperties {
  jsPlumb: jsPlumbInstance;
  service: IService;
  events: INodeEvents;
}

export const EmptyService: IService = {
  id: '',
  name: '',
  uri: '',
  timeout: 20,
  categories: [],
  type: ServiceType.EMPTY,
  uiProps: {top: 0, left: 0},
};

export enum Command {
  GET_SERVICES = 'GET_SERVICES',
  GET_CONNECTIONS = 'GET_CONNECTIONS',
  GET_CURRENT_STATES = 'GET_CURRENT_STATES',
}

export enum Reply {
  SERVICES = 'SERVICES',
  CONNECTIONS = 'CONNECTIONS',
  UPDATE = 'UPDATE',
  CURRENT_STATES = 'CURRENT_STATES',
  RELOADED = 'RELOADED',
  RELOAD_ERROR = 'RELOAD_ERROR',
  NOT_RECOGNIZED = 'COMMAND NOT RECOGNIZED',
}

export interface IMessage {
  reply: Reply;
  content?: IService[] | IConnection[] | IServiceStatus | IServiceStatus[];
}
