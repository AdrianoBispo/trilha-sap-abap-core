import { useState } from 'react';
import { Button, StepInput } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/create.js';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/refresh.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import CodeBlock from '../components/CodeBlock';
import { toast } from '../state/store';
import { Field, LabCard, Row, StatusTag } from './common';

const hash = (v: number) => (((v * 2654435761) >>> 0) >>> 5) % 8;
interface Probe { probes: number[]; hit: number; cmp: number }
type Last =
  | { kind: 'ins'; v: number; rc: [number, number, number] }
  | { kind: 'read'; v: number; std: Probe; srt: Probe; hsh: { b: number; hit: number; cmp: number } }
  | null;
interface S { std: number[]; sorted: number[]; hashed: number[][] }

function insert(s: S, v: number): [S, [number, number, number]] {
  const std = [...s.std, v];
  let sorted = s.sorted, r2 = 4;
  if (!s.sorted.includes(v)) { sorted = [...s.sorted, v].sort((a, b) => a - b); r2 = 0; }
  const b = hash(v);
  let hashed = s.hashed, r3 = 4;
  if (!s.hashed[b].includes(v)) { hashed = s.hashed.map((bk, i) => (i === b ? [...bk, v] : bk)); r3 = 0; }
  return [{ std, sorted, hashed }, [0, r2, r3]];
}
const initial = (): S => [42, 7, 19, 88, 3, 56, 7].reduce<S>((s, v) => insert(s, v)[0], { std: [], sorted: [], hashed: Array.from({ length: 8 }, () => []) });

const cmpTxt = (o: { hit: number; cmp: number }, hashed?: boolean) =>
  `${o.cmp} comparaç${o.cmp === 1 ? 'ão' : 'ões'}` + (o.hit >= 0 ? (hashed ? '' : ` · sy-tabix ${o.hit + 1}`) : ' · sy-subrc 4');

/** Standard, sorted e hashed com as mesmas operações INSERT e READ TABLE. */
export default function Itab() {
  const [s, setS] = useState<S>(initial);
  const [last, setLast] = useState<Last>(null);
  const [val, setVal] = useState(42);

  function ins(v: number) {
    if (s.std.length >= 30) { toast('Limite de 30 linhas neste laboratório'); return; }
    const [n, rc] = insert(s, v);
    setS(n);
    setLast({ kind: 'ins', v, rc });
  }
  function read(v: number) {
    const std: Probe = { probes: [], hit: -1, cmp: 0 };
    for (let i = 0; i < s.std.length; i++) { std.cmp++; std.probes.push(i); if (s.std[i] === v) { std.hit = i; break; } }
    const srt: Probe = { probes: [], hit: -1, cmp: 0 };
    let lo = 0, hi = s.sorted.length - 1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1; srt.cmp++; srt.probes.push(m);
      if (s.sorted[m] === v) { srt.hit = m; break; }
      if (s.sorted[m] < v) lo = m + 1; else hi = m - 1;
    }
    const b = hash(v), bk = s.hashed[b], j = bk.indexOf(v);
    setLast({ kind: 'read', v, std, srt, hsh: { b, hit: j, cmp: j >= 0 ? j + 1 : bk.length } });
  }
  function random() {
    let cur = s, l: Last = last;
    for (let i = 0; i < 5 && cur.std.length < 30; i++) {
      const v = Math.floor(Math.random() * 100);
      const [n, rc] = insert(cur, v);
      cur = n; l = { kind: 'ins', v, rc };
    }
    setS(cur); setLast(l);
  }

  const slotCls = (table: 'std' | 'srt', i: number) => {
    if (last?.kind === 'read') { const o = last[table]; return o.hit === i ? 'hit' : o.probes.includes(i) ? 'probe' : ''; }
    if (last?.kind === 'ins') {
      const arr = table === 'std' ? s.std : s.sorted;
      const ok = last.rc[table === 'std' ? 0 : 1] === 0;
      return ok && arr[i] === last.v && (table === 'srt' || i === s.std.length - 1) ? 'new' : '';
    }
    return '';
  };

  let code = 'DATA std    TYPE STANDARD TABLE OF i WITH NON-UNIQUE KEY table_line.\nDATA sorted TYPE SORTED TABLE OF i WITH UNIQUE KEY table_line.\nDATA hashed TYPE HASHED TABLE OF i WITH UNIQUE KEY table_line.';
  let title = 'Declarações';
  if (last?.kind === 'ins') { code = `INSERT ${last.v} INTO TABLE itab.` + (last.rc[1] ? `\n" sorted/hashed: chave ${last.v} já existe => sy-subrc = 4, nada inserido` : ''); title = 'Última instrução'; }
  if (last?.kind === 'read') { code = `READ TABLE itab WITH TABLE KEY table_line = ${last.v}\n     TRANSPORTING NO FIELDS.`; title = 'Última instrução'; }

  const status = (k: 0 | 1 | 2) => {
    if (last?.kind === 'ins') return <StatusTag tipo={last.rc[k] ? 'aviso' : 'sucesso'}>sy-subrc = {last.rc[k]}</StatusTag>;
    if (last?.kind === 'read') {
      if (k === 0) return <StatusTag tipo={last.std.hit >= 0 ? 'aviso' : 'erro'}>{cmpTxt(last.std)}</StatusTag>;
      if (k === 1) return <StatusTag tipo={last.srt.hit >= 0 ? 'info' : 'erro'}>{cmpTxt(last.srt)}</StatusTag>;
      return <StatusTag tipo={last.hsh.hit >= 0 ? 'sucesso' : 'erro'}>hash + {cmpTxt(last.hsh, true)}</StatusTag>;
    }
    return null;
  };

  return (
    <LabCard title="Três tabelas, mesmas operações" subtitle="TYPE … TABLE OF i WITH … KEY table_line" icon="sorting-ranking">
      <Row>
        <Field label="Chave" htmlFor="it-v" width="8rem">
          <StepInput id="it-v" min={0} max={999} value={val} onChange={e => setVal(Math.max(0, Math.min(999, Math.trunc(e.target.value))))} />
        </Field>
        <Button design="Emphasized" icon="create" onClick={() => ins(val)}>INSERT</Button>
        <Button icon="search" onClick={() => read(val)}>READ TABLE</Button>
        <Button design="Transparent" icon="refresh" onClick={random}>+5 aleatórias</Button>
        <Button design="Transparent" icon="decline" onClick={() => { setS({ std: [], sorted: [], hashed: Array.from({ length: 8 }, () => []) }); setLast(null); }}>CLEAR</Button>
      </Row>
      <CodeBlock code={code} title={title} />
      <div className="panel3">
        <div className="panel">
          <h4>STANDARD · NON-UNIQUE {status(0)}</h4>
          <div className="slots">{s.std.length ? s.std.map((v, i) => <div key={i} className={`slot ${slotCls('std', i)}`}>{v}<small>{i + 1}</small></div>) : <span className="note">vazia</span>}</div>
        </div>
        <div className="panel">
          <h4>SORTED · UNIQUE {status(1)}</h4>
          <div className="slots">{s.sorted.length ? s.sorted.map((v, i) => <div key={i} className={`slot ${slotCls('srt', i)}`}>{v}<small>{i + 1}</small></div>) : <span className="note">vazia</span>}</div>
        </div>
        <div className="panel">
          <h4>HASHED · UNIQUE {status(2)}</h4>
          <div className="buckets">
            {s.hashed.map((bk, b) => (
              <div className="bucket" key={b}>
                <small>bucket {b}</small>
                {bk.map((v, j) => {
                  let cls = '';
                  if (last?.kind === 'read' && last.hsh.b === b) cls = last.hsh.hit === j ? 'hit' : j < (last.hsh.hit < 0 ? bk.length : last.hsh.hit) ? 'probe' : '';
                  else if (last?.kind === 'ins' && last.v === v && last.rc[2] === 0) cls = 'new';
                  return <div key={j} className={`slot ${cls}`}>{v}</div>;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </LabCard>
  );
}
