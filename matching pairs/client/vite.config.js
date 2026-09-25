import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This config only powers the standalone dev/preview harness (npm run dev).
// The reusable module itself lives entirely under src/ and never imports
// anything Vite-specific, so it can be dropped into the main school
// system's own build (whatever bundler that uses) without this file.
export default defineConfig({
  plugins: [react()],
});
