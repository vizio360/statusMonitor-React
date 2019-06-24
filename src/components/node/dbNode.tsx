import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Node, NodeStatus, INodeEvents} from './';
import {EndpointOptions, Defaults, jsPlumb, jsPlumbInstance} from 'jsPlumb';
import dbImage from '../../../images/db.png';
import {Fetch, IStatus, IService} from '../../fetchData';

interface IDBNode {
  jsPlumb: jsPlumbInstance;
  service: IService;
  events: INodeEvents;
}

class DBNode extends React.Component<IDBNode> {
  componentDidMount() {}

  render() {
    return (
      <Fetch service={this.props.service}>
        {(status: IStatus) => (
          <Node
            id={this.props.service.id}
            name={this.props.service.name}
            jsPlumb={this.props.jsPlumb}
            image={dbImage}
            status={
              status.status === 'Unhealthy'
                ? NodeStatus.UNHEALTHY
                : NodeStatus.HEALTHY
            }
            events={this.props.events}
            uiProps={this.props.service.uiProps}
          />
        )}
      </Fetch>
    );
  }
}

export default DBNode;
