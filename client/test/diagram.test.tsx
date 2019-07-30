import React from 'react';

//ignoring typescript errors as the jsPlumb mocks
//export more symbols than the original jsPlumb
//these symbols are used to have quick access
//to all jsPlumb function mocks
//@ts-ignore
import {jsPlumb, setContainer, getInstance, bind} from 'jsPlumb';

import Diagram from '@app/diagram';
import renderer from 'react-test-renderer';
import servicesMock from '@mocks/services.json';
import connectionsMock from '@mocks/connections.json';
import {IStatusMonitorClient} from '@app/wsClient';

describe.only('Diagram test', () => {
  const mockClient: any = {
    connect: jest.fn().mockResolvedValue(''),
    getServices: jest.fn().mockReturnValue(servicesMock),
    getConnections: jest.fn().mockReturnValue(connectionsMock),
  };

  let createComponent = async () => {
    const cdmSpy = jest.spyOn(Diagram.prototype, 'componentDidMount');
    let d = renderer.create(<Diagram wsClient={mockClient} />);
    await cdmSpy.mock.results[0].value;
    return d;
  };

  it('can be instatiated', async () => {
    let d = await createComponent();
    let diagramJson = d.toJSON();
    expect(diagramJson).toMatchSnapshot();
    expect(mockClient.connect).toHaveBeenCalledWith('ws://localhost:3333/channel');
    expect(mockClient.getServices).toHaveBeenCalled();
    expect(mockClient.getConnections).toHaveBeenCalled();

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
  });
});
