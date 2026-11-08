import { useState } from 'react';
import { Slider } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { CONN, Field, fmtNum, LabCard, Row, StatusLine, StatusTag, Strip } from './common';

type Cat = 'Longa' | 'Média' | 'Curta';
const TIPO: Record<Cat, string> = { Longa: 'c5', 'Média': 'info', Curta: 'sucesso' };

/** CASE em CDS: a ordem dos WHEN importa. */
export default function CaseLab() {
  const [L, setL] = useState(9000);
  const [M, setM] = useState(4000);
  const cls = (d: number): Cat => (d >= L ? 'Longa' : d >= M ? 'Média' : 'Curta');
  const cnt: Record<Cat, number> = { Longa: 0, 'Média': 0, Curta: 0 };
  const rows = CONN.map(r => {
    const k = cls(r.distance);
    cnt[k]++;
    return { v: `${r.carrier_id} ${r.connection_id}`, r: `${r.airport_from_id} → ${r.airport_to_id}`, d: fmtNum(r.distance), c: <StatusTag tipo={TIPO[k]}>{k}</StatusTag> };
  });

  return (
    <LabCard title="Classificação por distância" subtitle="ZI_Connection · 13 conexões" icon="filter">
      <Row>
        <Field label={<>Longa se distance &gt;= <b>{fmtNum(L)}</b> km</>} htmlFor="cl-l" grow>
          <Slider id="cl-l" min={2000} max={13000} step={250} value={L} onInput={e => setL(e.target.value)} accessibleName="Limite Longa" />
        </Field>
        <Field label={<>Média se distance &gt;= <b>{fmtNum(M)}</b> km</>} htmlFor="cl-m" grow>
          <Slider id="cl-m" min={500} max={12000} step={250} value={M} onInput={e => setM(e.target.value)} accessibleName="Limite Média" />
        </Field>
      </Row>
      <CodeBlock code={`case\n  when distance >= ${L} then 'Longa'\n  when distance >= ${M} then 'Média'\n  else 'Curta'\nend as DistanceCategory`} title="Elemento calculado" lang="cds" />
      <StatusLine>
        <StatusTag tipo="c5">Longa: {cnt.Longa}</StatusTag>
        <StatusTag tipo="info">Média: {cnt['Média']}</StatusTag>
        <StatusTag tipo="sucesso">Curta: {cnt.Curta}</StatusTag>
      </StatusLine>
      {M > L && (
        <Strip kind="aviso">
          O limite de “Média” está acima do de “Longa”: como o CASE para no primeiro WHEN verdadeiro, nenhuma linha cai em “Média” acima do limite de “Longa”. A ordem dos WHEN importa.
        </Strip>
      )}
      <DataTable
        columns={[{ key: 'v', label: 'Voo', mono: true }, { key: 'r', label: 'Rota', mono: true }, { key: 'd', label: 'Distância (km)', align: 'End' }, { key: 'c', label: 'DistanceCategory' }]}
        rows={rows}
      />
    </LabCard>
  );
}
