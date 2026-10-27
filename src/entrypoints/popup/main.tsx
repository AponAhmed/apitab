import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { PopupPage } from '@/pages/PopupPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { installRuntimeLogging } from '@/utils/logger';

installRuntimeLogging('popup');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary source="popup">
      <PopupPage />
    </ErrorBoundary>
  </React.StrictMode>,
);
