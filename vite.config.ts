import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import docIcons from './vite-plugin-doc-icons.ts';
import docsMarkdown from './vite-plugin-docs.ts';

const docs = path.resolve(import.meta.dirname, 'docs');

export default defineConfig({
  // Caminhos relativos: o build funciona em qualquer subpasta (ex.: GitHub Pages).
  base: './',
  plugins: [react(), docsMarkdown(docs), docIcons(docs)],
  build: {
    // O núcleo do UI5 Web Components é um bloco único grande; temas e idiomas vêm em arquivos separados, sob demanda.
    chunkSizeWarningLimit: 2500,
  },
});
