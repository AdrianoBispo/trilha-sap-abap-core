import { useState } from 'react';
import {
  Avatar, Bar, Breadcrumbs, BreadcrumbsItem, Button, Card, DynamicPage, DynamicPageTitle, Link, MessageStrip,
  ProgressIndicator, Tag, Text, Title, Toolbar, ToolbarButton,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/refresh.js';
import '@ui5/webcomponents-icons/dist/nav-back.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import { COURSES, EXAM, LESSONS, lessonById, type QuizQuestion } from '../content/content';
import { QuizOptions } from '../components/Quiz';
import { Blocks, Inline } from '../render/Markdown';
import { navigate } from '../state/store';
import { accent } from './common';

interface Sim { qs: QuizQuestion[]; i: number; ans: (number | null)[]; finished: boolean }

function newSim(n: number): Sim {
  const pool = LESSONS.flatMap(l => l.quiz);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const qs = pool.slice(0, Math.min(n, pool.length));
  return { qs, i: 0, ans: qs.map(() => null), finished: false };
}

// Mantém o simulado em andamento ao trocar de página.
let saved: Sim | null = null;

export default function ExamPage() {
  const m = EXAM.meta;
  const total = Number(m.questoes) || 15;
  const min = Number(m.nota_minima) || 65;
  const [sim, setSimState] = useState<Sim>(() => (saved ??= newSim(total)));
  const setSim = (s: Sim) => { saved = s; setSimState(s); };
  const top = () => document.querySelector('.page')?.scrollTo?.({ top: 0 });
  const restart = () => { setSim(newSim(total)); top(); };

  return (
    <DynamicPage
      className="page"
      titleArea={
        <DynamicPageTitle
          heading={<div className="dp-heading"><Avatar icon={m.icone ?? 'education'} colorScheme={accent(m.cor)} size="S" shape="Square" /><Title level="H1" size="H2">{m.titulo}</Title></div>}
          subheading={<Text>{m.subtitulo}</Text>}
          breadcrumbs={
            <Breadcrumbs onItemClick={e => { if ((e.detail.item as HTMLElement).getAttribute('href')) { e.preventDefault(); navigate('inicio'); } }}>
              <BreadcrumbsItem href="#inicio">Início</BreadcrumbsItem>
              <BreadcrumbsItem>Recursos</BreadcrumbsItem>
            </Breadcrumbs>
          }
          actionsBar={<Toolbar design="Transparent"><ToolbarButton icon="refresh" text="Novo sorteio" onClick={restart} /></Toolbar>}
        />
      }
    >
      <div className="wrap-narrow">
        {sim.finished ? <Result sim={sim} min={min} onRestart={restart} /> : <Running sim={sim} setSim={setSim} onEnd={() => { setSim({ ...sim, finished: true }); top(); }} />}
      </div>
    </DynamicPage>
  );
}

function Running({ sim, setSim, onEnd }: { sim: Sim; setSim: (s: Sim) => void; onEnd: () => void }) {
  const q = sim.qs[sim.i];
  const l = lessonById(q.lessonId);
  const answered = sim.ans.filter(a => a != null).length;
  const last = sim.i === sim.qs.length - 1;
  const go = (d: number) => setSim({ ...sim, i: Math.max(0, Math.min(sim.qs.length - 1, sim.i + d)) });

  return (
    <Card className="md-card">
      <div className="md-card-body exam">
        <div className="exam-head">
          <Title level="H2" size="H5">Questão {sim.i + 1} de {sim.qs.length}</Title>
          <span className="note">Tema: {l?.title} · respondidas {answered}/{sim.qs.length}</span>
        </div>
        <ProgressIndicator value={((sim.i + 1) / sim.qs.length) * 100} displayValue={`${sim.i + 1}/${sim.qs.length}`} />
        <p className="quiz-title exam-q"><Inline nodes={q.question} /></p>
        <QuizOptions
          key={sim.i}
          q={q}
          name={`sim-${sim.i}`}
          value={sim.ans[sim.i]}
          reveal={false}
          onChange={j => setSim({ ...sim, ans: sim.ans.map((a, k) => (k === sim.i ? j : a)) })}
        />
        {last && answered < sim.qs.length && (
          <MessageStrip design="Critical" hideCloseButton>
            Ainda há {sim.qs.length - answered} questão(ões) em branco. Você pode finalizar assim mesmo.
          </MessageStrip>
        )}
        <Bar
          design="FloatingFooter"
          className="exam-bar"
          startContent={<Button icon="nav-back" disabled={sim.i === 0} onClick={() => go(-1)}>Anterior</Button>}
          endContent={
            <>
              {!last && <Button design="Emphasized" endIcon="navigation-right-arrow" onClick={() => go(1)}>Próxima</Button>}
              <Button design={last ? 'Emphasized' : 'Default'} icon="accept" onClick={onEnd}>Finalizar</Button>
            </>
          }
        />
      </div>
    </Card>
  );
}

function Result({ sim, min, onRestart }: { sim: Sim; min: number; onRestart: () => void }) {
  const right = sim.qs.filter((q, i) => sim.ans[i] === q.answer).length;
  const pct = Math.round((right / sim.qs.length) * 100);
  const ok = pct >= min;
  const byCourse = COURSES.map(c => {
    const idx = sim.qs.map((q, i) => [q, i] as const).filter(([q]) => lessonById(q.lessonId)?.course === c);
    return { c, n: idx.length, r: idx.filter(([q, i]) => sim.ans[i] === q.answer).length };
  });
  const msg = EXAM.containers[ok ? 'aprovado' : 'reprovado'];

  return (
    <div className="stack">
      <Card className="md-card">
        <div className="md-card-body result-box">
          <div>
            <div className={`score ${ok ? 'ok' : 'bad'}`}>{pct}%</div>
            <div className="note">{right} de {sim.qs.length} corretas</div>
          </div>
          <Tag design={ok ? 'Positive' : 'Negative'} size="L">{ok ? 'Aprovado' : `Abaixo de ${min}%`}</Tag>
          <div className="result-courses">
            {byCourse.map(x => (
              <div key={x.c.id}>
                <div className="result-course-h"><span>Curso {x.c.n} · {x.c.title}</span><b>{x.r}/{x.n}</b></div>
                <ProgressIndicator value={x.n ? (x.r / x.n) * 100 : 0} displayValue={`${x.r}/${x.n}`} valueState={x.n && x.r === x.n ? 'Positive' : 'None'} />
              </div>
            ))}
          </div>
          <Button design="Emphasized" icon="refresh" onClick={onRestart}>Novo simulado</Button>
        </div>
      </Card>
      {msg && msg.length > 0 && (
        <MessageStrip design={ok ? 'Positive' : 'Critical'} hideCloseButton><Blocks nodes={msg} /></MessageStrip>
      )}
      <Title level="H2" size="H4">Revisão</Title>
      <Card className="md-card">
        <div className="md-card-body quiz">
          {sim.qs.map((q, i) => {
            const l = lessonById(q.lessonId);
            const st = sim.ans[i] == null ? 'em branco' : sim.ans[i] === q.answer ? 'certa' : 'errada';
            return (
              <div className="quiz-q" key={i}>
                <p className="quiz-title">
                  <span className="quiz-num">{i + 1}.</span> <Inline nodes={q.question} />
                  <Tag design={st === 'certa' ? 'Positive' : 'Negative'} className="quiz-badge">{st}</Tag>
                </p>
                <QuizOptions q={q} name={`rev-${i}`} value={sim.ans[i]} reveal />
                <div className="quiz-why">
                  <Blocks nodes={q.why} />
                  {l && <Link href={`#${l.id}`} onClick={e => { e.preventDefault(); navigate(l.id); }}>Rever: {l.title}</Link>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
