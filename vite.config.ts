import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the build runs from GitHub Pages' /dollroleplay/ subfolder or any static host.
  base: './',
  test: { include: ['tests/**/*.test.ts'] },
} as never);
