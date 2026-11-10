import type { ReactNode } from 'react';
import { Table, TableCell, TableHeaderCell, TableHeaderRow, TableRow } from '@ui5/webcomponents-react';

export interface Column {
  key: string;
  label: ReactNode;
  /** Alinhamento: números à direita. */
  align?: 'Start' | 'Center' | 'End';
  width?: string;
  minWidth?: string;
  /** Renderiza o valor em fonte monoespaçada. */
  mono?: boolean;
}

interface Props {
  columns: Column[];
  rows: Record<string, ReactNode>[];
  noDataText?: string;
  className?: string;
  /** Esconde a linha de cabeçalho (tabelas sem títulos de coluna). */
  hideHeader?: boolean;
  accessibleName?: string;
}

/**
 * Tabela UI5 (ui5-table) com o visual de lista do SAP Horizon.
 * O conteúdo de cada célula vai dentro de um <span>: a célula é um contêiner flex, e sem ele
 * os espaços entre texto e trechos em negrito ou código seriam descartados.
 */
export default function DataTable({ columns, rows, noDataText = 'Nenhuma linha.', className, hideHeader, accessibleName }: Props) {
  return (
    <div className={`table-wrap${className ? ' ' + className : ''}${hideHeader ? ' no-head' : ''}`}>
      <Table
        accessibleName={accessibleName}
        noDataText={noDataText}
        overflowMode="Scroll"
        headerRow={
          <TableHeaderRow>
            {columns.map(c => (
              <TableHeaderCell key={c.key} horizontalAlign={c.align} width={c.width} minWidth={c.minWidth ?? '4rem'}>
                {c.label}
              </TableHeaderCell>
            ))}
          </TableHeaderRow>
        }
      >
        {rows.map((r, i) => (
          <TableRow key={i} rowKey={String(i)}>
            {columns.map(c => (
              <TableCell key={c.key} horizontalAlign={c.align}>
                {c.mono ? <span className="mono">{r[c.key] == null ? <span className="null">null</span> : r[c.key]}</span> : <span className="cell-flow">{r[c.key]}</span>}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
