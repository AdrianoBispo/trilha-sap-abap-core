import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, IllustratedMessage, NavigationLayout, ProgressIndicator, SearchItem, ShellBar, ShellBarBranding, ShellBarItem,
  ShellBarSearch, Toast,
} from '@ui5/webcomponents-react';
import type { NavigationLayoutDomRef, ToastDomRef } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/PageNotFound.js';
import '@ui5/webcomponents-icons/dist/menu2.js';
import '@ui5/webcomponents-icons/dist/course-book.js';
import '@ui5/webcomponents-icons/dist/syntax.js';
import '@ui5/webcomponents-icons/dist/light-mode.js';
import '@ui5/webcomponents-icons/dist/dark-mode.js';
import '@ui5/webcomponents-icons/dist/document-text.js';
import { lessonById, LESSONS, moduleBySlug, MODULES, REFERENCE, type Lesson, type Module } from './content/content';
import { toText } from './content/markdown';
import LessonPage from './pages/LessonPage';
import ModulePage from './pages/ModulePage';
import HomePage from './pages/HomePage';
import ReferencePage from './pages/ReferencePage';
import ModuleNav from './components/ModuleNav';
import { navigate, scrollToSection, toggleTheme, useDone, useRoute, useTheme, useToastState } from './state/store';

const APP = 'Trilha ABAP Core';

/* ---------- Rotas ---------- */
// #inicio · #referencia · #<módulo> · #<lição> · #<lição>/<seção>
type View =
  | { kind: 'home' }
  | { kind: 'reference' }
  | { kind: 'module'; module: Module }
  | { kind: 'lesson'; lesson: Lesson; section?: string }
  | { kind: 'missing' };

function resolve(route: string): View {
  const [head, sub] = route.split('/');
  if (head === 'inicio') return { kind: 'home' };
  if (head === 'referencia') return { kind: 'reference' };
  const lesson = lessonById(head);
  if (lesson) return { kind: 'lesson', lesson, section: lesson.sections.some(s => s.id === sub) ? sub : undefined };
  const module = moduleBySlug(head);
  if (module) return { kind: 'module', module };
  return { kind: 'missing' };
}

/* ---------- Pesquisa ---------- */
interface Hit { title: string; desc: string; route: string; icon: string; hay: string }
function buildIndex(): Hit[] {
  const refTable = REFERENCE.sections.flatMap(s => s.nodes).find(n => n.type === 'table');
  const refRows = refTable && refTable.type === 'table' ? refTable.children.slice(1) : [];
  return [
    ...MODULES.map(c => ({
      title: `Módulo ${c.label} · ${c.title}`, desc: `${c.lessons.length} lições`, route: c.slug, icon: c.icon,
      hay: `módulo ${c.label} ${c.title} ${c.desc}`.toLowerCase(),
    })),
    ...LESSONS.map(l => ({
      title: l.title, desc: `Módulo ${l.module.label} · ${l.sub}`, route: l.id, icon: l.icon,
      hay: [l.title, l.sub, l.objectives.join(' '), l.keywords, l.sections.map(s => s.titleText).join(' ')].join(' ').toLowerCase(),
    })),
    ...refRows.map(r => {
      const [cat, syn, what, les] = r.children.map(c => toText(c).trim());
      return { title: syn, desc: `Referência · ${what}`, route: lessonById(les) ? les : 'referencia', icon: 'syntax', hay: `${syn} ${what} ${cat}`.toLowerCase() };
    }),
    { title: 'Referência rápida', desc: 'Sintaxe e glossário', route: 'referencia', icon: 'course-book', hay: 'referência glossário cheat sheet sintaxe' },
  ];
}

/** O wrapper React do UI5 injeta `slot`; componentes próprios precisam repassá-lo. */
function Search({ slot }: { slot?: string }) {
  const index = useMemo(buildIndex, []);
  const [q, setQ] = useState('');
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hits = terms.length ? index.filter(h => terms.every(t => h.hay.includes(t))).slice(0, 8) : [];
  return (
    <ShellBarSearch
      slot={slot}
      placeholder="Pesquisar módulos, lições, comandos…"
      accessibleName="Pesquisar módulos, lições e comandos"
      showClearIcon
      value={q}
      onInput={e => setQ(e.target.value)}
      onSearch={e => {
        const item = (e.detail as { item?: HTMLElement }).item;
        const route = item?.dataset.route ?? hits[0]?.route;
        if (route) {
          navigate(route);
          setQ('');
        }
      }}
    >
      {hits.map(h => <SearchItem key={h.route + h.title} data-route={h.route} text={h.title} description={h.desc} icon={h.icon} />)}
    </ShellBarSearch>
  );
}

/* ---------- App ---------- */
export default function App() {
  const route = useRoute();
  const done = useDone();
  const theme = useTheme();
  const toastState = useToastState();
  const toastRef = useRef<ToastDomRef>(null);
  const navRef = useRef<NavigationLayoutDomRef>(null);
  const [mode, setMode] = useState<'Auto' | 'Collapsed' | 'Expanded'>('Auto');

  const view = resolve(route);
  // O índice lateral só existe na página de um módulo e nas lições dele.
  const mod = view.kind === 'module' ? view.module : view.kind === 'lesson' ? view.lesson.module : undefined;

  useEffect(() => {
    document.title =
      view.kind === 'lesson' ? `${view.lesson.title} · ${APP}`
      : view.kind === 'module' ? `Módulo ${view.module.label} · ${view.module.title} · ${APP}`
      : view.kind === 'reference' ? `Referência rápida · ${APP}`
      : APP;
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (toastState.n && toastRef.current) {
      toastRef.current.open = false;
      requestAnimationFrame(() => toastRef.current && (toastRef.current.open = true));
    }
  }, [toastState]);

  const toggleNav = () => setMode(navRef.current?.isSideCollapsed() ? 'Expanded' : 'Collapsed');
  const onSelect = (id: string | undefined) => {
    if (!id) return;
    // Clicar de novo no item atual não muda o endereço; rola mesmo assim.
    if (id === route) scrollToSection(id.split('/')[1]);
    else navigate(id);
    if (innerWidth < 600) setMode('Collapsed');
  };

  const total = LESSONS.length;
  const nDone = LESSONS.filter(l => done.has(l.id)).length;

  let page;
  if (view.kind === 'lesson') page = <LessonPage key={view.lesson.id} lesson={view.lesson} section={view.section} />;
  else if (view.kind === 'module') page = <ModulePage key={view.module.id} module={view.module} />;
  else if (view.kind === 'reference') page = <ReferencePage />;
  else if (view.kind === 'home') page = <HomePage />;
  else
    page = (
      <div className="page page-scroll center">
        <IllustratedMessage name="PageNotFound" titleText="Página não encontrada" subtitleText={`Não existe conteúdo para “${route}”.`}>
          <Button design="Emphasized" onClick={() => navigate('inicio')}>Ir para o início</Button>
        </IllustratedMessage>
      </div>
    );

  return (
    <>
      <NavigationLayout
        ref={navRef}
        // Sem índice lateral, o painel fica recolhido para não cobrir a página no celular.
        mode={mod ? mode : 'Collapsed'}
        header={
          <ShellBar
            startButton={mod ? <Button icon="menu2" design="Transparent" tooltip="Índice do módulo" accessibleName="Mostrar ou ocultar o índice do módulo" onClick={toggleNav} /> : undefined}
            branding={
              <ShellBarBranding href="#inicio" accessibleName={`${APP}, início`} logo={<img src="./favicon.svg" alt="" />}>
                {APP}
              </ShellBarBranding>
            }
            secondaryTitle="ABAP do clássico à nuvem · documentação guiada"
            showSearchField
            searchField={<Search />}
            content={
              <div className="shell-progress" title="Lições lidas">
                <span>{nDone}/{total} lidas</span>
                <ProgressIndicator hideValue value={(nDone / total) * 100} valueState={nDone === total ? 'Positive' : 'None'} accessibleName={`${nDone} de ${total} lições lidas`} />
              </div>
            }
          >
            <ShellBarItem icon="syntax" text="Referência rápida" onClick={() => navigate('referencia')} />
            <ShellBarItem
              icon={theme === 'dark' ? 'light-mode' : 'dark-mode'}
              text={theme === 'dark' ? 'Tema claro (Morning Horizon)' : 'Tema escuro (Evening Horizon)'}
              onClick={toggleTheme}
            />
          </ShellBar>
        }
        sideContent={mod ? <ModuleNav module={mod} lessonId={view.kind === 'lesson' ? view.lesson.id : undefined} onSelect={onSelect} /> : undefined}
      >
        <main className="main" id="conteudo">{page}</main>
      </NavigationLayout>
      <Toast ref={toastRef} duration={2200} placement="BottomCenter">{toastState.text}</Toast>
    </>
  );
}
