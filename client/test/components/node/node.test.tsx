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

  it('renders a node', () => {
    let node = renderer.create(jsx);
    let tree = node.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('re-renders a node if service status changes', () => {
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

  it('re-renders a node if service ui properties change', () => {
    let node = renderer.create(jsx);
    let tree = node.toJSON();
    expect(tree).toMatchSnapshot();

    let updatedService: IService = JSON.parse(JSON.stringify(service));
    updatedService.uiProps = {
      top: 500,
      left: 600,
    };
    let jsxUpdate = (
      <Node
        key={service.id}
        service={updatedService}
        serviceState={serviceState}
      />
    );
    node.update(jsxUpdate);
    tree = node.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
