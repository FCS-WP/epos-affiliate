import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const entry = process.env.ENTRY || 'main';

const entries = {
  main: {
    input: resolve(__dirname, 'src/main.jsx'),
    entryFileNames: 'frontend.js',
    assetFileNames: 'frontend.[ext]',
  },
  login: {
    input: resolve(__dirname, 'src/login.jsx'),
    entryFileNames: 'login.js',
    assetFileNames: 'login.[ext]',
  },
};

const config = entries[entry] || entries.main;

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  build: {
    outDir: resolve(__dirname, '../../dist/frontend'),
    emptyOutDir: entry === 'main',
    rollupOptions: {
      input: config.input,
      output: {
        entryFileNames: config.entryFileNames,
        assetFileNames: config.assetFileNames,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
