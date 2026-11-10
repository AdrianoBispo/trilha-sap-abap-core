import { useEffect, useRef } from 'react';
import { Button, Icon } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/time-entry-request.js';
import { LEARNING_JOURNEY, MODULES, type Lesson } from '../content/content';
import { Blocks, Inline } from '../render/Markdown';
import { ArticleHead, LinkList, Pager, type PagerItem } from '../components/Parts';
import { scrollToSection, setActiveSection, setDone, toast, useDone } from '../state/store';

/** Distância do topo da área de rolagem a partir da qual uma seção conta como “a atual”. */
const SPY_OFFSET = 120;

/** Chama `fn` quando o elemento já tiver altura (os componentes UI5 terminam de montar depois do React). */
function whenLaidOut(el: HTMLElement, fn: () => void) {
  if (el.clientHeight > 0) { fn(); return () => {}; }
  const ro = new ResizeObserver(() => { if (el.clientHeight > 0) { ro.disconnect(); fn(); } });
  ro.observe(el);
  return () => ro.disconnect();
}

export default function LessonPage({ lesson: l, section }: { lesson: Lesson; section?: string }) {
  const done = useDone();
  const isDone = done.has(l.id);
  const c = l.module;
  const scroller = useRef<HTMLDivElement>(null);

  // Endereço #lição/seção: rola até a seção pedida; #lição volta ao topo.
  const first = useRef(true);
  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    const root = scroller.current;
    if (!root || (!section && isFirst)) return;
    if (!isFirst) {
      scrollToSection(section);
      return;
    }
    // Na carga da página, o conteúdo acima da seção ainda cresce enquanto os componentes UI5
    // terminam de renderizar: realinha por alguns instantes, até o usuário rolar por conta própria.
    const content = root.firstElementChild!;
    const align = () => scrollToSection(section, false);
    const ro = new ResizeObserver(align);
    const stop = () => { ro.disconnect(); clearTimeout(timer); events.forEach(t => root.removeEventListener(t, stop)); };
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    events.forEach(t => root.addEventListener(t, stop, { passive: true }));
    const timer = setTimeout(stop, 2500);
    const cancelWait = whenLaidOut(root, () => { align(); ro.observe(content); });
    return () => { cancelWait(); stop(); };
  }, [l.id, section]);

  // Acompanha a seção visível para destacá-la no índice lateral.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (root.clientHeight === 0) return;
      const secs = [...root.querySelectorAll<HTMLElement>('[data-section]')];
      const limit = root.getBoundingClientRect().top + SPY_OFFSET;
      let cur = '';
      for (const el of secs) {
        if (el.getBoundingClientRect().top <= limit) cur = el.dataset.section!;
        else break;
      }
      // No fim da página a última seção pode ser curta demais para chegar ao topo.
      if (root.scrollTop > 0 && root.scrollTop + root.clientHeight >= root.scrollHeight - 2 && secs.length) {
        const last = secs[secs.length - 1];
        if (last.getBoundingClientRect().top < root.getBoundingClientRect().bottom) cur = last.dataset.section!;
      }
      setActiveSection(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    root.addEventListener('scroll', onScroll, { passive: true });
    // Recalcula quando o layout muda (montagem dos componentes UI5, figuras, laboratórios).
    const ro = new ResizeObserver(onScroll);
    ro.observe(root);
    if (root.firstElementChild) ro.observe(root.firstElementChild);
    return () => {
      ro.disconnect();
      root.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      setActiveSection('');
    };
  }, [l.id]);

  const toggle = () => {
    setDone(l.id, !isDone);
    toast(!isDone ? 'Lição marcada como lida' : 'Marcação removida');
  };

  // Anterior e próxima dentro do módulo; nas pontas, a página do módulo.
  const nextModule = MODULES[MODULES.indexOf(c) + 1];
  const before = c.lessons[l.num - 2];
  const after = c.lessons[l.num];
  const prev: PagerItem = before
    ? { id: before.id, title: before.title, label: 'Lição anterior' }
    : { id: c.slug, title: `Módulo ${c.label} · ${c.title}`, label: 'Visão geral do módulo' };
  const next: PagerItem = after
    ? { id: after.id, title: after.title, label: 'Próxima lição' }
    : nextModule
      ? { id: nextModule.slug, title: `Módulo ${nextModule.label} · ${nextModule.title}`, label: 'Próximo módulo' }
      : { id: 'referencia', title: 'Referência rápida', label: 'Consultar' };

  const links = l.sapLearning ? [...l.docs, { title: `SAP Learning: ${l.sapLearning}`, url: LEARNING_JOURNEY }] : l.docs;

  return (
    <div className="page page-scroll" ref={scroller}>
      <article className="article">
        <ArticleHead
          crumbs={[{ label: 'Início', route: 'inicio' }, { label: `Módulo ${c.label} · ${c.title}`, route: c.slug }, { label: l.title }]}
          eyebrow={`Módulo ${c.label} · Lição ${l.num} de ${c.lessons.length}`}
          title={l.title}
          lead={l.sub}
          meta={[
            ...(l.dur ? [<><Icon name="time-entry-request" className="meta-ic" />{l.dur} de leitura</>] : []),
            ...(isDone ? [<span className="meta-done"><Icon name="accept" className="meta-ic" />Lida</span>] : []),
          ]}
        />

        {l.objectives.length > 0 && (
          <aside className="callout" aria-labelledby={`obj-${l.id}`}>
            <h2 className="callout-title" id={`obj-${l.id}`}>Nesta lição você vai</h2>
            <ul className="objectives">
              {l.objectives.map(o => <li key={o}><Icon name="accept" /><span>{o}</span></li>)}
            </ul>
          </aside>
        )}

        {l.sections.map(s => (
          <section key={s.id} id={`s-${s.id}`} data-section={s.id} className="article-sec">
            {s.title.length > 0 && <h2 className="article-h2"><Inline nodes={s.title} /></h2>}
            <Blocks nodes={s.nodes} />
          </section>
        ))}

        <footer className="article-foot">
          {links.length > 0 && (
            <section className="article-sec">
              <h2 className="article-h2">Documentação oficial</h2>
              <LinkList links={links} />
            </section>
          )}
          <div className="done-box">
            <div>
              <b>{isDone ? 'Lição lida' : 'Terminou a leitura?'}</b>
              <span>{isDone ? 'Ela aparece como lida no índice do módulo.' : 'Marque a lição como lida para acompanhar o progresso no módulo.'}</span>
            </div>
            <Button design={isDone ? 'Default' : 'Emphasized'} icon="accept" onClick={toggle}>
              {isDone ? 'Desmarcar' : 'Marcar como lida'}
            </Button>
          </div>
          <Pager prev={prev} next={next} label="Lição anterior e próxima" />
        </footer>
      </article>
    </div>
  );
}
