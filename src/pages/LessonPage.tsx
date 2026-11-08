import {
  Avatar, Breadcrumbs, BreadcrumbsItem, Icon, Label, ObjectPage, ObjectPageHeader, ObjectPageSection, ObjectPageTitle,
  Tag, Text, Title, Toolbar, ToolbarButton,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/question-mark.js';
import '@ui5/webcomponents-icons/dist/course-book.js';
import '@ui5/webcomponents-icons/dist/nav-back.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import { LEARNING_JOURNEY, LESSONS, type Lesson } from '../content/content';
import { Blocks, Inline } from '../render/Markdown';
import Quiz from '../components/Quiz';
import { LinkList, Pager, SectionTitle } from '../components/Parts';
import { navigate, setDone, toast, useDone } from '../state/store';
import type { AvatarColorScheme } from './common';

export default function LessonPage({ lesson: l }: { lesson: Lesson }) {
  const done = useDone();
  const isDone = done.has(l.id);
  const c = l.course;
  const prev = LESSONS[l.idx - 1];
  const next = LESSONS[l.idx + 1];

  const toggle = () => {
    setDone(l.id, !isDone);
    toast(!isDone ? 'Lição marcada como concluída' : 'Marcação removida');
  };

  return (
    <ObjectPage
      key={l.id}
      className="page"
      mode="Default"
      image={<Avatar icon={l.icon} colorScheme={`Accent${c.color}` as AvatarColorScheme} size="L" shape="Square" />}
      titleArea={
        <ObjectPageTitle
          header={<Title level="H1" size="H2" wrappingType="Normal">{l.title}</Title>}
          subHeader={<Text>{l.sub}</Text>}
          breadcrumbs={
            <Breadcrumbs onItemClick={e => { const h = (e.detail.item as HTMLElement).getAttribute('href'); if (h) { e.preventDefault(); navigate(h.slice(1)); } }}>
              <BreadcrumbsItem href="#inicio">Início</BreadcrumbsItem>
              <BreadcrumbsItem href={`#${c.lessons[0].id}`}>Curso {c.n} · {c.title}</BreadcrumbsItem>
              <BreadcrumbsItem>{l.title}</BreadcrumbsItem>
            </Breadcrumbs>
          }
          actionsBar={
            <Toolbar design="Transparent">
              <ToolbarButton design={isDone ? 'Positive' : 'Emphasized'} icon="accept" text={isDone ? 'Concluída' : 'Marcar como concluída'} onClick={toggle} />
            </Toolbar>
          }
        />
      }
      headerArea={
        <ObjectPageHeader>
          <div className="attrs">
            <div className="attr"><Label showColon={false}>Unidade SAP Learning</Label><Text>{c.en} · {l.unit}</Text></div>
            <div className="attr"><Label showColon={false}>Duração estimada</Label><Text>{l.dur}</Text></div>
            <div className="attr">
              <Label showColon={false}>Status</Label>
              {isDone ? <Tag design="Positive">Concluída</Tag> : <Tag design="Neutral" hideStateIcon>Não iniciada</Tag>}
            </div>
          </div>
        </ObjectPageHeader>
      }
    >
      {[
      <ObjectPageSection key="s-objetivos" id="s-objetivos" titleText="Objetivos" hideTitleText>
        <div className="objectives-box">
          <Title level="H2" size="H5">Ao final desta lição você será capaz de</Title>
          <ul className="objectives">
            {l.objectives.map(o => <li key={o}><Icon name="accept" /><span>{o}</span></li>)}
          </ul>
        </div>
      </ObjectPageSection>,
      ...l.sections.map(s => (
        <ObjectPageSection key={s.id} id={`s-${s.id}`} titleText={s.anchor} hideTitleText>
          <div className="sec">
            {s.title.length > 0 && <SectionTitle icon={s.icon}><Inline nodes={s.title} /></SectionTitle>}
            <Blocks nodes={s.nodes} />
          </div>
        </ObjectPageSection>
      )),
      ...(l.quiz.length > 0 ? [
        <ObjectPageSection key="s-quiz" id="s-quiz" titleText="Quiz" hideTitleText>
          <div className="sec">
            <SectionTitle icon="question-mark">Verifique o que aprendeu</SectionTitle>
            <Quiz key={l.id} questions={l.quiz} />
          </div>
        </ObjectPageSection>,
      ] : []),
      <ObjectPageSection key="s-documentacao" id="s-documentacao" titleText="Documentação" hideTitleText>
        <div className="sec">
          <SectionTitle icon="course-book">Documentação oficial</SectionTitle>
          <LinkList links={[...l.docs, { title: `SAP Learning: ${c.en}, unidade ${l.unit}`, url: LEARNING_JOURNEY }]} />
          <Pager
            prev={prev ? { id: prev.id, title: prev.title, label: 'Anterior' } : { id: 'inicio', title: 'Início', label: 'Voltar' }}
            next={next ? { id: next.id, title: next.title, label: 'Próxima' } : { id: 'simulado', title: 'Simulado de certificação', label: 'Próximo' }}
          />
        </div>
      </ObjectPageSection>
      ]}
    </ObjectPage>
  );
}
