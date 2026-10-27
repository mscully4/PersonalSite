/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Node by default; the few tests that need a DOM opt in with a
    // `// @vitest-environment jsdom` comment, which keeps the suite fast.
    environment: 'node',
    include: ['{src,scripts}/**/*.test.{ts,tsx}'],
  },
});
