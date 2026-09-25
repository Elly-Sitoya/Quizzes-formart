import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This file is only the local dev/build harness for running the crossword
// app standalone. Every actual piece of the feature - components, context,
// the generator, all styling - lives under src/ and doesn't import
// anything Vite-specific, so it can be lifted into the school management
// system's own build (Vite, webpack, whatever it uses) without this file.
export default defineConfig({
  plugins: [react()],
});
