import * as React from 'react';
import * as ReactDOM from 'react-dom';
import appConfig from '../config/appconfig.json';
import {Fetch, IStatus, IService} from './fetchData';
import serverImage from '../images/Home-Server-icon.png';
import {EndpointOptions, Defaults, jsPlumb, jsPlumbInstance} from 'jsPlumb';

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

class Diagram extends React.Component {
  jsPlumbInstance: jsPlumbInstance;

  componentDidMount() {
    let defaults: Defaults = {
      Connector: 'Flowchart',
      Anchors: ['Left', 'BottomRight'],
    };
    this.jsPlumbInstance = jsPlumb.getInstance(defaults);

    this.jsPlumbInstance.setContainer('hello');

    let endPointOptions: EndpointOptions = {
      maxConnections: 1,
      anchor: 'Bottom',
      type: 'Dot',
      id: 'oneC',
      scope: 'dotEndPoint',
      reattachConnections: true,
      parameters: {},
    };

    this.jsPlumbInstance.addEndpoint('one', endPointOptions);
    this.jsPlumbInstance.draggable(['one', 'two']);
    this.jsPlumbInstance.connect({source: 'one', target: 'two'});
  }

  render() {
    return (
      <div id="hello" style={{position: 'absolute'}}>
        <div
          id="one"
          className="alert alert-primary"
          style={{position: 'absolute', width: '100px', height: '100px'}}>
          <img src={serverImage} width={100} height={100} />
        </div>
        <div
          id="two"
          className="alert alert-primary"
          style={{position: 'absolute', width: '100px', height: '100px'}}>
          <img src={serverImage} width={100} height={100} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Diagram />, document.getElementById('diagram'));
