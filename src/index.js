import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <--- PASTIKAN BARIS INI ADA
import ProjectDashboard from './ProjectDashboard';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ProjectDashboard />
  </React.StrictMode>
);
