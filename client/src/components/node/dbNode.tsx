import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Node, NodeStatus, INodeEvents} from './';
import {EndpointOptions, Defaults, jsPlumb, jsPlumbInstance} from 'jsPlumb';
import dbImage from '@images/db.png';
import {Fetch, IStatus, IService} from '@app/fetchData';

interface IDBNode {
  jsPlumb: jsPlumbInstance;
  service: IService;
  events: INodeEvents;
}

class DBNode extends React.Component<IDBNode> {
  componentDidMount() {}

  render() {
    return (
      <Node
        id={this.props.service.id}
        name={this.props.service.name}
        jsPlumb={this.props.jsPlumb}
        image={dbImage}
        status={NodeStatus.UNHEALTHY}
        events={this.props.events}
        uiProps={this.props.service.uiProps}
      />
    );
  }
}

export default DBNode;
