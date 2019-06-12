import * as React from 'react';
import * as ReactDOM from 'react-dom';
import appConfig from '../config/appconfig.json';
import {Fetch, IStatus, IService} from './fetchData';

class StatusTable extends React.Component {
  services: IService[];
  constructor(props: any) {
    super(props);
    this.services = appConfig.services;
  }

  renderRows(services: IService[]) {
    let id: number = 0;
    let results: JSX.Element[] = services.map(service => (
      <Fetch
        service={service}
        render={(status: IStatus) => (
          <tr
            className={status.status === 'Unhealthy' ? 'table-danger' : ''}
            key={id++}>
            <td>{service.name}</td>
            <td>{status.status}</td>
            <td>{status.totalDuration}</td>
          </tr>
        )}
      />
    ));
    if (results.length == 0) {
      results.push(
        <tr key={1}>
          <td colSpan={4}> No results!</td>
        </tr>,
      );
    }
    return results;
  }

  render() {
    return (
      <table className="table table-borderless">
        <thead>
          <tr>
            <th scope="col">name</th>
            <th scope="col">status</th>
            <th scope="col">duration</th>
          </tr>
        </thead>
        <tbody>{this.renderRows(this.services)}</tbody>
      </table>
    );
  }
}

ReactDOM.render(<StatusTable />, document.getElementById('root'));
