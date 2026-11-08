import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Módulo virtual `virtual:doc-icons`.
 *
 * Varre os arquivos Markdown de `docs/` atrás de ícones (`icone: nome` no
 * cabeçalho ou `icone="nome"` em títulos e diretivas) e gera um `import` para
 * cada ícone do pacote @ui5/webcomponents-icons. Assim o bundle leva só os
 * ícones realmente usados pelo conteúdo, e quem edita o texto não precisa
 * mexer em código para usar um ícone novo.
 */
export default function docIcons(docsDir: string): Plugin {
  const VIRTUAL = 'virtual:doc-icons';
  const RESOLVED = '\0' + VIRTUAL;
  const iconsDir = path.resolve('node_modules/@ui5/webcomponents-icons/dist');

  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : e.name.endsWith('.md') ? [p] : [];
    });

  const collect = () => {
    const names = new Set<string>();
    for (const file of walk(docsDir)) {
      const txt = fs.readFileSync(file, 'utf8');
      for (const m of txt.matchAll(/icone(?:="|:\s*)([a-z0-9-]+)/g)) names.add(m[1]);
    }
    return [...names].sort();
  };

  return {
    name: 'doc-icons',
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : undefined;
    },
    load(id) {
      if (id !== RESOLVED) return;
      const lines: string[] = [];
      for (const name of collect()) {
        if (fs.existsSync(path.join(iconsDir, `${name}.js`))) {
          lines.push(`import '@ui5/webcomponents-icons/dist/${name}.js';`);
        } else {
          this.warn(`Ícone "${name}" usado em docs/ não existe em @ui5/webcomponents-icons.`);
        }
      }
      return lines.join('\n') + '\nexport {};\n';
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(docsDir) && file.endsWith('.md')) {
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
    },
  };
}
