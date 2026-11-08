import { useState } from 'react';
import { CheckBox, Option, Select, Slider } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { cols, Field, FLIGHTS, LabCard, Row, Seg, StatusLine, StatusTag, type Flight } from './common';

const AG: Record<string, { k: string; f: (r: Flight[]) => string | number }> = {
  'COUNT( * )': { k: 'flights', f: r => r.length },
  'SUM( seats_occupied )': { k: 'passengers', f: r => r.reduce((s, x) => s + x.seats_occupied, 0) },
  'AVG( seats_occupied AS DEC( 10, 2 ) )': { k: 'avg_pax', f: r => (r.reduce((s, x) => s + x.seats_occupied, 0) / r.length).toFixed(2) },
  'MAX( price )': { k: 'max_price', f: r => Math.max(...r.map(x => x.price)).toFixed(2) },
  'MIN( price )': { k: 'min_price', f: r => Math.min(...r.map(x => x.price)).toFixed(2) },
};

/** Agregações, GROUP BY e HAVING executados “no banco”. */
export default function AggLab() {
  const [a, setA] = useState('COUNT( * )');
  const [g, setG] = useState<'carrier_id' | 'conn' | 'none'>('carrier_id');
  const [h, setH] = useState(1);
  const [full, setFull] = useState(false);

  const keys = g === 'conn' ? ['carrier_id', 'connection_id'] : g === 'carrier_id' ? ['carrier_id'] : [];
  let c = `SELECT FROM /dmo/flight\n  FIELDS ${[...keys, `${a} AS ${AG[a].k}`].join(',\n         ')}`;
  if (full) c += `\n  WHERE seats_occupied = seats_max`;
  if (keys.length) c += `\n  GROUP BY ${keys.join(', ')}`;
  if (h > 1) c += `\n  HAVING COUNT( * ) >= ${h}`;
  if (keys.length) c += `\n  ORDER BY ${keys.join(', ')}`;
  c += `\n  INTO TABLE @DATA(stats).`;

  const src = FLIGHTS.filter(f => !full || f.seats_occupied === f.seats_max);
  const groups = new Map<string, Flight[]>();
  src.forEach(f => {
    const k = keys.map(x => f[x as keyof Flight]).join('|');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(f);
  });
  if (!keys.length && !groups.size) groups.set('', []);
  const rows = [...groups.entries()]
    .filter(([, r]) => (keys.length ? r.length >= h : r.length >= h || h === 1))
    .sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0))
    .map(([k, r]) => {
      const o: Record<string, string | number | null> = {};
      keys.forEach((x, i) => (o[x] = k.split('|')[i]));
      o[AG[a].k] = r.length ? AG[a].f(r) : a.startsWith('COUNT') ? 0 : null;
      return o;
    });

  return (
    <LabCard title="Agregação em /DMO/FLIGHT" subtitle="16 voos de exemplo" icon="overview-chart">
      <Row>
        <Field label="Agregação" htmlFor="ag-f">
          <Select id="ag-f" value={a} onChange={e => setA(e.target.value)}>
            {Object.keys(AG).map(x => <Option key={x} value={x}>{x}</Option>)}
          </Select>
        </Field>
        <Field label="GROUP BY">
          <Seg label="GROUP BY" value={g} onChange={setG} options={[['carrier_id', 'carrier_id'], ['conn', 'carrier_id, connection_id'], ['none', 'nenhum']]} />
        </Field>
        <Field label={<>HAVING COUNT( * ) &gt;= <b>{h}</b></>} htmlFor="ag-h" width="12rem">
          <Slider id="ag-h" min={1} max={4} step={1} value={h} showTickmarks onInput={e => setH(e.target.value)} accessibleName="HAVING" />
        </Field>
        <CheckBox text="WHERE seats_occupied = seats_max" checked={full} onChange={e => setFull(e.target.checked)} />
      </Row>
      <CodeBlock code={c} title="ABAP SQL" />
      <StatusLine>
        <StatusTag>{src.length} linhas lidas no banco</StatusTag>
        <StatusTag tipo="sucesso">{rows.length} transferidas ao ABAP</StatusTag>
      </StatusLine>
      <DataTable columns={cols([...keys, AG[a].k], [AG[a].k])} rows={rows} />
    </LabCard>
  );
}
