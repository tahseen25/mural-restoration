// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          60_000,
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0f0e0b',
              color:      '#faf7f2',
              fontFamily: '"DM Sans", system-ui',
              fontSize:   '14px',
              borderRadius: '2px',
            },
            success: { iconTheme: { primary: '#6b7f5a', secondary: '#faf7f2' } },
            error:   { iconTheme: { primary: '#b54e2d', secondary: '#faf7f2' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
