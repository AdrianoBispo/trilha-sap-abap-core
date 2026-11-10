/**
 * Renderiza a árvore Markdown (mdast) com componentes UI5 Web Components.
 *
 * Extensões aceitas no Markdown (diretivas):
 *   :::cartao{etiqueta="…" tipo="sucesso|aviso|erro|info|neutro|c5|c7" icone="…" subtitulo="…"}
 *   :::colunas{n="2|3"}           grade de colunas
 *   :::nota  :::aviso  :::sucesso  :::erro   faixas de mensagem (MessageStrip)
 *   :::figura{arquivo="x.svg"}    ilustração de docs/figuras + legenda
 *   :::termos  :::checklist  :::links   listas especiais
 *   ::laboratorio{id="…"}         laboratório interativo
 *   :kbd[Ctrl+F3]   :tag[texto]{tipo="…"}
 */
import { createContext, Fragment, useContext, type ReactNode } from 'react';
import type { Nodes, PhrasingContent, RootContent, Table as MdTable } from 'mdast';
import type { ContainerDirective, LeafDirective, TextDirective } from 'mdast-util-directive';
import { Card, CardHeader, Icon, Link, MessageStrip, Tag, Title } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/chain-link.js';
import '@ui5/webcomponents-icons/dist/inspect.js';
import CodeBlock from '../components/CodeBlock';
import DataTable from '../components/DataTable';
import { figure } from '../content/content';
import { toText } from '../content/markdown';
import { LABS } from '../labs';
import { navigate } from '../state/store';
import { tagProps } from './tags';
export { tagProps };

/** Diretivas folha extras que uma página pode fornecer (ex.: ::modulos na página inicial). */
export const MdExtras = createContext<Record<string, () => ReactNode>>({});

const STRIP: Record<string, 'Information' | 'Critical' | 'Positive' | 'Negative'> = {
  nota: 'Information', aviso: 'Critical', sucesso: 'Positive', erro: 'Negative',
};

function MdLink({ url, children }: { url: string; children: ReactNode }) {
  const internal = url.startsWith('#');
  return (
    <Link
      href={url}
      target={internal ? undefined : '_blank'}
      onClick={internal ? e => { e.preventDefault(); navigate(url.slice(1)); } : undefined}
      wrappingType="Normal"
    >
      {children}
    </Link>
  );
}

export function Inline({ nodes }: { nodes: PhrasingContent[] }) {
  return <>{nodes.map((n, i) => <Fragment key={i}>{inline(n)}</Fragment>)}</>;
}

function inline(n: PhrasingContent | TextDirective): ReactNode {
  switch (n.type) {
    case 'text': return n.value;
    case 'strong': return <strong><Inline nodes={n.children} /></strong>;
    case 'emphasis': return <em><Inline nodes={n.children} /></em>;
    case 'delete': return <del><Inline nodes={n.children} /></del>;
    case 'inlineCode': return <code className="md-code">{n.value}</code>;
    case 'break': return <br />;
    case 'link': return <MdLink url={n.url}><Inline nodes={n.children} /></MdLink>;
    case 'image': return <img src={n.url} alt={n.alt ?? ''} />;
    case 'textDirective': {
      if (n.name === 'kbd') return <kbd>{toText(n)}</kbd>;
      if (n.name === 'tag') return <Tag {...tagProps(n.attributes?.tipo ?? undefined)} hideStateIcon>{toText(n)}</Tag>;
      return `:${n.name}${n.children.length ? `[${toText(n)}]` : ''}`; // não é diretiva: mantém o texto
    }
    default: return null;
  }
}

/** Conteúdo de um item de lista ou faixa: parágrafos viram texto corrido. */
function Flow({ nodes }: { nodes: RootContent[] }) {
  if (nodes.length === 1 && nodes[0].type === 'paragraph') return <Inline nodes={nodes[0].children} />;
  return <Blocks nodes={nodes} />;
}

function MdTableView({ node }: { node: MdTable }) {
  const [head, ...body] = node.children;
  const align = (i: number): 'End' | 'Center' | undefined => (node.align?.[i] === 'right' ? 'End' : node.align?.[i] === 'center' ? 'Center' : undefined);
  const columns = head.children.map((c, i) => ({ key: String(i), label: <Inline nodes={c.children} />, align: align(i) }));
  const empty = head.children.every(c => !toText(c).trim());
  const rows = body.map(r => Object.fromEntries(r.children.map((c, i) => [String(i), <Inline nodes={c.children} />])));
  return <DataTable columns={columns} rows={rows} hideHeader={empty} />;
}

function CardDirective({ node }: { node: ContainerDirective }) {
  const a = node.attributes ?? {};
  const kids = node.children as RootContent[];
  const head = kids[0]?.type === 'heading' ? kids[0] : undefined;
  const body = head ? kids.slice(1) : kids;
  const tag = a.etiqueta ? <Tag {...tagProps(a.tipo ?? undefined)} hideStateIcon>{a.etiqueta}</Tag> : null;
  return (
    <Card
      className="md-card"
      header={
        head ? (
          <CardHeader
            titleText={toText(head)}
            subtitleText={a.subtitulo ?? undefined}
            avatar={a.icone ? <Icon name={a.icone} /> : undefined}
            action={tag ?? undefined}
          />
        ) : undefined
      }
    >
      <div className="md-card-body">
        {!head && tag && <div className="md-card-tag">{tag}</div>}
        <Blocks nodes={body} />
      </div>
    </Card>
  );
}

function SpecialList({ node, kind }: { node: ContainerDirective; kind: 'termos' | 'checklist' | 'links' }) {
  const items = node.children.flatMap(c => (c.type === 'list' ? c.children : []));
  if (kind === 'termos') {
    return (
      <dl className="md-terms">
        {items.map((li, i) => {
          const p = li.children[0];
          const inl = p?.type === 'paragraph' ? p.children : [];
          // "termo — definição": divide no primeiro travessão
          const k = inl.findIndex(x => x.type === 'text' && x.value.includes(' — '));
          if (k < 0) return <dd key={i}><Inline nodes={inl} /></dd>;
          const t = inl[k] as { value: string };
          const cut = t.value.indexOf(' — ');
          const term: PhrasingContent[] = [...inl.slice(0, k), { type: 'text', value: t.value.slice(0, cut) }];
          const def: PhrasingContent[] = [{ type: 'text', value: t.value.slice(cut + 3) }, ...inl.slice(k + 1)];
          return (
            <Fragment key={i}>
              <dt><Inline nodes={term} /></dt>
              <dd><Inline nodes={def} /></dd>
            </Fragment>
          );
        })}
      </dl>
    );
  }
  const icon = kind === 'links' ? 'chain-link' : 'accept';
  return (
    <ul className={`md-icon-list md-${kind}`}>
      {items.map((li, i) => (
        <li key={i}>
          <Icon name={icon} className="md-icon-list-ic" />
          <span><Flow nodes={li.children} /></span>
        </li>
      ))}
    </ul>
  );
}

function Figure({ name, caption }: { name: string; caption?: RootContent[] }) {
  const svg = figure(name);
  return (
    <figure className="md-figure">
      <div className="md-figure-art" dangerouslySetInnerHTML={{ __html: svg ?? `<p class="md-missing">Figura não encontrada: docs/figuras/${name}</p>` }} />
      {caption && caption.length > 0 && <figcaption><Flow nodes={caption} /></figcaption>}
    </figure>
  );
}

function Directive({ node }: { node: ContainerDirective | LeafDirective }) {
  const extras = useContext(MdExtras);
  const a = node.attributes ?? {};
  if (node.type === 'leafDirective') {
    if (node.name === 'laboratorio') {
      const Lab = a.id ? LABS[a.id] : undefined;
      return Lab ? <Lab /> : <MessageStrip design="Negative" hideCloseButton>Laboratório “{a.id}” não existe.</MessageStrip>;
    }
    if (node.name === 'figura' && a.arquivo) return <Figure name={a.arquivo} />;
    const extra = extras[node.name];
    if (extra) return <>{extra()}</>;
    return null;
  }
  const kids = node.children as RootContent[];
  if (STRIP[node.name]) {
    return (
      <MessageStrip className="md-strip" design={STRIP[node.name]} hideCloseButton>
        <Flow nodes={kids} />
      </MessageStrip>
    );
  }
  switch (node.name) {
    case 'cartao': return <CardDirective node={node} />;
    case 'colunas': return <div className={`md-cols md-cols-${a.n === '3' ? 3 : 2}`}><Blocks nodes={kids} /></div>;
    case 'figura': return <Figure name={a.arquivo ?? ''} caption={kids} />;
    case 'termos': case 'checklist': case 'links': return <SpecialList node={node} kind={node.name} />;
    default: return <div className={`md-${node.name}`}><Blocks nodes={kids} /></div>;
  }
}

function block(n: RootContent, i: number): ReactNode {
  switch (n.type) {
    case 'paragraph': return <p key={i} className="md-p"><Inline nodes={n.children} /></p>;
    case 'heading': {
      const level = Math.min(6, n.depth + 0) as 1 | 2 | 3 | 4 | 5 | 6;
      return <Title key={i} level={`H${level}`} size={level <= 2 ? 'H3' : level === 3 ? 'H5' : 'H6'} className="md-h" wrappingType="Normal"><Inline nodes={n.children} /></Title>;
    }
    case 'code': {
      const title = n.meta?.match(/title="([^"]*)"/)?.[1];
      return <CodeBlock key={i} code={n.value} lang={n.lang ?? 'abap'} title={title} />;
    }
    case 'list': {
      const L = n.ordered ? 'ol' : 'ul';
      return <L key={i} className="md-list" start={n.start ?? undefined}>{n.children.map((li, j) => <li key={j}><Flow nodes={li.children} /></li>)}</L>;
    }
    case 'table': return <MdTableView key={i} node={n} />;
    case 'blockquote': return <blockquote key={i} className="md-quote"><Blocks nodes={n.children} /></blockquote>;
    case 'thematicBreak': return <hr key={i} className="md-hr" />;
    case 'containerDirective': case 'leafDirective': return <Directive key={i} node={n} />;
    default: return null;
  }
}

export function Blocks({ nodes }: { nodes: RootContent[] }) {
  return <>{nodes.map(block)}</>;
}

export const plain = (n: Nodes | Nodes[]) => toText(n);
