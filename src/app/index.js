import React from 'react';
import { createRoot } from 'react-dom/client';
import '../less/app.less';
import Coriolis from './Coriolis';
import ErrorBoundary from './components/ErrorBoundary';

const container = document.getElementById('coriolis');
const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <Coriolis />
  </ErrorBoundary>
);
