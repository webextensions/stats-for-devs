import './index.css';

import { createRoot } from 'react-dom/client';

import { App } from './App/App.tsx';
import { loadDevOverlays } from './appUtils/devOverlays/loadDevOverlays.ts';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Mounted outside the React tree (mirrors the web-app-template's post-render mounting slot)
loadDevOverlays();
