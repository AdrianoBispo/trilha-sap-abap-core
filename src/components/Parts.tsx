import type { ReactNode } from 'react';
import { Breadcrumbs, BreadcrumbsItem, Icon, Link, Title } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/chain-link.js';
import '@ui5/webcomponents-icons/dist/nav-back.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import type { LinkItem } from '../content/markdown';
import { navigate } from '../state/store';

/** Título de seção (##) com ícone, usado nas seções da página inicial. */
export function SectionTitle({ icon, children }: { icon?: string; children: ReactNode }) {
  return (
    <div className="sec-title">
      {icon && <Icon name={icon} className="sec-title-ic" />}
      <Title level="H2" size="H4" wrappingType="Normal">{children}</Title>
    </div>
  );
}

interface Crumb { label: string; route?: string }

/** Cabeçalho de artigo: trilha de navegação, chamada, título, linha fina e metadados. */
export function ArticleHead({ crumbs, eyebrow, title, lead, meta, children }: {
  crumbs: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode[];
  children?: ReactNode;
}) {
  return (
    <header className="article-head">
      <Breadcrumbs
        className="article-crumbs"
        onItemClick={e => {
          const h = (e.detail.item as HTMLElement).getAttribute('href');
          if (h) { e.preventDefault(); navigate(h.slice(1)); }
        }}
      >
        {crumbs.map(c => <BreadcrumbsItem key={c.label} href={c.route ? `#${c.route}` : undefined}>{c.label}</BreadcrumbsItem>)}
      </Breadcrumbs>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="article-title">{title}</h1>
      {lead && <p className="article-lead">{lead}</p>}
      {meta && meta.length > 0 && (
        <ul className="article-meta">
          {meta.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
      {children}
    </header>
  );
}

/** Lista de links externos (documentação oficial no fim do artigo). */
export function LinkList({ links }: { links: LinkItem[] }) {
  return (
    <ul className="md-icon-list md-links doc-links">
      {links.map(d => (
        <li key={d.url + d.title}>
          <Icon name="chain-link" className="md-icon-list-ic" />
          <Link href={d.url} target="_blank" wrappingType="Normal">{d.title}</Link>
        </li>
      ))}
    </ul>
  );
}

export interface PagerItem { id: string; title: string; label: string }

/** Navegação “anterior / próxima” no fim do artigo. */
export function Pager({ prev, next, label }: { prev?: PagerItem; next?: PagerItem; label: string }) {
  const item = (p: PagerItem, dir: 'prev' | 'next') => (
    <a
      className={`pager-item pager-${dir}`}
      href={`#${p.id}`}
      onClick={e => { e.preventDefault(); navigate(p.id); }}
    >
      <small>
        {dir === 'prev' && <Icon name="nav-back" />}
        {p.label}
        {dir === 'next' && <Icon name="navigation-right-arrow" />}
      </small>
      <b>{p.title}</b>
    </a>
  );
  return (
    <nav className="pager" aria-label={label}>
      {prev ? item(prev, 'prev') : <span />}
      {next ? item(next, 'next') : <span />}
    </nav>
  );
}
