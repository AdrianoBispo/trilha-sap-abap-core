import { useRef } from 'react';
import { Button } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy.js';
import { highlight, highlightLines } from './highlight';
import { toast } from '../state/store';

const LANG_LABEL: Record<string, string> = { abap: 'ABAP', cds: 'CDS', bdl: 'BDL', ddl: 'DDL', dcl: 'DCL' };

interface Props {
  code: string;
  title?: string;
  lang?: string;
  /** Índices (base 0) de linhas a destacar, ex.: linhas executadas. */
  activeLines?: number[];
  /** Mostra números de linha. */
  numbered?: boolean;
  hideCopy?: boolean;
}

export default function CodeBlock({ code, title, lang = 'abap', activeLines, numbered, hideCopy }: Props) {
  const preRef = useRef<HTMLPreElement>(null);
  const label = LANG_LABEL[lang.toLowerCase()] ?? lang.toUpperCase();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast('Código copiado');
    } catch {
      const sel = getSelection();
      if (preRef.current && sel) {
        const r = document.createRange();
        r.selectNodeContents(preRef.current);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      toast('Selecionado: use Ctrl+C para copiar');
    }
  }

  const html =
    activeLines || numbered
      ? highlightLines(code, label)
          .map((l, i) => {
            const on = activeLines?.includes(i) ? ' is-active' : '';
            const num = numbered ? `<span class="code-ln" aria-hidden="true">${i + 1}</span>` : '';
            return `<span class="code-line${on}">${num}${l || ' '}</span>`;
          })
          .join('\n')
      : highlight(code, label);

  return (
    <div className="code">
      <div className="code-head">
        <span className="code-title">{title ?? label}</span>
        <span className="code-lang">{label}</span>
        {!hideCopy && (
          <Button design="Transparent" icon="copy" onClick={copy} tooltip="Copiar código" accessibleName="Copiar código">
            Copiar
          </Button>
        )}
      </div>
      <pre ref={preRef} tabIndex={0}>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
