---
titulo: Modularização e paradigmas
subtitulo: Sub-rotinas FORM e PERFORM, includes, macros e a passagem do procedural para o orientado a objetos.
duracao: "50 min"
icone: split
objetivos:
  - Separar modularização de código-fonte e modularização por procedimentos
  - Ler sub-rotinas FORM e PERFORM em código legado
  - Explicar por que FORM é obsoleto
  - Usar INCLUDE apenas para organizar um programa
  - Comparar o paradigma procedural com o orientado a objetos
palavras_chave: modularização form perform endform using changing tables include top include macro define procedural orientado a objetos método módulo de função
---

## Por que modularizar {ancora="Visão geral" icone="split"}

Modularizar é dividir um programa em partes com nome, cada uma com uma responsabilidade. O ganho é triplo: o código fica legível, o mesmo trecho é reaproveitado e cada parte pode ser testada sozinha. O ABAP acumulou, ao longo de décadas, várias técnicas para isso. Elas se dividem em dois grupos.

::::colunas{n="2"}
:::cartao{etiqueta="Código-fonte" tipo="neutro"}
### Modularização de código-fonte

O texto é copiado para dentro do programa antes da compilação. Não há interface nem dados próprios.

- **Includes** (`INCLUDE`)
- **Macros** (`DEFINE … END-OF-DEFINITION`)
:::

:::cartao{etiqueta="Procedimentos" tipo="info"}
### Modularização por procedimentos

Blocos chamados em tempo de execução, com **interface de parâmetros** e **dados locais**.

- **Sub-rotinas** (`FORM`), obsoletas
- **Módulos de função** (`FUNCTION`)
- **Métodos** (`METHOD`)
:::
::::

| Técnica | Onde vive | Interface | Reúso entre programas | Situação |
| --- | --- | --- | --- | --- |
| Include | Programa do tipo include | Nenhuma | Não recomendado | Só para organizar programas grandes |
| Macro | No próprio programa | Posicional (`&1`…`&9`) | Não | Evite; não é depurável |
| Sub-rotina | Programa, grupo de funções | Posicional, tipagem fraca | Possível, mas frágil | **Obsoleta** |
| Módulo de função | Grupo de funções | Nomeada, mantida na SE37 | Sim, inclusive remoto (RFC) | Em uso para RFC, update e bloqueios |
| Método | Classe local ou global | Nomeada, verificada na compilação | Sim | **Recomendado** |

## Sub-rotinas: FORM e PERFORM {ancora="FORM e PERFORM" icone="history"}

Em programas clássicos, o procedimento padrão era a **sub-rotina**: definida com `FORM … ENDFORM` e chamada com `PERFORM`.

```abap title="Sub-rotina em um report clássico (Standard ABAP)"
REPORT zflight_seats.

DATA free_seats TYPE i.

START-OF-SELECTION.
  PERFORM calc_free_seats USING    385 371
                          CHANGING free_seats.
  WRITE: / 'Assentos livres:', free_seats.

FORM calc_free_seats USING    seats_max TYPE i
                              seats_occ TYPE i
                     CHANGING free      TYPE i.
  free = seats_max - seats_occ.
ENDFORM.
```

:::termos
- `USING` — Parâmetros de entrada. Sem `VALUE( )`, são passados **por referência** e podem ser alterados por engano.
- `CHANGING` — Parâmetros de entrada e saída.
- `TABLES` — Tabelas internas com linha de cabeçalho; forma mais antiga ainda.
- `PERFORM … IN PROGRAM …` — Chama a sub-rotina de **outro** programa, sem nenhum contrato entre os dois.
:::

### Por que são obsoletas

:::checklist
- Os parâmetros são **posicionais**: trocar a ordem de dois argumentos do mesmo tipo compila e produz um resultado errado.
- A tipagem é opcional. Um parâmetro sem tipo aceita qualquer coisa e o erro só aparece em runtime.
- A sub-rotina enxerga e altera todos os **dados globais** do programa. Não há encapsulamento.
- Não existe visibilidade: qualquer programa pode chamar qualquer `FORM`.
- Não há valor de retorno, então não cabem em expressões.
:::

Sub-rotinas não podem ser criadas em classes e **não existem** no ABAP Cloud. Em código novo, o substituto direto é um método de uma classe local:

```abap title="O mesmo cálculo como método"
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS free_seats
      IMPORTING seats_max     TYPE i
                seats_occ     TYPE i
      RETURNING VALUE(result) TYPE i.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD free_seats.
    result = seats_max - seats_occ.
  ENDMETHOD.
ENDCLASS.

" Chamada: parâmetros nomeados, resultado usado na expressão
DATA(free) = lcl_flight=>free_seats( seats_max = 385 seats_occ = 371 ).
```

## Includes {ancora="INCLUDE" icone="document-text"}

Um **include** é um programa do tipo I que não roda sozinho. O comando `INCLUDE nome.` insere o texto dele naquele ponto, **antes da compilação**. O resultado é exatamente o mesmo de ter escrito tudo em um arquivo só.

```abap title="Estrutura típica de um programa grande"
REPORT zflight_report.

INCLUDE zflight_report_top.    " declarações globais (TOP include)
INCLUDE zflight_report_sel.    " tela de seleção
INCLUDE zflight_report_cls.    " classes locais
INCLUDE zflight_report_f01.    " sub-rotinas, em código antigo
```

Includes são a base de três tipos de programa que você vai encontrar: **grupos de funções** (um include por módulo de função), **module pools** de dynpros e as próprias **classes globais**, que o sistema divide em includes por seção e por método.

:::aviso
Um include **não é uma unidade de reúso**. Incluir o mesmo include em dois programas cria duas cópias do código, que dependem de variáveis com o mesmo nome nos dois lugares. Uma alteração feita para um programa pode quebrar o outro, e o erro só aparece na ativação dele. Para reaproveitar, use uma classe global.
:::

## Macros {ancora="Macros" icone="text-formatting"}

`DEFINE nome. … END-OF-DEFINITION.` cria uma abreviação de texto com até nove marcadores (`&1` a `&9`), expandida na compilação. Macros não têm tipos, não são depuráveis passo a passo e só valem no programa que as define. Aparecem em código antigo para encurtar trechos repetidos; hoje um método ou uma expressão construtora resolve o mesmo caso.

## Dois paradigmas {ancora="Paradigmas" icone="compare"}

::::colunas{n="2"}
:::cartao{etiqueta="Procedural" tipo="c7"}
### Programa no centro

Dados globais declarados no topo; sub-rotinas e módulos de função que os leem e alteram. O estado pertence ao **programa** ou ao **grupo de funções**, e existe uma única cópia dele por sessão interna.
:::

:::cartao{etiqueta="Orientado a objetos" tipo="c5"}
### Objeto no centro

Dados e comportamento ficam juntos na **classe**. Cada instância tem o próprio estado, protegido por seções de visibilidade. Interfaces e herança permitem trocar implementações sem mexer em quem usa.
:::
::::

A recomendação da SAP é direta: **ABAP Objects para tudo o que for novo**. Blocos procedurais ficam restritos ao que a técnica exige, como o módulo de função que recebe uma chamada RFC, e mesmo ali o ideal é o módulo apenas repassar a chamada para um método. As próximas lições seguem essa ordem: [Módulos de função](#function-modules), [Classes locais](#classes-locais) e [Classes globais](#classes-globais).

:::documentacao
- [ABAP Keyword Documentation: FORM](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapform.htm)
- [ABAP Keyword Documentation: INCLUDE](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapinclude_prog.htm)
- [ABAP Keyword Documentation: diretriz "ABAP Objects as a Programming Model"](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenabap_obj_progr_model_guidl.htm)
- [Cheat sheet: Program Flow Logic](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/13_Program_Flow_Logic.md)
:::
