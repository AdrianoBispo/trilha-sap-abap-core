import { useState, type ReactNode } from 'react';
import { Input } from '@ui5/webcomponents-react';
import DataTable from '../components/DataTable';
import { Chips, decStr, Field, LabCard, parseAbapNum, roundDec, Row, StatusTag } from './common';

const PRESETS = ['12.5', '-3.5', '  7 ', '1234567', 'A1B2C3', 'abc', '20261332', '20261027', '99999999999'];

/** Célula a célula, como o conteúdo fica num campo de tamanho fixo. */
const Cells = ({ s, len }: { s: string; len: number }) => (
  <span className="cells">
    {[...s.padEnd(len, ' ').slice(0, len)].map((ch, i) => <span key={i} className={ch === ' ' ? 'blank' : ''}>{ch === ' ' ? '·' : ch}</span>)}
  </span>
);
const Result = ({ children }: { children: ReactNode }) => <span className="result">{children}</span>;

/** O mesmo texto atribuído a i, p, c, n e d. */
export default function ConvLab() {
  const [src, setSrc] = useState('12.5');
  const p = parseAbapNum(src);
  const rows: { t: string; v: ReactNode; r: ReactNode }[] = [];

  if (!p.ok) rows.push({ t: 'i', v: <StatusTag tipo="erro">CX_SY_CONVERSION_NO_NUMBER</StatusTag>, r: 'O texto precisa representar um número.' });
  else {
    const s = decStr(roundDec(p, 0), 0);
    const over = BigInt(s) > 2147483647n || BigInt(s) < -2147483648n;
    rows.push({
      t: 'i',
      v: over ? <StatusTag tipo="erro">CX_SY_CONVERSION_OVERFLOW</StatusTag> : <Result>{s}</Result>,
      r: p.frac && /[1-9]/.test(p.frac) ? 'Casas decimais arredondadas comercialmente (0,5 sobe, afastando do zero).' : 'Valor numérico convertido.',
    });
  }
  if (!p.ok) rows.push({ t: 'p LENGTH 8 DECIMALS 2', v: <StatusTag tipo="erro">CX_SY_CONVERSION_NO_NUMBER</StatusTag>, r: 'Mesmo critério do tipo i.' });
  else {
    const r = roundDec(p, 2);
    rows.push({ t: 'p LENGTH 8 DECIMALS 2', v: r.v > 999999999999999n ? <StatusTag tipo="erro">CX_SY_CONVERSION_OVERFLOW</StatusTag> : <Result>{decStr(r, 2)}</Result>, r: 'Até 13 dígitos inteiros e 2 decimais, arredondado.' });
  }
  rows.push({
    t: 'c LENGTH 5',
    v: <Cells s={src} len={5} />,
    r: src.length > 5 ? `Cortado à direita: perdeu “${src.slice(5)}” sem aviso.` : src.length < 5 ? 'Completado com espaços à direita.' : 'Cabe exatamente.',
  });
  const dig = src.replace(/\D/g, '');
  const nres = dig.length > 6 ? dig.slice(-6) : dig.padStart(6, '0');
  rows.push({
    t: 'n LENGTH 6',
    v: <Cells s={nres} len={6} />,
    r: dig.length > 6 ? `Só os dígitos, alinhados à direita: perdeu “${dig.slice(0, -6)}” à esquerda.` : dig !== src.trim() ? 'Só os dígitos são passados, alinhados à direita com zeros.' : 'Alinhado à direita, completado com zeros.',
  });
  const d8 = src.padEnd(8, ' ').slice(0, 8);
  const valid = /^\d{8}$/.test(d8) && (() => {
    const y = +d8.slice(0, 4), m = +d8.slice(4, 6), dd = +d8.slice(6);
    const dt = new Date(Date.UTC(y, m - 1, dd));
    return m >= 1 && m <= 12 && dt.getUTCDate() === dd && dt.getUTCMonth() === m - 1;
  })();
  rows.push({
    t: 'd',
    v: <Cells s={d8} len={8} />,
    r: valid ? 'Data válida (AAAAMMDD).' : <><StatusTag tipo="aviso">data inválida</StatusTag> Os 8 primeiros caracteres são copiados <b>sem validação</b>. Use <code className="md-code">EXACT d( )</code> para detectar.</>,
  });

  return (
    <LabCard title="Laboratório de conversão" subtitle="DATA(source) = `…`. e depois target = source." icon="restart">
      <Row>
        <Field label="Valor de origem (string)" htmlFor="cv-in" grow>
          <Input id="cv-in" className="mono" value={src} onInput={e => setSrc(e.target.value)} />
        </Field>
        <Chips items={PRESETS} onPick={setSrc} />
      </Row>
      <DataTable
        columns={[{ key: 't', label: 'DATA target TYPE …', mono: true }, { key: 'v', label: 'Conteúdo de target' }, { key: 'r', label: 'Regra aplicada' }]}
        rows={rows}
      />
    </LabCard>
  );
}
