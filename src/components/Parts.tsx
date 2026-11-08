import type { ReactNode } from 'react';
import { Card, Icon, Link, Title } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/chain-link.js';
import '@ui5/webcomponents-icons/dist/nav-back.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import type { LinkItem } from '../content/markdown';
import { navigate } from '../state/store';

/** Título de seção (##) com ícone, no estilo dos títulos de seção do Object Page. */
export function SectionTitle({ icon, children }: { icon?: string; children: ReactNode }) {
  return (
    <div className="sec-title">
      {icon && <Icon name={icon} className="sec-title-ic" />}
      <Title level="H2" size="H4" wrappingType="Normal">{children}</Title>
    </div>
  );
}

/** Lista de links externos dentro de um Card. */
export function LinkList({ links }: { links: LinkItem[] }) {
  return (
    <Card className="md-card">
      <ul className="md-icon-list md-links md-card-body">
        {links.map(d => (
          <li key={d.url + d.title}>
            <Icon name="chain-link" className="md-icon-list-ic" />
            <Link href={d.url} target="_blank" wrappingType="Normal">{d.title}</Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

interface PagerItem { id: string; title: string; label: string }

/** Navegação “anterior / próxima” no fim da lição. */
export function Pager({ prev, next }: { prev: PagerItem; next: PagerItem }) {
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
    <nav className="pager" aria-label="Lição anterior e próxima">
      {item(prev, 'prev')}
      {item(next, 'next')}
    </nav>
  );
}
