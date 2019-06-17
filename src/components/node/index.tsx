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

const inEndPointOptions: EndpointOptions = {
  maxConnections: 10,
  anchor: 'TopRight',
  paintStyle: {fill: '#F00'},
  type: 'Dot',
  id: 'oneC',
  scope: 'dotEndPoint',
  reattachConnections: true,
  parameters: {},
  isTarget: true,
};

const outEndPointOptions: EndpointOptions = {
  maxConnections: 10,
  anchor: 'BottomRight',
  paintStyle: {fill: '#00F'},
  type: 'Dot',
  id: 'oneC',
  scope: 'dotEndPoint',
  reattachConnections: true,
  parameters: {},
  isSource: true,
};

class Node extends React.Component<INodeProps> {
  jsPlumb: jsPlumbInstance;
  nodeEvents: INodeEvents;

  constructor(props: INodeProps) {
    super(props);
    this.jsPlumb = props.jsPlumb;
    this.nodeEvents = props.events;
    console.log(props.id);
  }

  onDragStop(params: DragEventCallbackOptions) {
    if (this.nodeEvents && this.nodeEvents.stopDrag)
      this.nodeEvents.stopDrag(params);
  }

  componentDidMount() {
    this.jsPlumb.addEndpoint(this.props.id, inEndPointOptions);
    this.jsPlumb.addEndpoint(this.props.id, outEndPointOptions);
    this.jsPlumb.draggable(this.props.id, {stop: this.onDragStop.bind(this)});
  }

  render() {
    return (
      <div
        id={this.props.id}
        className={this.props.className ? this.props.className : 'node'}
        style={this.props.uiProps}>
        <img src={this.props.image} width="100%" height="100%" />
        {this.props.status === NodeStatus.UNHEALTHY ? (
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
