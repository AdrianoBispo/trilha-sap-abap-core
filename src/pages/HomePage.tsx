import {
  Avatar, Button, Card, CardHeader, List, ListItemStandard, ProgressIndicator, Tag, Text, Title,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/play.js';
import '@ui5/webcomponents-icons/dist/education.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/circle-task.js';
import { COURSES, figure, HOME, LESSONS } from '../content/content';
import { Blocks, Inline, MdExtras } from '../render/Markdown';
import { SectionTitle } from '../components/Parts';
import { navigate, useDone } from '../state/store';
import { accent } from './common';

function CourseTiles() {
  const done = useDone();
  return (
    <div className="tiles">
      {COURSES.map(c => {
        const d = c.lessons.filter(l => done.has(l.id)).length;
        return (
          <Card
            key={c.id}
            className="tile"
            header={
              <CardHeader
                interactive
                titleText={c.title}
                subtitleText={c.en}
                additionalText={`Curso ${c.n}`}
                avatar={<Avatar icon={c.icon} colorScheme={accent(c.color)} shape="Square" size="S" />}
                onClick={() => c.lessons[0] && navigate(c.lessons[0].id)}
              />
            }
          >
            <div className="tile-body">
              <Text>{c.desc}</Text>
              <ProgressIndicator value={c.lessons.length ? (d / c.lessons.length) * 100 : 0} displayValue={`${d} de ${c.lessons.length} lições`} valueState={d === c.lessons.length ? 'Positive' : 'None'} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function TrailMap() {
  const done = useDone();
  return (
    <div className="md-cols md-cols-3">
      {COURSES.map(c => (
        <Card
          key={c.id}
          className="md-card"
          header={<CardHeader titleText={c.title} subtitleText={`Curso ${c.n}`} avatar={<Avatar icon={c.icon} colorScheme={accent(c.color)} shape="Square" size="XS" />} />}
        >
          <List
            accessibleName={`Lições do curso ${c.n}`}
            separators="Inner"
            onItemClick={e => { const id = (e.detail.item as HTMLElement).dataset.id; if (id) navigate(id); }}
          >
            {c.lessons.map(l => (
              <ListItemStandard
                key={l.id}
                data-id={l.id}
                type="Navigation"
                icon={done.has(l.id) ? 'accept' : 'circle-task'}
                description={`Unidade ${l.unit} · ${l.dur}`}
                highlight={done.has(l.id) ? 'Positive' : 'None'}
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
  const done = useDone();
  const nextLesson = LESSONS.find(l => !done.has(l.id));
  const m = HOME.meta;
  const art = m.ilustracao ? figure(m.ilustracao) : undefined;

  return (
    <div className="page page-scroll">
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-text">
            {m.selo && <Tag design="Information" hideStateIcon className="hero-eyebrow">{m.selo}</Tag>}
            <Title level="H1" size="H1" wrappingType="Normal" className="hero-title">{m.titulo}</Title>
            {m.resumo && <Text className="hero-lead">{m.resumo}</Text>}
            <div className="hero-actions">
              <Button design="Emphasized" icon="play" onClick={() => navigate(nextLesson ? nextLesson.id : 'simulado')}>
                {done.size ? `Continuar: ${nextLesson ? nextLesson.title : 'simulado'}` : 'Começar pela primeira lição'}
              </Button>
              <Button icon="education" onClick={() => navigate('simulado')}>Fazer o simulado</Button>
            </div>
          </div>
          {art && <div className="hero-art" dangerouslySetInnerHTML={{ __html: art }} />}
        </div>
      </section>
      <div className="wrap body">
        <MdExtras.Provider value={{ cursos: () => <CourseTiles />, 'mapa-da-trilha': () => <TrailMap /> }}>
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
