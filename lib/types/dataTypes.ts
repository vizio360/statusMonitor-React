interface IService {
  id: string;
  name: string;
  uri: string;
  timeout: number;
  categories: string[];
  type: string;
  uiProps: {top: number; left: number};
}

export {IService};
