import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Node} from '@app/components/node';
import renderer from 'react-test-renderer';
import {
  Status,
  IService,
  IServiceLastKnownState,
  ServiceType,
} from '@dataTypes';

describe('Node', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const service: IService = {
    id: '1',
    name: 'A_SERVICE',
    uri: 'http://service',
    timeout: 30,
    type: ServiceType.DB,
    categories: [],
    uiProps: {
      top: 10,
      left: 10,
    },
  };

  const serviceState: IServiceLastKnownState = {
    serviceId: '1',
    status: Status.HEALTHY,
    responseBody: 'some json body',
  };

  const jsx = (
    <Node key={service.id} service={service} serviceState={serviceState} />
  );

  it('renders a DB node', () => {
    let node = renderer.create(jsx);
    let tree = node.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('updates a node if service status changes', () => {
    let node = renderer.create(jsx);
    let tree = node.toJSON();
    expect(tree).toMatchSnapshot();

    const serviceStateUpdated: IServiceLastKnownState = {
      serviceId: '1',
      status: Status.UNHEALTHY,
      responseBody: 'some json body',
    };
    let jsxUpdate = (
      <Node
        key={service.id}
        service={service}
        serviceState={serviceStateUpdated}
      />
    );
    node.update(jsxUpdate);
    tree = node.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('does not re-render if node service status did not change', () => {
    let node = renderer.create(jsx);

    const serviceStateUpdated: IServiceLastKnownState = {
      serviceId: '1',
      status: Status.HEALTHY,
      responseBody: 'some json body',
    };

    const renderSpy = jest.spyOn(Node.prototype, 'render');
    let jsxUpdate = (
      <Node
        key={service.id}
        service={service}
        serviceState={serviceStateUpdated}
      />
    );
    node.update(jsxUpdate);
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
