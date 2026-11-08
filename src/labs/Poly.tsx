import { useState, type ReactNode } from 'react';
import { Button, Option, Select } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/create.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { Field, fmtNum, LabCard, Row, Strip } from './common';

interface Plane { t: 'cargo' | 'pax'; name: string; v: number }
const NAMES = ['D-ABYT', 'PP-XTA', 'N123UA', 'JA731J', 'D-AIXP', '9V-SKA'];

/** Tipo estático x tipo dinâmico, CAST e IS INSTANCE OF. */
export default function Poly() {
  const [planes, setPlanes] = useState<Plane[]>([{ t: 'cargo', name: 'D-ABUK', v: 50000 }, { t: 'pax', name: 'D-AIMA', v: 509 }]);
  const [seq, setSeq] = useState(0);
  const [sel, setSel] = useState(0);
  const [out, setOut] = useState<{ kind: 'sucesso' | 'erro' | 'info'; body: ReactNode } | null>(null);

  const add = (t: Plane['t']) => {
    const s = seq + 1;
    setSeq(s);
    setPlanes(p => [...p, { t, name: NAMES[seq % 6], v: t === 'cargo' ? 20000 + ((s * 7919) % 80) * 1000 : 150 + ((s * 37) % 300) }]);
    setOut(null);
  };
  const p = planes[sel];
  const ap = planes
    .map(x => (x.t === 'cargo' ? `APPEND NEW lcl_cargo_plane( name = '${x.name}' cargo_kg = ${x.v} ) TO planes.` : `APPEND NEW lcl_passenger_plane( name = '${x.name}' seats = ${x.v} ) TO planes.`))
    .join('\n');

  return (
    <LabCard title="Uma referência, vários comportamentos" subtitle="DATA planes TYPE TABLE OF REF TO lcl_plane" icon="puzzle">
      <Row>
        <Button icon="create" onClick={() => add('cargo')}>Cargueiro</Button>
        <Button icon="create" onClick={() => add('pax')}>Passageiros</Button>
        <Button design="Transparent" icon="decline" onClick={() => { setPlanes([]); setSel(0); setOut(null); }}>Limpar</Button>
      </Row>
      <CodeBlock
        title="Programa"
        code={`${ap || '" tabela vazia'}\n\nLOOP AT planes INTO DATA(plane).\n  " plane é REF TO lcl_plane: o método executado depende do objeto\n  out->write( plane->get_attributes( ) ).\nENDLOOP.`}
      />
      <DataTable
        columns={[{ key: 'i', label: '#', align: 'End', width: '3rem' }, { key: 's', label: 'Tipo estático', mono: true }, { key: 'd', label: 'Tipo dinâmico', mono: true }, { key: 'r', label: 'get_attributes( ) retorna' }]}
        rows={planes.map((x, i) => ({
          i: i + 1,
          s: 'REF TO lcl_plane',
          d: x.t === 'cargo' ? 'lcl_cargo_plane' : 'lcl_passenger_plane',
          r: x.t === 'cargo' ? `${x.name}: cargueiro, ${fmtNum(x.v)} kg` : `${x.name}: ${x.v} assentos`,
        }))}
      />
      <Row>
        <Field label="Linha" htmlFor="po-i" width="10rem">
          <Select id="po-i" value={String(sel)} disabled={!planes.length} onChange={e => { setSel(+e.target.value); setOut(null); }}>
            {planes.map((x, i) => <Option key={i} value={String(i)}>{`${i + 1} · ${x.name}`}</Option>)}
          </Select>
        </Field>
        <Button disabled={!p} onClick={() => p && setOut(p.t === 'cargo'
          ? { kind: 'sucesso', body: <>Downcast funcionou: agora você acessa <code className="md-code">cargo-&gt;cargo_kg</code> = {fmtNum(p.v)}.</> }
          : { kind: 'erro', body: <><b>CX_SY_MOVE_CAST_ERROR</b>: o objeto é um lcl_passenger_plane, não um lcl_cargo_plane.</> })}>
          CAST lcl_cargo_plane( plane )
        </Button>
        <Button disabled={!p} onClick={() => p && setOut({ kind: p.t === 'cargo' ? 'sucesso' : 'info', body: <><code className="md-code">IF plane IS INSTANCE OF lcl_cargo_plane.</code> → <b>{p.t === 'cargo' ? 'verdadeiro' : 'falso'}</b>. Verifique antes de fazer o CAST e evite a exceção.</> })}>
          IS INSTANCE OF lcl_cargo_plane
        </Button>
      </Row>
      {out && <Strip kind={out.kind}>{out.body}</Strip>}
    </LabCard>
  );
}
