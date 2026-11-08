import type { Heading, Nodes, PhrasingContent, RootContent } from 'mdast';
import type {} from 'mdast-util-frontmatter';
import type {} from 'mdast-util-directive';
import type {} from 'mdast-util-gfm';

/** Documento Markdown já processado no build (ver vite-plugin-docs.ts). */
export interface ParsedDoc<F = Record<string, unknown>> {
  meta: F;
  nodes: RootContent[];
}

/** Texto puro de um nó (sem formatação). */
export function toText(node: Nodes | Nodes[] | undefined): string {
  if (!node) return '';
  if (Array.isArray(node)) return node.map(toText).join('');
  if ('value' in node && typeof node.value === 'string' && node.type !== 'html' && node.type !== 'yaml') return node.value;
  if ('children' in node) return (node.children as Nodes[]).map(toText).join('');
  return '';
}

const ATTR_BLOCK = /\s*\{([^{}]*)\}\s*$/;

/**
 * Títulos aceitam atributos no fim, entre chaves:
 *   ## Título da seção {ancora="Rótulo curto" icone="nome-do-icone"}
 * Devolve os atributos e remove o trecho `{…}` do título.
 */
export function headingAttrs(h: Heading): Record<string, string> {
  const last = h.children[h.children.length - 1];
  if (!last || last.type !== 'text') return {};
  const m = last.value.match(ATTR_BLOCK);
  if (!m) return {};
  const attrs: Record<string, string> = {};
  for (const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
  const id = m[1].match(/#([\w-]+)/);
  if (id) attrs.id = id[1];
  last.value = last.value.slice(0, m.index).replace(/\s+$/, '');
  return attrs;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface Section {
  id: string;
  anchor: string;
  icon?: string;
  title: PhrasingContent[];
  titleText: string;
  nodes: RootContent[];
}

/** Divide o corpo em seções a cada título de nível 2 (##). */
export function splitSections(nodes: RootContent[]): Section[] {
  const sections: Section[] = [];
  const used = new Set<string>();
  let cur: Section | null = null;
  for (const node of nodes) {
    if (node.type === 'heading' && node.depth === 2) {
      const attrs = headingAttrs(node);
      const titleText = toText(node).trim();
      const anchor = attrs.ancora || titleText;
      let id = attrs.id || slugify(anchor) || `secao-${sections.length + 1}`;
      while (used.has(id)) id += '-2';
      used.add(id);
      cur = { id, anchor, icon: attrs.icone, title: node.children, titleText, nodes: [] };
      sections.push(cur);
    } else {
      if (!cur) {
        cur = { id: 'introducao', anchor: 'Introdução', title: [], titleText: '', nodes: [] };
        used.add(cur.id);
        sections.push(cur);
      }
      cur.nodes.push(node);
    }
  }
  return sections;
}

/** Remove e devolve os blocos `:::nome` do nível superior (ex.: quiz, documentacao). */
export function takeContainers(nodes: RootContent[], name: string): RootContent[][] {
  const found: RootContent[][] = [];
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.type === 'containerDirective' && n.name === name) {
      found.unshift(n.children as RootContent[]);
      nodes.splice(i, 1);
    }
  }
  return found;
}

export interface LinkItem {
  title: string;
  url: string;
}

/** Lê uma lista Markdown de links: `- [Título](url)`. */
export function readLinks(nodes: RootContent[]): LinkItem[] {
  const out: LinkItem[] = [];
  for (const n of nodes) {
    if (n.type !== 'list') continue;
    for (const li of n.children) {
      const para = li.children.find(c => c.type === 'paragraph');
      const link = para && para.type === 'paragraph' ? para.children.find(c => c.type === 'link') : undefined;
      if (link && link.type === 'link') out.push({ title: toText(link).trim(), url: link.url });
    }
  }
  return out;
}
