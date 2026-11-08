---
titulo: Técnicas básicas
subtitulo: Variáveis, tipos, cálculos, condições, repetições e o debugger.
unidade: "2"
duracao: "3 h 49 min"
icone: syntax
objetivos:
  - Declarar objetos de dados e tipos
  - Escrever expressões aritméticas
  - Usar IF, CASE, DO e WHILE
  - Depurar com breakpoints
palavras_chave: data types constants inline div mod if case do while debug breakpoint sy-index xsdbool
---

## Objetos de dados e tipos {ancora="Objetos de dados" icone="database"}

Um **objeto de dados** é uma área de memória com nome e tipo. Você declara variáveis com `DATA`, tipos próprios com `TYPES` e valores fixos com `CONSTANTS`. A **declaração inline** `DATA( )` deixa o compilador deduzir o tipo pelo lado direito.

```abap title="Declarações"
TYPES ty_price TYPE p LENGTH 8 DECIMALS 2.

DATA carrier   TYPE c LENGTH 3.          " texto de tamanho fixo
DATA seats     TYPE i VALUE 180.          " inteiro com valor inicial
DATA price     TYPE ty_price.
CONSTANTS c_max_seats TYPE i VALUE 300.

DATA(city)  = `Recife`.                   " string (crase)
DATA(count) = 10.                         " i
DATA(code)  = 'LH'.                       " c LENGTH 2 (aspas simples)
```

:::cartao{icone="table-view" subtitulo="Valor inicial é o que a variável contém antes de qualquer atribuição."}
### Tipos ABAP embutidos mais usados

| Tipo | Uso | Tamanho | Valor inicial |
| --- | --- | --- | --- |
| `i` | Inteiro de 4 bytes | ±2.147.483.647 | `0` |
| `int8` | Inteiro de 8 bytes | ±9,2 × 10¹⁸ | `0` |
| `p` | Número decimal compactado (valores monetários) | 1–16 bytes, até 14 decimais | `0` |
| `decfloat34` | Ponto flutuante decimal | 34 dígitos | `0` |
| `c` | Texto de tamanho fixo | 1–262.143 caracteres | espaços |
| `string` | Texto de tamanho variável | dinâmico | string vazia |
| `n` | Texto numérico (só dígitos) | 1–262.143 | `'000…'` |
| `d / t` | Data AAAAMMDD / hora HHMMSS | 8 / 6 caracteres | `'00000000'` |
| `abap_bool` | Booleano (`abap_true` = 'X') | c LENGTH 1 | espaço (falso) |
:::

## Expressões aritméticas {ancora="Cálculos" icone="measure"}

Os operadores são `+ - * / **`, além de `DIV` (divisão inteira) e `MOD` (resto). Uma pegadinha clássica: quando o resultado vai para um inteiro, `/` **arredonda** em vez de truncar. E em ABAP o resultado de `MOD` nunca é negativo.

::laboratorio{id="divcalc"}

## Estruturas de controle {ancora="Controle" icone="process"}

:::colunas{n="2"}
```abap title="Condições"
IF seats > c_max_seats.
  out->write( `Lotado` ).
ELSEIF seats IS INITIAL.
  out->write( `Sem reservas` ).
ELSE.
  out->write( |Livres: { c_max_seats - seats }| ).
ENDIF.

CASE carrier.
  WHEN 'LH' OR 'LX'.
    out->write( `Grupo Lufthansa` ).
  WHEN OTHERS.
    out->write( `Outra companhia` ).
ENDCASE.
```

```abap title="Repetições"
DO 3 TIMES.
  out->write( |Volta { sy-index }| ).
ENDDO.

DATA(n) = 0.
WHILE n < 5.
  n += 1.
  IF n = 2.
    CONTINUE.        " pula para a próxima volta
  ENDIF.
  IF n = 4.
    EXIT.            " sai do laço
  ENDIF.
ENDWHILE.

" Condição como valor booleano
DATA(is_full) = xsdbool( seats >= c_max_seats ).
```
:::

:::nota
**sy-index** conta as voltas de `DO` e `WHILE`. Em `LOOP AT` sobre tabelas internas o contador é **sy-tabix**.
:::

## Depurando no ADT {ancora="Debugger" icone="developer-settings"}

:::::colunas{n="2"}
:::cartao
### Breakpoints

Dê duplo clique na régua à esquerda do código (ou :kbd[Ctrl+Shift+B]). Ao executar com :kbd[F9], o ADT pergunta se deseja abrir a perspectiva **Debug**.
:::

::::cartao
### Navegação

:::termos
- :kbd[F5] — Step into (entra no método)
- :kbd[F6] — Step over (próxima instrução)
- :kbd[F7] — Step return (volta ao chamador)
- :kbd[F8] — Resume (até o próximo breakpoint)
:::
::::
:::::

:::quiz
### Qual o tipo deduzido em `DATA(code) = 'LH'.`?

- [ ] `string`
- [x] `c LENGTH 2`
- [ ] `n LENGTH 2`
- [ ] `abap_bool`

> Aspas simples criam um literal de texto do tipo c com o tamanho do literal. Crases criam string.

### Qual o valor de `-7 MOD 3` em ABAP?

- [ ] -1
- [ ] 1
- [x] 2
- [ ] -2

> Em ABAP o resultado de MOD nunca é negativo: -7 = 3 × (-3) + 2.

### Dentro de um `DO … ENDDO`, qual campo do sistema conta as voltas?

- [ ] `sy-tabix`
- [x] `sy-index`
- [ ] `sy-dbcnt`
- [ ] `sy-subrc`

> sy-index conta voltas de DO e WHILE. sy-tabix é o índice da linha em LOOP AT.
:::

:::documentacao
- [DATA](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapdata.htm)
- [TYPES](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abaptypes.htm)
- [IF](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapif.htm)
- [CASE](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapcase.htm)
- [DO](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapdo.htm)
- [Cheat sheet: Data Types and Data Objects](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/16_Data_Types_and_Objects.md)
- [Cheat sheet: Program Flow Logic](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/13_Program_Flow_Logic.md)
:::
