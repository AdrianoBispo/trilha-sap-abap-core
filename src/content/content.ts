/**
 * Carrega todo o conteúdo textual de docs/ (Vite import.meta.glob).
 * Nenhum texto das páginas fica no código: tudo vem dos arquivos Markdown.
 */
import type { RootContent } from 'mdast';
import { readLinks, splitSections, takeContainers, toText, type LinkItem, type ParsedDoc, type Section } from './markdown';

// Cada .md chega já convertido em { meta, nodes } pelo plugin vite-plugin-docs.ts.
const files = import.meta.glob(['/docs/**/*.md', '!/docs/README.md'], { import: 'default', eager: true }) as Record<string, ParsedDoc>;
/** Cópia profunda: o processamento abaixo altera os nós (ex.: remove {atributos} dos títulos). */
const parseDoc = <F,>(doc: ParsedDoc | undefined): { meta: F; nodes: RootContent[] } =>
  doc ? (structuredClone(doc) as { meta: F; nodes: RootContent[] }) : { meta: {} as F, nodes: [] };
const svgs = import.meta.glob('/docs/figuras/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Trilha da SAP Learning que deu origem a parte das lições (campo `sap_learning` do cabeçalho). */
export const LEARNING_JOURNEY = 'https://learning.sap.com/learning-journeys/acquire-core-abap-skills';

export interface Module {
  n: number;
  /** Número com dois dígitos, como aparece na navegação: "01". */
  label: string;
  /** Nome da pasta, ex.: "1-abap-overview". */
  id: string;
  /** Endereço da página do módulo: o nome da pasta sem o número ("abap-overview" → #abap-overview). */
  slug: string;
  title: string;
  icon: string;
  color: number;
  desc: string;
  lessons: Lesson[];
  /** Soma das durações das lições, em minutos. */
  minutes: number;
}

export interface Lesson {
  id: string;
  idx: number;
  num: number;
  module: Module;
  title: string;
  sub: string;
  /** Unidade correspondente na SAP Learning, quando a lição deriva de uma. */
  sapLearning: string;
  dur: string;
  /** Duração em minutos, lida de `duracao` ("1 h 25 min" → 85). */
  minutes: number;
  icon: string;
  objectives: string[];
  keywords: string;
  sections: Section[];
  docs: LinkItem[];
  file: string;
}

interface ModuleMeta { numero: number; titulo: string; icone?: string; cor?: number }
interface LessonMeta {
  titulo: string; subtitulo?: string; sap_learning?: string; duracao?: string; icone?: string;
  objetivos?: string[]; palavras_chave?: string;
}

/** "1 h 25 min" → 85; "45 min" → 45. */
const toMinutes = (d: string) => {
  const h = d.match(/(\d+)\s*h/), m = d.match(/(\d+)\s*min/);
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
};

/** 225 → "3 h 45 min". */
export const formatMinutes = (n: number) => {
  const h = Math.floor(n / 60), m = n % 60;
  return h ? (m ? `${h} h ${String(m).padStart(2, '0')} min` : `${h} h`) : `${m} min`;
};

function build() {
  const modules: Module[] = [];
  const byFolder = new Map<string, Module>();
  for (const [file, src] of Object.entries(files)) {
    const m = file.match(/^\/docs\/modulos\/([^/]+)\/_modulo\.md$/);
    if (!m) continue;
    const { meta, nodes } = parseDoc<ModuleMeta>(src);
    const n = Number(meta.numero) || modules.length + 1;
    const c: Module = {
      n,
      label: String(n).padStart(2, '0'),
      id: m[1],
      slug: m[1].replace(/^\d+-/, ''),
      title: meta.titulo,
      icon: meta.icone ?? 'course-book',
      color: Number(meta.cor) || 6,
      desc: toText(nodes).trim(),
      lessons: [],
      minutes: 0,
    };
    modules.push(c);
    byFolder.set(m[1], c);
  }
  modules.sort((a, b) => a.n - b.n);

  const lessonFiles = Object.keys(files)
    .filter(f => /^\/docs\/modulos\/[^/]+\/\d+-[^/]+\.md$/.test(f))
    .sort();
  for (const file of lessonFiles) {
    const [, folder, name] = file.match(/^\/docs\/modulos\/([^/]+)\/(\d+-[^/]+)\.md$/)!;
    const mod = byFolder.get(folder);
    if (!mod) {
      console.warn(`[docs] ${file}: pasta sem _modulo.md.`);
      continue;
    }
    const { meta, nodes } = parseDoc<LessonMeta>(files[file]);
    const id = name.replace(/^\d+-/, '');
    const docs = takeContainers(nodes, 'documentacao').flatMap(readLinks);
    mod.lessons.push({
      id,
      idx: 0,
      num: mod.lessons.length + 1,
      module: mod,
      title: meta.titulo ?? id,
      sub: meta.subtitulo ?? '',
      sapLearning: String(meta.sap_learning ?? ''),
      dur: meta.duracao ?? '',
      minutes: toMinutes(meta.duracao ?? ''),
      icon: meta.icone ?? 'document-text',
      objectives: meta.objetivos ?? [],
      keywords: meta.palavras_chave ?? '',
      sections: splitSections(nodes),
      docs,
      file,
    });
  }
  const lessons = modules.flatMap(c => c.lessons);
  lessons.forEach((l, i) => (l.idx = i));
  modules.forEach(c => (c.minutes = c.lessons.reduce((t, l) => t + l.minutes, 0)));
  // Módulos e lições dividem o mesmo espaço de endereços (#slug).
  const taken = new Set([...RESERVED, ...lessons.map(l => l.id)]);
  for (const c of modules) if (taken.has(c.slug)) console.warn(`[docs] O endereço do módulo "${c.slug}" coincide com o de uma lição ou página.`);
  return { modules, lessons };
}

/** Páginas avulsas: seus endereços não podem ser usados por módulos nem lições. */
const RESERVED = ['inicio', 'referencia'];

export const { modules: MODULES, lessons: LESSONS } = build();
export const lessonById = (id: string) => LESSONS.find(l => l.id === id);
export const moduleBySlug = (slug: string) => MODULES.find(c => c.slug === slug);

/* ---------- Páginas avulsas ---------- */

export interface PageDoc<F> {
  meta: F;
  sections: Section[];
  containers: Record<string, RootContent[]>;
  links: LinkItem[];
}

function page<F>(name: string, containerNames: string[] = []): PageDoc<F> {
  const file = `/docs/${name}.md`;
  const { meta, nodes } = parseDoc<F>(files[file]);
  const containers: Record<string, RootContent[]> = {};
  for (const c of containerNames) containers[c] = takeContainers(nodes, c).flat();
  const links = takeContainers(nodes, 'documentacao').flatMap(readLinks);
  return { meta, sections: splitSections(nodes), containers, links };
}

export interface HomeMeta { selo?: string; titulo?: string; resumo?: string; ilustracao?: string }
export interface RefMeta { titulo?: string; subtitulo?: string; icone?: string; cor?: number }

export const HOME = page<HomeMeta>('inicio');
export const REFERENCE = page<RefMeta>('referencia');

/** SVG de docs/figuras pelo nome do arquivo. */
export const figure = (name: string): string | undefined => svgs[`/docs/figuras/${name}`];
