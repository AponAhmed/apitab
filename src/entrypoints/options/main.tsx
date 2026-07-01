import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { OptionsPage } from '@/pages/OptionsPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>,
);
