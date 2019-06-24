import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Node, NodeStatus, INodeEvents} from './';
import {EndpointOptions, Defaults, jsPlumb, jsPlumbInstance} from 'jsPlumb';
import apiImage from '../../../images/api.png';
import {Fetch, IStatus, IService} from '../../fetchData';

interface IAPINode {
  jsPlumb: jsPlumbInstance;
  service: IService;
  events: INodeEvents;
}

class APINode extends React.Component<IAPINode> {
  render() {
    return (
      <Fetch service={this.props.service}>
        {(status: IStatus) => (
          <Node
            id={this.props.service.id}
            name={this.props.service.name}
            jsPlumb={this.props.jsPlumb}
            image={apiImage}
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

export default APINode;
