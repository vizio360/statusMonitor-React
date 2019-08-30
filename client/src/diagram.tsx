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
  Status,
} from '@dataTypes';
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
  isEditing: boolean;
  amendNode: boolean;
  selectedNode: IService;
}

interface IDiagramProps {
  wsClient: IStatusMonitorClient;
}

//this needs to be read from a config file
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
      isEditing: false,
      amendNode: false,
      selectedNode: EmptyService,
    };
    this.wsClient.onUpdate(this.onUpdateReceived.bind(this));
    this.wsClient.onReload(this.onReloadReceived.bind(this));
    this.onDragStop = this.onDragStop.bind(this);
    this.onNodeDoubleClick = this.onNodeDoubleClick.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onEdit = this.onEdit.bind(this);
    //this.save = this.save.bind(this);
    this.onAddNode = this.onAddNode.bind(this);
    this.onNodeChangeConfirm = this.onNodeChangeConfirm.bind(this);
    this.setupJsPlumb();
  }

  onReloadReceived() {
    this.init();
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
    let lastKnownStates: IServiceLastKnownState[] = this.state.lastKnownStates;
    if (service.id) {
      let tmp: IService = services.find(s => s.id === service.id);
      let index: number = services.indexOf(tmp);
      services[index] = service;
    } else {
      service.id = '' + (services.length + 1);
      services.push(service);
      const lastKnownState: IServiceLastKnownState = {
        serviceId: service.id,
        status: Status.HEALTHY,
        responseBody: '',
      };

      lastKnownStates.push(lastKnownState);
    }
    this.setState({
      services: services,
      dataChanged: true,
      lastKnownStates: lastKnownStates,
      amendNode: false,
    });
  }

  onEdit() {
    this.setState({
      isEditing: true,
    });
  }

  onCancel() {
    this.init();
  }

  onAddNode() {
    this.setState({amendNode: true, selectedNode: EmptyService});
  }

  init() {
    let newServices = this.wsClient.getServices();
    this.setState({
      services: newServices,
      lastKnownStates: this.wsClient.getServicesLastKnownState(),
      dataChanged: false,
      isEditing: false,
      amendNode: false,
      selectedNode: EmptyService,
    });
  }

  async componentDidMount() {
    await this.wsClient.connect(SERVER_URI);
    this.init();
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

  componentDidUpdate() {
    if (!this.state.isEditing) {
      this.jsPlumbInstance.reset();
      this.createJsPlumbEndPoints(this.state.services);
      this.createConnections(this.wsClient.getConnections());
    }
    this.state.services.forEach((service: IService) => {
      this._createEndPoints(service);
      this.jsPlumbInstance.draggable(service.id, {stop: this.onDragStop});
      this.jsPlumbInstance.setDraggable(service.id, this.state.isEditing);
    });
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

  _createEndPoints(service: IService) {
    this.jsPlumbInstance.addEndpoint(
      service.id,
      this.getSourceEndPoint(service.id),
    );
    this.jsPlumbInstance.addEndpoint(
      service.id,
      this.getTargetEndPoint(service.id),
    );
  }

  createJsPlumbEndPoints(services: IService[]) {
    services.forEach((service: IService) => {
      this._createEndPoints(service);
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
    console.log('state on dbkclick', this.state);
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
    connections = connections.map((c: Connection) => ({
      sourceId: c.endpoints[0].getElement().id,
      targetId: c.endpoints[1].getElement().id,
    }));
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
      element => service.id == element.serviceId,
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
    console.log('state', this.state);
    return (
      <div>
        <NavBar
          dataChanged={this.state.dataChanged}
          onEdit={this.onEdit}
          onCancel={this.onCancel}
          onSave={this.save}
          onAddNode={this.onAddNode}
        />
        <div id="hello" style={{position: 'absolute'}}>
          {this.renderNodes(this.state.services)}
        </div>
        <NodeEditor
          id="nodeEditor"
          key={this.state.selectedNode.id}
          show={this.state.amendNode}
          node={this.state.selectedNode}
          onConfirm={this.onNodeChangeConfirm}
        />
      </div>
    );
  }
}
