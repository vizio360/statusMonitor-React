import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  DragEventCallbackOptions,
  EndpointOptions,
  Defaults,
  jsPlumb,
  jsPlumbInstance,
} from 'jsPlumb';
import './node.css';
import fireImage from '../../../images/fire.gif';

interface INodeEvents {
  stopDrag: (params: DragEventCallbackOptions) => void;
  onDoubleClick: (id: string) => void;
}

interface INodeProps {
  jsPlumb: jsPlumbInstance;
  image: any;
  name: string;
  id: string;
  status: NodeStatus;
  className?: string;
  events?: INodeEvents;
  uiProps: {top: number; left: number};
}

enum NodeStatus {
  HEALTHY,
  UNHEALTHY,
}

enum NodeType {
  CRM = 'CRM',
  API = 'API',
  DB = 'DB',
}

class Node extends React.Component<INodeProps> {
  jsPlumb: jsPlumbInstance;
  nodeEvents: INodeEvents;

  constructor(props: INodeProps) {
    super(props);
    this.jsPlumb = props.jsPlumb;
    this.nodeEvents = props.events;
    this.onDragStop = this.onDragStop.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
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

  onDragStop(params: DragEventCallbackOptions) {
    if (this.nodeEvents && this.nodeEvents.stopDrag)
      this.nodeEvents.stopDrag(params);
  }

  onDoubleClick(e: React.MouseEvent<HTMLElement>) {
    if (this.nodeEvents && this.nodeEvents.onDoubleClick)
      this.nodeEvents.onDoubleClick(this.props.id);
  }

  componentDidMount() {
    this.jsPlumb.addEndpoint(
      this.props.id,
      this.getSourceEndPoint(this.props.id),
    );
    this.jsPlumb.addEndpoint(
      this.props.id,
      this.getTargetEndPoint(this.props.id),
    );
    this.jsPlumb.draggable(this.props.id, {stop: this.onDragStop});
  }

  render() {
    return (
      <div
        id={this.props.id}
        className={this.props.className ? this.props.className : 'node'}
        style={this.props.uiProps}
        onDoubleClick={this.onDoubleClick}>
        <img src={this.props.image} width="100%" height="100%" />
        {this.props.status !== NodeStatus.HEALTHY ? (
          <img
            className="nodeOverlay"
            src={fireImage}
            width="100%"
            height="100%"
          />
        ) : (
          ''
        )}
        <p>{this.props.name}</p>
      </div>
    );
  }
}

export {Node, NodeStatus, NodeType, INodeEvents};
