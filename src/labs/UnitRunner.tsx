import { useState } from 'react';
import { Button, ProgressIndicator } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/play.js';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { LabCard, Note, Row, Seg, StatusLine, StatusTag } from './common';

type V = 'ok' | 'b1' | 'b2';
const IMPL: Record<V, string> = {
  ok: 'r_price = i_price - i_price * i_percent / 100.',
  b1: 'r_price = i_price - i_price * i_percent / 10.',
  b2: '" validação removida\nr_price = i_price - i_price * i_percent / 100.',
};

/** Roda três testes ABAP Unit contra versões corretas e com bug. */
export default function UnitRunner() {
  const [v, setV] = useState<V>('ok');
  const [res, setRes] = useState<[string, string | null][] | null>(null);

  const calc = (p: number, pct: number) => {
    if (v !== 'b2' && (pct < 0 || pct > 100)) throw new Error('cx');
    return p - (p * pct) / (v === 'b1' ? 10 : 100);
  };
  function run() {
    const tests: [string, () => string | null][] = [
      ['ten_percent', () => { const a = calc(100, 10); return a === 90 ? null : `Esperado [90.00], atual [${a.toFixed(2)}]`; }],
      ['zero_percent', () => { const a = calc(100, 0); return a === 100 ? null : `Esperado [100.00], atual [${a.toFixed(2)}]`; }],
      ['invalid_percent', () => { try { calc(100, 120); return 'Esperava exceção (cl_abap_unit_assert=>fail)'; } catch { return null; } }],
    ];
    setRes(tests.map(([n, f]) => [n, f()]));
  }
  const fails = res?.filter(t => t[1]).length ?? 0;
  const code = (v === 'b2' ? '' : 'IF i_percent < 0 OR i_percent > 100.\n  RAISE EXCEPTION TYPE cx_abap_invalid_value.\nENDIF.\n') + IMPL[v];

  return (
    <LabCard title="Executor de testes" subtitle="Escolha uma versão de apply_discount e rode os testes" icon="message-success">
      <Row>
        <Seg label="Versão" value={v} onChange={x => { setV(x); setRes(null); }} options={[['ok', 'Implementação correta'], ['b1', 'Bug: / 10'], ['b2', 'Bug: sem validação']]} />
        <Button design="Emphasized" icon="play" onClick={run}>Executar testes (Ctrl+Shift+F10)</Button>
      </Row>
      <CodeBlock code={code} title="apply_discount · versão em teste" />
      {res ? (
        <>
          <ProgressIndicator value={100} valueState={fails ? 'Negative' : 'Positive'} displayValue={fails ? `${fails} de 3 falharam` : '3 de 3 passaram'} />
          <StatusLine>
            <StatusTag tipo={fails ? 'erro' : 'sucesso'}>{fails ? `${fails} de 3 falharam` : '3 de 3 passaram'}</StatusTag>
            <span className="note">ltc_price_calc · DURATION SHORT · RISK LEVEL HARMLESS</span>
          </StatusLine>
          <DataTable
            columns={[{ key: 'm', label: 'Método', mono: true }, { key: 'r', label: 'Resultado' }]}
            rows={res.map(([m, r]) => ({ m, r: r ? <StatusTag tipo="erro">✕ {r}</StatusTag> : <StatusTag tipo="sucesso">✓ ok</StatusTag> }))}
          />
        </>
      ) : (
        <Note>{v === 'ok' ? 'Clique em executar para ver o resultado.' : 'Versão alterada. Execute os testes novamente.'}</Note>
      )}
    </LabCard>
  );
}
