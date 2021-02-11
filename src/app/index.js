import '@babel/polyfill';
import React from 'react';
import { render } from 'react-dom';
import '../styles/app.scss';
import Coriolis from './Coriolis';
// import TapEventPlugin from 'react/lib/TapEventPlugin';
// import EventPluginHub from 'react/lib/EventPluginHub';

// onTouchTap not ready for primetime yet, too many issues with preventing default
// EventPluginHub.injection.injectEventPluginsByName({ TapEventPlugin });

render(<Coriolis />, document.getElementById('coriolis'));
