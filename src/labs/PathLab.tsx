import { useState } from 'react';
import { CheckBox, Option, Select } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { CARR, CONN, cols, fdate, Field, FLIGHTS, LabCard, Note, Row, StatusLine, StatusTag } from './common';

/** Expressões de caminho em CDS: _Carrier [1..1] e _Flights [0..*]. */
export default function PathLab() {
  const [car, setCar] = useState('LH');
  const [wn, setWn] = useState(true);
  const [wf, setWf] = useState(false);
  const [flt, setFlt] = useState('');

  const fexpr = flt === 'full' ? `_Flights[ SeatsOccupied = 330 ]` : flt === 'd' ? `_Flights[1: FlightDate = '20261103' ]` : '_Flights';
  const columns = ['CarrierId', 'ConnectionId', ...(wn ? ['CarrierName'] : []), ...(wf ? ['FlightDate'] : [])];
  let c = `define view entity ZI_ConnectionPaths\n  as select from ZI_Connection\n{\n  key CarrierId,\n  key ConnectionId,`;
  if (wn) c += `\n      _Carrier.Name as CarrierName,`;
  if (wf) c += `\n  key ${fexpr}.FlightDate as FlightDate,   // vira chave: multiplica linhas`;
  c = c.replace(/,$/, '') + `\n}\nwhere CarrierId = '${car}'`;

  const base = CONN.filter(r => r.carrier_id === car);
  const rows: Record<string, string | null>[] = [];
  base.forEach(r => {
    const o: Record<string, string | null> = { CarrierId: r.carrier_id, ConnectionId: r.connection_id };
    if (wn) o.CarrierName = CARR[r.carrier_id];
    if (!wf) { rows.push(o); return; }
    const fl = FLIGHTS.filter(f => f.carrier_id === r.carrier_id && f.connection_id === r.connection_id && (flt !== 'full' || f.seats_occupied === 330) && (flt !== 'd' || f.flight_date === '20261103'));
    if (!fl.length) rows.push({ ...o, FlightDate: null });
    else fl.forEach(f => rows.push({ ...o, FlightDate: fdate(f.flight_date) }));
  });
  const joins = [wn ? 'LEFT OUTER TO ONE JOIN ZI_Carrier' : '', wf ? 'LEFT OUTER (TO MANY) JOIN ZI_Flight' : ''].filter(Boolean);

  return (
    <LabCard title="SELECT em ZI_Connection" subtitle="_Carrier [1..1] · _Flights [0..*]" icon="chain-link">
      <Row>
        <Field label="Companhia" htmlFor="pl-c" width="10rem">
          <Select id="pl-c" value={car} onChange={e => setCar(e.target.value)}>{Object.keys(CARR).map(k => <Option key={k} value={k}>{k}</Option>)}</Select>
        </Field>
        <CheckBox text="_Carrier.Name" checked={wn} onChange={e => setWn(e.target.checked)} />
        <CheckBox text="_Flights.FlightDate" checked={wf} onChange={e => setWf(e.target.checked)} />
        <Field label="Filtro em _Flights" htmlFor="pl-flt" width="16rem">
          <Select id="pl-flt" value={flt} disabled={!wf} onChange={e => setFlt(e.target.value)}>
            <Option value="">(sem filtro)</Option>
            <Option value="full">[ SeatsOccupied = 330 ]</Option>
            <Option value="d">[1: FlightDate = '20261103' ]</Option>
          </Select>
        </Field>
      </Row>
      <CodeBlock code={c} title="Projeção com caminhos" lang="cds" />
      <StatusLine>
        <StatusTag>{base.length} conexões na origem</StatusTag>
        <StatusTag tipo={rows.length > base.length ? 'aviso' : 'sucesso'}>{rows.length} linhas no resultado</StatusTag>
        {joins.length ? joins.map(j => <StatusTag key={j} tipo="info">{j}</StatusTag>) : <StatusTag tipo="sucesso">nenhum join gerado</StatusTag>}
      </StatusLine>
      <DataTable columns={cols(columns)} rows={rows} />
      {wf && rows.some(r => r.FlightDate == null) && (
        <Note>Linhas com <i>null</i>: a associação gera LEFT OUTER JOIN, então conexões sem voo correspondente continuam no resultado.</Note>
      )}
    </LabCard>
  );
}
