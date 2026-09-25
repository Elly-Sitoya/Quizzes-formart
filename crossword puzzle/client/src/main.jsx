import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Standalone entry point, used only when this app is run on its own
// (npm run dev / npm run build). When it's dropped into the existing
// school management system, the host app can skip this file entirely
// and just mount <App /> (see src/App.jsx) inside its own tree.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
