import { useState } from 'react';
import { Button, Input, Option, Select } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/create.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/chain-link.js';
import { highlight } from '../components/highlight';
import { Field, LabCard, Note, Row } from './common';

const VARS = ['connection1', 'connection2', 'connection3'] as const;
type Var = (typeof VARS)[number];
interface Obj { id: number; c: string; n: string; gone?: boolean }
interface State { vars: Record<Var, number | null>; objs: Obj[]; counter: number; seq: number; log: { stmt: string; note?: string; err?: string }[] }

const init: State = { vars: { connection1: null, connection2: null, connection3: null }, objs: [], counter: 0, seq: 0, log: [] };

/** Remove objetos já recolhidos e marca como recolhidos os que ficaram sem referência. */
function gc(s: State): State {
  const objs = s.objs.filter(o => !o.gone).map(o => (VARS.some(v => s.vars[v] === o.id) ? o : { ...o, gone: true }));
  return { ...s, objs };
}

const VarSelect = ({ id, value, onChange }: { id: string; value: Var; onChange: (v: Var) => void }) => (
  <Select id={id} value={value} onChange={e => onChange(e.target.value as Var)}>
    {VARS.map(v => <Option key={v} value={v}>{v}</Option>)}
  </Select>
);

/** Pilha de variáveis REF TO e objetos no heap, com garbage collector. */
export default function ObjLab() {
  const [s, setS] = useState(init);
  const [v, setV] = useState<Var>('connection1');
  const [car, setCar] = useState('LH');
  const [con, setCon] = useState('0400');
  const [dst, setDst] = useState<Var>('connection2');
  const [src, setSrc] = useState<Var>('connection1');

  function create() {
    const c = car.trim().toUpperCase(), n = con.trim();
    const stmt = `${v} = NEW #( i_carrier_id = '${c}' i_connection_id = '${n}' ).`;
    let st = gc(s);
    if (!c || !n) {
      setS({ ...st, log: [...st.log, { stmt, err: `RAISE EXCEPTION cx_abap_invalid_value: nenhum objeto criado, ${v} mantém o valor anterior` }] });
      return;
    }
    const id = st.seq + 1;
    st = { ...st, seq: id, counter: st.counter + 1, objs: [...st.objs, { id, c, n }], vars: { ...st.vars, [v]: id }, log: [...st.log, { stmt }] };
    setS(gc(st));
  }
  const clear = () => {
    const st = gc(s);
    setS(gc({ ...st, vars: { ...st.vars, [v]: null }, log: [...st.log, { stmt: `CLEAR ${v}.` }] }));
  };
  const copy = () => {
    const st = gc(s);
    setS(gc({ ...st, vars: { ...st.vars, [dst]: st.vars[src] }, log: [...st.log, { stmt: `${dst} = ${src}.`, note: '(copia a referência, não o objeto)' }] }));
  };

  return (
    <LabCard title="Laboratório de objetos" subtitle="Pilha de variáveis à esquerda, objetos na memória (heap) à direita" icon="org-chart">
      <Row>
        <Field label="Variável" htmlFor="ob-var"><VarSelect id="ob-var" value={v} onChange={setV} /></Field>
        <Field label="i_carrier_id" htmlFor="ob-car" width="7rem"><Input id="ob-car" className="mono" maxlength={3} value={car} onInput={e => setCar(e.target.value)} /></Field>
        <Field label="i_connection_id" htmlFor="ob-con" width="8rem"><Input id="ob-con" className="mono" maxlength={4} value={con} onInput={e => setCon(e.target.value)} /></Field>
        <Button design="Emphasized" icon="create" onClick={create}>NEW</Button>
        <Button icon="decline" onClick={clear}>CLEAR</Button>
      </Row>
      <Row>
        <Field label="Destino" htmlFor="ob-dst"><VarSelect id="ob-dst" value={dst} onChange={setDst} /></Field>
        <span className="mono eq">=</span>
        <Field label="Origem" htmlFor="ob-src"><VarSelect id="ob-src" value={src} onChange={setSrc} /></Field>
        <Button icon="chain-link" onClick={copy}>Copiar referência</Button>
      </Row>
      <div className="heap">
        <div className="mem">
          <b>Variáveis · REF TO lcl_connection</b>
          {VARS.map(name => (
            <div className="refv" key={name}>
              <span>{name}</span>
              {s.vars[name] ? <b className="ref-on">→ objeto #{s.vars[name]}</b> : <span className="note">INITIAL</span>}
            </div>
          ))}
          <div className="refv refv-static">
            <span>lcl_connection=&gt;conn_counter</span>
            <b>{s.counter}</b>
          </div>
        </div>
        <div className="mem">
          <b>Heap</b>
          <div className="objs">
            {s.objs.length ? (
              s.objs.map(o => {
                const refs = VARS.filter(x => s.vars[x] === o.id).length;
                return (
                  <div className={`inst${o.gone ? ' gone' : ''}`} key={o.id}>
                    <b>#{o.id} lcl_connection</b>
                    <span>carrier_id = '{o.c}'</span>
                    <span>connection_id = '{o.n}'</span>
                    <span className="note">{o.gone ? 'Sem referência: recolhido pelo garbage collector' : `${refs} ${refs === 1 ? 'referência' : 'referências'}`}</span>
                  </div>
                );
              })
            ) : (
              <Note>Nenhum objeto. Use NEW para criar.</Note>
            )}
          </div>
        </div>
      </div>
      <div>
        <span className="lbl">Instruções executadas</span>
        <div className="log">
          {s.log.length ? (
            s.log.slice(-6).reverse().map((l, i) => (
              <div key={s.log.length - i}>
                <span dangerouslySetInnerHTML={{ __html: highlight(l.stmt) }} />
                {l.note && <span className="note"> {l.note}</span>}
                {l.err && <div className="log-err">→ {l.err}</div>}
              </div>
            ))
          ) : (
            <div>Nada executado ainda.</div>
          )}
        </div>
      </div>
    </LabCard>
  );
}
