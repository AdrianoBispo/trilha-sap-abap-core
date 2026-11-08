import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, IllustratedMessage, NavigationLayout, ProgressIndicator, SearchItem, ShellBar, ShellBarBranding, ShellBarItem,
  ShellBarSearch, SideNavigation, SideNavigationGroup, SideNavigationItem, Tag, Toast,
} from '@ui5/webcomponents-react';
import type { NavigationLayoutDomRef, ToastDomRef } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/PageNotFound.js';
import '@ui5/webcomponents-icons/dist/menu2.js';
import '@ui5/webcomponents-icons/dist/home.js';
import '@ui5/webcomponents-icons/dist/course-book.js';
import '@ui5/webcomponents-icons/dist/education.js';
import '@ui5/webcomponents-icons/dist/syntax.js';
import '@ui5/webcomponents-icons/dist/light-mode.js';
import '@ui5/webcomponents-icons/dist/dark-mode.js';
import '@ui5/webcomponents-icons/dist/document-text.js';
import { COURSES, lessonById, LESSONS, REFERENCE } from './content/content';
import { toText } from './content/markdown';
import LessonPage from './pages/LessonPage';
import HomePage from './pages/HomePage';
import ReferencePage from './pages/ReferencePage';
import ExamPage from './pages/ExamPage';
import { navigate, toggleTheme, useDone, useRoute, useTheme, useToastState } from './state/store';

const APP = 'Trilha ABAP Core';

/* ---------- Pesquisa ---------- */
interface Hit { title: string; desc: string; route: string; icon: string; hay: string }
function buildIndex(): Hit[] {
  const refTable = REFERENCE.sections.flatMap(s => s.nodes).find(n => n.type === 'table');
  const refRows = refTable && refTable.type === 'table' ? refTable.children.slice(1) : [];
  return [
    ...LESSONS.map(l => ({
      title: l.title, desc: `Curso ${l.course.n} · ${l.sub}`, route: l.id, icon: l.icon,
      hay: [l.title, l.sub, l.objectives.join(' '), l.keywords, l.sections.map(s => s.titleText).join(' ')].join(' ').toLowerCase(),
    })),
    ...refRows.map(r => {
      const [cat, syn, what, les] = r.children.map(c => toText(c).trim());
      return { title: syn, desc: `Referência · ${what}`, route: lessonById(les) ? les : 'referencia', icon: 'syntax', hay: `${syn} ${what} ${cat}`.toLowerCase() };
    }),
    { title: 'Referência rápida', desc: 'Sintaxe e glossário', route: 'referencia', icon: 'course-book', hay: 'referência glossário cheat sheet sintaxe' },
    { title: 'Simulado de certificação', desc: 'Questões sorteadas, nota mínima 65%', route: 'simulado', icon: 'education', hay: 'simulado certificação prova exame quiz' },
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
      placeholder="Pesquisar lições, comandos…"
      accessibleName="Pesquisar lições e comandos"
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

  const lesson = lessonById(route);
  const known = lesson || ['inicio', 'referencia', 'simulado'].includes(route);
  const current = known ? route : '';

  useEffect(() => {
    document.title = lesson ? `${lesson.title} · ${APP}` : route === 'referencia' ? `Referência rápida · ${APP}` : route === 'simulado' ? `Simulado · ${APP}` : APP;
  }, [route, lesson]);

  useEffect(() => {
    if (toastState.n && toastRef.current) {
      toastRef.current.open = false;
      requestAnimationFrame(() => toastRef.current && (toastRef.current.open = true));
    }
  }, [toastState]);

  const toggleNav = () => setMode(navRef.current?.isSideCollapsed() ? 'Expanded' : 'Collapsed');
  const onSelect = (id: string | undefined) => {
    if (!id) return;
    navigate(id);
    if (innerWidth < 600) setMode('Collapsed');
  };

  const total = LESSONS.length;
  const nDone = LESSONS.filter(l => done.has(l.id)).length;

  let page;
  if (lesson) page = <LessonPage key={lesson.id} lesson={lesson} />;
  else if (route === 'referencia') page = <ReferencePage />;
  else if (route === 'simulado') page = <ExamPage />;
  else if (route === 'inicio') page = <HomePage />;
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
        mode={mode}
        header={
          <ShellBar
            startButton={<Button icon="menu2" design="Transparent" tooltip="Navegação" accessibleName="Alternar navegação" onClick={toggleNav} />}
            branding={
              <ShellBarBranding href="#inicio" accessibleName={`${APP}, início`} logo={<img src="./favicon.svg" alt="" />}>
                {APP}
              </ShellBarBranding>
            }
            secondaryTitle="Acquiring Core ABAP Skills · estudo guiado"
            showSearchField
            searchField={<Search />}
            content={
              <div className="shell-progress" title="Progresso na trilha">
                <span>{nDone}/{total} lições</span>
                <ProgressIndicator hideValue value={(nDone / total) * 100} valueState={nDone === total ? 'Positive' : 'None'} accessibleName={`${nDone} de ${total} lições concluídas`} />
              </div>
            }
          >
            <ShellBarItem
              icon={theme === 'dark' ? 'light-mode' : 'dark-mode'}
              text={theme === 'dark' ? 'Tema claro (Morning Horizon)' : 'Tema escuro (Evening Horizon)'}
              onClick={toggleTheme}
            />
          </ShellBar>
        }
        sideContent={
          <SideNavigation
            accessibleName="Lições"
            onSelectionChange={e => onSelect((e.detail.item as HTMLElement).dataset.route)}
          >
            <SideNavigationItem text="Início" icon="home" data-route="inicio" selected={current === 'inicio'} />
            {COURSES.map(c => (
              <SideNavigationGroup key={c.id} text={`Curso ${c.n} · ${c.title}`} expanded>
                {c.lessons.map(l => (
                  <SideNavigationItem
                    key={l.id}
                    text={`${String(l.num).padStart(2, '0')}  ${l.title}`}
                    icon={l.icon}
                    data-route={l.id}
                    selected={current === l.id}
                    tooltip={l.sub}
                    tag={done.has(l.id) ? <Tag design="Positive" size="S" hideStateIcon>✓</Tag> : undefined}
                  />
                ))}
              </SideNavigationGroup>
            ))}
            <SideNavigationGroup text="Recursos" expanded>
              <SideNavigationItem text="Referência rápida" icon="course-book" data-route="referencia" selected={current === 'referencia'} />
              <SideNavigationItem text="Simulado de certificação" icon="education" data-route="simulado" selected={current === 'simulado'} />
            </SideNavigationGroup>
          </SideNavigation>
        }
      >
        <main className="main" id="conteudo">{page}</main>
      </NavigationLayout>
      <Toast ref={toastRef} duration={2200} placement="BottomCenter">{toastState.text}</Toast>
    </>
  );
}
