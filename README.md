# Trilha ABAP Core: site de estudo interativo

Site de estudo de SAP ABAP em português, com 48 lições em 10 módulos: do funcionamento do servidor de aplicação ao RAP, passando por modularização, jobs, CDS, integração, enhancements e tratamento de erros. Parte das lições deriva da jornada [**Acquiring Core ABAP Skills**](https://learning.sap.com/learning-journeys/acquire-core-abap-skills) da SAP Learning. Feito com **Vite + React + TypeScript** e a biblioteca [**UI5 Web Components**](https://ui5.github.io/webcomponents/) da SAP, com o visual SAP Horizon nos temas claro (Morning Horizon) e escuro (Evening Horizon).

O site é organizado como um blog de documentação: cada módulo tem uma página própria (`#abap-overview`, `#elementos-fundamentais`…) com as lições em ordem, e cada lição é um artigo com objetivos, explicação, código ABAP/CDS comentado, ilustrações, laboratórios interativos e links para a documentação oficial. Na página do módulo e nas lições dele, um índice lateral lista as lições e as seções de cada uma, destacando a seção visível. Há também uma referência rápida de sintaxe com glossário.

## Conteúdo

| Módulo | Lições |
| :--- | :--- |
| **01 · ABAP Overview** | A linguagem ABAP · O servidor de aplicação ABAP · Do ABAP clássico à nuvem · LUW · Primeiros passos |
| **02 · Elementos fundamentais da linguagem ABAP** | Técnicas básicas · Tipos e conversões · Variáveis do sistema · Estruturas · Tabelas internas · Performance de tabelas internas · Modelagem e tipos globais · Tabelas de banco · Lendo dados do banco · Processando texto · Funções embutidas · Comentários e documentação |
| **03 · Técnicas de modularização** | Modularização e paradigmas · Módulos de função · Classes locais · Classes globais · Orientação a objetos eficaz · Análise e testes |
| **04 · Background jobs e programação paralela** | Background jobs · Application jobs e bgPF · Programação paralela |
| **05 · Modelagem e análise de dados** | CDS view entities · Relações e associações · Code pushdown em CDS · Anotações e meta objetos · Code pushdown em ABAP SQL · AMDP · Performance de consultas · Modelos analíticos em CDS |
| **06 · RAP Business Objects** | Modelo RAP · Business objects e EML · Verificações de autorização |
| **07 · Integração e conectividade no ABAP** | Integração no ABAP · RFC, BAPI e IDoc · HTTP, OData e eventos |
| **08 · ABAP Enhancement** | Enhancements clássicos · BAdIs · Extensibilidade no ABAP Cloud |
| **09 · ABAP: External Interfaces** | Arquivos e data clusters · XML e JSON |
| **10 · Tratamento de erros** | Erros no ABAP · Classes de exceção · Mensagens e logs |

Entre os laboratórios estão os simuladores do **Function Builder** (SE37) e do **Class Builder** (SE24), que mostram o código gerado a partir das abas dessas ferramentas.

## Como rodar

Requer Node.js 22 ou mais novo.

```bash
npm install
npm run dev       # servidor de desenvolvimento em http://localhost:5173
npm run build     # verificação de tipos + build estático em dist/
npm run preview   # serve o build
```

O build gera um site estático (rotas por `#hash`: `#inicio`, `#referencia`, `#<módulo>`, `#<lição>` e `#<lição>/<seção>`), que pode ser publicado em qualquer hospedagem estática. O `vercel.json` já traz a configuração para a Vercel. O tema escolhido fica no `localStorage` do navegador.

## Editar o conteúdo

**Todo o texto fica em [`docs/`](docs/), em Markdown.** Para corrigir uma explicação, incluir uma questão ou criar uma lição, edite os arquivos `.md`, sem tocar no código. O guia completo da sintaxe está em [`docs/README.md`](docs/README.md).

```
docs/
├── inicio.md, referencia.md
├── figuras/*.svg
├── arquitetura/*.drawio
└── modulos/<n>-<módulo>/_modulo.md e NN-<lição>.md
```

## Diagramas de arquitetura

A pasta [`docs/arquitetura/`](docs/arquitetura/) guarda três diagramas editáveis no [draw.io](https://app.diagrams.net/), no estilo do SAP Architecture Center: a arquitetura do servidor de aplicação ABAP, o gerenciamento de sessões e memória, e a SAP LUW. As figuras das lições correspondentes, em `docs/figuras/`, são versões simplificadas deles, desenhadas com a paleta do site para acompanhar os temas claro e escuro. O script `gerar_diagramas.py` documenta como os arquivos foram gerados; ele depende de uma biblioteca de ícones SAP local e não faz parte do build.

## Estrutura do código

| Caminho | Conteúdo |
| :--- | :--- |
| `vite-plugin-docs.ts` | Converte cada `.md` de `docs/` em árvore mdast no build. O navegador não carrega o parser. |
| `vite-plugin-doc-icons.ts` | Importa só os ícones SAP citados nos Markdown |
| `src/content/` | Leitura dos documentos: módulos, lições, seções |
| `src/render/Markdown.tsx` | Renderiza o Markdown com componentes UI5 (Card, MessageStrip, Table, Tag, Link…) |
| `src/pages/` | Início, página do módulo, lição e referência, no formato de artigo |
| `src/labs/` | Os 22 laboratórios interativos |
| `src/components/` | Índice lateral do módulo, cabeçalho de artigo, bloco de código com realce ABAP/CDS, tabela UI5 |
| `src/state/store.ts` | Rota, seção visível, tema e toast |
| `src/styles/` | Fontes 72 locais, paleta das ilustrações e layout. Todas as cores vêm dos parâmetros de tema `--sap…` do Horizon. |

## Créditos e licenças

- Componentes, temas e ícones: [UI5 Web Components](https://github.com/UI5/webcomponents) (Apache-2.0).
- Fontes 72/72 Mono do pacote [`@sap-theming/theming-base-content`](https://www.npmjs.com/package/@sap-theming/theming-base-content) (Apache-2.0, cópia em `src/assets/fonts/LICENSE-sap-theming.txt`), servidas localmente.
- Estrutura inspirada no [Almanaque ABAP](https://bmoreiraribeiro.github.io/ABAP/).
- Referências: [ABAP Keyword Documentation](https://help.sap.com/doc/abapdocu_cp_index_htm/CLOUD/en-US/index.htm) e [ABAP cheat sheets](https://github.com/SAP-samples/abap-cheat-sheets) da SAP.

Projeto de estudo independente, sem vínculo com a SAP. SAP, ABAP, SAP Fiori e SAP Horizon são marcas da SAP SE.
