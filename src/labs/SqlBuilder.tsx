import { useState } from 'react';
import { CheckBox, Label, Option, Select, Slider, StepInput } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { CARR, CONN, cols, Field, LabCard, Row, Seg, StatusLine, StatusTag, Strip, type Connection } from './common';

const F = ['carrier_id', 'connection_id', 'airport_from_id', 'airport_to_id', 'departure_time', 'distance'] as const;
type Fld = (typeof F)[number];

/** Monta um SELECT em /DMO/CONNECTION e mostra o resultado sobre dados de exemplo. */
export default function SqlBuilder() {
  const [fields, setFields] = useState<Set<Fld>>(new Set(['carrier_id', 'connection_id', 'airport_from_id', 'airport_to_id']));
  const [carrier, setCarrier] = useState('LH');
  const [minDist, setMinDist] = useState(0);
  const [order, setOrder] = useState('');
  const [upto, setUpto] = useState(0);
  const [mode, setMode] = useState<'t' | 's'>('t');
  const single = mode === 's';

  const fl = F.filter(f => fields.has(f));
  const where: string[] = [];
  if (carrier) where.push(`carrier_id = '${carrier}'`);
  if (minDist) where.push(`distance > ${minDist}`);
  let c = `SELECT${single ? ' SINGLE' : ''} FROM /dmo/connection\n  FIELDS ${fl.join(', ') || '…'}`;
  if (where.length) c += `\n  WHERE ${where.join('\n    AND ')}`;
  if (!single && order) c += `\n  ORDER BY ${order}`;
  c += single ? `\n  INTO @DATA(connection).` : `\n  INTO TABLE @DATA(connections)` + (upto ? `\n  UP TO ${upto} ROWS.` : '.');

  let rows: Connection[] = CONN.filter(r => (!carrier || r.carrier_id === carrier) && r.distance > minDist);
  if (!single && order) {
    const [k, dir] = order.split(' ') as [keyof Connection, string?];
    rows = [...rows].sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (dir ? -1 : 1));
  }
  if (single) rows = rows.slice(0, 1);
  else if (upto) rows = rows.slice(0, upto);
  const subrc = rows.length ? 0 : 4;

  const toggle = (f: Fld, on: boolean) => setFields(s => { const n = new Set(s); if (on) n.add(f); else n.delete(f); return n; });

  return (
    <LabCard title="SELECT em /DMO/CONNECTION" subtitle="13 conexões de exemplo" icon="filter">
      <Seg label="Modo" value={mode} onChange={setMode} options={[['t', 'INTO TABLE'], ['s', 'SELECT SINGLE']]} />
      <div>
        <Label showColon={false}>FIELDS</Label>
        <Row className="checks">
          {F.map(f => <CheckBox key={f} text={f} className="mono-check" checked={fields.has(f)} onChange={e => toggle(f, e.target.checked)} />)}
        </Row>
      </div>
      <Row>
        <Field label="WHERE carrier_id =" htmlFor="sq-car">
          <Select id="sq-car" value={carrier} onChange={e => setCarrier(e.target.value)}>
            <Option value="">(sem filtro)</Option>
            {Object.keys(CARR).map(k => <Option key={k} value={k}>{k}</Option>)}
          </Select>
        </Field>
        <Field label={<>AND distance &gt; <b>{minDist}</b></>} htmlFor="sq-dist" grow>
          <Slider id="sq-dist" min={0} max={12000} step={500} value={minDist} onInput={e => setMinDist(e.target.value)} accessibleName="Distância mínima" />
        </Field>
        <Field label="ORDER BY" htmlFor="sq-ord">
          <Select id="sq-ord" disabled={single} value={order} onChange={e => setOrder(e.target.value)}>
            <Option value="">(nenhum)</Option>
            <Option value="connection_id">connection_id</Option>
            <Option value="distance DESCENDING">distance DESCENDING</Option>
            <Option value="airport_from_id">airport_from_id</Option>
          </Select>
        </Field>
        <Field label="UP TO n ROWS" htmlFor="sq-up" width="9rem">
          <StepInput id="sq-up" disabled={single} min={0} max={20} value={upto} onChange={e => setUpto(Math.max(0, Math.trunc(e.target.value)))} />
        </Field>
      </Row>
      <CodeBlock code={c} title="ABAP SQL gerado" />
      {!fl.length ? (
        <Strip kind="erro">Erro de sintaxe: <code className="md-code">FIELDS</code> precisa de pelo menos um campo (ou <code className="md-code">*</code>).</Strip>
      ) : (
        <>
          <StatusLine>
            <StatusTag tipo={subrc ? 'aviso' : 'sucesso'}>sy-subrc = {subrc}</StatusTag>
            <StatusTag tipo="info">sy-dbcnt = {rows.length}</StatusTag>
          </StatusLine>
          <DataTable columns={cols(fl, ['distance'])} rows={rows.map(r => Object.fromEntries(fl.map(f => [f, r[f]])))} />
          {single && (
            <Strip kind="aviso">
              O WHERE não informa a chave completa (<code className="md-code">carrier_id</code> e <code className="md-code">connection_id</code>). <code className="md-code">SELECT SINGLE</code> devolve uma linha qualquer que atenda, e o ATC sinaliza isso.
            </Strip>
          )}
          {!single && !order && rows.length > 1 && (
            <Strip>Sem <code className="md-code">ORDER BY</code>, a ordem das linhas não é garantida pelo banco. Aqui elas aparecem na ordem da chave primária.</Strip>
          )}
        </>
      )}
    </LabCard>
  );
}
