import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface IStatus {
  name: string;
  status: string;
  totalDuration: number;
}

interface IService {
  id: string;
  name: string;
  uri: string;
  timeout: number;
  categories: string[];
  type: string;
  uiProps: {top: number; left: number};
}

let EmptyService: IService = {
  id: '',
  name: '',
  uri: '',
  timeout: 20,
  categories: [],
  type: '',
  uiProps: {top: 0, left: 0},
};

interface IRenderChild {
  (data: IStatus): any;
}

interface IFetchProps {
  service: IService;
  render: IRenderChild;
}

interface IState {
  status: IStatus;
}

let defaultStatus: IStatus = {
  name: 'not yet set',
  status: 'not yet set',
  totalDuration: -1,
};

class Fetch extends React.Component<IFetchProps, IState> {
  service: IService;
  interval: number;

  constructor(props: IFetchProps) {
    super(props);
    this.service = props.service;
    this.state = {status: defaultStatus};
  }

  componentDidMount() {
    this.interval = window.setInterval(() => {
      fetch('/forward?uri=' + this.service.uri)
        .then(res => res.json())
        .then(results => {
          this.setState({
            status: {
              name: results.name,
              status: results.status,
              totalDuration: results.totalDuration,
            },
          });
        });
    }, this.service.timeout * 1000);
  }

  componentWillUnmount() {
    window.clearInterval(this.interval);
  }

  render(): any {
    return this.props.render(this.state.status);
  }
}

export {Fetch, IStatus, IService, EmptyService};
