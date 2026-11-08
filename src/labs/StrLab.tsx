import { useState } from 'react';
import { Input, Option, Select } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import { Field, LabCard, Note, Row, Strip, vis } from './common';

type Args = Record<string, string>;
interface Fn { p: [string, string][]; f: (t: string, a: Args) => string | number; c: (a: Args) => string; num?: boolean }

const FN: Record<string, Fn> = {
  to_upper: { p: [], f: t => t.toUpperCase(), c: () => 'to_upper( val = text )' },
  to_lower: { p: [], f: t => t.toLowerCase(), c: () => 'to_lower( val = text )' },
  condense: { p: [], f: t => t.trim().replace(/ {2,}/g, ' '), c: () => 'condense( val = text )' },
  strlen: { p: [], f: t => t.length, c: () => 'strlen( text )', num: true },
  substring: {
    p: [['off', '2'], ['len', '6']],
    f: (t, a) => { const o = +a.off, l = a.len === '' ? t.length - o : +a.len; if (o < 0 || l < 0 || o + l > t.length) throw new Error('CX_SY_RANGE_OUT_OF_BOUNDS'); return t.substr(o, l); },
    c: a => `substring( val = text off = ${a.off}${a.len !== '' ? ' len = ' + a.len : ''} )`,
  },
  find: { p: [['sub', 'ABAP']], f: (t, a) => (a.sub === '' ? 0 : t.indexOf(a.sub)), c: a => `find( val = text sub = \`${a.sub}\` )`, num: true },
  count: { p: [['sub', 'a']], f: (t, a) => (a.sub === '' ? 0 : t.split(a.sub).length - 1), c: a => `count( val = text sub = \`${a.sub}\` )`, num: true },
  replace: {
    p: [['sub', 'a'], ['with', 'o'], ['occ', '0']],
    f: (t, a) => {
      if (!a.sub) return t;
      const occ = parseInt(a.occ || '1', 10), parts = t.split(a.sub);
      if (parts.length === 1) return t;
      if (occ === 0) return parts.join(a.with);
      const n = parts.length - 1, k = occ > 0 ? occ : n + occ + 1;
      if (k < 1 || k > n) return t;
      return parts.slice(0, k).join(a.sub) + a.with + parts.slice(k).join(a.sub);
    },
    c: a => `replace( val = text sub = \`${a.sub}\` with = \`${a.with}\` occ = ${a.occ || 1} )`,
  },
  segment: {
    p: [['index', '2'], ['sep', ' ']],
    f: (t, a) => { const segs = t.split(a.sep || ' '), i = parseInt(a.index, 10), k = i > 0 ? i - 1 : segs.length + i; if (!i || k < 0 || k >= segs.length) throw new Error('CX_SY_STRG_PAR_VAL'); return segs[k]; },
    c: a => `segment( val = text index = ${a.index} sep = \`${a.sep}\` )`,
  },
  reverse: { p: [], f: t => [...t].reverse().join(''), c: () => 'reverse( text )' },
  template: {
    p: [['WIDTH', '30'], ['ALIGN', 'CENTER'], ['PAD', '*']],
    f: (t, a) => {
      const w = parseInt(a.WIDTH, 10) || 0, pad = (a.PAD || ' ')[0];
      if (w <= t.length) return t;
      const tot = w - t.length, al = (a.ALIGN || 'LEFT').toUpperCase();
      if (al === 'RIGHT') return pad.repeat(tot) + t;
      if (al === 'CENTER') { const l = Math.floor(tot / 2); return pad.repeat(l) + t + pad.repeat(tot - l); }
      return t + pad.repeat(tot);
    },
    c: a => `|{ text WIDTH = ${a.WIDTH} ALIGN = ${(a.ALIGN || 'LEFT').toUpperCase()} PAD = '${(a.PAD || ' ')[0]}' }|`,
  },
};

const defaults = (fn: string): Args => Object.fromEntries(FN[fn].p.map(p => [p[0], p[1]]));

/** Funções embutidas de texto e string templates. */
export default function StrLab() {
  const [text, setText] = useState('  Trilha ABAP  na  nuvem  ');
  const [fn, setFn] = useState('to_upper');
  const [args, setArgs] = useState<Args>({});
  const d = FN[fn];

  let out;
  try {
    const r = d.f(text, args);
    out = d.num ? (
      <span className="result">{r}</span>
    ) : (
      <>
        <div className="result"><span className="vis">`{vis(String(r))}`</span></div>
        <Note>Espaços aparecem como · · tamanho {String(r).length}</Note>
      </>
    );
  } catch (e) {
    out = <Strip kind="erro">Exceção <b>{(e as Error).message}</b>: parâmetro fora dos limites do texto (tamanho {text.length}).</Strip>;
  }

  return (
    <LabCard title="Laboratório de funções de texto" subtitle="text TYPE string" icon="syntax">
      <Row>
        <Field label="text" htmlFor="st-t" grow><Input id="st-t" className="mono" value={text} onInput={e => setText(e.target.value)} /></Field>
        <Field label="Função" htmlFor="st-f">
          <Select id="st-f" value={fn} onChange={e => { const v = e.target.value; setFn(v); setArgs(defaults(v)); }}>
            {Object.keys(FN).map(f => <Option key={f} value={f}>{f === 'template' ? 'string template' : f + '( )'}</Option>)}
          </Select>
        </Field>
      </Row>
      <Row>
        {d.p.length ? (
          d.p.map(([k]) => (
            <Field key={fn + k} label={k} htmlFor={`st-${k}`} width="9rem">
              <Input id={`st-${k}`} className="mono" value={args[k] ?? ''} onInput={e => setArgs(a => ({ ...a, [k]: e.target.value }))} />
            </Field>
          ))
        ) : (
          <Note>Esta função só recebe o texto.</Note>
        )}
      </Row>
      <CodeBlock code={`DATA(result) = ${d.c(args)}.`} title="Expressão" />
      {out}
    </LabCard>
  );
}
