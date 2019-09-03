import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './node.css';
import fireImage from '@images/fire.gif';
import {
  Status,
  ServiceType,
  IService,
  IServiceLastKnownState,
} from '@dataTypes';

import crmImage from '@images/crm.png';
import dbImage from '@images/db.png';
import apiImage from '@images/api.png';

interface INodeEvents {
  onDoubleClick: (id: string) => void;
}

interface INodeProps {
  service: IService;
  serviceState: IServiceLastKnownState;
  className?: string;
  events?: INodeEvents;
}

class Node extends React.Component<INodeProps> {
  nodeEvents: INodeEvents;

  constructor(props: INodeProps) {
    super(props);
    this.nodeEvents = props.events;
    this.onDoubleClick = this.onDoubleClick.bind(this);
  }

  onDoubleClick(e: React.MouseEvent<HTMLElement>) {
    if (this.nodeEvents && this.nodeEvents.onDoubleClick)
      this.nodeEvents.onDoubleClick(this.props.service.id);
  }

  hasNodeChanged(nextProps: INodeProps): boolean {
    let uiProps = this.props.service.uiProps;
    let newUIProps = nextProps.service.uiProps;
    return (
      nextProps.serviceState.status != this.props.serviceState.status ||
      uiProps.top != newUIProps.top ||
      uiProps.left != newUIProps.left
    );
  }

  getNodeTypeImage(serviceType: ServiceType) {
    let img: string;
    switch (serviceType) {
      case ServiceType.DB:
        img = dbImage;
        break;
      case ServiceType.API:
        img = apiImage;
        break;
      case ServiceType.CRM:
        img = crmImage;
        break;
    }
    return img;
  }

  shouldComponentUpdate(nextProps: INodeProps): boolean {
    return this.hasNodeChanged(nextProps);
  }

  render() {
    return (
      <div
        id={this.props.service.id}
        className={this.props.className ? this.props.className : 'node'}
        style={this.props.service.uiProps}
        onDoubleClick={this.onDoubleClick}>
        <img
          src={this.getNodeTypeImage(this.props.service.type)}
          width="100%"
          height="100%"
        />
        {this.props.serviceState.status !== Status.HEALTHY ? (
          <img
            className="nodeOverlay"
            src={fireImage}
            width="100%"
            height="100%"
          />
        ) : (
          ''
        )}
        <p>{this.props.service.name}</p>
      </div>
    );
  }
}

export {Node, INodeEvents};
