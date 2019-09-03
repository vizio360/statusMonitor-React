import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  IServiceLastKnownState,
  IConnection,
  ServiceType,
  IService,
  getEmptyService,
  Status,
} from '@dataTypes';
import {clone} from '@utils/clone';
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
  connections: IConnection[];
  dataChanged: boolean;
  isEditing: boolean;
  amendNode: boolean;
  selectedNode: IService;
}

interface IDiagramProps {
  wsClient: IStatusMonitorClient;
}

//TODO
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
      connections: [],
      dataChanged: false,
      isEditing: false,
      amendNode: false,
      selectedNode: getEmptyService(),
    };
    this.wsClient.onUpdate(this.onUpdateReceived.bind(this));
    this.wsClient.onReload(this.onReloadReceived.bind(this));
    this.onDragStop = this.onDragStop.bind(this);
    this.onNodeDoubleClick = this.onNodeDoubleClick.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onEdit = this.onEdit.bind(this);
    //this.save = this.save.bind(this);
    this.onAddNode = this.onAddNode.bind(this);
    this.onNodeEditorConfirm = this.onNodeEditorConfirm.bind(this);
    this.onNodeEditorCancel = this.onNodeEditorCancel.bind(this);
    this.onNodeEditorDelete = this.onNodeEditorDelete.bind(this);
    this.setupJsPlumb();
  }

  onReloadReceived() {
    this.init();
  }

  onUpdateReceived(state: IServiceLastKnownState) {
    let lastKnownStates: IServiceLastKnownState[] = clone(
      this.state.lastKnownStates,
    );
    let tmp: IServiceLastKnownState = lastKnownStates.find(
      s => s.serviceId === state.serviceId,
    );
    let index: number = lastKnownStates.indexOf(tmp);
    lastKnownStates[index] = state;
    this.setState({
      lastKnownStates: lastKnownStates,
    });
  }

  onNodeEditorCancel() {
    this.setState({
      amendNode: false,
      selectedNode: getEmptyService(),
    });
  }

  //TODO
  onNodeEditorDelete(service: IService) {}

  onNodeEditorConfirm(service: IService) {
    let services: IService[] = clone(this.state.services);
    let lastKnownStates: IServiceLastKnownState[] = clone(
      this.state.lastKnownStates,
    );

    let tmp: IService = services.find(s => s.id === service.id);
    let index: number = services.indexOf(tmp);
    if (index > -1) {
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
    this.setState({amendNode: true, selectedNode: getEmptyService()});
  }

  init() {
    this.setState({
      services: this.wsClient.getServices(),
      lastKnownStates: this.wsClient.getServicesLastKnownState(),
      connections: this.wsClient.getConnections(),
      dataChanged: false,
      isEditing: false,
      amendNode: false,
      selectedNode: getEmptyService(),
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
      connectionsDetachable: this.state.isEditing,
      parameters: {},
      isTarget: this.state.isEditing,
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
      connectionsDetachable: this.state.isEditing,
      parameters: {},
      isSource: this.state.isEditing,
    };
    return outEndPointOptions;
  }

  addNewConnection(sourceId: string, targetId: string) {
    const conn: IConnection = {
      sourceId: sourceId,
      targetId: targetId,
    };
    let connections = clone(this.state.connections);
    connections.push(conn);

    this.setState(prevState => ({
      connections: connections,
      dataChanged: true,
    }));
  }

  deleteNewConnection(sourceId: string, targetId: string) {
    let connections: IConnection[] = clone(this.state.connections);
    let conn = connections.find(connection => {
      return (
        connection.sourceId === sourceId && connection.targetId === targetId
      );
    });
    let index = connections.indexOf(conn);
    connections.splice(index, 1);
    this.setState(prevState => ({
      connections: connections,
      dataChanged: true,
    }));
  }

  componentDidUpdate() {
    this.jsPlumbInstance.reset();
    this.jsPlumbInstance.bind('connection', (info, originalEvent) => {
      if (originalEvent !== undefined) {
        this.addNewConnection(info.sourceId, info.targetId);
      }
    });
    this.jsPlumbInstance.bind('connectionDetached', (info, originalEvent) => {
      if (originalEvent !== undefined) {
        this.deleteNewConnection(info.sourceId, info.targetId);
      }
    });
    this.createJsPlumbEndPoints(this.state.services);
    this.createConnections(this.state.connections);
    this.state.services.forEach((service: IService) => {
      this.jsPlumbInstance.draggable(service.id, {stop: this.onDragStop});
      this.jsPlumbInstance.setDraggable(service.id, this.state.isEditing);
    });
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
    this.jsPlumbInstance.setContainer('jsPlumbDiagram');
  }

  onDragStop(params: DragEventCallbackOptions) {
    let pos: number[] = params.pos;
    let x: number = pos[0];
    let y: number = pos[1];
    let services = clone(this.state.services);
    let serviceToUpdate: IService = services.find((element: IService) => {
      return element.id === params.el.id;
    });
    const newUIProps = {
      top: y,
      left: x,
    };
    serviceToUpdate.uiProps = newUIProps;
    this.setState({
      services: services,
      dataChanged: true,
      amendNode: false,
    });
  }

  onNodeDoubleClick(serviceId: string) {
    let services: IService[] = clone(this.state.services);
    let service: IService = services.find(service => service.id == serviceId);
    this.setState({amendNode: true, selectedNode: service});
  }

  //TODO
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
    return (
      <div>
        <NavBar
          dataChanged={this.state.dataChanged}
          onEdit={this.onEdit}
          onCancel={this.onCancel}
          onSave={this.save}
          onAddNode={this.onAddNode}
        />
        <div id="jsPlumbDiagram" style={{position: 'absolute'}}>
          {this.renderNodes(this.state.services)}
        </div>
        <NodeEditor
          id="nodeEditor"
          key={Date.now()} //forcing react to remount this component
          show={this.state.amendNode}
          node={this.state.selectedNode}
          onConfirm={this.onNodeEditorConfirm}
          onCancel={this.onNodeEditorCancel}
          onDelete={this.onNodeEditorDelete}
        />
      </div>
    );
  }
}
