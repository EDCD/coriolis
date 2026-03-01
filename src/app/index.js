import React from 'react';
import { createRoot } from 'react-dom/client';
import '../less/app.less';
import Coriolis from './Coriolis';

const container = document.getElementById('coriolis');
const root = createRoot(container);
root.render(<Coriolis />);
