enum ServiceType {
  CRM = 'CRM',
  API = 'API',
  DB = 'DB',
}

interface IService {
  id: string;
  name: string;
  uri: string;
  timeout: number;
  categories: string[];
  type: ServiceType;
  uiProps: {top: number; left: number};
}

interface IConnection {
  sourceId: number;
  targetId: number;
}

export {IService, IConnection, ServiceType};
