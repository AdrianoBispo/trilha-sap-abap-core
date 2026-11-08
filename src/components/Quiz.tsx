import { useId, useState } from 'react';
import { Icon, MessageStrip, RadioButton, Tag } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import type { QuizQuestion } from '../content/content';
import { Blocks, Inline } from '../render/Markdown';

interface OptionsProps {
  q: QuizQuestion;
  /** Índice escolhido ou null. */
  value: number | null;
  onChange?: (j: number) => void;
  /** Mostra correção (certa/errada). */
  reveal: boolean;
  name: string;
}

/** Opções de uma questão: RadioButton UI5 com rótulo em Markdown (aceita `código`). */
export function QuizOptions({ q, value, onChange, reveal, name }: OptionsProps) {
  return (
    <div className="quiz-opts" role="radiogroup">
      {q.options.map((o, j) => {
        const right = reveal && j === q.answer;
        const wrong = reveal && j === value && j !== q.answer;
        const select = () => !reveal && onChange?.(j);
        return (
          <div
            key={j}
            className={`quiz-opt${value === j ? ' is-selected' : ''}${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}${reveal ? ' is-locked' : ''}`}
            onClick={select}
          >
            <RadioButton
              name={name}
              checked={value === j}
              readonly={reveal}
              valueState={right ? 'Positive' : wrong ? 'Negative' : 'None'}
              accessibleName={q.optionsText[j]}
              onChange={select}
            />
            <span className="quiz-opt-text"><Inline nodes={o} /></span>
            {right && <Icon name="accept" className="quiz-opt-ic ok" accessibleName="Resposta correta" />}
            {wrong && <Icon name="decline" className="quiz-opt-ic err" accessibleName="Resposta errada" />}
          </div>
        );
      })}
    </div>
  );
}

/** Quiz de fim de lição: corrige cada questão assim que respondida. */
export default function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const id = useId();
  const [ans, setAns] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = ans.filter(a => a != null).length;
  const right = ans.filter((a, i) => a === questions[i].answer).length;
  const total = questions.length;
  const finished = answered === total;

  return (
    <div className="quiz">
      {questions.map((q, i) => (
        <div className="quiz-q" key={i}>
          <p className="quiz-title">
            <span className="quiz-num">{i + 1}.</span> <Inline nodes={q.question} />
            {ans[i] != null && (
              <Tag design={ans[i] === q.answer ? 'Positive' : 'Negative'} className="quiz-badge">
                {ans[i] === q.answer ? 'Correta' : 'Incorreta'}
              </Tag>
            )}
          </p>
          <QuizOptions q={q} name={`${id}-${i}`} value={ans[i]} reveal={ans[i] != null} onChange={j => setAns(a => a.map((x, k) => (k === i ? j : x)))} />
          {ans[i] != null && q.why.length > 0 && (
            <div className="quiz-why"><Blocks nodes={q.why} /></div>
          )}
        </div>
      ))}
      {finished && (
        <MessageStrip design={right === total ? 'Positive' : right >= total / 2 ? 'Information' : 'Critical'} hideCloseButton>
          <strong>{right} de {total} corretas.</strong>{' '}
          {right === total ? 'Você pode marcar esta lição como concluída.' : 'Revise as explicações acima e tente o simulado depois.'}
        </MessageStrip>
      )}
    </div>
  );
}
