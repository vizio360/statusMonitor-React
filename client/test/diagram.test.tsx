import React from 'react';
import {Node} from '@app/components/node';
import NavBar from '@app/navbar';
import NodeEditor from '@app/nodeEditor';

//ignoring typescript errors as the jsPlumb mocks
//export more symbols than the original jsPlumb
//these symbols are used to have quick access
//to all jsPlumb function mocks
//MOCKS are in __mocks__/jsPlumb
import {
  jsPlumb,
  //@ts-ignore
  draggable,
  //@ts-ignore
  addEndpoint,
  //@ts-ignore
  setContainer,
  //@ts-ignore
  getInstance,
  //@ts-ignore
  bind,
  //@ts-ignore
  reset,
  //@ts-ignore
  setDraggable,
} from 'jsPlumb';

import Diagram from '@app/diagram';
import renderer from 'react-test-renderer';
import servicesMock from '@mocks/services.json';
import connectionsMock from '@mocks/connections.json';
import lastKnownStatesMock from '@mocks/lastKnownStates.json';
import {IStatusMonitorClient} from '@app/wsClient';
import {
  ServiceType,
  IService,
  Status,
  IServiceLastKnownState,
} from '@dataTypes';

describe('Diagram', () => {
  const clone = (array: any) => {
    return JSON.parse(JSON.stringify(array));
  };
  const mockClient: any = {
    connect: jest.fn().mockResolvedValue(''),
    getServices: jest.fn().mockImplementation(() => {
      return clone(servicesMock);
    }),
    getConnections: jest.fn().mockImplementation(() => {
      return clone(connectionsMock);
    }),
    getServicesLastKnownState: jest.fn().mockImplementation(() => {
      return clone(lastKnownStatesMock);
    }),
    onUpdate: jest.fn().mockImplementation(cb => {}),
    onReload: jest.fn().mockImplementation(cb => {}),
    onError: jest.fn().mockImplementation(cb => {}),
  };

  let createDiagramComponent = async () => {
    const cdmSpy = jest.spyOn(Diagram.prototype, 'componentDidMount');
    let d = renderer.create(<Diagram wsClient={mockClient} />);
    await cdmSpy.mock.results[0].value;
    return d;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const checkJSPlumbInit = (serv: IService[]) => {
    expect(getInstance).toHaveBeenCalledWith({
      Connector: 'StateMachine',
      Anchors: ['Left', 'BottomRight'],
    });
    expect(setContainer).toHaveBeenCalledWith('jsPlumbDiagram');
    expect(bind).toHaveBeenNthCalledWith(1, 'connection', expect.any(Function));
    expect(bind).toHaveBeenNthCalledWith(
      2,
      'connectionDetached',
      expect.any(Function),
    );
    expect(addEndpoint.mock.calls.length).toBe(servicesMock.length * 2);
    expect(draggable.mock.calls.length).toBe(servicesMock.length);
    expect(setDraggable.mock.calls.length).toBe(servicesMock.length);
  };

  it('can be instatiated', async () => {
    let diagram = await createDiagramComponent();
    let diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
    expect(mockClient.connect).toHaveBeenCalledWith(
      'ws://localhost:3333/channel',
    );
    expect(mockClient.getServices).toHaveBeenCalled();
    expect(mockClient.getConnections).toHaveBeenCalled();
    expect(mockClient.getServicesLastKnownState).toHaveBeenCalled();

    checkJSPlumbInit(servicesMock as IService[]);
  });

  it('updates when an update state is received', async () => {
    let diagram = await createDiagramComponent();
    let diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
    const updateCallback = mockClient.onUpdate.mock.calls[0][0];
    const state: IServiceLastKnownState = {
      serviceId: '1',
      status: Status.UNHEALTHY,
      responseBody: 'casjcnaksd',
    };
    updateCallback(state);
    diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
  });

  it('reloads when a reload message is received', async () => {
    let diagram = await createDiagramComponent();
    let diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
    const reloadCallback = mockClient.onReload.mock.calls[0][0];

    mockClient.getServices.mockImplementationOnce(() => {
      return clone(servicesMock.slice(2));
    });
    mockClient.getConnections.mockImplementationOnce(() => {
      return clone(connectionsMock.slice(2));
    });
    mockClient.getServicesLastKnownState.mockImplementationOnce(() => {
      return clone(lastKnownStatesMock.slice(2));
    });

    reloadCallback();
    expect(reset).toHaveBeenCalled();
    diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
  });

  it('resets itself if cancelling an edit', async () => {
    let diagram = await createDiagramComponent();
    let component = diagram.root;
    let initSpy = jest.spyOn(Diagram.prototype, 'init');

    let navBar = component.findByType(NavBar);
    navBar.props.onEdit();
    navBar.props.onCancel();
    expect(initSpy).toHaveBeenCalled();
    let diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
  });

  it('adds a new node on node editor confirmation', async () => {
    let diagram = await createDiagramComponent();
    let diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
    let component = diagram.root;

    let newService: IService = {
      id: '',
      name: 'newService',
      uri: 'newService URI',
      timeout: 30,
      categories: ['cat1'],
      type: ServiceType.CRM,
      uiProps: {
        top: 10,
        left: 15,
      },
    };
    let nodeEditor = component.findByType(NodeEditor);
    nodeEditor.props.onConfirm(newService);
    diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
  });

  it('cancels the node editor modal', async () => {
    let diagram = await createDiagramComponent();
    let component = diagram.root;
    let node = component.findAllByType(Node)[0];
    node.props.events.onDoubleClick(servicesMock[0].id);
    let diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
    let nodeEditor = component.findByType(NodeEditor);
    nodeEditor.props.onCancel();
    diagramJson = diagram.toJSON();
    expect(diagramJson).toMatchSnapshot();
  });
});
