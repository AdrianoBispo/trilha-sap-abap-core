# Trilha ABAP Core: site de estudo interativo

Site de estudo de SAP ABAP em 22 lições que segue a jornada [**Acquiring Core ABAP Skills**](https://learning.sap.com/learning-journeys/acquire-core-abap-skills) da SAP Learning. Feito com **Vite + React + TypeScript** e a biblioteca [**UI5 Web Components**](https://ui5.github.io/webcomponents/) da SAP, com o visual SAP Horizon nos temas claro (Morning Horizon) e escuro (Evening Horizon).

Cada lição traz objetivos, explicação, código ABAP/CDS comentado, ilustrações, um laboratório interativo, um quiz e links para a documentação oficial. Há também uma referência rápida de sintaxe com glossário e um simulado de certificação com 15 questões e nota mínima de 65%.

## Conteúdo

| Curso | Lições |
| :--- | :--- |
| **1. Programação ABAP básica** (Basic ABAP Programming) | Primeiros passos · Técnicas básicas · Classes locais · Lendo dados do banco · Estruturas · Tabelas internas · Business objects e EML · Modelo RAP |
| **2. Programação ABAP intermediária** (Intermediate ABAP Programming) | Análise, testes e documentação · Tipos e conversões · Processando texto · Code pushdown em ABAP SQL · Performance de tabelas internas · Verificações de autorização · Orientação a objetos eficaz · Classes de exceção |
| **3. Dicionário ABAP e CDS** (Data Modeling in ABAP Dictionary and ABAP CDS) | Modelagem e tipos globais · Tabelas de banco · CDS view entities · Relações e associações · Code pushdown em CDS · Anotações e meta objetos |

## Como rodar

Requer Node.js 22 ou mais novo.

```bash
npm install
npm run dev       # servidor de desenvolvimento em http://localhost:5173
npm run build     # verificação de tipos + build estático em dist/
npm run preview   # serve o build
```

O build gera um site estático (rotas por `#hash`), que pode ser publicado em qualquer hospedagem estática. O `vercel.json` já traz a configuração para a Vercel. O progresso das lições e o tema escolhido ficam no `localStorage` do navegador.

## Editar o conteúdo

**Todo o texto fica em [`docs/`](docs/), em Markdown.** Para corrigir uma explicação, incluir uma questão ou criar uma lição, edite os arquivos `.md`, sem tocar no código. O guia completo da sintaxe está em [`docs/README.md`](docs/README.md).

```
docs/
├── inicio.md, referencia.md, simulado.md
├── figuras/*.svg
└── cursos/<n>-<curso>/_curso.md e NN-<lição>.md
```

## Estrutura do código

| Caminho | Conteúdo |
| :--- | :--- |
| `vite-plugin-docs.ts` | Converte cada `.md` de `docs/` em árvore mdast no build. O navegador não carrega o parser. |
| `vite-plugin-doc-icons.ts` | Importa só os ícones SAP citados nos Markdown |
| `src/content/` | Leitura dos documentos: cursos, lições, quizzes, seções |
| `src/render/Markdown.tsx` | Renderiza o Markdown com componentes UI5 (Card, MessageStrip, Table, Tag, Link…) |
| `src/pages/` | Início, lição (ObjectPage), referência (ObjectPage) e simulado (DynamicPage) |
| `src/labs/` | Os 20 laboratórios interativos |
| `src/components/` | Bloco de código com realce ABAP/CDS, quiz, tabela UI5 |
| `src/state/store.ts` | Rota, progresso, tema e toast |
| `src/styles/` | Fontes 72 locais, paleta das ilustrações e layout. Todas as cores vêm dos parâmetros de tema `--sap…` do Horizon. |

## Créditos e licenças

- Componentes, temas e ícones: [UI5 Web Components](https://github.com/UI5/webcomponents) (Apache-2.0).
- Fontes 72/72 Mono do pacote [`@sap-theming/theming-base-content`](https://www.npmjs.com/package/@sap-theming/theming-base-content) (Apache-2.0, cópia em `src/assets/fonts/LICENSE-sap-theming.txt`), servidas localmente.
- Estrutura inspirada no [Almanaque ABAP](https://bmoreiraribeiro.github.io/ABAP/).
- Referências: [ABAP Keyword Documentation](https://help.sap.com/doc/abapdocu_cp_index_htm/CLOUD/en-US/index.htm) e [ABAP cheat sheets](https://github.com/SAP-samples/abap-cheat-sheets) da SAP.

Projeto de estudo independente, sem vínculo com a SAP. SAP, ABAP, SAP Fiori e SAP Horizon são marcas da SAP SE.
