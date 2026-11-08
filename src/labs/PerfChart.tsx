import { useState } from 'react';
import { Slider } from '@ui5/webcomponents-react';
import DataTable from '../components/DataTable';
import { Field, fmtNum, LabCard, Row } from './common';

const W = 640, H = 300, L = 64, R = 20, T = 16, B = 40;
const x = (n: number) => L + ((Math.log10(n) - 1) / 4) * (W - L - R);
const y = (v: number) => T + (1 - Math.log10(Math.max(v, 1)) / 5) * (H - T - B);
const lin = (n: number) => (n + 1) / 2;
const bin = (n: number) => Math.log2(n) + 1;
const hsh = () => 1;
const path = (f: (n: number) => number) => {
  let d = '';
  for (let e = 1; e <= 5.0001; e += 0.05) { const n = 10 ** e; d += (d ? 'L' : 'M') + x(n).toFixed(1) + ' ' + y(f(n)).toFixed(1); }
  return d;
};
const lbl = (v: number) => (v >= 1000 ? `${v / 1000} mil` : String(v));
const SERIES: [(n: number) => number, string, string][] = [
  [lin, 'var(--sapCriticalColor)', 'STANDARD (linear)'],
  [bin, 'var(--sapInformativeColor)', 'SORTED (binária)'],
  [hsh, 'var(--sapPositiveColor)', 'HASHED'],
];

/** Comparações médias por leitura em função do tamanho da tabela (escala log). */
export default function PerfChart() {
  const [e, setE] = useState(3);
  const n = Math.round(10 ** e);

  return (
    <LabCard title="Comparações médias por leitura" subtitle="Escala logarítmica nos dois eixos" icon="overview-chart">
      <Row>
        <Field label={<>Linhas na tabela: <b>{fmtNum(n)}</b></>} htmlFor="pc-n" grow>
          <Slider id="pc-n" min={1} max={5} step={0.05} value={e} onInput={ev => setE(ev.target.value)} accessibleName="Linhas na tabela (escala logarítmica)" />
        </Field>
        <div className="legend">
          {SERIES.map(([, c, t]) => <span key={t}><i style={{ background: c }} />{t}</span>)}
        </div>
      </Row>
      <div className="svg-scroll">
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de comparações por tamanho de tabela">
          {[1, 10, 100, 1000, 10000, 100000].map(v => (
            <g key={'y' + v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end">{lbl(v)}</text>
            </g>
          ))}
          {[10, 100, 1000, 10000, 100000].map(v => (
            <g key={'x' + v}>
              <line x1={x(v)} x2={x(v)} y1={T} y2={H - B} className="grid" />
              <text x={x(v)} y={H - B + 18} textAnchor="middle">{lbl(v)}</text>
            </g>
          ))}
          <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle">linhas na tabela</text>
          <text x={14} y={(T + H - B) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(T + H - B) / 2})`}>comparações</text>
          {SERIES.map(([f, c]) => <path key={c} d={path(f)} fill="none" stroke={c} strokeWidth={2.5} />)}
          <line x1={x(n)} x2={x(n)} y1={T} y2={H - B} className="cursor" />
          {SERIES.map(([f, c]) => <circle key={c} cx={x(n)} cy={y(f(n))} r={5} fill={c} className="dot" />)}
        </svg>
      </div>
      <DataTable
        columns={[{ key: 't', label: 'Tipo' }, { key: 'c', label: 'Comparações por leitura', align: 'End' }, { key: 'm', label: 'Para 1.000 leituras', align: 'End' }]}
        rows={[
          { t: 'STANDARD (READ … WITH KEY)', c: fmtNum(lin(n), 1), m: fmtNum(lin(n) * 1000) },
          { t: 'SORTED (busca binária)', c: fmtNum(bin(n), 1), m: fmtNum(bin(n) * 1000) },
          { t: 'HASHED', c: '≈ 1', m: '≈ 1.000' },
        ]}
      />
    </LabCard>
  );
}
