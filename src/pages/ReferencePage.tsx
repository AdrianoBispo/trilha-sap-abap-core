import { useMemo, useState } from 'react';
import type { RootContent, Table as MdTable } from 'mdast';
import { Icon, Input, Link, SegmentedButton, SegmentedButtonItem } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';
import { lessonById, REFERENCE } from '../content/content';
import { toText } from '../content/markdown';
import { highlight } from '../components/highlight';
import DataTable from '../components/DataTable';
import { ArticleHead, LinkList } from '../components/Parts';
import { Blocks, Inline } from '../render/Markdown';
import { navigate } from '../state/store';

interface RefRow { cat: string; syntax: string; what: RootContent[]; lesson: string }

/** Tabela "Categoria | Sintaxe | O que faz | Lição" com filtro por texto e categoria. */
function RefTable({ table }: { table: MdTable }) {
  const rows: RefRow[] = useMemo(
    () =>
      table.children.slice(1).map(r => ({
        cat: toText(r.children[0]).trim(),
        syntax: toText(r.children[1]).trim(),
        what: r.children[2]?.children ?? [],
        lesson: toText(r.children[3]).trim(),
      })) as RefRow[],
    [table],
  );
  const cats = [...new Set(rows.map(r => r.cat))];
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const v = q.trim().toLowerCase();
  const shown = rows.filter(r => (!cat || r.cat === cat) && (!v || `${r.syntax} ${toText(r.what as never)}`.toLowerCase().includes(v)));

  return (
    <div className="stack">
      <div className="lab-row">
        <div className="field" style={{ flex: '2 1 16rem' }}>
          <Input
            icon={<Icon name="search" />}
            placeholder="Filtrar: loop, join, exceção…"
            accessibleName="Filtrar sintaxe"
            value={q}
            onInput={e => setQ(e.target.value)}
          />
        </div>
        <SegmentedButton
          accessibleName="Categoria"
          onSelectionChange={e => setCat((e.detail.selectedItems[0] as HTMLElement | undefined)?.dataset.v ?? '')}
        >
          <SegmentedButtonItem data-v="" selected={cat === ''}>Todas</SegmentedButtonItem>
          {cats.map(c => <SegmentedButtonItem key={c} data-v={c} selected={cat === c}>{c}</SegmentedButtonItem>)}
        </SegmentedButton>
      </div>
      <DataTable
        noDataText="Nenhum item corresponde ao filtro."
        columns={[
          { key: 'cat', label: 'Categoria', width: '7rem' },
          { key: 'syntax', label: 'Sintaxe', minWidth: '16rem' },
          { key: 'what', label: 'O que faz' },
          { key: 'lesson', label: 'Lição' },
        ]}
        rows={shown.map(r => {
          const l = lessonById(r.lesson);
          return {
            cat: <span className="ref-cat">{r.cat}</span>,
            syntax: <code className="md-code ref-code" dangerouslySetInnerHTML={{ __html: highlight(r.syntax, r.cat === 'CDS' ? 'CDS' : 'ABAP') }} />,
            what: <Inline nodes={r.what as never} />,
            lesson: l ? <Link href={`#${l.id}`} onClick={e => { e.preventDefault(); navigate(l.id); }}>{l.title}</Link> : r.lesson,
          };
        })}
      />
    </div>
  );
}

export default function ReferencePage() {
  const m = REFERENCE.meta;
  return (
    <div className="page page-scroll">
      <article className="article article-wide">
        <ArticleHead crumbs={[{ label: 'Início', route: 'inicio' }, { label: m.titulo ?? 'Referência' }]} eyebrow="Consulta" title={m.titulo} lead={m.subtitulo} />
        {REFERENCE.sections.map(s => {
          const tableIdx = s.nodes.findIndex(n => n.type === 'table' && toText(n.children[0].children[0]).trim() === 'Categoria');
          return (
            <section key={s.id} id={`s-${s.id}`} className="article-sec">
              {s.title.length > 0 && <h2 className="article-h2"><Inline nodes={s.title} /></h2>}
              {tableIdx >= 0 ? (
                <>
                  <Blocks nodes={s.nodes.slice(0, tableIdx)} />
                  <RefTable table={s.nodes[tableIdx] as MdTable} />
                  <Blocks nodes={s.nodes.slice(tableIdx + 1)} />
                </>
              ) : (
                <Blocks nodes={s.nodes} />
              )}
            </section>
          );
        })}
        {REFERENCE.links.length > 0 && (
          <footer className="article-foot">
            <section className="article-sec">
              <h2 className="article-h2">Documentação oficial</h2>
              <LinkList links={REFERENCE.links} />
            </section>
          </footer>
        )}
      </article>
    </div>
  );
}
