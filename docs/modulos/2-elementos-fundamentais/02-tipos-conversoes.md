---
titulo: Tipos e conversões
subtitulo: Regras de conversão, CONV, EXACT e tipo de cálculo.
sap_learning: "Intermediate ABAP Programming · unidade 2"
duracao: "2 h 25 min"
icone: restart
objetivos:
  - Prever conversões implícitas
  - Usar CONV e EXACT
  - Entender o tipo de cálculo
  - Evitar perdas silenciosas
palavras_chave: conversão conv exact arredondamento overflow cx_sy_conversion decfloat34 tipo de cálculo
---

## Conversões implícitas {ancora="Regras de conversão" icone="restart"}

Quando você atribui um valor a uma variável de outro tipo, o ABAP **converte automaticamente** seguindo regras fixas. Elas são práticas, mas podem surpreender: textos são cortados sem aviso, números são arredondados, e datas não são validadas.

::laboratorio{id="convlab"}

## Conversão explícita e sem perdas {ancora="CONV e EXACT" icone="copy"}

::::colunas{n="2"}
```abap title="Operadores de construção"
DATA(amount) = CONV decfloat34( '1234.565' ).

" Força o tipo de um parâmetro na chamada
out->write( CONV string( 42 ) ).

" EXACT: lança exceção se houver perda
TRY.
    DATA(rounded) = EXACT i( '3.5' ).
  CATCH cx_sy_conversion_rounding.
    out->write( `Haveria arredondamento` ).
ENDTRY.

TRY.
    DATA(day) = EXACT d( '20261332' ).
  CATCH cx_sy_conversion_no_date.
    out->write( `Data inválida` ).
ENDTRY.
```

:::cartao
### Tipo deduzido na declaração inline

| Código | Tipo resultante |
| --- | --- |
| `DATA(a) = 5.` | `i` |
| `DATA(b) = '5'.` | `c LENGTH 1` |
| ``DATA(c) = `5`.`` | `string` |
| `DATA(d) = '3.14'.` | `c LENGTH 4 (texto!)` |
| `DATA(e) = CONV decfloat34( '3.14' ).` | `decfloat34` |
| `DATA(f) = cl_abap_context_info=>get_system_date( ).` | `d` |
:::
::::

## Tipo de cálculo em expressões {ancora="Tipo de cálculo" icone="measure"}

Antes de calcular, o ABAP escolhe um **tipo de cálculo** com base em todos os operandos *e* no destino. A hierarquia é `i` → `int8` → `p` → `decfloat34`: vale o tipo mais “forte” presente. Isso explica por que `DATA(x) = 7 / 2.` resulta em 4 e não em 3,5.

```abap title="Exemplos"
DATA int  TYPE i.
DATA pack TYPE p LENGTH 8 DECIMALS 2.

int  = 7 / 2.                    " 4    (cálculo em i, arredondado)
pack = 7 / 2.                    " 3.50 (cálculo em p por causa do destino)
DATA(x) = 7 / 2.                 " 4    (tipo deduzido: i)
DATA(y) = CONV decfloat34( 7 ) / 2.  " 3.5
```

:::quiz
### Qual o resultado de atribuir o texto `'12.5'` a uma variável do tipo `i`?

- [ ] 12
- [x] 13
- [ ] 12.5
- [ ] Exceção

> A conversão para i arredonda comercialmente: 12,5 vira 13.

### Atribuir `'A1B2C3'` a uma variável `n LENGTH 6` resulta em:

- [ ] `A1B2C3`
- [x] `000123`
- [ ] `123000`
- [ ] Exceção

> Para n, só os dígitos são passados, alinhados à direita e completados com zeros.

### Qual operador lança exceção se a conversão perder informação?

- [ ] `CONV`
- [ ] `CAST`
- [x] `EXACT`
- [ ] `VALUE`

> EXACT verifica perda (ex.: arredondamento) e lança exceção, ao contrário de CONV.
:::

:::documentacao
- [Conversion Rules](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenconversion_rules.htm)
- [Cheat sheet: Data Types and Data Objects](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/16_Data_Types_and_Objects.md)
- [Cheat sheet: Numeric Operations](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/29_Numeric_Operations.md)
:::
