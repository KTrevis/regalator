import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EdenProvider, edenClient } from './lib/eden';
import { TooltipProvider } from './components/ui/tooltip';
import { routeTree } from './routeTree.gen';
import './styles.css';

const queryClient = new QueryClient();
const router = createRouter({ routeTree });
const root = document.getElementById('root');

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <EdenProvider client={edenClient} queryClient={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </EdenProvider>
    </QueryClientProvider>
  </StrictMode>,
);
