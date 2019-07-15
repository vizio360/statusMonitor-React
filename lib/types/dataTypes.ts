interface IService {
  id: string;
  name: string;
  uri: string;
  timeout: number;
  categories: string[];
  type: string;
  uiProps: {top: number; left: number};
}

interface IConnection {
  sourceId: number;
  targetId: number;
}

export {IService, IConnection};
