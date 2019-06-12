import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface IStatus {
  name: string;
  status: string;
  totalDuration: number;
}

interface IService {
  name: string;
  uri: string;
  categories: string[];
}

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
    }, 1000);
  }

  componentWillUnmount() {
    window.clearInterval(this.interval);
  }

  render(): any {
    return this.props.render(this.state.status);
  }
}

export {Fetch, IStatus, IService};
