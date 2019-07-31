import React from 'react';

//ignoring typescript errors as the jsPlumb mocks
//export more symbols than the original jsPlumb
//these symbols are used to have quick access
//to all jsPlumb function mocks
//@ts-ignore
import {
  //@ts-ignore
  draggable,
  //@ts-ignore
  addEndpoint,
  jsPlumb,
  //@ts-ignore
  setContainer,
  //@ts-ignore
  getInstance,
  //@ts-ignore
  bind,
} from 'jsPlumb';

import Diagram from '@app/diagram';
import renderer from 'react-test-renderer';
import servicesMock from '@mocks/services.json';
import connectionsMock from '@mocks/connections.json';
import lastKnownStatesMock from '@mocks/lastKnownStates.json';
import {IStatusMonitorClient} from '@app/wsClient';
import {Status, IServiceLastKnownState} from '@dataTypes';

describe.only('Diagram', () => {
  const mockClient: any = {
    connect: jest.fn().mockResolvedValue(''),
    getServices: jest.fn().mockReturnValue(servicesMock),
    getConnections: jest.fn().mockReturnValue(connectionsMock),
    getServicesLastKnownState: jest.fn().mockReturnValue(lastKnownStatesMock),
    onUpdate: jest.fn().mockImplementation(cb => {}),
  };

  let createComponent = async () => {
    const cdmSpy = jest.spyOn(Diagram.prototype, 'componentDidMount');
    let d = renderer.create(<Diagram wsClient={mockClient} />);
    await cdmSpy.mock.results[0].value;
    return d;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can be instatiated', async () => {
    let d = await createComponent();
    let diagramJson = d.toJSON();
    expect(diagramJson).toMatchSnapshot();
    expect(mockClient.connect).toHaveBeenCalledWith(
      'ws://localhost:3333/channel',
    );
    expect(mockClient.getServices).toHaveBeenCalled();
    expect(mockClient.getConnections).toHaveBeenCalled();
    expect(mockClient.getServicesLastKnownState).toHaveBeenCalled();

    //JSPLUMB checks
    expect(getInstance).toHaveBeenCalledWith({
      Connector: 'StateMachine',
      Anchors: ['Left', 'BottomRight'],
    });
    expect(setContainer).toHaveBeenCalledWith('hello');
    expect(bind).toHaveBeenNthCalledWith(1, 'connection', expect.any(Function));
    expect(bind).toHaveBeenNthCalledWith(
      2,
      'connectionDetached',
      expect.any(Function),
    );
    expect(addEndpoint.mock.calls.length).toBe(servicesMock.length * 2);
    expect(draggable.mock.calls.length).toBe(servicesMock.length);
  });

  it('updates when an update state is received', async () => {
    let d = await createComponent();
    let diagramJson = d.toJSON();
    expect(diagramJson).toMatchSnapshot();
    const updateCallback = mockClient.onUpdate.mock.calls[0][0];
    const state: IServiceLastKnownState = {
      serviceId: '1',
      status: Status.UNHEALTHY,
      responseBody: 'casjcnaksd',
    };
    updateCallback(state);

    diagramJson = d.toJSON();
    expect(diagramJson).toMatchSnapshot();
  });
});
