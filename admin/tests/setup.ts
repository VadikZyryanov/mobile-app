import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Mock env vars so supabase client инициализируется в тестах
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// localStorage shim для @supabase/supabase-js
if (typeof window !== 'undefined' && !window.localStorage) {
  // jsdom уже даёт localStorage, fallback не нужен в большинстве случаев
}

// MSW сервер — поднимем только если потребуется в конкретных suite
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
