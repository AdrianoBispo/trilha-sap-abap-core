import type { ReactNode } from 'react';
import { Button, Card, CardHeader, Icon, Label, MessageStrip, SegmentedButton, SegmentedButtonItem, Tag } from '@ui5/webcomponents-react';
import { tagProps } from '../render/tags';

/* ---------- Layout ---------- */

export function LabCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: string; children: ReactNode }) {
  return (
    <Card
      className="lab"
      header={<CardHeader titleText={title} subtitleText={subtitle} avatar={<Icon name={icon} />} additionalText="Laboratório" />}
    >
      <div className="lab-body">{children}</div>
    </Card>
  );
}

export function Field({ label, htmlFor, children, grow, width }: { label: ReactNode; htmlFor?: string; children: ReactNode; grow?: boolean; width?: string }) {
  return (
    <div className="field" style={{ flex: grow ? '1 1 14rem' : undefined, width }}>
      <Label for={htmlFor} showColon={false} wrappingType="Normal">{label}</Label>
      {children}
    </div>
  );
}

export const Row = ({ children, className }: { children: ReactNode; className?: string }) => <div className={`lab-row${className ? ' ' + className : ''}`}>{children}</div>;

export function Chips({ items, onPick, label = 'Exemplos' }: { items: string[]; onPick: (v: string) => void; label?: string }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {items.map(p => (
        <Button key={p} design="Transparent" className="chip" onClick={() => onPick(p)}>
          <span className="vis">{vis(p)}</span>
        </Button>
      ))}
    </div>
  );
}

export function Seg<T extends string>({ options, value, onChange, label }: { options: [T, string][]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <SegmentedButton
      accessibleName={label}
      onSelectionChange={e => {
        const it = e.detail.selectedItems[0] as HTMLElement | undefined;
        if (it?.dataset.v != null) onChange(it.dataset.v as T);
      }}
    >
      {options.map(([v, t]) => (
        <SegmentedButtonItem key={v} data-v={v} selected={v === value}>
          {t}
        </SegmentedButtonItem>
      ))}
    </SegmentedButton>
  );
}

export function StatusTag({ tipo, children }: { tipo?: string; children: ReactNode }) {
  return <Tag {...tagProps(tipo)} hideStateIcon={!tipo || tipo === 'neutro'}>{children}</Tag>;
}

export const StatusLine = ({ children }: { children: ReactNode }) => <div className="statusline">{children}</div>;

type StripKind = 'info' | 'aviso' | 'erro' | 'sucesso';
const STRIP_DESIGN = { info: 'Information', aviso: 'Critical', erro: 'Negative', sucesso: 'Positive' } as const;
export function Strip({ kind = 'info', children }: { kind?: StripKind; children: ReactNode }) {
  return (
    <MessageStrip design={STRIP_DESIGN[kind]} hideCloseButton className="md-strip">
      {children}
    </MessageStrip>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <p className="note">{children}</p>;

/** Mostra espaços como “·” para deixar visível o conteúdo de strings. */
export function vis(s: string): ReactNode {
  return [...s].map((ch, i) => (ch === ' ' ? <i key={i} className="sp">·</i> : ch));
}

export const fmtNum = (n: number, d = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

/* ---------- Números no estilo ABAP (string decimal exata) ---------- */

export interface AbapNum { ok: boolean; sign: 1 | -1; int: string; frac: string }

export function parseAbapNum(s: string): AbapNum {
  const t = String(s).trim();
  if (t === '') return { ok: true, sign: 1, int: '0', frac: '' };
  const m = t.match(/^([+-]?)(\d*)(?:\.(\d*))?([+-]?)$/);
  if (!m || (m[1] && m[4]) || (m[2] === '' && !(m[3] || ''))) return { ok: false, sign: 1, int: '0', frac: '' };
  return { ok: true, sign: m[1] === '-' || m[4] === '-' ? -1 : 1, int: (m[2] || '0').replace(/^0+(?=\d)/, ''), frac: m[3] || '' };
}

/** Arredondamento comercial para d casas: devolve o valor escalado por 10^d. */
export function roundDec(p: AbapNum, d: number): { sign: 1 | -1; v: bigint } {
  const frac = (p.frac + '0'.repeat(d + 1)).slice(0, d + 1);
  let v = BigInt(p.int + frac.slice(0, d) || '0');
  const rest = (p.frac + '0'.repeat(d + 1)).slice(d);
  if (rest.length && rest[0] >= '5') v += 1n;
  return { sign: v === 0n ? 1 : p.sign, v };
}

export function decStr(r: { sign: number; v: bigint }, d: number) {
  let s = r.v.toString().padStart(d + 1, '0');
  s = d ? s.slice(0, -d) + '.' + s.slice(-d) : s;
  return (r.sign < 0 ? '-' : '') + s;
}

/** a / b com d decimais e arredondamento comercial (inteiros). */
export function divRound(a: number, b: number, d: number) {
  const sign = (Math.sign(a) * Math.sign(b) || 1) as 1 | -1;
  const n = BigInt(Math.abs(a)) * 10n ** BigInt(d);
  const den = BigInt(Math.abs(b));
  let q = n / den;
  const rem = n - q * den;
  if (2n * rem >= den) q += 1n;
  return decStr({ sign: q === 0n ? 1 : sign, v: q }, d);
}

/* ---------- Dados de exemplo inspirados no modelo /DMO/ ---------- */

export interface Connection { carrier_id: string; connection_id: string; airport_from_id: string; airport_to_id: string; departure_time: string; distance: number }
export interface Flight { carrier_id: string; connection_id: string; flight_date: string; price: number; seats_max: number; seats_occupied: number }

export const CONN: Connection[] = (
  [
    ['AA', '0017', 'JFK', 'SFO', '11:00:00', 4139], ['AA', '0064', 'SFO', 'JFK', '09:00:00', 4139],
    ['AZ', '0555', 'FCO', 'FRA', '19:00:00', 966], ['AZ', '0788', 'FCO', 'NRT', '12:00:00', 9859],
    ['JL', '0407', 'NRT', 'FRA', '13:30:00', 9364], ['JL', '0408', 'FRA', 'NRT', '20:25:00', 9364],
    ['LH', '0400', 'FRA', 'JFK', '10:10:00', 6162], ['LH', '0401', 'JFK', 'FRA', '18:30:00', 6162], ['LH', '0402', 'FRA', 'EWR', '13:30:00', 6217],
    ['SQ', '0001', 'SIN', 'SFO', '17:00:00', 13597], ['SQ', '0002', 'SFO', 'SIN', '21:55:00', 13597],
    ['UA', '0941', 'FRA', 'SFO', '14:30:00', 9126], ['UA', '3504', 'SFO', 'FRA', '15:00:00', 9126],
  ] as const
).map(r => ({ carrier_id: r[0], connection_id: r[1], airport_from_id: r[2], airport_to_id: r[3], departure_time: r[4], distance: r[5] }));

export const CARR: Record<string, string> = { AA: 'American Airlines', AZ: 'Alitalia', JL: 'Japan Airlines', LH: 'Lufthansa', SQ: 'Singapore Airlines', UA: 'United Airlines' };

export const FLIGHTS: Flight[] = (
  [
    ['AA', '0017', '20261105', 422.94, 385, 371], ['AA', '0017', '20261119', 422.94, 385, 290], ['AA', '0064', '20261106', 438.2, 385, 342],
    ['AZ', '0555', '20261108', 185.0, 140, 140], ['AZ', '0555', '20261122', 185.0, 140, 98],
    ['JL', '0407', '20261110', 1120.0, 380, 362], ['JL', '0408', '20261112', 1120.0, 380, 301],
    ['LH', '0400', '20261103', 879.82, 330, 330], ['LH', '0400', '20261117', 879.82, 330, 287], ['LH', '0401', '20261104', 902.1, 330, 312], ['LH', '0402', '20261115', 845.0, 330, 154],
    ['SQ', '0001', '20261109', 1490.0, 471, 455], ['SQ', '0002', '20261111', 1490.0, 471, 398],
    ['UA', '0941', '20261107', 870.0, 300, 276], ['UA', '0941', '20261121', 870.0, 300, 244], ['UA', '3504', '20261114', 899.0, 300, 300],
  ] as const
).map(r => ({ carrier_id: r[0], connection_id: r[1], flight_date: r[2], price: r[3], seats_max: r[4], seats_occupied: r[5] }));

export const fdate = (d: string) => `${d.slice(6)}.${d.slice(4, 6)}.${d.slice(0, 4)}`;

/** Colunas simples para DataTable a partir de nomes de campo. */
export const cols = (names: string[], num: string[] = []) =>
  names.map(n => ({ key: n, label: n, align: num.includes(n) ? ('End' as const) : undefined, mono: true }));
