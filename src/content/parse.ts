/**
 * Conversão Markdown → árvore mdast, executada no build/servidor de desenvolvimento
 * pelo plugin vite-plugin-docs.ts. O navegador recebe só o JSON resultante.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import YAML from 'yaml';
import type { Root, RootContent } from 'mdast';
import type {} from 'mdast-util-frontmatter';
import type { ParsedDoc } from './markdown.ts';

const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm).use(remarkDirective);

/** Remove posições do texto-fonte (não usadas na renderização) para reduzir o JSON. */
function strip(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strip);
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) if (k !== 'position') out[k] = strip(v);
    return out;
  }
  return node;
}

export function parseMarkdown(source: string, file: string, warn: (msg: string) => void = console.warn): ParsedDoc {
  const tree = processor.runSync(processor.parse(source)) as Root;
  let meta: Record<string, unknown> = {};
  const nodes: RootContent[] = [];
  for (const node of tree.children) {
    if (node.type === 'yaml') {
      try {
        meta = (YAML.parse(node.value) ?? {}) as Record<string, unknown>;
      } catch (e) {
        warn(`Cabeçalho YAML inválido em ${file}: ${(e as Error).message}`);
      }
    } else if (node.type !== 'html') {
      // Comentários HTML (<!-- -->) servem só para quem edita o texto.
      nodes.push(node);
    }
  }
  return { meta, nodes: strip(nodes) as RootContent[] };
}
