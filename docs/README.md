# Como editar o conteúdo

Todo o texto do site está nesta pasta, em Markdown. Não é preciso mexer no código para corrigir uma explicação, trocar um exemplo, adicionar uma questão ou criar uma lição. Com `npm run dev` rodando, a página recarrega sozinha a cada arquivo salvo.

```
docs/
├── inicio.md          página inicial
├── referencia.md      referência rápida (tabela de sintaxe e glossário)
├── simulado.md        textos do simulado
├── figuras/           ilustrações SVG usadas nas lições
└── cursos/
    └── 1-programacao-abap-basica/
        ├── _curso.md               dados do curso
        ├── 01-primeiros-passos.md  lição (o nome vira a URL: #primeiros-passos)
        └── …
```

A ordem das lições segue o número no início do nome do arquivo. O que vem depois do número é o endereço da lição.

## Cabeçalho da lição

Cada lição começa com um bloco YAML entre `---`:

```yaml
---
titulo: Primeiros passos
subtitulo: ABAP Cloud, Eclipse ADT, pacotes e sua primeira classe executável.
unidade: "1"                # unidade na SAP Learning
duracao: 1 h 25 min
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

Linguagens com realce: `abap`, `cds`, `bdl`, `ddl` e `dcl`.

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

## Quiz

No fim da lição, dentro de `:::quiz`, cada `###` é uma pergunta. Marque a alternativa certa com `[x]` e escreva a explicação em uma citação (`>`):

```md
:::quiz
### Qual atalho ativa o objeto no ADT?

- [ ] :kbd[F8]
- [x] :kbd[Ctrl+F3]
- [ ] :kbd[Ctrl+1]

> Ctrl+F3 ativa. F8 abre o Data Preview.
:::
```

O simulado sorteia suas questões de todos os quizzes. Uma questão nova entra no simulado automaticamente.

## Documentação oficial

Os links do fim da lição ficam em `:::documentacao`, como uma lista de links. O link da unidade na SAP Learning é acrescentado automaticamente.

```md
:::documentacao
- [Cheat sheet: ABAP SQL](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/03_ABAP_SQL.md)
:::
```

## Ícones

Os nomes vêm da biblioteca de ícones SAP: [ui5.github.io/webcomponents/icons](https://ui5.github.io/webcomponents/icons/) (ex.: `cloud`, `database`, `key`, `source-code`). O build importa só os ícones citados nos arquivos e avisa se um nome não existir.

## Nova lição ou novo curso

- **Lição:** crie `NN-endereco.md` na pasta do curso, com o cabeçalho, as seções, o `:::quiz` e o `:::documentacao`.
- **Curso:** crie uma pasta `N-nome-do-curso/` com um `_curso.md` contendo `numero`, `titulo`, `titulo_en`, `icone` e `cor` (1 a 10). O texto abaixo do cabeçalho é a descrição do curso.
- **Laboratório:** é a única parte que exige código. Crie o componente em `src/labs/` e registre-o em `src/labs/index.ts`.

Comentários `<!-- … -->` podem ser usados livremente e não aparecem no site.
