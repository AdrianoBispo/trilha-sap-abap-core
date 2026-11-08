import { useState } from 'react';
import { CheckBox } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { LabCard, Note, Row, StatusTag } from './common';

const SRC = { carrier_id: 'LH', connection_id: '0400', airport_from_id: 'FRA', airport_to_id: 'JFK', distance: 6162 } as const;
const BASE: Record<string, string | number> = { carrier_id: '', connection_id: '', from_airport: '', distance: 0, comment: 'manter este texto' };

/** CORRESPONDING #( ) com MAPPING, EXCEPT e BASE. */
export default function Corr() {
  const [map, setMap] = useState(false);
  const [exc, setExc] = useState(false);
  const [base, setBase] = useState(false);

  let c = `target = CORRESPONDING #( ${base ? 'BASE ( target ) ' : ''}connection`;
  if (map) c += `\n             MAPPING from_airport = airport_from_id`;
  if (exc) c += `\n             EXCEPT distance`;
  c += ' ).';

  const rows = Object.keys(BASE).map(k => {
    let v: string | number, how;
    if (k === 'from_airport' && map) { v = SRC.airport_from_id; how = <StatusTag tipo="c5">mapeado</StatusTag>; }
    else if (k in SRC && !(exc && k === 'distance')) { v = SRC[k as keyof typeof SRC]; how = <StatusTag tipo="sucesso">mesmo nome</StatusTag>; }
    else if (base) { v = BASE[k]; how = <StatusTag tipo="info">mantido (BASE)</StatusTag>; }
    else { v = typeof BASE[k] === 'number' ? 0 : ''; how = <StatusTag>inicial</StatusTag>; }
    return { k, v: v === '' ? <span className="note">' '</span> : v, how };
  });

  return (
    <LabCard title="CORRESPONDING #( )" subtitle="origem: connection · destino: target (tipos diferentes)" icon="chain-link">
      <Row className="checks">
        <CheckBox text="MAPPING from_airport = airport_from_id" checked={map} onChange={e => setMap(e.target.checked)} />
        <CheckBox text="EXCEPT distance" checked={exc} onChange={e => setExc(e.target.checked)} />
        <CheckBox text="BASE ( target )" checked={base} onChange={e => setBase(e.target.checked)} />
      </Row>
      <CodeBlock code={c} title="Instrução" />
      <div className="split">
        <div className="panel">
          <h4>connection (origem)</h4>
          <DataTable
            columns={[{ key: 'k', label: 'componente', mono: true }, { key: 'v', label: 'valor', mono: true }]}
            rows={Object.entries(SRC).map(([k, v]) => ({ k, v }))}
          />
        </div>
        <div className="panel">
          <h4>target (resultado)</h4>
          <DataTable
            columns={[{ key: 'k', label: 'componente', mono: true }, { key: 'v', label: 'valor', mono: true }, { key: 'how', label: 'origem' }]}
            rows={rows}
          />
          <Note>Antes da instrução, <code className="md-code">target-comment</code> valia “manter este texto”.</Note>
        </div>
      </div>
    </LabCard>
  );
}
