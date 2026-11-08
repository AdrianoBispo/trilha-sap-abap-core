import { useState } from 'react';
import { Avatar, Button, Input, Label } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/table-view.js';
import '@ui5/webcomponents-icons/dist/detail-view.js';
import '@ui5/webcomponents-icons/dist/workflow-tasks.js';
import '@ui5/webcomponents-icons/dist/show.js';
import '@ui5/webcomponents-icons/dist/org-chart.js';
import '@ui5/webcomponents-icons/dist/cloud.js';
import '@ui5/webcomponents-icons/dist/nav-back.js';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { LabCard, StatusTag } from './common';

type AvatarScheme = 'Accent1' | 'Accent2' | 'Accent3' | 'Accent4' | 'Accent5' | 'Accent6' | 'Accent7' | 'Accent8' | 'Accent9' | 'Accent10';
interface Layer { n: string; a: string; ic: string; col: AvatarScheme; d: string; lang?: string; code?: string; preview?: boolean }

const L: Layer[] = [
  { n: 'Tabela de banco', a: 'ZRAP_TRAVEL', ic: 'table-view', col: 'Accent7', d: 'Persistência. Guarda os dados ativos do business object.', lang: 'ddl', code: `define table zrap_travel {\n  key client      : abap.clnt not null;\n  key travel_uuid : sysuuid_x16 not null;\n  travel_id       : /dmo/travel_id;\n  description     : /dmo/description;\n  @Semantics.amount.currencyCode : 'zrap_travel.currency_code'\n  total_price     : /dmo/total_price;\n  currency_code   : /dmo/currency_code;\n  status          : /dmo/travel_status;\n  local_last_changed_at : abp_locinst_lastchange_tstmpl;\n}` },
  { n: 'CDS raiz (modelo)', a: 'ZR_Travel', ic: 'detail-view', col: 'Accent6', d: 'Modelo de dados do BO com nomes semânticos. "root" marca a entidade raiz.', lang: 'cds', code: `define root view entity ZR_Travel\n  as select from zrap_travel\n{\n  key travel_uuid   as TravelUUID,\n      travel_id     as TravelId,\n      description   as Description,\n      @Semantics.amount.currencyCode: 'CurrencyCode'\n      total_price   as TotalPrice,\n      currency_code as CurrencyCode,\n      status        as Status,\n      local_last_changed_at as LocalLastChanged\n}` },
  { n: 'Comportamento', a: 'ZR_Travel (BDEF) + ZBP_R_TRAVEL', ic: 'workflow-tasks', col: 'Accent5', d: 'Operações, validações, determinações e ações. A lógica fica na classe de comportamento (behavior pool).', lang: 'bdl', code: `managed implementation in class zbp_r_travel unique;\nstrict ( 2 );\n\ndefine behavior for ZR_Travel alias Travel\npersistent table zrap_travel\nlock master\nauthorization master ( instance )\netag master LocalLastChanged\n{\n  create; update; delete;\n  validation validateStatus on save { create; field Status; }\n  action acceptTravel result [1] $self;\n}` },
  { n: 'Projeção', a: 'ZC_Travel', ic: 'show', col: 'Accent4', d: 'Recorte do modelo para um caso de uso específico, com anotações de UI e o que é exposto.', lang: 'cds', code: `@Metadata.allowExtensions: true\ndefine root view entity ZC_Travel\n  provider contract transactional_query\n  as projection on ZR_Travel\n{\n  key TravelUUID,\n      TravelId,\n      Description,\n      TotalPrice,\n      CurrencyCode,\n      Status\n}` },
  { n: 'Service definition', a: 'ZUI_TRAVEL', ic: 'org-chart', col: 'Accent1', d: 'Escolhe as entidades que o serviço expõe, sem dizer o protocolo.', lang: 'cds', code: `@EndUserText.label: 'Serviço de viagens'\ndefine service ZUI_TRAVEL {\n  expose ZC_Travel as Travel;\n}` },
  { n: 'Service binding', a: 'ZUI_TRAVEL_O4', ic: 'cloud', col: 'Accent8', d: 'Liga o serviço a um protocolo: OData V4, tipo UI. Depois de publicar, o botão Preview abre o app Fiori Elements.', preview: true },
];

const TRAVELS = [
  { id: '00000001', d: 'Congresso em Lisboa', p: '2.450,00 EUR', s: 'Aceita' },
  { id: '00000002', d: 'Feira em Frankfurt', p: '3.120,00 EUR', s: 'Aberta' },
  { id: '00000003', d: 'Visita a cliente', p: '980,00 EUR', s: 'Aberta' },
];

/** Camadas de uma aplicação RAP, da tabela ao app Fiori Elements. */
export default function Rap() {
  const [cur, setCur] = useState(0);
  const x = L[cur];
  return (
    <LabCard title="Da tabela ao navegador" subtitle="Clique nas camadas, de baixo para cima no modelo" icon="overview-chart">
      <div className="split split-rap">
        <div className="layers" role="tablist" aria-label="Camadas RAP">
          {L.map((l, i) => (
            <button key={l.n} role="tab" aria-selected={i === cur} className={`layer${i === cur ? ' on' : ''}`} onClick={() => setCur(i)}>
              <Avatar size="XS" icon={l.ic} colorScheme={l.col} />
              <span><b>{l.n}</b><small>{l.a}</small></span>
            </button>
          ))}
        </div>
        <div className="layer-detail">
          <p>{x.d}</p>
          {x.preview ? (
            <>
              <dl className="md-terms">
                <dt>Tipo de binding</dt><dd>OData V4 · UI</dd>
                <dt>Service definition</dt><dd className="mono">ZUI_TRAVEL</dd>
                <dt>Entity set</dt><dd className="mono">Travel</dd>
                <dt>Status</dt><dd><StatusTag tipo="sucesso">Publicado</StatusTag></dd>
              </dl>
              <FioriPreview title="Viagens" filters={['Travel ID']}>
                <DataTable
                  columns={[{ key: 'id', label: 'Travel ID' }, { key: 'd', label: 'Descrição' }, { key: 'p', label: 'Preço', align: 'End' }, { key: 's', label: 'Status' }]}
                  rows={TRAVELS.map(t => ({ ...t, s: <StatusTag tipo={t.s === 'Aceita' ? 'sucesso' : 'aviso'}>{t.s}</StatusTag> }))}
                />
              </FioriPreview>
            </>
          ) : (
            <CodeBlock code={x.code!} title={x.a} lang={x.lang} />
          )}
        </div>
      </div>
    </LabCard>
  );
}

/** Mini “List Report” do Fiori Elements usado nas prévias. */
export function FioriPreview({ title, filters, count = 3, children }: { title: string; filters: string[]; count?: number; children: React.ReactNode }) {
  return (
    <div className="preview">
      <div className="mini-shell"><Avatar size="XS" icon="nav-back" colorScheme="Transparent" /> {title}<span className="mini-tag">Preview Fiori Elements</span></div>
      <div className="fio-bar">
        {filters.length ? (
          filters.map(f => (
            <div className="field" key={f} style={{ width: '9rem' }}>
              <Label showColon={false}>{f}</Label>
              <Input disabled accessibleName={f} />
            </div>
          ))
        ) : (
          <span className="note">Sem filtros: nenhum @UI.selectionField.</span>
        )}
        <Button design="Emphasized">Go</Button>
      </div>
      <div className="fio-list">
        <div className="fio-title">{title} ({count})</div>
        {children}
      </div>
    </div>
  );
}
