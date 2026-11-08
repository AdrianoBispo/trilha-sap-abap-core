import { useState } from 'react';
import { StepInput } from '@ui5/webcomponents-react';
import DataTable from '../components/DataTable';
import { highlight } from '../components/highlight';
import { Chips, divRound, Field, LabCard, Note, Row, Strip } from './common';

const PRESETS = ['7 , 2', '-7 , 2', '7 , -2', '10 , 4', '1 , 3', '5 , 0', '0 , 0'];

/** Mesmos operandos, quatro resultados: / para i, / para p, DIV e MOD. */
export default function DivCalc() {
  const [a, setA] = useState(7);
  const [b, setB] = useState(2);

  const absB = Math.abs(b);
  const mod = b === 0 ? 0 : ((a % absB) + absB) % absB;
  const div = b === 0 ? 0 : (a - mod) / b;
  const r = b === 0 ? ['0', '0.00', '0', '0'] : [divRound(a, b, 0), divRound(a, b, 2), String(div), String(mod)];
  const lines: [string, string, string, string][] = [
    ['result_i = a / b.', 'result_i TYPE i', r[0], 'Divide e arredonda comercialmente para inteiro.'],
    ['result_p = a / b.', 'result_p TYPE p DECIMALS 2', r[1], 'O destino do tipo p muda o tipo de cálculo.'],
    ['result_i = a DIV b.', 'TYPE i', r[2], 'Parte inteira, escolhida para que o resto seja ≥ 0.'],
    ['result_i = a MOD b.', 'TYPE i', r[3], 'Resto, sempre entre 0 e |b| − 1.'],
  ];

  return (
    <LabCard title="Calculadora de divisão ABAP" subtitle="Mesmos operandos, quatro resultados diferentes" icon="measure">
      <Row>
        <Field label="Dividendo (a)" htmlFor="dc-a">
          <StepInput id="dc-a" value={a} onChange={e => setA(Math.trunc(e.target.value))} />
        </Field>
        <Field label="Divisor (b)" htmlFor="dc-b">
          <StepInput id="dc-b" value={b} onChange={e => setB(Math.trunc(e.target.value))} />
        </Field>
        <Chips
          items={PRESETS}
          onPick={p => {
            const [x, y] = p.split(',').map(s => parseInt(s, 10));
            setA(x);
            setB(y);
          }}
        />
      </Row>
      {b === 0 && a !== 0 ? (
        <Strip kind="erro">
          <strong>CX_SY_ZERODIVIDE</strong> em todas as quatro operações: divisão por zero com dividendo diferente de zero.
        </Strip>
      ) : (
        <>
          <DataTable
            columns={[
              { key: 'i', label: 'Instrução' },
              { key: 'd', label: 'Destino', mono: true },
              { key: 'r', label: 'Resultado', align: 'End' },
              { key: 'w', label: 'Por quê' },
            ]}
            rows={lines.map(l => ({
              i: <code className="md-code" dangerouslySetInnerHTML={{ __html: highlight(l[0].replace(/\ba\b/, String(a)).replace(/\bb\b/, String(b))) }} />,
              d: l[1],
              r: <strong className="mono">{l[2]}</strong>,
              w: l[3],
            }))}
          />
          <Note>
            {b !== 0
              ? `Verificação: ${a} = (${div}) × (${b}) + ${mod}.`
              : 'Caso especial: 0 dividido por 0 resulta 0 em ABAP, sem exceção.'}
          </Note>
        </>
      )}
    </LabCard>
  );
}
