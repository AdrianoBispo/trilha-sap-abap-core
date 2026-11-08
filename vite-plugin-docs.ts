import path from 'node:path';
import type { Plugin } from 'vite';
import { parseMarkdown } from './src/content/parse.ts';

/**
 * Transforma cada arquivo Markdown de `docs/` em um módulo JavaScript com o
 * cabeçalho YAML (`meta`) e a árvore do corpo (`nodes`, formato mdast).
 * O parser roda só no build e no servidor de desenvolvimento; editar um .md
 * recarrega a página automaticamente.
 */
export default function docsMarkdown(docsDir: string): Plugin {
  const root = path.resolve(docsDir) + path.sep;
  return {
    name: 'docs-markdown',
    transform(code, id) {
      const file = id.split('?')[0];
      if (!file.startsWith(root) || !file.endsWith('.md')) return;
      const doc = parseMarkdown(code, path.relative(path.dirname(root), file), msg => this.warn(msg));
      return { code: `export default ${JSON.stringify(doc)};`, map: null };
    },
  };
}
