import React from 'react';
import { createRoot } from 'react-dom/client';
import './theme/lava-me.css'; // Importe o seu CSS aqui em cima!
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);