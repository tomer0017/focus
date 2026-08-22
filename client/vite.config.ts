/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The API is not called yet (Focus runs on mock data), but keeping the proxy
// correct means the first real request works without a config change.
// Override with VITE_API_PROXY_TARGET if the server runs on another port.
export default defineConfig(({ command, mode }) => {
  // envDir '.' keeps this config free of @types/node just to read process.cwd().
  const env = loadEnv(mode, '.');
  // The server binds 5001 (see server/.env); 3000 is only the fallback the
  // server itself uses when PORT is unset.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5001';

  /*
   * GitHub Pages serves this project from https://tomer0017.github.io/focus/,
   * so a production build must emit asset URLs under `/focus/`. Dev stays on
   * `/`, which is what keeps `npm run dev` unchanged; `vite preview` inherits
   * the build's base, so the local preview reproduces the deployed sub-path.
   * Publishing under a different name only needs VITE_BASE_PATH.
   */
  const base = env.VITE_BASE_PATH || (command === 'build' ? '/focus/' : '/');

  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        '/health': { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
    /*
     * Tests cover `src/lib` — the pure rules. Deliberately no jsdom and no
     * component rendering: what can hide information, create a duplicate or
     * fire a reminder on the wrong day all lives in those functions, and a
     * suite that renders every card would be slower, more brittle and would
     * still not catch any of it. See CLAUDE.md → Testing.
     */
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      exclude: ['src/legacy/**'],
    },
  };
});
