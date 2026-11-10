import { useState } from 'react';
import { Button, CheckBox, Input, Option, Select } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/fx.js';
import CodeBlock from '../components/CodeBlock';
import { Field, LabCard, Note, Row, Seg, Strip } from './common';

type Kind = 'IMPORTING' | 'EXPORTING' | 'CHANGING' | 'TABLES';
type Tab = Kind | 'EXCEPTIONS';
type Proc = 'normal' | 'rfc' | 'update';
type View = 'fm' | 'group' | 'call';
interface Param { kind: Kind; n: string; typing: 'TYPE' | 'LIKE'; t: string; def: string; opt: boolean; val: boolean }
interface Exc { n: string; txt: string }
type Msg = ['erro' | 'aviso' | 'info', string];

const KINDS: Kind[] = ['IMPORTING', 'EXPORTING', 'CHANGING', 'TABLES'];
const TAB_LABEL: Record<Tab, string> = { IMPORTING: 'Import', EXPORTING: 'Export', CHANGING: 'Changing', TABLES: 'Tables', EXCEPTIONS: 'Exceptions' };
const PREFIX: Record<Kind, string> = { IMPORTING: 'iv_', EXPORTING: 'ev_', CHANGING: 'cv_', TABLES: 'it_' };

const INIT: Param[] = [
  { kind: 'IMPORTING', n: 'iv_carrier_id', typing: 'TYPE', t: '/dmo/carrier_id', def: '', opt: false, val: true },
  { kind: 'IMPORTING', n: 'iv_connection_id', typing: 'TYPE', t: '/dmo/connection_id', def: '', opt: false, val: true },
  { kind: 'IMPORTING', n: 'iv_only_future', typing: 'TYPE', t: 'abap_bool', def: 'abap_true', opt: false, val: true },
  { kind: 'EXPORTING', n: 'ev_free_seats', typing: 'TYPE', t: 'i', def: '', opt: false, val: true },
];
const INIT_EXC: Exc[] = [{ n: 'flight_not_found', txt: 'Nenhum voo para a conexão' }];

const ident = (s: string) => /^[a-z_/][a-z0-9_/]*$/i.test(s.trim());
const up = (s: string) => s.trim().toUpperCase();
const low = (s: string) => s.trim().toLowerCase();

function check(group: string, name: string, proc: Proc, P: Param[], E: Exc[], excClass: boolean): Msg[] {
  const m: Msg[] = [];
  if (!/^[zy]/i.test(group)) m.push(['erro', 'O grupo de funções precisa começar com Z ou Y (namespace do cliente).']);
  if (group.length > 26) m.push(['erro', `Grupo com ${group.length} caracteres: o limite é 26.`]);
  if (!/^[zy]_/i.test(name)) m.push(['erro', 'O módulo de função precisa começar com Z_ ou Y_.']);
  if (name.length > 30) m.push(['erro', `Nome com ${name.length} caracteres: o limite para módulos de função é 30.`]);
  const names = P.map(p => low(p.n));
  P.forEach((p, i) => {
    if (!ident(p.n)) m.push(['erro', `${TAB_LABEL[p.kind]}: nome de parâmetro “${p.n}” inválido.`]);
    else if (names.indexOf(low(p.n)) !== i) m.push(['erro', `Parâmetro ${low(p.n)} duplicado: o nome precisa ser único em toda a interface.`]);
    if (!p.t.trim()) m.push(['erro', `Parâmetro ${low(p.n)}: informe o tipo associado.`]);
  });
  if (P.some(p => p.typing === 'LIKE')) m.push(['aviso', 'Tipagem com LIKE é aceita só por compatibilidade. Prefira TYPE com um tipo do Dictionary.']);
  if (P.some(p => p.kind === 'TABLES')) m.push(['aviso', 'Parâmetros TABLES são obsoletos: declare um tipo de tabela e use IMPORTING, EXPORTING ou CHANGING.']);
  const byRef = P.filter(p => p.kind !== 'TABLES' && !p.val);
  if (proc === 'rfc' && byRef.length) m.push(['erro', `Módulo RFC: ${byRef.map(p => low(p.n)).join(', ')} precisa de “Passagem por valor”. Não existe referência entre dois sistemas.`]);
  if (proc === 'update') {
    if (byRef.length) m.push(['erro', `Módulo de update: ${byRef.map(p => low(p.n)).join(', ')} precisa de “Passagem por valor”. Os dados são gravados para execução posterior.`]);
    if (P.some(p => p.kind === 'EXPORTING' || p.kind === 'CHANGING')) m.push(['aviso', 'Módulo de update só recebe dados (IMPORTING e TABLES). Parâmetros de saída são ignorados: ele roda depois, no work process de atualização.']);
    if (E.length) m.push(['aviso', 'Exceções de um módulo de update não chegam ao chamador. Um erro ali cancela a atualização e desfaz a LUW do banco.']);
  }
  if (proc === 'rfc' && excClass) m.push(['aviso', 'Em chamadas RFC trate também system_failure e communication_failure, que só existem como exceções clássicas.']);
  E.forEach((e, i) => {
    if (!ident(e.n)) m.push(['erro', `Exceção “${e.n}” com nome inválido.`]);
    else if (E.findIndex(x => low(x.n) === low(e.n)) !== i) m.push(['erro', `Exceção ${low(e.n)} duplicada.`]);
  });
  if (excClass && E.some(e => ident(e.n) && !/^[zy]?cx_/i.test(e.n.trim()))) m.push(['aviso', 'Com classes de exceção, a aba Exceptions lista classes (CX_…, ZCX_…), não nomes livres.']);
  return m;
}

/** Bloco de comentário da interface, como o Function Builder gera no include do módulo. */
function interfaceBlock(proc: Proc, P: Param[], E: Exc[], excClass: boolean) {
  const bar = '*"' + '-'.repeat(70);
  const L = [bar, proc === 'update' ? '*"*"Update Function Module:' : '*"*"Local Interface:'];
  for (const k of KINDS) {
    const ps = P.filter(p => p.kind === k && ident(p.n));
    if (!ps.length) continue;
    L.push(`*"  ${k}`);
    for (const p of ps) {
      const tail = p.def.trim() && k !== 'EXPORTING' && k !== 'TABLES' ? ` DEFAULT ${p.def.trim().toUpperCase()}` : p.opt && k !== 'EXPORTING' ? ' OPTIONAL' : '';
      if (k === 'TABLES') L.push(`*"      ${up(p.n)} ${p.typing === 'LIKE' ? 'LIKE' : 'STRUCTURE'}  ${up(p.t) || '?'}${p.opt ? ' OPTIONAL' : ''}`);
      else L.push(`*"     ${p.val ? 'VALUE' : 'REFERENCE'}(${up(p.n)}) ${p.typing}  ${up(p.t) || '?'}${tail}`);
    }
  }
  const es = E.filter(e => ident(e.n));
  if (es.length) {
    L.push(`*"  ${excClass ? 'RAISING' : 'EXCEPTIONS'}`);
    es.forEach(e => L.push(`*"      ${up(e.n)}`));
  }
  L.push(bar);
  return L.join('\n');
}

function fmCode(name: string, proc: Proc, P: Param[], E: Exc[], excClass: boolean) {
  const e0 = E.find(e => ident(e.n));
  const raise = !e0 ? '' : excClass
    ? `\n  " Para sinalizar um erro ao chamador:\n  " RAISE EXCEPTION NEW ${low(e0.n)}( ).`
    : `\n  " Para sinalizar um erro ao chamador (vira sy-subrc na chamada):\n  " RAISE ${low(e0.n)}.`;
  return `FUNCTION ${low(name)}.\n${interfaceBlock(proc, P, E, excClass)}\n\n  " A lógica do módulo entra aqui. O bloco acima é só um comentário\n  " gerado pelo Function Builder: a interface real fica nas abas.${raise}\n\nENDFUNCTION.`;
}

function groupCode(group: string, name: string) {
  const g = up(group);
  const pad = (s: string) => s.padEnd(Math.max(30, g.length + 13));
  return [
    `* Programa principal do grupo de funções: SAPL${g}`,
    `${pad(`INCLUDE l${low(group)}top.`)}" Declarações globais`,
    `${pad(`INCLUDE l${low(group)}uxx.`)}" Módulos de função`,
    `${pad(`* INCLUDE l${low(group)}f01.`)}" Sub-rotinas (opcional)`,
    '',
    `* Include L${g}TOP: dados globais, visíveis a todos os módulos do grupo`,
    `FUNCTION-POOL ${low(group)}.`,
    '',
    `* Include L${g}UXX: mantido pelo sistema, um INCLUDE por módulo`,
    `${pad(`INCLUDE l${low(group)}u01.`)}" ${up(name)}`,
  ].join('\n');
}

function callCode(name: string, proc: Proc, P: Param[], E: Exc[], excClass: boolean) {
  const ok = P.filter(p => ident(p.n));
  const w = Math.max(6, ...ok.map(p => p.n.trim().length), ...(excClass ? [] : E.map(e => e.n.trim().length)), proc === 'rfc' ? 21 : 0);
  const line = (p: Param, kind: Kind) => {
    // Para o chamador, toda saída do módulo é opcional; entradas, só as marcadas ou com valor padrão.
    const optional = kind === 'EXPORTING' || p.opt || (kind !== 'TABLES' && !!p.def.trim());
    return `${optional ? '*' : ' '}   ${low(p.n).padEnd(w)} =`;
  };
  // Na chamada os papéis se invertem: o que o módulo importa, o chamador exporta.
  const blocks: [string, Kind][] = [['EXPORTING', 'IMPORTING'], ['IMPORTING', 'EXPORTING'], ['CHANGING', 'CHANGING'], ['TABLES', 'TABLES']];
  const L: string[] = [];
  const suffix = proc === 'rfc' ? " DESTINATION 'DESTINO_RFC'" : proc === 'update' ? ' IN UPDATE TASK' : '';
  L.push(`CALL FUNCTION '${up(name)}'${suffix}`);
  for (const [callKw, kind] of blocks) {
    if (proc === 'update' && (kind === 'EXPORTING' || kind === 'CHANGING')) continue;
    const ps = ok.filter(p => p.kind === kind);
    if (!ps.length) continue;
    L.push(`  ${callKw}`);
    ps.forEach(p => L.push(line(p, kind)));
  }
  const es = E.filter(e => ident(e.n));
  if (proc === 'update') {
    L.push('  .', '', '" Nada é executado ainda: a chamada fica registrada na SAP LUW.', 'COMMIT WORK.   " dispara os módulos de update registrados');
    return L.join('\n');
  }
  if (!excClass) {
    L.push('  EXCEPTIONS');
    let i = 1;
    es.forEach(e => L.push(`    ${low(e.n).padEnd(w)} = ${i++}`));
    if (proc === 'rfc') {
      L.push(`    ${'system_failure'.padEnd(w)} = ${i++}`);
      L.push(`    ${'communication_failure'.padEnd(w)} = ${i++}`);
    }
    L.push(`    ${'OTHERS'.padEnd(w)} = ${i}.`);
    L.push('IF sy-subrc <> 0.', '  " Trate o erro: cada exceção recebeu um valor de sy-subrc acima', 'ENDIF.');
    return L.join('\n');
  }
  L.push('  .');
  const body = L.map(l => '    ' + l).join('\n');
  const catches = (es.length ? es : [{ n: 'cx_root' }]).map(e => `  CATCH ${low(e.n)} INTO DATA(lx_error).\n    " Trate o erro: lx_error->get_text( )`).join('\n');
  return `TRY.\n${body}\n${catches}\nENDTRY.`;
}

/** Simula as abas do Function Builder (SE37) e mostra o código que elas geram. */
export default function FunctionBuilder() {
  const [group, setGroup] = useState('ZFG_FLIGHT');
  const [name, setName] = useState('Z_FLIGHT_GET_FREE_SEATS');
  const [proc, setProc] = useState<Proc>('normal');
  const [P, setP] = useState<Param[]>(INIT);
  const [E, setE] = useState<Exc[]>(INIT_EXC);
  const [excClass, setExcClass] = useState(false);
  const [tab, setTab] = useState<Tab>('IMPORTING');
  const [view, setView] = useState<View>('fm');

  const updP = (i: number, patch: Partial<Param>) => setP(ps => ps.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const updE = (i: number, patch: Partial<Exc>) => setE(es => es.map((e, k) => (k === i ? { ...e, ...patch } : e)));
  const count = (t: Tab) => (t === 'EXCEPTIONS' ? E.length : P.filter(p => p.kind === t).length);
  const msgs = check(group.trim(), name.trim(), proc, P, E, excClass);
  const errors = msgs.filter(m => m[0] === 'erro').length;

  const code = view === 'fm' ? fmCode(name, proc, P, E, excClass) : view === 'group' ? groupCode(group, name) : callCode(name, proc, P, E, excClass);
  const title = view === 'fm' ? `Include L${up(group)}U01 · ${up(name)}` : view === 'group' ? `Grupo de funções ${up(group)}` : 'Chamada (botão Pattern do editor)';
  const kind = tab === 'EXCEPTIONS' ? null : tab;
  const cols = kind === 'TABLES' ? 'minmax(9rem,1.4fr) 7rem minmax(9rem,1.6fr) 5rem 2.5rem' : kind === 'EXPORTING' ? 'minmax(9rem,1.4fr) 6rem minmax(9rem,1.6fr) 5.5rem 2.5rem' : 'minmax(9rem,1.4fr) 6rem minmax(9rem,1.4fr) minmax(7rem,1fr) 5rem 5.5rem 2.5rem';

  return (
    <LabCard title="Simulador do Function Builder" subtitle="Preencha as abas como na SE37 e veja o código que o sistema gera" icon="fx">
      <Row>
        <Field label="Grupo de funções" htmlFor="fb-g" width="12rem"><Input id="fb-g" className="mono" maxlength={30} value={group} onInput={e => setGroup(e.target.value)} /></Field>
        <Field label="Módulo de função" htmlFor="fb-n" grow><Input id="fb-n" className="mono" maxlength={34} value={name} onInput={e => setName(e.target.value)} /></Field>
        <Field label="Tipo de processamento (aba Attributes)" htmlFor="fb-p" width="16rem">
          <Select id="fb-p" value={proc} onChange={e => setProc(e.target.value as Proc)}>
            <Option value="normal">Normal function module</Option>
            <Option value="rfc">Remote-enabled module (RFC)</Option>
            <Option value="update">Update module</Option>
          </Select>
        </Field>
      </Row>

      <Seg<Tab> label="Abas da interface" value={tab} onChange={setTab} options={(['IMPORTING', 'EXPORTING', 'CHANGING', 'TABLES', 'EXCEPTIONS'] as Tab[]).map(t => [t, `${TAB_LABEL[t]} (${count(t)})`])} />

      {kind ? (
        <>
          <div className="frows" role="table" aria-label={`Parâmetros ${TAB_LABEL[kind]}`}>
            <div className="prow frow-head" role="row" style={{ gridTemplateColumns: cols }}>
              <span role="columnheader">Nome do parâmetro</span><span role="columnheader">Tipagem</span><span role="columnheader">Tipo associado</span>
              {kind !== 'EXPORTING' && kind !== 'TABLES' && <span role="columnheader">Valor padrão</span>}
              {kind !== 'EXPORTING' && <span role="columnheader">Opcional</span>}
              {kind !== 'TABLES' && <span role="columnheader">Por valor</span>}
              <span />
            </div>
            {P.map((p, i) => p.kind === kind && (
              <div className="prow" role="row" key={i} style={{ gridTemplateColumns: cols }}>
                <Input className="mono" value={p.n} accessibleName="Nome do parâmetro" onInput={e => updP(i, { n: e.target.value })} />
                <Select value={p.typing} accessibleName="Tipagem" onChange={e => updP(i, { typing: e.target.value as Param['typing'] })}>
                  <Option value="TYPE">TYPE</Option>
                  <Option value="LIKE">LIKE</Option>
                </Select>
                <Input className="mono" value={p.t} accessibleName="Tipo associado" onInput={e => updP(i, { t: e.target.value })} />
                {kind !== 'EXPORTING' && kind !== 'TABLES' && <Input className="mono" value={p.def} accessibleName="Valor padrão" onInput={e => updP(i, { def: e.target.value })} />}
                {kind !== 'EXPORTING' && <CheckBox checked={p.opt || !!p.def.trim()} disabled={!!p.def.trim() && kind !== 'TABLES'} accessibleName="Opcional" onChange={e => updP(i, { opt: e.target.checked })} />}
                {kind !== 'TABLES' && <CheckBox checked={p.val} accessibleName="Passagem por valor" onChange={e => updP(i, { val: e.target.checked })} />}
                <Button design="Transparent" icon="delete" tooltip="Remover parâmetro" accessibleName="Remover parâmetro" onClick={() => setP(ps => ps.filter((_, k) => k !== i))} />
              </div>
            ))}
            {count(kind) === 0 && <Note>Nenhum parâmetro nesta aba.</Note>}
          </div>
          <div>
            <Button icon="add" onClick={() => setP(ps => [...ps, { kind, n: `${PREFIX[kind]}novo_${ps.length + 1}`, typing: 'TYPE', t: kind === 'TABLES' ? '/dmo/flight' : 'string', def: '', opt: false, val: kind !== 'TABLES' }])}>
              Adicionar parâmetro
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="lab-row checks">
            <CheckBox text="Exception classes (usar RAISING em vez de exceções clássicas)" checked={excClass} onChange={e => setExcClass(e.target.checked)} />
          </div>
          <div className="frows" role="table" aria-label="Exceções">
            <div className="prow frow-head" role="row" style={{ gridTemplateColumns: 'minmax(10rem,1fr) minmax(12rem,2fr) 2.5rem' }}>
              <span role="columnheader">{excClass ? 'Classe de exceção' : 'Exceção'}</span><span role="columnheader">Texto breve</span><span />
            </div>
            {E.map((e, i) => (
              <div className="prow" role="row" key={i} style={{ gridTemplateColumns: 'minmax(10rem,1fr) minmax(12rem,2fr) 2.5rem' }}>
                <Input className="mono" value={e.n} accessibleName="Nome da exceção" onInput={ev => updE(i, { n: ev.target.value })} />
                <Input value={e.txt} accessibleName="Texto breve" onInput={ev => updE(i, { txt: ev.target.value })} />
                <Button design="Transparent" icon="delete" tooltip="Remover exceção" accessibleName="Remover exceção" onClick={() => setE(es => es.filter((_, k) => k !== i))} />
              </div>
            ))}
            {E.length === 0 && <Note>Nenhuma exceção declarada.</Note>}
          </div>
          <div>
            <Button icon="add" onClick={() => setE(es => [...es, { n: excClass ? 'cx_abap_invalid_value' : `erro_${es.length + 1}`, txt: '' }])}>Adicionar exceção</Button>
          </div>
        </>
      )}

      <div className="stack">
        {msgs.map((m, i) => <Strip key={i} kind={m[0]}>{m[1]}</Strip>)}
        {errors === 0 && <Strip kind="sucesso">Interface consistente: o módulo pode ser ativado.</Strip>}
      </div>

      <Seg<View> label="Código gerado" value={view} onChange={setView} options={[['fm', 'Módulo de função'], ['group', 'Grupo de funções'], ['call', 'Chamada']]} />
      <CodeBlock code={code} title={title} />
      <Note>
        {view === 'fm' && 'O bloco *" é reescrito pelo sistema a cada alteração nas abas. Editá-lo à mão não muda a interface.'}
        {view === 'group' && 'Um grupo de funções é um programa (SAPL…) formado por includes. Dados declarados no include TOP ficam vivos entre as chamadas dentro da mesma sessão interna.'}
        {view === 'call' && 'Linhas iniciadas por * são parâmetros opcionais, que o Pattern insere comentados. Repare na inversão: o que o módulo importa, o chamador exporta.'}
      </Note>
    </LabCard>
  );
}
