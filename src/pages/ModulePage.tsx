import { Button, Icon } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/play.js';
import '@ui5/webcomponents-icons/dist/time-entry-request.js';
import '@ui5/webcomponents-icons/dist/list.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import { formatMinutes, MODULES, type Module } from '../content/content';
import { ArticleHead, Pager, type PagerItem } from '../components/Parts';
import { navigate } from '../state/store';

const pad = (n: number) => String(n).padStart(2, '0');

export default function ModulePage({ module: c }: { module: Module }) {
  const n = c.lessons.length;
  const start = c.lessons[0];

  const i = MODULES.indexOf(c);
  const prevM = MODULES[i - 1];
  const nextM = MODULES[i + 1];
  const prev: PagerItem | undefined = prevM && { id: prevM.slug, title: `Módulo ${prevM.label} · ${prevM.title}`, label: 'Módulo anterior' };
  const next: PagerItem = nextM
    ? { id: nextM.slug, title: `Módulo ${nextM.label} · ${nextM.title}`, label: 'Próximo módulo' }
    : { id: 'referencia', title: 'Referência rápida', label: 'Consultar' };

  return (
    <div className="page page-scroll">
      <article className="article">
        <ArticleHead
          crumbs={[{ label: 'Início', route: 'inicio' }, { label: `Módulo ${c.label}` }]}
          eyebrow={`Módulo ${c.label} de ${pad(MODULES.length)}`}
          title={c.title}
          lead={c.desc}
          meta={[
            <><Icon name="list" className="meta-ic" />{n} {n === 1 ? 'lição' : 'lições'}</>,
            <><Icon name="time-entry-request" className="meta-ic" />{formatMinutes(c.minutes)} de leitura</>,
          ]}
        >
          {start && (
            <div className="article-actions">
              <Button design="Emphasized" icon="play" onClick={() => navigate(start.id)}>
                Começar a leitura
              </Button>
            </div>
          )}
        </ArticleHead>

        <section className="article-sec">
          <h2 className="article-h2">Lições</h2>
          <ol className="post-list">
            {c.lessons.map(l => {
              const nSecs = l.sections.filter(s => s.title.length > 0).length;
              return (
                <li key={l.id}>
                  <a className="post" href={`#${l.id}`} onClick={e => { e.preventDefault(); navigate(l.id); }}>
                    <span className="post-num" aria-hidden="true">{pad(l.num)}</span>
                    <span className="post-body">
                      <span className="post-title">{l.title}</span>
                      {l.sub && <span className="post-sub">{l.sub}</span>}
                      <span className="post-meta">
                        {l.dur && <span><Icon name="time-entry-request" className="meta-ic" />{l.dur}</span>}
                        <span>{nSecs} {nSecs === 1 ? 'seção' : 'seções'}</span>
                      </span>
                    </span>
                    <Icon name="navigation-right-arrow" className="post-arrow" />
                  </a>
                </li>
              );
            })}
          </ol>
        </section>

        <footer className="article-foot">
          <Pager prev={prev} next={next} label="Módulo anterior e próximo" />
        </footer>
      </article>
    </div>
  );
}
