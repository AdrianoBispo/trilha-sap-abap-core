import { useState } from 'react';
import { Input } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import { Chips, decStr, divRound, Field, LabCard, parseAbapNum, roundDec, Row, Strip } from './common';

const CODE = [
  'TRY.',
  '    DATA(divisor) = CONV i( input ).',
  '    DATA(result)  = 100 / divisor.',
  '    out->write( |100 / { divisor } = { result }| ).',
  '  CATCH cx_sy_zerodivide INTO DATA(zero).',
  '    out->write( zero->get_text( ) ).',
  '  CATCH cx_sy_conversion_no_number.',
  '    out->write( `Isso não é um número` ).',
  '  CATCH cx_root INTO DATA(other).',
  '    out->write( |Outro erro: { other->get_text( ) }| ).',
  'ENDTRY.',
  'out->write( `O programa continua` ).',
].join('\n');
const PRESETS = ['8', '3', '0', 'abc', ' 12.7', '99999999999'];

/** Execução passo a passo de TRY … CATCH com linhas executadas destacadas. */
export default function TrySim() {
  const [s, setS] = useState('8');
  const p = parseAbapNum(s);
  let lines: number[], out: string[], ex = '';
  if (!p.ok) {
    lines = [0, 1, 6, 7, 10, 11]; out = ['Isso não é um número']; ex = 'CX_SY_CONVERSION_NO_NUMBER → CX_SY_CONVERSION_ERROR → CX_DYNAMIC_CHECK';
  } else {
    const d = BigInt(decStr(roundDec(p, 0), 0));
    if (d > 2147483647n || d < -2147483648n) { lines = [0, 1, 8, 9, 10, 11]; out = [`Outro erro: Overflow ao converter "${s.trim()}"`]; ex = 'CX_SY_CONVERSION_OVERFLOW: não há CATCH específico, cx_root captura'; }
    else if (d === 0n) { lines = [0, 1, 2, 4, 5, 10, 11]; out = ['Divisão por zero']; ex = 'CX_SY_ZERODIVIDE → CX_SY_ARITHMETIC_ERROR → CX_DYNAMIC_CHECK'; }
    else { lines = [0, 1, 2, 3, 10, 11]; out = [`100 / ${d} = ${divRound(100, Number(d), 0)}`]; }
  }
  out.push('O programa continua');

  return (
    <LabCard title="Execução passo a passo" subtitle="input TYPE string" icon="play">
      <Row>
        <Field label="input" htmlFor="ts-in" width="12rem"><Input id="ts-in" className="mono" value={s} onInput={e => setS(e.target.value)} /></Field>
        <Chips items={PRESETS} onPick={setS} />
      </Row>
      <CodeBlock code={CODE} title="Simulação · linhas executadas destacadas" activeLines={lines} numbered hideCopy />
      <div className="console" aria-live="polite">{out.join('\n')}</div>
      {ex ? (
        <Strip kind="aviso">Exceção lançada na linha {lines[2] === 2 ? 3 : 2}: <code className="md-code">{ex}</code></Strip>
      ) : (
        <Strip kind="sucesso">Nenhuma exceção: o bloco TRY terminou normalmente e os CATCH foram ignorados.</Strip>
      )}
    </LabCard>
  );
}
