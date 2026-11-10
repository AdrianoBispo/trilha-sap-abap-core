---
titulo: Modelagem e tipos globais
subtitulo: ABAP Dictionary, CDS, domínios e elementos de dados.
sap_learning: "Data Modeling in ABAP Dictionary and ABAP CDS · unidade 1 + 3"
duracao: "3 h 23 min"
icone: org-chart
objetivos:
  - Descrever as tarefas do Dictionary e do CDS
  - Nomear os principais objetos
  - Diferenciar domínio e elemento de dados
  - Usar tipos globais
palavras_chave: dictionary domínio elemento de dados data element domain estrutura tipo de tabela tipos embutidos
---

## ABAP Dictionary e ABAP CDS {ancora="Dicionário" icone="database"}

O **ABAP Dictionary** descreve tipos e tabelas de banco de forma central: o que você define ali pode ser usado em qualquer programa. O **ABAP CDS** (*Core Data Services*) acrescenta modelos semânticos sobre essas tabelas, como views, associações e regras de acesso.

:::::colunas{n="2"}
::::cartao
### Objetos do Dictionary

:::termos
- Domínio — Tipo técnico, tamanho e valores fixos.
- Elemento de dados — Significado de negócio e rótulos de campo.
- Estrutura — Tipo estruturado global.
- Tipo de tabela — Tipo global de tabela interna.
- Tabela de banco — Definição da tabela física.
:::
::::

::::cartao
### Objetos CDS

:::termos
- View entity — Leitura modelada, com joins, associações e cálculos.
- Abstract / custom entity — Tipos e entidades sem persistência própria.
- Access control (DCL) — Regras de autorização por linha.
- Metadata extension — Anotações de UI separadas da view.
- Behavior definition — Comportamento transacional RAP.
:::
::::
:::::

## Domínio, elemento de dados e campo {ancora="Domínio e elemento" icone="org-chart"}

::figura{arquivo="modelagem-1.svg"}

```abap title="Tipos globais em uso"
" Elemento de dados como tipo de variável
DATA status TYPE /dmo/travel_status.

" Estrutura global (Dictionary) como tipo de linha
DATA travel TYPE /dmo/travel.

" Tipo de tabela global
DATA travels TYPE /dmo/t_travel.
```

## Tipos embutidos do Dictionary {ancora="Tipos do Dictionary" icone="table-view"}

| Tipo | Uso | Equivale em ABAP |
| --- | --- | --- |
| `abap.char( n )` | Texto fixo | `c LENGTH n` |
| `abap.numc( n )` | Texto numérico | `n LENGTH n` |
| `abap.int4 / int8` | Inteiros | `i / int8` |
| `abap.dec( l, d )` | Decimal | `p` |
| `abap.curr( l, d ) + abap.cuky` | Valor monetário e moeda | `p + c(5)` |
| `abap.quan( l, d ) + abap.unit` | Quantidade e unidade | `p + c(3)` |
| `abap.dats / abap.tims` | Data e hora | `d / t` |
| `abap.string( 0 )` | Texto longo | `string` |
| `abap.clnt` | Mandante | `c LENGTH 3` |

:::documentacao
- [Cheat sheet: ABAP Dictionary](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/26_ABAP_Dictionary.md)
- [Cheat sheet: Data Types and Data Objects](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/16_Data_Types_and_Objects.md)
:::
