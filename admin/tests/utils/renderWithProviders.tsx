import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { type ReactElement, type ReactNode } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, networkMode: 'always' },
      mutations: { retry: false, networkMode: 'always' },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options: {
    initialEntries?: string[];
    queryClient?: QueryClient;
    renderOptions?: RenderOptions;
  } = {},
) {
  const { initialEntries = ['/'], queryClient = createTestQueryClient(), renderOptions } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
