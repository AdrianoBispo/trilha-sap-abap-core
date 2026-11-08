import { useEffect, useRef, useState } from 'react';
import { Button, Input } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import { reducedMotion } from '../state/store';
import { Field, LabCard, Row, Seg } from './common';

/** Console do ADT: executar (F9) uma classe ativada ou com alterações pendentes. */
export default function Hello() {
  const [text, setText] = useState('Hello World');
  const [active, setActive] = useState<'1' | '0'>('1');
  const [lastActive, setLastActive] = useState('Hello World');
  const [out, setOut] = useState<{ warn: boolean; full: string; shown: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);

  function run() {
    const full = active === '1' ? text : lastActive;
    if (active === '1') setLastActive(text);
    clearInterval(timer.current);
    if (reducedMotion()) {
      setOut({ warn: active === '0', full, shown: full.length });
      return;
    }
    setOut({ warn: active === '0', full, shown: 0 });
    let i = 0;
    timer.current = window.setInterval(() => {
      i++;
      setOut(o => (o ? { ...o, shown: i } : o));
      if (i >= full.length) clearInterval(timer.current);
    }, 28);
  }

  return (
    <LabCard title="Console do ADT" subtitle="Simulação da execução com F9" icon="play">
      <Row>
        <Field label="Texto passado para out->write( )" htmlFor="hw-txt" grow>
          <Input id="hw-txt" value={text} onInput={e => setText(e.target.value)} />
        </Field>
        <Field label="Estado da classe">
          <Seg label="Estado da classe" value={active} onChange={setActive} options={[['1', 'Ativada'], ['0', 'Alterada, não ativada']]} />
        </Field>
        <Button design="Emphasized" icon="play" onClick={run}>Executar (F9)</Button>
      </Row>
      <CodeBlock code={'out->write( `' + text.replace(/`/g, '``') + '` ).'} title="Linha 11 · ZCL_HELLO_WORLD" />
      <div className="console" aria-live="polite">
        {out ? (
          <>
            <span className="console-p">ZCL_HELLO_WORLD › if_oo_adt_classrun~main</span>
            {'\n'}
            {out.warn && (
              <span className="console-warn">
                ⚠ ZCL_HELLO_WORLD tem alterações não ativadas. O ADT executou a última versão ativa (Ctrl+F3 ativa).{'\n'}
              </span>
            )}
            <span>{out.full.slice(0, out.shown)}</span>
          </>
        ) : (
          <span className="console-p">Console vazio. Clique em Executar.</span>
        )}
      </div>
    </LabCard>
  );
}
