import React from 'react';
import * as ReactDOM from 'react-dom';
import Diagram from '@app/diagram';
import {StatusMonitorClient} from '@app/wsClient';


ReactDOM.render(<Diagram wsClient={StatusMonitorClient.getInstance()}/>, document.getElementById('diagram'));
