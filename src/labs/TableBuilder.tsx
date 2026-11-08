import { useState } from 'react';
import { Button, CheckBox, Input, Option, Select } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import CodeBlock from '../components/CodeBlock';
import { Field, LabCard, Row, Strip } from './common';

/** [tem tamanho, tem decimais] */
const TYPES: Record<string, [boolean, boolean]> = {
  'abap.clnt': [false, false], 'abap.char': [true, false], 'abap.numc': [true, false], 'abap.int4': [false, false],
  'abap.dec': [true, true], 'abap.curr': [true, true], 'abap.cuky': [false, false], 'abap.dats': [false, false],
  'abap.string': [false, false], sysuuid_x16: [false, false],
};
interface Fld { n: string; t: string; l: string; d: string; k: boolean }
const INIT: Fld[] = [
  { n: 'client', t: 'abap.clnt', l: '', d: '', k: true }, { n: 'travel_id', t: 'abap.numc', l: '8', d: '', k: true },
  { n: 'description', t: 'abap.char', l: '80', d: '', k: false }, { n: 'begin_date', t: 'abap.dats', l: '', d: '', k: false },
  { n: 'total_price', t: 'abap.curr', l: '16', d: '2', k: false }, { n: 'currency_code', t: 'abap.cuky', l: '', d: '', k: false },
];

function check(name: string, F: Fld[]): ['erro' | 'aviso', string][] {
  const msgs: ['erro' | 'aviso', string][] = [];
  if (!/^[zy]/.test(name)) msgs.push(['erro', 'O nome da tabela precisa começar com Z ou Y (namespace do cliente).']);
  if (name.length > 16) msgs.push(['erro', `Nome com ${name.length} caracteres: o limite para tabelas de banco é 16.`]);
  if (!/^[a-z][a-z0-9_]*$/.test(name)) msgs.push(['erro', 'Use apenas letras, dígitos e sublinhado, começando por letra.']);
  const names = F.map(f => f.n.trim().toLowerCase());
  F.forEach((f, i) => {
    const n = names[i];
    if (!/^[a-z][a-z0-9_]*$/.test(n)) msgs.push(['erro', `Campo ${i + 1}: nome “${f.n}” inválido.`]);
    if (n.length > 30) msgs.push(['erro', `Campo ${n}: máximo de 30 caracteres.`]);
    if (names.indexOf(n) !== i) msgs.push(['erro', `Campo ${n} duplicado.`]);
    const [hl, hd] = TYPES[f.t];
    if (hl && !(+f.l > 0)) msgs.push(['erro', `Campo ${n}: informe o tamanho.`]);
    if (f.t === 'abap.char' && +f.l > 1333) msgs.push(['erro', `Campo ${n}: abap.char vai até 1333 em tabelas; use abap.string para textos longos.`]);
    if (hd && +f.d > +f.l) msgs.push(['erro', `Campo ${n}: decimais maiores que o tamanho.`]);
    if (f.t === 'abap.string' && f.k) msgs.push(['erro', `Campo ${n}: strings não podem ser chave.`]);
  });
  const firstNonKey = F.findIndex(f => !f.k);
  if (firstNonKey >= 0 && F.slice(firstNonKey).some(f => f.k)) msgs.push(['erro', 'Campos chave precisam vir antes dos demais campos.']);
  if (!F.some(f => f.k)) msgs.push(['erro', 'A tabela precisa de pelo menos um campo chave.']);
  if (F.some(f => f.t === 'abap.clnt') && !(F[0]?.t === 'abap.clnt' && F[0].k)) msgs.push(['aviso', 'O campo de mandante deve ser o primeiro campo chave.']);
  if (!F.some(f => f.t === 'abap.clnt')) msgs.push(['aviso', 'Sem campo abap.clnt a tabela é independente de mandante. Para dados de aplicação, inclua client como primeiro campo.']);
  if (F.some(f => f.t === 'abap.curr') && !F.some(f => f.t === 'abap.cuky')) msgs.push(['erro', 'Campos abap.curr precisam referenciar um campo abap.cuky de moeda.']);
  return msgs;
}

/** Edita os campos de uma tabela e gera o define table com verificações. */
export default function TableBuilder() {
  const [name, setName] = useState('ztravel_demo');
  const [dc, setDc] = useState('#A');
  const [F, setF] = useState<Fld[]>(INIT);

  const upd = (i: number, patch: Partial<Fld>) =>
    setF(fs => fs.map((f, k) => {
      if (k !== i) return f;
      const nf = { ...f, ...patch };
      if (patch.t) {
        const [a, b] = TYPES[nf.t];
        if (!a) nf.l = '';
        if (!b) nf.d = '';
        if (a && !nf.l) nf.l = nf.t === 'abap.char' ? '20' : nf.t === 'abap.numc' ? '8' : '16';
        if (b && !nf.d) nf.d = '2';
      }
      return nf;
    }));

  const lname = name.trim().toLowerCase();
  const msgs = check(lname, F);
  const cuky = F.find(f => f.t === 'abap.cuky');
  const w = Math.max(...F.map(f => f.n.length + (f.k ? 4 : 0)), 8);
  const typ = (f: Fld) => { const [a, b] = TYPES[f.t]; return f.t + (a ? `(${f.l || '?'}${b ? ',' + (f.d || '0') : ''})` : f.t === 'abap.string' ? '(0)' : ''); };
  let code = `@EndUserText.label : 'Tabela de estudo'\n@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE\n@AbapCatalog.tableCategory : #TRANSPARENT\n@AbapCatalog.deliveryClass : ${dc}\n@AbapCatalog.dataMaintenance : #RESTRICTED\ndefine table ${lname} {\n`;
  F.forEach(f => {
    if (f.t === 'abap.curr' && cuky) code += `  @Semantics.amount.currencyCode : '${lname}.${cuky.n}'\n`;
    code += `  ${((f.k ? 'key ' : '') + f.n).padEnd(w)} : ${typ(f)}${f.k ? ' not null' : ''};\n`;
  });
  code += '}';

  return (
    <LabCard title="Construtor de tabela" subtitle="Edite os campos; a definição e as verificações se atualizam" icon="create">
      <Row>
        <Field label="Nome da tabela" htmlFor="tb-n" width="14rem"><Input id="tb-n" className="mono" maxlength={20} value={name} onInput={e => setName(e.target.value)} /></Field>
        <Field label="Classe de entrega" htmlFor="tb-dc" width="13rem">
          <Select id="tb-dc" value={dc} onChange={e => setDc(e.target.value)}>
            <Option value="#A">#A aplicação</Option>
            <Option value="#C">#C customizing</Option>
            <Option value="#L">#L temporária</Option>
          </Select>
        </Field>
      </Row>
      <div className="frows" role="table" aria-label="Campos da tabela">
        <div className="frow frow-head" role="row">
          <span role="columnheader">Campo</span><span role="columnheader">Tipo</span><span role="columnheader">Tam.</span><span role="columnheader">Dec.</span><span role="columnheader">Chave</span><span />
        </div>
        {F.map((f, i) => {
          const [hl, hd] = TYPES[f.t];
          return (
            <div className="frow" role="row" key={i}>
              <Input className="mono" value={f.n} accessibleName={`Nome do campo ${i + 1}`} onInput={e => upd(i, { n: e.target.value })} />
              <Select value={f.t} accessibleName={`Tipo do campo ${i + 1}`} onChange={e => upd(i, { t: e.target.value })}>
                {Object.keys(TYPES).map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
              <Input className="mono" value={f.l} disabled={!hl} accessibleName="Tamanho" onInput={e => upd(i, { l: e.target.value })} />
              <Input className="mono" value={f.d} disabled={!hd} accessibleName="Decimais" onInput={e => upd(i, { d: e.target.value })} />
              <CheckBox checked={f.k} accessibleName="Campo chave" onChange={e => upd(i, { k: e.target.checked })} />
              <Button design="Transparent" icon="delete" tooltip="Remover campo" accessibleName="Remover campo" onClick={() => setF(fs => fs.filter((_, k) => k !== i))} />
            </div>
          );
        })}
      </div>
      <div>
        <Button icon="add" onClick={() => setF(fs => [...fs, { n: 'novo_campo_' + (fs.length + 1), t: 'abap.char', l: '20', d: '', k: false }])}>Adicionar campo</Button>
      </div>
      <div className="stack">
        {msgs.length ? msgs.map((m, i) => <Strip key={i} kind={m[0]}>{m[1]}</Strip>) : <Strip kind="sucesso">Sem erros: a tabela pode ser ativada.</Strip>}
      </div>
      <CodeBlock code={code} title={lname.toUpperCase()} lang="ddl" />
    </LabCard>
  );
}
