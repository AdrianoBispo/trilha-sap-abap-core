import { SideNavigation, SideNavigationGroup, SideNavigationItem, SideNavigationSubItem } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/home.js';
import type { Module } from '../content/content';
import { useActiveSection } from '../state/store';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Índice lateral de um módulo: visão geral, lições e, dentro de cada lição, as seções.
 * Só aparece na página do módulo e nas lições dele.
 * O wrapper React do UI5 injeta `slot`; por isso ele é repassado ao SideNavigation.
 */
export default function ModuleNav({ module: c, lessonId, onSelect, slot }: {
  module: Module;
  lessonId?: string;
  onSelect: (route: string | undefined) => void;
  slot?: string;
}) {
  const active = useActiveSection();

  return (
    <SideNavigation
      slot={slot}
      accessibleName={`Módulo ${c.label}: lições e seções`}
      onSelectionChange={e => onSelect((e.detail.item as HTMLElement).dataset.route)}
      header={
        <div className="snav-head">
          <span className="eyebrow">Módulo {c.label}</span>
          <span className="snav-title">{c.title}</span>
        </div>
      }
      fixedItems={<SideNavigationItem text="Todos os módulos" icon="home" data-route="inicio" />}
    >
      <SideNavigationItem text="Visão geral do módulo" icon={c.icon} data-route={c.slug} selected={!lessonId} />
      <SideNavigationGroup text="Lições" expanded>
        {c.lessons.map(l => {
          const current = l.id === lessonId;
          return (
            <SideNavigationItem
              key={l.id}
              text={`${pad(l.num)}  ${l.title}`}
              icon={l.icon}
              tooltip={l.title}
              data-route={l.id}
              expanded={current}
              selected={current && !active}
            >
              {l.sections.map(s => (
                <SideNavigationSubItem
                  key={s.id}
                  text={s.anchor}
                  tooltip={s.anchor}
                  data-route={`${l.id}/${s.id}`}
                  selected={current && active === s.id}
                />
              ))}
            </SideNavigationItem>
          );
        })}
      </SideNavigationGroup>
    </SideNavigation>
  );
}
