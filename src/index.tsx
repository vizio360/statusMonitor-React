import * as React from 'react';
import * as ReactDOM from 'react-dom';
import appConfig from '../config/appconfig.json';
import {Fetch, IStatus, IService} from './fetchData';
import serverImage from '../images/Home-Server-icon.png';
import NavBar from './navbar';
import {
  Connection,
  DragEventCallbackOptions,
  EndpointOptions,
  Defaults,
  jsPlumb,
  jsPlumbInstance,
} from 'jsPlumb';
import CRMNode from './components/node/crmNode';
import APINode from './components/node/apiNode';
import DBNode from './components/node/dbNode';
import {NodeType} from './components/node';

interface IDiagramState {
  services: IService[];
  dataChanged: boolean;
}

class Diagram extends React.Component<{}, IDiagramState> {
  jsPlumbInstance: jsPlumbInstance;
  services: IService[];
  constructor(props: any) {
    super(props);
    this.state = {services: [], dataChanged: false};
    this.onDragStop = this.onDragStop.bind(this);
    this.save = this.save.bind(this);
  }

  componentDidMount() {
    fetch('/services')
      .then(res => res.json())
      .then(res => {
        this.setState({services: res});
      })
      .then(res => {
        fetch('/connections')
          .then(res => res.json())
          .then(res => {
            res.forEach((conn: any) => {
              let source = this.jsPlumbInstance.getEndpoints(conn.sourceId)[0];
              let target = this.jsPlumbInstance.getEndpoints(conn.targetId)[1];

              this.jsPlumbInstance.connect({
                source: source,
                target: target,
              });
            });
          });
      });
  }

  componentWillMount() {
    let defaults: Defaults = {
      Connector: 'StateMachine',
      Anchors: ['Left', 'BottomRight'],
    };
    this.jsPlumbInstance = jsPlumb.getInstance(defaults);
    this.jsPlumbInstance.setContainer('hello');
  }

  onDragStop(params: DragEventCallbackOptions) {
    console.log('params');
    console.log(params);

    let pos: number[] = params.pos;
    let x: number = pos[0];
    let y: number = pos[1];
    let serviceToUpdate: IService = this.state.services.find(
      (element: IService) => {
        return element.id === params.el.id;
      },
    );
    serviceToUpdate.uiProps.top = y;
    serviceToUpdate.uiProps.left = x;
    this.setState(this.state);
    this.setState({dataChanged: true});
  }

  save() {
    console.log(this.jsPlumbInstance.getAllConnections());
    console.log(JSON.stringify(this.state.services));
    fetch('/services', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(this.state),
    });

    let connections: any = this.jsPlumbInstance.getAllConnections();
    connections = connections.map((c: Connection) => {
      return {
        sourceId: c.endpoints[0].getElement().id,
        targetId: c.endpoints[1].getElement().id,
      };
    });
    fetch('/connections', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({connections: connections}),
    });
    this.setState({dataChanged: false});
  }

  createNodeBasedOnType(service: IService) {
    let el: JSX.Element;
    switch (service.type) {
      case NodeType.CRM:
        el = (
          <CRMNode
            service={service}
            jsPlumb={this.jsPlumbInstance}
            events={{stopDrag: this.onDragStop}}
          />
        );
        break;
      case NodeType.API:
        el = (
          <APINode
            service={service}
            jsPlumb={this.jsPlumbInstance}
            events={{stopDrag: this.onDragStop}}
          />
        );
        break;
      case NodeType.DB:
        el = (
          <DBNode
            service={service}
            jsPlumb={this.jsPlumbInstance}
            events={{stopDrag: this.onDragStop}}
          />
        );
        break;
    }

    return el;
  }

  renderNodes(services: IService[]) {
    let id: number = 0;
    let results: JSX.Element[] = services.map(service => {
      return this.createNodeBasedOnType(service);
    });
    return results;
  }

  render() {
    return (
      <div>
        <NavBar dataChanged={this.state.dataChanged} onSave={this.save} />
        <div id="hello" style={{position: 'absolute'}}>
          {this.renderNodes(this.state.services)}
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Diagram />, document.getElementById('diagram'));
