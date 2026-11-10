# Como editar o conteúdo

Todo o texto do site está nesta pasta, em Markdown. Não é preciso mexer no código para corrigir uma explicação, trocar um exemplo ou criar uma lição. Com `npm run dev` rodando, a página recarrega sozinha a cada arquivo salvo.

```
docs/
├── inicio.md          página inicial
├── referencia.md      referência rápida (tabela de sintaxe e glossário)
├── figuras/           ilustrações SVG usadas nas lições
├── arquitetura/       diagramas draw.io (fonte editável; não entram no site)
└── modulos/
    └── 1-abap-overview/          módulo (sem o número, vira a URL: #abap-overview)
        ├── _modulo.md              dados do módulo
        ├── 01-linguagem-abap.md    lição (o nome vira a URL: #linguagem-abap)
        └── …
```

A ordem das lições segue o número no início do nome do arquivo. O que vem depois do número é o endereço da lição, que precisa ser único em todo o site: mudar uma lição de módulo não muda o endereço dela.

## Cabeçalho da lição

Cada lição começa com um bloco YAML entre `---`:

```yaml
---
titulo: Primeiros passos
subtitulo: ABAP Cloud, Eclipse ADT, pacotes e sua primeira classe executável.
duracao: 1 h 25 min
sap_learning: Basic ABAP Programming · unidade 1   # opcional: unidade de origem na SAP Learning
icone: play                 # nome de um ícone SAP (ver abaixo)
objetivos:
  - Explicar o que é ABAP Cloud e clean core
  - Criar e ativar uma classe
palavras_chave: eclipse adt pacote hello world   # ajudam a pesquisa
---
```

## Seções

Cada título `##` vira uma seção da página e uma aba na barra de navegação da lição. Entre chaves, no fim do título, vão o rótulo curto da aba e o ícone:

```md
## O que muda com o ABAP Cloud {ancora="ABAP Cloud" icone="cloud"}
```

Use `###` para subtítulos dentro de uma seção.

## Markdown comum

Negrito (`**texto**`), itálico (`*texto*`), `código`, links, listas e tabelas funcionam normalmente. Tabelas viram tabelas UI5. Links internos usam `#` e o endereço da lição, por exemplo `[Estruturas](#estruturas)`.

Blocos de código levam a linguagem e um título opcional:

````md
```abap title="ZCL_HELLO_WORLD"
out->write( `Hello World` ).
```
````

Linguagens com realce: `abap`, `cds`, `bdl`, `ddl` e `dcl`. Outras, como `xml`, aparecem sem realce de palavras-chave.

## Blocos especiais

| Sintaxe | Resultado |
| :--- | :--- |
| `:::nota` … `:::` | Faixa de informação (azul) |
| `:::aviso` … `:::` | Faixa de atenção (laranja) |
| `:::sucesso` … `:::` | Faixa de sucesso (verde) |
| `:::erro` … `:::` | Faixa de erro (vermelho) |
| `:::cartao` … `:::` | Cartão. Um `###` logo no início vira o título do cartão. |
| `:::cartao{etiqueta="Permitido" tipo="sucesso"}` | Cartão com etiqueta colorida |
| `:::colunas{n="2"}` … `:::` | Coloca os blocos internos lado a lado (2 ou 3 colunas) |
| `:::termos` com `- termo — definição` | Lista de termos e definições |
| `:::checklist` / `:::links` | Listas com ícone de visto / de link |
| `::figura{arquivo="nome.svg"}` | Ilustração de `docs/figuras` |
| `:::figura{arquivo="nome.svg"}` legenda `:::` | Ilustração com legenda |
| `::laboratorio{id="hello"}` | Laboratório interativo |
| `::modulos` | Bloco gerado da página inicial (cards dos módulos) |
| `:kbd[Ctrl+F3]` | Tecla |
| `:tag[texto]{tipo="aviso"}` | Etiqueta dentro do texto |

Valores de `tipo`: `sucesso`, `aviso`, `erro`, `info`, `neutro`, `c5`, `c7` ou `cor-1` a `cor-10`.

Para colocar um bloco dentro de outro, o bloco de fora precisa de mais `:` que o de dentro:

```md
::::colunas{n="2"}
:::cartao
### Passo a passo
1. …
:::

:::cartao
### Atalhos
…
:::
::::
```

## Documentação oficial

Os links do fim da lição ficam em `:::documentacao`, como uma lista de links. Se o cabeçalho tiver `sap_learning`, o link da unidade na SAP Learning é acrescentado automaticamente.

```md
:::documentacao
- [Cheat sheet: ABAP SQL](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/03_ABAP_SQL.md)
:::
```

## Ícones

Os nomes vêm da biblioteca de ícones SAP: [ui5.github.io/webcomponents/icons](https://ui5.github.io/webcomponents/icons/) (ex.: `cloud`, `database`, `key`, `source-code`). O build importa só os ícones citados nos arquivos e avisa se um nome não existir.

## Nova lição ou novo módulo

- **Lição:** crie `NN-endereco.md` na pasta do módulo, com o cabeçalho, as seções e o `:::documentacao`.
- **Módulo:** crie uma pasta `N-nome-do-modulo/` com um `_modulo.md` contendo `numero`, `titulo`, `icone` e `cor` (1 a 10). O texto abaixo do cabeçalho é a descrição do módulo. A ordem dos módulos vem do campo `numero`, não do nome da pasta.
- **Mover uma lição:** mova o arquivo para a pasta do outro módulo e ajuste o número. Os links continuam valendo.
- **Laboratório:** é a única parte que exige código. Crie o componente em `src/labs/` e registre-o em `src/labs/index.ts`.

Comentários `<!-- … -->` podem ser usados livremente e não aparecem no site.
