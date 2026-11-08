import { useState } from 'react';
import { CheckBox, StepInput } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { LabCard, StatusTag } from './common';
import { FioriPreview } from './Rap';

interface El { n: string; lbl: string; li: number; sf: number; on: boolean; sfon: boolean }
const INIT: El[] = [
  { n: 'TravelId', lbl: 'Viagem', li: 10, sf: 10, on: true, sfon: true },
  { n: 'AgencyId', lbl: 'Agência', li: 20, sf: 20, on: false, sfon: true },
  { n: 'Description', lbl: 'Descrição', li: 30, sf: 30, on: true, sfon: false },
  { n: 'BeginDate', lbl: 'Início', li: 40, sf: 40, on: true, sfon: false },
  { n: 'TotalPrice', lbl: 'Preço total', li: 50, sf: 50, on: false, sfon: false },
  { n: 'Status', lbl: 'Status', li: 60, sf: 60, on: true, sfon: true },
];
const DATA: Record<string, string>[] = [
  { TravelId: '00000001', AgencyId: '070001', Description: 'Congresso em Lisboa', BeginDate: '10.11.2026', TotalPrice: '2.450,00 EUR', Status: 'A' },
  { TravelId: '00000002', AgencyId: '070005', Description: 'Feira em Frankfurt', BeginDate: '18.11.2026', TotalPrice: '3.120,00 EUR', Status: 'O' },
  { TravelId: '00000003', AgencyId: '070012', Description: 'Visita a cliente em Recife', BeginDate: '02.12.2026', TotalPrice: '980,00 EUR', Status: 'X' },
  { TravelId: '00000004', AgencyId: '070001', Description: 'Treinamento em Walldorf', BeginDate: '12.01.2027', TotalPrice: '1.870,00 EUR', Status: 'O' },
];
const ST: Record<string, [string, string]> = { A: ['sucesso', 'Aceita'], O: ['aviso', 'Aberta'], X: ['erro', 'Recusada'] };

/** Metadata extension com @UI.lineItem e @UI.selectionField e prévia ao vivo. */
export default function UiLab() {
  const [E, setE] = useState(INIT);
  const upd = (i: number, p: Partial<El>) => setE(es => es.map((e, k) => (k === i ? { ...e, ...p } : e)));

  let c = `@Metadata.layer: #CUSTOMER\nannotate entity ZC_Travel with\n{`;
  E.forEach(e => {
    if (!e.on && !e.sfon) return;
    c += '\n';
    if (e.on) c += `  @UI.lineItem: [{ position: ${e.li} }]\n`;
    if (e.sfon) c += `  @UI.selectionField: [{ position: ${e.sf} }]\n`;
    c += `  ${e.n};\n`;
  });
  c += '}';
  const columns = E.filter(e => e.on).sort((a, b) => a.li - b.li);
  const filters = E.filter(e => e.sfon).sort((a, b) => a.sf - b.sf);

  return (
    <LabCard title="Metadata extension ao vivo" subtitle="annotate entity ZC_Travel" icon="show">
      <div className="split">
        <DataTable
          columns={[{ key: 'n', label: 'Elemento', mono: true }, { key: 'li', label: '@UI.lineItem' }, { key: 'p', label: 'position', width: '8rem' }, { key: 'sf', label: '@UI.selectionField' }]}
          rows={E.map((e, i) => ({
            n: e.n,
            li: <CheckBox checked={e.on} accessibleName={`lineItem ${e.n}`} onChange={ev => upd(i, { on: ev.target.checked })} />,
            p: <StepInput value={e.li} step={10} min={0} accessibleName={`posição ${e.n}`} onChange={ev => upd(i, { li: Math.trunc(ev.target.value) })} />,
            sf: <CheckBox checked={e.sfon} accessibleName={`selectionField ${e.n}`} onChange={ev => upd(i, { sfon: ev.target.checked })} />,
          }))}
        />
        <CodeBlock code={c} title="ZC_TRAVEL (DDLX)" lang="cds" />
      </div>
      <FioriPreview title="Viagens" filters={filters.map(f => f.lbl)} count={DATA.length}>
        {columns.length ? (
          <DataTable
            columns={columns.map(e => ({ key: e.n, label: e.lbl }))}
            rows={DATA.map(r => Object.fromEntries(columns.map(e => [e.n, e.n === 'Status' ? <StatusTag tipo={ST[r.Status][0]}>{ST[r.Status][1]}</StatusTag> : r[e.n]])))}
          />
        ) : (
          <div className="empty">A tabela não tem colunas. Marque @UI.lineItem em algum elemento.</div>
        )}
      </FioriPreview>
    </LabCard>
  );
}
