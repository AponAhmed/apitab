import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { installRuntimeLogging } from '@/utils/logger';

installRuntimeLogging('app');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary source="app">
      <WorkspacePage />
    </ErrorBoundary>
  </React.StrictMode>,
);
