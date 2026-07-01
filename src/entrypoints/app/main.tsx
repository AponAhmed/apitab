import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { WorkspacePage } from '@/pages/WorkspacePage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorkspacePage />
  </React.StrictMode>,
);
