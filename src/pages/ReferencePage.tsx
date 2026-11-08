import { useMemo, useState } from 'react';
import type { RootContent, Table as MdTable } from 'mdast';
import {
  Avatar, Breadcrumbs, BreadcrumbsItem, Icon, Input, Link, ObjectPage, ObjectPageSection, ObjectPageTitle,
  SegmentedButton, SegmentedButtonItem, Text, Title,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/course-book.js';
import { lessonById, REFERENCE } from '../content/content';
import { toText } from '../content/markdown';
import { highlight } from '../components/highlight';
import DataTable from '../components/DataTable';
import { LinkList, SectionTitle } from '../components/Parts';
import { Blocks, Inline } from '../render/Markdown';
import { navigate } from '../state/store';
import { accent } from './common';

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
    <ObjectPage
      className="page"
      mode="Default"
      image={<Avatar icon={m.icone ?? 'syntax'} colorScheme={accent(m.cor)} size="L" shape="Square" />}
      titleArea={
        <ObjectPageTitle
          header={<Title level="H1" size="H2">{m.titulo}</Title>}
          subHeader={<Text>{m.subtitulo}</Text>}
          breadcrumbs={
            <Breadcrumbs onItemClick={e => { if ((e.detail.item as HTMLElement).getAttribute('href')) { e.preventDefault(); navigate('inicio'); } }}>
              <BreadcrumbsItem href="#inicio">Início</BreadcrumbsItem>
              <BreadcrumbsItem>Recursos</BreadcrumbsItem>
            </Breadcrumbs>
          }
        />
      }
    >
      {[
      ...REFERENCE.sections.map(s => {
        const tableIdx = s.nodes.findIndex(n => n.type === 'table' && toText(n.children[0].children[0]).trim() === 'Categoria');
        return (
          <ObjectPageSection key={s.id} id={`s-${s.id}`} titleText={s.anchor} hideTitleText>
            <div className="sec">
              {s.title.length > 0 && <SectionTitle icon={s.icon}><Inline nodes={s.title} /></SectionTitle>}
              {tableIdx >= 0 ? (
                <>
                  <Blocks nodes={s.nodes.slice(0, tableIdx)} />
                  <RefTable table={s.nodes[tableIdx] as MdTable} />
                  <Blocks nodes={s.nodes.slice(tableIdx + 1)} />
                </>
              ) : (
                <Blocks nodes={s.nodes} />
              )}
            </div>
          </ObjectPageSection>
        );
      }),
      ...(REFERENCE.links.length > 0 ? [
        <ObjectPageSection key="s-documentacao" id="s-documentacao" titleText="Documentação" hideTitleText>
          <div className="sec">
            <SectionTitle icon="course-book">Documentação oficial</SectionTitle>
            <LinkList links={REFERENCE.links} />
          </div>
        </ObjectPageSection>,
      ] : []),
      ]}
    </ObjectPage>
  );
}
