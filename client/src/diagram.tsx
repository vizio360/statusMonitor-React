import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  IServiceLastKnownState,
  IConnection,
  ServiceType,
  IService,
  EmptyService,
} from '@dataTypes';
import serverImage from '../images/Home-Server-icon.png';
import NavBar from '@app/navbar';
import NodeEditor from '@app/nodeEditor';
import {IStatusMonitorClient} from '@app/wsClient';
import {
  Connection,
  DragEventCallbackOptions,
  EndpointOptions,
  Defaults,
  jsPlumb,
  jsPlumbInstance,
} from 'jsPlumb';
import {Node} from '@app/components/node';

interface IDiagramState {
  services: IService[];
  lastKnownStates: IServiceLastKnownState[];
  dataChanged: boolean;
  amendNode: boolean;
  selectedNode: IService;
}

interface IDiagramProps {
  wsClient: IStatusMonitorClient;
}

const SERVER_URI: string = 'ws://localhost:3333/channel';

export default class Diagram extends React.Component<
  IDiagramProps,
  IDiagramState
> {
  jsPlumbInstance: jsPlumbInstance;
  wsClient: IStatusMonitorClient;
  constructor(props: any) {
    super(props);
    this.wsClient = props.wsClient;
    this.state = {
      services: [],
      lastKnownStates: [],
      dataChanged: false,
      amendNode: false,
      selectedNode: EmptyService,
    };
    this.wsClient.onUpdate(this.onUpdateReceived.bind(this));
    this.onDragStop = this.onDragStop.bind(this);
    this.onNodeDoubleClick = this.onNodeDoubleClick.bind(this);
    //this.save = this.save.bind(this);
    //this.onAddNode = this.onAddNode.bind(this);
    //this.onNodeChangeConfirm = this.onNodeChangeConfirm.bind(this);
    this.setupJsPlumb();
  }

  onUpdateReceived(state: IServiceLastKnownState) {
    let lastKnownStates: IServiceLastKnownState[] = this.state.lastKnownStates;
    let tmp: IServiceLastKnownState = lastKnownStates.find(
      s => s.serviceId === state.serviceId,
    );
    let index: number = lastKnownStates.indexOf(tmp);
    lastKnownStates[index] = state;
    this.setState({
      lastKnownStates: lastKnownStates,
    });
  }

  onNodeChangeConfirm(service: IService) {
    let services: IService[] = this.state.services;
    if (service.id) {
      let tmp: IService = services.find(s => s.id === service.id);
      let index: number = services.indexOf(tmp);
      services[index] = service;
    } else {
      service.id = '' + (services.length + 1);
      services.push(service);
    }
    this.setState({services: services, dataChanged: true});
  }

  onAddNode() {
    this.setState({amendNode: true, selectedNode: EmptyService});
  }

  async componentDidMount() {
    await this.wsClient.connect(SERVER_URI);
    this.setState({
      services: this.wsClient.getServices(),
      lastKnownStates: this.wsClient.getServicesLastKnownState(),
    });
    this.createJsPlumbEndPoints(this.state.services);
    this.createConnections(this.wsClient.getConnections());
  }

  getTargetEndPoint(id: string) {
    let inEndPointOptions: EndpointOptions = {
      maxConnections: 10,
      anchor: 'Top',
      paintStyle: {fill: '#F00'},
      type: 'Dot',
      id: id + 'target',
      scope: 'dotEndPoint',
      reattachConnections: true,
      parameters: {},
      isTarget: true,
    };
    return inEndPointOptions;
  }

  getSourceEndPoint(id: string) {
    let outEndPointOptions: EndpointOptions = {
      maxConnections: 10,
      anchor: 'Bottom',
      paintStyle: {fill: '#00F'},
      type: 'Dot',
      id: id + 'source',
      scope: 'dotEndPoint',
      reattachConnections: true,
      parameters: {},
      isSource: true,
    };
    return outEndPointOptions;
  }

  createJsPlumbEndPoints(services: IService[]) {
    services.forEach((service: IService) => {
      this.jsPlumbInstance.addEndpoint(
        service.id,
        this.getSourceEndPoint(service.id),
      );
      this.jsPlumbInstance.addEndpoint(
        service.id,
        this.getTargetEndPoint(service.id),
      );
      this.jsPlumbInstance.draggable(service.id, {stop: this.onDragStop});
    });
  }

  createConnections(connections: IConnection[]) {
    connections.forEach((conn: any) => {
      let source = this.jsPlumbInstance.getEndpoints(conn.sourceId)[0];
      let target = this.jsPlumbInstance.getEndpoints(conn.targetId)[1];
      this.jsPlumbInstance.connect({
        source: source,
        target: target,
      });
    });
  }

  setupJsPlumb() {
    let defaults: Defaults = {
      Connector: 'StateMachine',
      Anchors: ['Left', 'BottomRight'],
    };
    this.jsPlumbInstance = jsPlumb.getInstance(defaults);
    this.jsPlumbInstance.setContainer('hello');
    this.jsPlumbInstance.bind('connection', (info, originalEvent) => {
      if (originalEvent !== undefined) this.setState({dataChanged: true});
    });
    this.jsPlumbInstance.bind('connectionDetached', (info, originalEvent) => {
      if (originalEvent !== undefined) this.setState({dataChanged: true});
    });
  }

  onDragStop(params: DragEventCallbackOptions) {
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
    return;
    fetch('/services', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({services: this.state.services}),
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
    this.setState({amendNode: false, dataChanged: false});
  }

  createNode(service: IService) {
    let state: IServiceLastKnownState = this.state.lastKnownStates.find(
      element => {
        return service.id == element.serviceId;
      },
    );
    let el: JSX.Element;

    el = (
      <Node
        key={service.id}
        service={service}
        serviceState={state}
        events={{
          onDoubleClick: this.onNodeDoubleClick,
        }}
      />
    );
    return el;
  }

  renderNodes(services: IService[]) {
    let id: number = 0;
    let results: JSX.Element[] = services.map(service => {
      return this.createNode(service);
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
          onConfirm={this.onNodeChangeConfirm}
        />
      </div>
    );
  }
}
