import { useState } from 'react';
import { Button, CheckBox, Input, Option, Select } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/puzzle.js';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { Field, LabCard, Note, Row, Seg, Strip } from './common';

type Vis = 'PUBLIC' | 'PROTECTED' | 'PRIVATE';
type PKind = 'IMPORTING' | 'EXPORTING' | 'CHANGING' | 'RETURNING';
type Tab = 'attrs' | 'methods' | 'params';
type View = 'source' | 'includes';
interface Attr { n: string; level: 'inst' | 'static' | 'const'; vis: Vis; ro: boolean; t: string; v: string }
interface MParam { n: string; kind: PKind; t: string; def: string; opt: boolean; val: boolean }
interface Method { n: string; level: 'inst' | 'static'; vis: Vis; raising: string; params: MParam[] }
type Msg = ['erro' | 'aviso' | 'info', string];

const VIS: Vis[] = ['PUBLIC', 'PROTECTED', 'PRIVATE'];
const PKINDS: PKind[] = ['IMPORTING', 'EXPORTING', 'CHANGING', 'RETURNING'];
const VIS_LABEL: Record<Vis, string> = { PUBLIC: 'Public', PROTECTED: 'Protected', PRIVATE: 'Private' };

const ATTRS: Attr[] = [
  { n: 'c_max_seats', level: 'const', vis: 'PUBLIC', ro: false, t: 'i', v: '300' },
  { n: 'booking_count', level: 'static', vis: 'PUBLIC', ro: true, t: 'i', v: '' },
  { n: 'carrier_id', level: 'inst', vis: 'PRIVATE', ro: false, t: '/dmo/carrier_id', v: '' },
  { n: 'seats_free', level: 'inst', vis: 'PRIVATE', ro: false, t: 'i', v: '' },
];
const METHODS: Method[] = [
  { n: 'constructor', level: 'inst', vis: 'PUBLIC', raising: 'cx_abap_invalid_value', params: [{ n: 'i_carrier_id', kind: 'IMPORTING', t: '/dmo/carrier_id', def: '', opt: false, val: false }] },
  {
    n: 'book', level: 'inst', vis: 'PUBLIC', raising: '', params: [
      { n: 'i_seats', kind: 'IMPORTING', t: 'i', def: '1', opt: false, val: false },
      { n: 'r_ok', kind: 'RETURNING', t: 'abap_bool', def: '', opt: false, val: true },
    ],
  },
  { n: 'get_booking_count', level: 'static', vis: 'PUBLIC', raising: '', params: [{ n: 'r_count', kind: 'RETURNING', t: 'i', def: '', opt: false, val: true }] },
];

const ident = (s: string) => /^[a-z_/][a-z0-9_/~]*$/i.test(s.trim());
const low = (s: string) => s.trim().toLowerCase();
const list = (s: string) => s.split(/[,\s]+/).map(low).filter(Boolean);

function check(name: string, create: Vis, fin: boolean, abs: boolean, A: Attr[], M: Method[]): Msg[] {
  const m: Msg[] = [];
  if (!/^[zy]/i.test(name)) m.push(['erro', 'Classes do cliente precisam começar com Z ou Y.']);
  else if (!/^[zy]cl_/i.test(name)) m.push(['aviso', 'Convenção: classes globais começam com ZCL_ (ZIF_ para interfaces, ZCX_ para exceções).']);
  if (name.length > 30) m.push(['erro', `Nome com ${name.length} caracteres: o limite para classes globais é 30.`]);
  if (abs && fin) m.push(['aviso', 'ABSTRACT com FINAL: a classe não pode ser instanciada nem herdada. Só os componentes estáticos ficam utilizáveis.']);
  const all = [...A.map(a => low(a.n)), ...M.map(x => low(x.n))];
  A.forEach((a, i) => {
    if (!ident(a.n)) m.push(['erro', `Atributo “${a.n}” com nome inválido.`]);
    else if (all.indexOf(low(a.n)) !== i) m.push(['erro', `Componente ${low(a.n)} duplicado: atributos e métodos dividem o mesmo espaço de nomes.`]);
    if (!a.t.trim()) m.push(['erro', `Atributo ${low(a.n)}: informe o tipo.`]);
    if (a.level === 'const' && !a.v.trim()) m.push(['erro', `Constante ${low(a.n)}: informe o valor inicial.`]);
    if (a.ro && a.level !== 'const' && a.vis !== 'PUBLIC') m.push(['erro', `Atributo ${low(a.n)}: READ-ONLY só é permitido na PUBLIC SECTION.`]);
  });
  M.forEach((x, i) => {
    const n = low(x.n);
    if (!ident(x.n)) m.push(['erro', `Método “${x.n}” com nome inválido.`]);
    else if (all.indexOf(n) !== A.length + i) m.push(['erro', `Componente ${n} duplicado.`]);
    if (n === 'constructor') {
      if (x.level === 'static') m.push(['erro', 'CONSTRUCTOR é sempre um método de instância. O construtor estático se chama CLASS_CONSTRUCTOR.']);
      if (x.params.some(p => p.kind !== 'IMPORTING')) m.push(['erro', 'O construtor aceita apenas parâmetros IMPORTING (e exceções em RAISING).']);
      if (x.vis !== 'PUBLIC') m.push(['aviso', 'No Class Builder o construtor fica na PUBLIC SECTION. Quem restringe a criação de objetos é a opção de instanciação (CREATE …).']);
    }
    if (n === 'class_constructor' && (x.level !== 'static' || x.vis !== 'PUBLIC' || x.params.length || x.raising.trim())) m.push(['erro', 'CLASS_CONSTRUCTOR precisa ser estático, público, sem parâmetros e sem exceções.']);
    if (x.params.filter(p => p.kind === 'RETURNING').length > 1) m.push(['erro', `Método ${n}: só é permitido um parâmetro RETURNING.`]);
    x.params.forEach((p, k) => {
      if (!ident(p.n)) m.push(['erro', `Método ${n}: parâmetro “${p.n}” com nome inválido.`]);
      else if (x.params.findIndex(q => low(q.n) === low(p.n)) !== k) m.push(['erro', `Método ${n}: parâmetro ${low(p.n)} duplicado.`]);
      if (!p.t.trim()) m.push(['erro', `Método ${n}: informe o tipo de ${low(p.n)}.`]);
    });
  });
  if (create !== 'PUBLIC' && !M.some(x => x.level === 'static' && low(x.n) !== 'class_constructor')) {
    m.push(['info', `CREATE ${create}: código externo não consegue usar NEW. Acrescente um método estático de fábrica que devolva a instância.`]);
  }
  return m;
}

function declAttr(a: Attr) {
  const kw = a.level === 'const' ? 'CONSTANTS' : a.level === 'static' ? 'CLASS-DATA' : 'DATA';
  const val = a.v.trim() ? ` VALUE ${a.v.trim()}` : '';
  const ro = a.ro && a.level !== 'const' ? ' READ-ONLY' : '';
  return `    ${kw} ${low(a.n)} TYPE ${low(a.t) || '?'}${val}${ro} .`;
}

function declMethod(x: Method) {
  const L = [`    ${x.level === 'static' ? 'CLASS-METHODS' : 'METHODS'} ${low(x.n)}`];
  for (const k of PKINDS) {
    const ps = x.params.filter(p => p.kind === k && ident(p.n));
    if (!ps.length) continue;
    L.push(`      ${k}`);
    for (const p of ps) {
      const byVal = p.val || k === 'RETURNING';
      const tail = k === 'IMPORTING' || k === 'CHANGING' ? (p.def.trim() ? ` DEFAULT ${p.def.trim()}` : p.opt ? ' OPTIONAL' : '') : '';
      L.push(`        ${byVal ? `VALUE(${low(p.n)})` : `!${low(p.n)}`} TYPE ${low(p.t) || '?'}${tail}`);
    }
  }
  const ex = list(x.raising);
  if (ex.length) {
    L.push('      RAISING');
    ex.forEach(e => L.push(`        ${e}`));
  }
  L[L.length - 1] += ' .';
  return L.join('\n');
}

function source(name: string, create: Vis, fin: boolean, abs: boolean, sup: string, intf: string, A: Attr[], M: Method[]) {
  const n = low(name);
  const head = [`CLASS ${n} DEFINITION`, '  PUBLIC'];
  if (sup.trim()) head.push(`  INHERITING FROM ${low(sup)}`);
  if (abs) head.push('  ABSTRACT');
  if (fin) head.push('  FINAL');
  head.push(`  CREATE ${create} .`);
  const L = [...head, ''];
  for (const v of VIS) {
    L.push(`  ${v} SECTION.`);
    const body: string[] = [];
    if (v === 'PUBLIC') list(intf).forEach(i => body.push(`    INTERFACES ${i} .`));
    if (body.length) body.push('');
    A.filter(a => a.vis === v && ident(a.n)).forEach(a => body.push(declAttr(a)));
    const ms = M.filter(x => x.vis === v && ident(x.n));
    if (ms.length && body.length && body[body.length - 1] !== '') body.push('');
    ms.forEach(x => body.push(declMethod(x)));
    if (body.length) L.push('', ...body);
  }
  L.push('ENDCLASS.', '', '', '', `CLASS ${n} IMPLEMENTATION.`);
  // O Class Builder grava os métodos em ordem alfabética, um include por método.
  [...M].filter(x => ident(x.n)).sort((a, b) => low(a.n).localeCompare(low(b.n))).forEach(x => L.push('', '', `  METHOD ${low(x.n)}.`, '  ENDMETHOD.'));
  L.push('ENDCLASS.');
  return L.join('\n');
}

function includes(name: string, M: Method[]) {
  const base = name.trim().toUpperCase().padEnd(30, '=');
  const rows = [
    { inc: `${base}CP`, what: 'Class pool: programa principal que reúne todos os includes', adt: 'Global Class' },
    { inc: `${base}CU`, what: 'PUBLIC SECTION', adt: 'Global Class' },
    { inc: `${base}CO`, what: 'PROTECTED SECTION', adt: 'Global Class' },
    { inc: `${base}CI`, what: 'PRIVATE SECTION', adt: 'Global Class' },
    ...[...M].filter(x => ident(x.n)).map((x, i) => ({ inc: `${base}CM${String(i + 1).padStart(3, '0')}`, what: `METHOD ${low(x.n)} … ENDMETHOD`, adt: 'Global Class' })),
    { inc: `${base}CCDEF`, what: 'Definições locais que a parte privada da classe precisa enxergar', adt: 'Class-relevant Local Types' },
    { inc: `${base}CCIMP`, what: 'Classes e tipos locais auxiliares', adt: 'Local Types' },
    { inc: `${base}CCMAC`, what: 'Macros locais', adt: 'Macros' },
    { inc: `${base}CCAU`, what: 'Classes de teste ABAP Unit', adt: 'Test Classes' },
  ];
  return rows.map(r => ({ inc: r.inc, what: r.what, adt: r.adt }));
}

/** Simula o Class Builder (SE24, modo baseado em formulário) e mostra a classe gerada. */
export default function ClassBuilder() {
  const [name, setName] = useState('ZCL_FLIGHT_BOOKING');
  const [create, setCreate] = useState<Vis>('PUBLIC');
  const [fin, setFin] = useState(true);
  const [abs, setAbs] = useState(false);
  const [sup, setSup] = useState('');
  const [intf, setIntf] = useState('');
  const [A, setA] = useState<Attr[]>(ATTRS);
  const [M, setM] = useState<Method[]>(METHODS);
  const [tab, setTab] = useState<Tab>('attrs');
  const [cur, setCur] = useState(1);
  const [view, setView] = useState<View>('source');

  const updA = (i: number, patch: Partial<Attr>) => setA(as => as.map((a, k) => (k === i ? { ...a, ...patch } : a)));
  const updM = (i: number, patch: Partial<Method>) => setM(ms => ms.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const sel = Math.min(cur, M.length - 1);
  const method = M[sel];
  const updP = (i: number, patch: Partial<MParam>) => updM(sel, { params: method.params.map((p, k) => (k === i ? { ...p, ...patch } : p)) });

  const msgs = check(name.trim(), create, fin, abs, A, M);
  const errors = msgs.filter(x => x[0] === 'erro').length;
  const colsA = 'minmax(8rem,1.3fr) 8.5rem 7.5rem 5.5rem minmax(8rem,1.3fr) minmax(6rem,1fr) 2.5rem';
  const colsM = 'minmax(9rem,1.3fr) 8.5rem 7.5rem minmax(10rem,1.6fr) 6.5rem 2.5rem';
  const colsP = 'minmax(8rem,1.3fr) 8.5rem minmax(8rem,1.3fr) minmax(6rem,1fr) 5rem 5.5rem 2.5rem';

  return (
    <LabCard title="Simulador do Class Builder" subtitle="Preencha as abas como na SE24 e veja a classe global que o sistema gera" icon="puzzle">
      <Row>
        <Field label="Classe" htmlFor="cb-n" width="15rem"><Input id="cb-n" className="mono" maxlength={34} value={name} onInput={e => setName(e.target.value)} /></Field>
        <Field label="Instanciação" htmlFor="cb-c" width="9rem">
          <Select id="cb-c" value={create} onChange={e => setCreate(e.target.value as Vis)}>
            {VIS.map(v => <Option key={v} value={v}>{VIS_LABEL[v]}</Option>)}
          </Select>
        </Field>
        <Field label="Superclasse (opcional)" htmlFor="cb-s" width="13rem"><Input id="cb-s" className="mono" value={sup} placeholder="zcl_…" onInput={e => setSup(e.target.value)} /></Field>
        <Field label="Interfaces (separadas por vírgula)" htmlFor="cb-i" grow><Input id="cb-i" className="mono" value={intf} placeholder="if_oo_adt_classrun" onInput={e => setIntf(e.target.value)} /></Field>
      </Row>
      <div className="lab-row checks">
        <CheckBox text="Final" checked={fin} onChange={e => setFin(e.target.checked)} />
        <CheckBox text="Abstract" checked={abs} onChange={e => setAbs(e.target.checked)} />
      </div>

      <Seg<Tab> label="Abas do Class Builder" value={tab} onChange={setTab} options={[['attrs', `Attributes (${A.length})`], ['methods', `Methods (${M.length})`], ['params', 'Parameters']]} />

      {tab === 'attrs' && (
        <>
          <div className="frows" role="table" aria-label="Atributos">
            <div className="prow frow-head" role="row" style={{ gridTemplateColumns: colsA }}>
              <span role="columnheader">Atributo</span><span role="columnheader">Nível</span><span role="columnheader">Visibilidade</span><span role="columnheader">Read-only</span><span role="columnheader">Tipo associado</span><span role="columnheader">Valor inicial</span><span />
            </div>
            {A.map((a, i) => (
              <div className="prow" role="row" key={i} style={{ gridTemplateColumns: colsA }}>
                <Input className="mono" value={a.n} accessibleName="Nome do atributo" onInput={e => updA(i, { n: e.target.value })} />
                <Select value={a.level} accessibleName="Nível" onChange={e => updA(i, { level: e.target.value as Attr['level'] })}>
                  <Option value="inst">Instance</Option>
                  <Option value="static">Static</Option>
                  <Option value="const">Constant</Option>
                </Select>
                <Select value={a.vis} accessibleName="Visibilidade" onChange={e => updA(i, { vis: e.target.value as Vis })}>
                  {VIS.map(v => <Option key={v} value={v}>{VIS_LABEL[v]}</Option>)}
                </Select>
                <CheckBox checked={a.ro && a.level !== 'const'} disabled={a.level === 'const'} accessibleName="Read-only" onChange={e => updA(i, { ro: e.target.checked })} />
                <Input className="mono" value={a.t} accessibleName="Tipo associado" onInput={e => updA(i, { t: e.target.value })} />
                <Input className="mono" value={a.v} accessibleName="Valor inicial" onInput={e => updA(i, { v: e.target.value })} />
                <Button design="Transparent" icon="delete" tooltip="Remover atributo" accessibleName="Remover atributo" onClick={() => setA(as => as.filter((_, k) => k !== i))} />
              </div>
            ))}
          </div>
          <div><Button icon="add" onClick={() => setA(as => [...as, { n: `novo_atributo_${as.length + 1}`, level: 'inst', vis: 'PRIVATE', ro: false, t: 'string', v: '' }])}>Adicionar atributo</Button></div>
        </>
      )}

      {tab === 'methods' && (
        <>
          <div className="frows" role="table" aria-label="Métodos">
            <div className="prow frow-head" role="row" style={{ gridTemplateColumns: colsM }}>
              <span role="columnheader">Método</span><span role="columnheader">Nível</span><span role="columnheader">Visibilidade</span><span role="columnheader">Exceções (RAISING)</span><span role="columnheader">Parâmetros</span><span />
            </div>
            {M.map((x, i) => (
              <div className="prow" role="row" key={i} style={{ gridTemplateColumns: colsM }}>
                <Input className="mono" value={x.n} accessibleName="Nome do método" onInput={e => updM(i, { n: e.target.value })} />
                <Select value={x.level} accessibleName="Nível" onChange={e => updM(i, { level: e.target.value as Method['level'] })}>
                  <Option value="inst">Instance</Option>
                  <Option value="static">Static</Option>
                </Select>
                <Select value={x.vis} accessibleName="Visibilidade" onChange={e => updM(i, { vis: e.target.value as Vis })}>
                  {VIS.map(v => <Option key={v} value={v}>{VIS_LABEL[v]}</Option>)}
                </Select>
                <Input className="mono" value={x.raising} placeholder="cx_…" accessibleName="Exceções" onInput={e => updM(i, { raising: e.target.value })} />
                <Button design="Transparent" onClick={() => { setCur(i); setTab('params'); }}>{x.params.length} · editar</Button>
                <Button design="Transparent" icon="delete" tooltip="Remover método" accessibleName="Remover método" disabled={M.length === 1} onClick={() => setM(ms => ms.filter((_, k) => k !== i))} />
              </div>
            ))}
          </div>
          <div><Button icon="add" onClick={() => setM(ms => [...ms, { n: `novo_metodo_${ms.length + 1}`, level: 'inst', vis: 'PUBLIC', raising: '', params: [] }])}>Adicionar método</Button></div>
        </>
      )}

      {tab === 'params' && method && (
        <>
          <Row>
            <Field label="Parâmetros do método" htmlFor="cb-m" width="18rem">
              <Select id="cb-m" value={String(sel)} onChange={e => setCur(Number(e.target.value))}>
                {M.map((x, i) => <Option key={i} value={String(i)}>{low(x.n) || `método ${i + 1}`}</Option>)}
              </Select>
            </Field>
          </Row>
          <div className="frows" role="table" aria-label="Parâmetros">
            <div className="prow frow-head" role="row" style={{ gridTemplateColumns: colsP }}>
              <span role="columnheader">Parâmetro</span><span role="columnheader">Tipo</span><span role="columnheader">Tipo associado</span><span role="columnheader">Valor padrão</span><span role="columnheader">Opcional</span><span role="columnheader">Por valor</span><span />
            </div>
            {method.params.map((p, i) => {
              const input = p.kind === 'IMPORTING' || p.kind === 'CHANGING';
              return (
                <div className="prow" role="row" key={i} style={{ gridTemplateColumns: colsP }}>
                  <Input className="mono" value={p.n} accessibleName="Nome do parâmetro" onInput={e => updP(i, { n: e.target.value })} />
                  <Select value={p.kind} accessibleName="Tipo de parâmetro" onChange={e => updP(i, { kind: e.target.value as PKind })}>
                    {PKINDS.map(k => <Option key={k} value={k}>{k[0] + k.slice(1).toLowerCase()}</Option>)}
                  </Select>
                  <Input className="mono" value={p.t} accessibleName="Tipo associado" onInput={e => updP(i, { t: e.target.value })} />
                  <Input className="mono" value={input ? p.def : ''} disabled={!input} accessibleName="Valor padrão" onInput={e => updP(i, { def: e.target.value })} />
                  <CheckBox checked={input && (p.opt || !!p.def.trim())} disabled={!input || !!p.def.trim()} accessibleName="Opcional" onChange={e => updP(i, { opt: e.target.checked })} />
                  <CheckBox checked={p.val || p.kind === 'RETURNING'} disabled={p.kind === 'RETURNING'} accessibleName="Passagem por valor" onChange={e => updP(i, { val: e.target.checked })} />
                  <Button design="Transparent" icon="delete" tooltip="Remover parâmetro" accessibleName="Remover parâmetro" onClick={() => updM(sel, { params: method.params.filter((_, k) => k !== i) })} />
                </div>
              );
            })}
            {method.params.length === 0 && <Note>Este método não tem parâmetros.</Note>}
          </div>
          <div><Button icon="add" onClick={() => updM(sel, { params: [...method.params, { n: `i_param_${method.params.length + 1}`, kind: 'IMPORTING', t: 'string', def: '', opt: false, val: false }] })}>Adicionar parâmetro</Button></div>
        </>
      )}

      <div className="stack">
        {msgs.map((x, i) => <Strip key={i} kind={x[0]}>{x[1]}</Strip>)}
        {errors === 0 && <Strip kind="sucesso">Sem erros: a classe pode ser ativada.</Strip>}
      </div>

      <Seg<View> label="Resultado" value={view} onChange={setView} options={[['source', 'Código-fonte da classe'], ['includes', 'Includes do class pool']]} />
      {view === 'source' ? (
        <>
          <CodeBlock code={source(name, create, fin, abs, sup, intf, A, M)} title={name.trim().toUpperCase()} />
          <Note>É este texto que o ADT e o botão “Source Code-Based” da SE24 mostram. O “!” antes do nome do parâmetro é o caractere de escape que o gerador sempre escreve; ele evita conflito com palavras da linguagem.</Note>
        </>
      ) : (
        <>
          <DataTable
            accessibleName="Includes do class pool"
            columns={[{ key: 'inc', label: 'Include', mono: true, minWidth: '19rem' }, { key: 'what', label: 'Conteúdo' }, { key: 'adt', label: 'Aba no ADT' }]}
            rows={includes(name, M)}
          />
          <Note>Uma classe global é um programa do tipo class pool, dividido em includes. O nome é completado com “=” até 30 caracteres, seguido do sufixo. Você não edita esses includes direto: o Class Builder e o ADT cuidam disso.</Note>
        </>
      )}
    </LabCard>
  );
}
