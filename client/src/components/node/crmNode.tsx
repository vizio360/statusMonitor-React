import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {INodeEvents, Node, NodeStatus} from './';
import {EndpointOptions, Defaults, jsPlumb, jsPlumbInstance} from 'jsPlumb';
import crmImage from '@images/crm.png';
import {Fetch, IStatus, IService} from '@app/fetchData';

interface ICRMNode {
  jsPlumb: jsPlumbInstance;
  service: IService;
  events?: INodeEvents;
}

class CRMNode extends React.Component<ICRMNode> {
  constructor(props: ICRMNode) {
    super(props);
  }
  componentDidMount() {
    console.log('mounted!');
  }

  componentWillUnmount() {
    console.log('umounted');
  }

  componentWillReceiveProps(props: ICRMNode) {
    console.log(props);
  }

  render() {
    return (
      <Fetch service={this.props.service}>
        {(status: IStatus) => (
          <Node
            id={this.props.service.id}
            name={this.props.service.name}
            jsPlumb={this.props.jsPlumb}
            image={crmImage}
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

export default CRMNode;
