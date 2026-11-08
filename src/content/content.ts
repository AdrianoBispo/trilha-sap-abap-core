/**
 * Carrega todo o conteúdo textual de docs/ (Vite import.meta.glob).
 * Nenhum texto das páginas fica no código: tudo vem dos arquivos Markdown.
 */
import type { BlockContent, PhrasingContent, RootContent } from 'mdast';
import { readLinks, splitSections, takeContainers, toText, type LinkItem, type ParsedDoc, type Section } from './markdown';

// Cada .md chega já convertido em { meta, nodes } pelo plugin vite-plugin-docs.ts.
const files = import.meta.glob(['/docs/**/*.md', '!/docs/README.md'], { import: 'default', eager: true }) as Record<string, ParsedDoc>;
/** Cópia profunda: o processamento abaixo altera os nós (ex.: remove {atributos} dos títulos). */
const parseDoc = <F,>(doc: ParsedDoc | undefined): { meta: F; nodes: RootContent[] } =>
  doc ? (structuredClone(doc) as { meta: F; nodes: RootContent[] }) : { meta: {} as F, nodes: [] };
const svgs = import.meta.glob('/docs/figuras/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const LEARNING_JOURNEY = 'https://learning.sap.com/learning-journeys/acquire-core-abap-skills';

export interface Course {
  n: number;
  id: string;
  title: string;
  en: string;
  icon: string;
  color: number;
  desc: string;
  lessons: Lesson[];
}

export interface QuizQuestion {
  question: PhrasingContent[];
  options: PhrasingContent[][];
  optionsText: string[];
  answer: number;
  why: RootContent[];
  lessonId: string;
}

export interface Lesson {
  id: string;
  idx: number;
  num: number;
  course: Course;
  title: string;
  sub: string;
  unit: string;
  dur: string;
  icon: string;
  objectives: string[];
  keywords: string;
  sections: Section[];
  quiz: QuizQuestion[];
  docs: LinkItem[];
  file: string;
}

interface CourseMeta { numero: number; titulo: string; titulo_en: string; icone?: string; cor?: number }
interface LessonMeta {
  titulo: string; subtitulo?: string; unidade?: string | number; duracao?: string; icone?: string;
  objetivos?: string[]; palavras_chave?: string;
}

function parseQuiz(blocks: RootContent[], lessonId: string, file: string): QuizQuestion[] {
  const qs: QuizQuestion[] = [];
  let cur: QuizQuestion | null = null;
  for (const n of blocks) {
    if (n.type === 'heading') {
      cur = { question: n.children, options: [], optionsText: [], answer: -1, why: [], lessonId };
      qs.push(cur);
    } else if (cur && n.type === 'list') {
      n.children.forEach(li => {
        const para = li.children.find(c => c.type === 'paragraph');
        const inl = para && para.type === 'paragraph' ? para.children : [];
        if (li.checked) cur!.answer = cur!.options.length;
        cur!.options.push(inl);
        cur!.optionsText.push(toText(inl).trim());
      });
    } else if (cur && n.type === 'blockquote') {
      cur.why.push(...(n.children as BlockContent[]));
    }
  }
  for (const q of qs) {
    if (q.answer < 0) console.warn(`[docs] ${file}: a questão "${toText(q.question)}" não tem resposta marcada com [x].`);
  }
  return qs.filter(q => q.answer >= 0 && q.options.length > 1);
}

function build() {
  const courses: Course[] = [];
  const byFolder = new Map<string, Course>();
  for (const [file, src] of Object.entries(files)) {
    const m = file.match(/^\/docs\/cursos\/([^/]+)\/_curso\.md$/);
    if (!m) continue;
    const { meta, nodes } = parseDoc<CourseMeta>(src);
    const c: Course = {
      n: Number(meta.numero) || courses.length + 1,
      id: m[1],
      title: meta.titulo,
      en: meta.titulo_en ?? '',
      icon: meta.icone ?? 'course-book',
      color: Number(meta.cor) || 6,
      desc: toText(nodes).trim(),
      lessons: [],
    };
    courses.push(c);
    byFolder.set(m[1], c);
  }
  courses.sort((a, b) => a.n - b.n);

  const lessonFiles = Object.keys(files)
    .filter(f => /^\/docs\/cursos\/[^/]+\/\d+-[^/]+\.md$/.test(f))
    .sort();
  for (const file of lessonFiles) {
    const [, folder, name] = file.match(/^\/docs\/cursos\/([^/]+)\/(\d+-[^/]+)\.md$/)!;
    const course = byFolder.get(folder);
    if (!course) {
      console.warn(`[docs] ${file}: pasta sem _curso.md.`);
      continue;
    }
    const { meta, nodes } = parseDoc<LessonMeta>(files[file]);
    const id = name.replace(/^\d+-/, '');
    const quiz = takeContainers(nodes, 'quiz').flatMap(b => parseQuiz(b, id, file));
    const docs = takeContainers(nodes, 'documentacao').flatMap(readLinks);
    course.lessons.push({
      id,
      idx: 0,
      num: course.lessons.length + 1,
      course,
      title: meta.titulo ?? id,
      sub: meta.subtitulo ?? '',
      unit: String(meta.unidade ?? ''),
      dur: meta.duracao ?? '',
      icon: meta.icone ?? 'document-text',
      objectives: meta.objetivos ?? [],
      keywords: meta.palavras_chave ?? '',
      sections: splitSections(nodes),
      quiz,
      docs,
      file,
    });
  }
  const lessons = courses.flatMap(c => c.lessons);
  lessons.forEach((l, i) => (l.idx = i));
  return { courses, lessons };
}

export const { courses: COURSES, lessons: LESSONS } = build();
export const lessonById = (id: string) => LESSONS.find(l => l.id === id);

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
export interface ExamMeta { titulo?: string; subtitulo?: string; icone?: string; cor?: number; questoes?: number; nota_minima?: number }

export const HOME = page<HomeMeta>('inicio');
export const REFERENCE = page<RefMeta>('referencia');
export const EXAM = page<ExamMeta>('simulado', ['aprovado', 'reprovado']);

/** SVG de docs/figuras pelo nome do arquivo. */
export const figure = (name: string): string | undefined => svgs[`/docs/figuras/${name}`];
