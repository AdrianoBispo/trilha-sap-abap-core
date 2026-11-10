import {
  Avatar, Button, Card, CardHeader, List, ListItemStandard, Tag, Text, Title,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/play.js';
import '@ui5/webcomponents-icons/dist/syntax.js';
import { figure, formatMinutes, HOME, LESSONS, MODULES } from '../content/content';
import { Blocks, Inline, MdExtras } from '../render/Markdown';
import { SectionTitle } from '../components/Parts';
import { LABS } from '../labs';
import { navigate } from '../state/store';
import { accent } from './common';

function ModuleTiles() {
  return (
    <div className="tiles">
      {MODULES.map(c => {
        return (
          <Card
            key={c.id}
            className="tile"
            header={
              <CardHeader
                interactive
                titleText={c.title}
                subtitleText={`Módulo ${c.label}`}
                additionalText={`${c.lessons.length} lições`}
                avatar={<Avatar icon={c.icon} colorScheme={accent(c.color)} shape="Square" size="S" />}
                onClick={() => navigate(c.slug)}
              />
            }
          >
            <div className="tile-body">
              <Text>{c.desc}</Text>
              <span className="note">{formatMinutes(c.minutes)} de leitura</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function TrailMap() {
  return (
    <div className="md-cols md-cols-3">
      {MODULES.map(c => (
        <Card
          key={c.id}
          className="md-card"
          header={<CardHeader interactive onClick={() => navigate(c.slug)} titleText={c.title} subtitleText={`Módulo ${c.label}`} avatar={<Avatar icon={c.icon} colorScheme={accent(c.color)} shape="Square" size="XS" />} />}
        >
          <List
            accessibleName={`Lições do módulo ${c.label}`}
            separators="Inner"
            onItemClick={e => { const id = (e.detail.item as HTMLElement).dataset.id; if (id) navigate(id); }}
          >
            {c.lessons.map(l => (
              <ListItemStandard
                key={l.id}
                data-id={l.id}
                type="Navigation"
                icon={l.icon}
                description={l.dur}
              >
                {l.title}
              </ListItemStandard>
            ))}
          </List>
        </Card>
      ))}
    </div>
  );
}

export default function HomePage() {
  const m = HOME.meta;
  const art = m.ilustracao ? figure(m.ilustracao) : undefined;
  // O resumo pode citar as quantidades atuais: {licoes}, {modulos} e {laboratorios}.
  const counts: Record<string, number> = { licoes: LESSONS.length, modulos: MODULES.length, laboratorios: Object.keys(LABS).length };
  const lead = m.resumo?.replace(/\{(\w+)\}/g, (all, k: string) => (k in counts ? String(counts[k]) : all));

  return (
    <div className="page page-scroll">
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-text">
            {m.selo && <Tag design="Information" hideStateIcon className="hero-eyebrow">{m.selo}</Tag>}
            <Title level="H1" size="H1" wrappingType="Normal" className="hero-title">{m.titulo}</Title>
            {lead && <Text className="hero-lead">{lead}</Text>}
            <div className="hero-actions">
              <Button design="Emphasized" icon="play" onClick={() => navigate(MODULES[0].slug)}>
                Começar pelo módulo {MODULES[0].label}
              </Button>
              <Button icon="syntax" onClick={() => navigate('referencia')}>Referência rápida</Button>
            </div>
          </div>
          {art && <div className="hero-art" dangerouslySetInnerHTML={{ __html: art }} />}
        </div>
      </section>
      <div className="wrap body">
        <MdExtras.Provider value={{ modulos: () => <ModuleTiles />, 'mapa-da-trilha': () => <TrailMap /> }}>
          {HOME.sections.map(s => (
            <section className="sec" key={s.id} id={s.id}>
              {s.title.length > 0 && <SectionTitle icon={s.icon}><Inline nodes={s.title} /></SectionTitle>}
              <Blocks nodes={s.nodes} />
            </section>
          ))}
        </MdExtras.Provider>
      </div>
    </div>
  );
}
