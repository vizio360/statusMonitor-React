import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Node, NodeStatus, INodeEvents} from './';
import {EndpointOptions, Defaults, jsPlumb, jsPlumbInstance} from 'jsPlumb';
import apiImage from '@images/api.png';
import {Fetch, IStatus, IService} from '@app/fetchData';

interface IAPINode {
  jsPlumb: jsPlumbInstance;
  service: IService;
  events: INodeEvents;
}

class APINode extends React.Component<IAPINode> {
  render() {
    return (
      <Node
        id={this.props.service.id}
        name={this.props.service.name}
        jsPlumb={this.props.jsPlumb}
        image={apiImage}
        status={NodeStatus.HEALTHY}
        events={this.props.events}
        uiProps={this.props.service.uiProps}
      />
    );
  }
}

export default APINode;
