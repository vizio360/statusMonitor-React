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
  matcher?: {[key: string]: any};
}

interface IConnection {
  sourceId: number;
  targetId: number;
}

interface IServiceStatus {
  serviceId: string;
  status: Status;
  responseBody: string;
}

const HEALTHY = true;
const UNHEALTHY = false;

enum Status {
  HEALTHY,
  UNHEALTHY,
}

export {IService, IConnection, ServiceType, Status, IServiceStatus};
