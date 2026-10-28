// defineConfig comes from vitest/config, not vite: as of Vitest 3 the `test`
// key is no longer merged into Vite's own config type, so importing from 'vite'
// typechecks as an unknown property.
import { defineConfig } from 'vitest/config';
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
