import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, CSSVariablesResolver } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { theme } from './theme';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--app-background': '#f8f9fa',
    '--sidebar-background': '#ffffff',
  },
  dark: {
    '--app-background': 'var(--mantine-color-dark-8)',
    '--sidebar-background': 'var(--mantine-color-dark-7)',
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light" cssVariablesResolver={cssVariablesResolver}>
        <ModalsProvider>
          <Notifications position="top-right" />
          <RouterProvider router={router} />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
