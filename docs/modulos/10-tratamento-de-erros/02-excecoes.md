---
titulo: Classes de exceção
subtitulo: "Hierarquia, TRY…CATCH e exceções próprias com mensagens."
sap_learning: "Intermediate ABAP Programming · unidade 8"
duracao: "1 h"
icone: error
objetivos:
  - Distinguir static, dynamic e no check
  - "Tratar exceções com TRY…CATCH"
  - Criar e lançar exceções próprias
palavras_chave: try catch cleanup raise exception cx_root cx_static_check cx_dynamic_check cx_no_check zerodivide
---

## Classes de exceção {ancora="Hierarquia" icone="tree"}

Toda exceção baseada em classe herda de `CX_ROOT`, por uma de três superclasses. A escolha define se o compilador obriga você a tratar ou declarar a exceção.

::figura{arquivo="excecoes-1.svg"}

## Simulador de TRY … CATCH {ancora="TRY … CATCH" icone="play"}

Digite um divisor e acompanhe qual bloco é executado. O primeiro `CATCH` compatível vence, então coloque as exceções mais específicas primeiro.

::laboratorio{id="trysim"}

## Criando sua própria classe de exceção {ancora="Exceção própria" icone="create"}

```abap title="ZCX_TRAVEL_INVALID"
CLASS zcx_travel_invalid DEFINITION PUBLIC
  INHERITING FROM cx_static_check FINAL CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_t100_message.
    INTERFACES if_t100_dyn_msg.

    CONSTANTS:
      BEGIN OF dates_inconsistent,
        msgid TYPE symsgid VALUE 'ZTRAVEL',
        msgno TYPE symsgno VALUE '001',
        attr1 TYPE scx_attrname VALUE 'BEGIN_DATE',
        attr2 TYPE scx_attrname VALUE 'END_DATE',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF dates_inconsistent.

    DATA begin_date TYPE /dmo/begin_date READ-ONLY.
    DATA end_date   TYPE /dmo/end_date READ-ONLY.

    METHODS constructor
      IMPORTING textid     LIKE if_t100_message=>t100key OPTIONAL
                previous   LIKE previous OPTIONAL
                begin_date TYPE /dmo/begin_date OPTIONAL
                end_date   TYPE /dmo/end_date OPTIONAL.
ENDCLASS.

" Lançando:
RAISE EXCEPTION NEW zcx_travel_invalid(
  textid     = zcx_travel_invalid=>dates_inconsistent
  begin_date = begin
  end_date   = end ).
```

:::quiz
### Qual superclasse obriga a declarar `RAISING` ou tratar a exceção, verificado pelo compilador?

- [x] `CX_STATIC_CHECK`
- [ ] `CX_DYNAMIC_CHECK`
- [ ] `CX_NO_CHECK`
- [ ] `CX_ROOT` diretamente

> Exceções de CX_STATIC_CHECK são verificadas em tempo de compilação.

### Qual exceção ocorre em `100 / 0`?

- [ ] `CX_SY_CONVERSION_NO_NUMBER`
- [x] `CX_SY_ZERODIVIDE`
- [ ] `CX_SY_ARITHMETIC_OVERFLOW`
- [ ] Nenhuma, resulta 0

> Divisão por zero lança CX_SY_ZERODIVIDE. Só 0 / 0 resulta em 0 sem exceção.

### Com vários `CATCH`, qual é executado?

- [ ] O último compatível
- [x] O primeiro compatível
- [ ] Todos os compatíveis
- [ ] O mais específico, onde estiver

> Os CATCH são avaliados em ordem; por isso coloque as classes mais específicas primeiro.
:::

:::documentacao
- [TRY](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abaptry.htm)
- [RAISE EXCEPTION](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapraise_exception_class.htm)
- [Cheat sheet: Exceptions](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/27_Exceptions.md)
:::
