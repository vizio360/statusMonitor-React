import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import appConfig from '../config/appconfig.json';
import {Fetch, IStatus, IService, EmptyService} from './fetchData';
import serverImage from '../images/Home-Server-icon.png';
import NavBar from './navbar';
import NodeEditor from './nodeEditor';
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
  amendNode: boolean;
  selectedNode: IService;
}

class Diagram extends React.Component<{}, IDiagramState> {
  jsPlumbInstance: jsPlumbInstance;
  services: IService[];
  constructor(props: any) {
    super(props);
    this.state = {
      services: [],
      dataChanged: false,
      amendNode: false,
      selectedNode: EmptyService,
    };
    this.onDragStop = this.onDragStop.bind(this);
    this.onNodeDoubleClick = this.onNodeDoubleClick.bind(this);
    this.save = this.save.bind(this);
    this.onAddNode = this.onAddNode.bind(this);
  }

  onAddNode() {
    this.setState({amendNode: true, selectedNode: EmptyService});
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
    this.setState({
      services: this.state.services,
      dataChanged: true,
      amendNode: false,
    });
  }

  onNodeDoubleClick(serviceId: string) {
    let service: IService = this.state.services.find(
      service => service.id == serviceId,
    );
    this.setState({amendNode: true, selectedNode: service});
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
            events={{
              stopDrag: this.onDragStop,
              onDoubleClick: this.onNodeDoubleClick,
            }}
          />
        );
        break;
      case NodeType.API:
        el = (
          <APINode
            service={service}
            jsPlumb={this.jsPlumbInstance}
            events={{
              stopDrag: this.onDragStop,
              onDoubleClick: this.onNodeDoubleClick,
            }}
          />
        );
        break;
      case NodeType.DB:
        el = (
          <DBNode
            service={service}
            jsPlumb={this.jsPlumbInstance}
            events={{
              stopDrag: this.onDragStop,
              onDoubleClick: this.onNodeDoubleClick,
            }}
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
        <NavBar
          dataChanged={this.state.dataChanged}
          onSave={this.save}
          onAddNode={this.onAddNode}
        />
        <div id="hello" style={{position: 'absolute'}}>
          {this.renderNodes(this.state.services)}
        </div>
        <NodeEditor
          id="nodeEditor"
          show={this.state.amendNode}
          node={this.state.selectedNode}
        />
      </div>
    );
  }
}

ReactDOM.render(<Diagram />, document.getElementById('diagram'));
