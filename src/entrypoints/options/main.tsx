import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { OptionsPage } from '@/pages/OptionsPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { installRuntimeLogging } from '@/utils/logger';

installRuntimeLogging('options');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary source="options">
      <OptionsPage />
    </ErrorBoundary>
  </React.StrictMode>,
);
