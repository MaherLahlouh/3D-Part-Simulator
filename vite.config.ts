import { defineConfig } from 'vite';
import path from 'path';
import monacoEditorPluginModule from 'vite-plugin-monaco-editor';
const monacoEditorPlugin = (monacoEditorPluginModule as any).default || monacoEditorPluginModule;

export default defineConfig({
  // 1. Project Root (where index.html lives)
  root: './', 

  // 2. Directory for static assets like .glb models or .hex files
  publicDir: 'public',

  server: {
    port: 5173,
    open: true, // Automatically opens your browser
    cors: true  // Allows frontend to communicate with your server.js backend
  },

  resolve: {
    alias: {
      '@client': path.resolve(__dirname, './src/client'),
      '@assets': path.resolve(__dirname, './src/client/assets'),
    },
  },

  //need check
  plugins: [
    monacoEditorPlugin({ // Some versions require .default
      languageWorkers: ['editorWorkerService', 'typescript', 'json']
    })
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true, // Essential for debugging TypeScript in the browser
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), 
        simulator: path.resolve(__dirname, 'src/client/pages/index.html'),
        login: path.resolve(__dirname, 'src/client/pages/login.html'),
        signup: path.resolve(__dirname, 'src/client/pages/sign_up.html'),
        landing: path.resolve(__dirname, 'src/client/pages/landing.html'),
        dashboard: path.resolve(__dirname, 'src/client/pages/dashboard.html'),
      },
    },
  },
});