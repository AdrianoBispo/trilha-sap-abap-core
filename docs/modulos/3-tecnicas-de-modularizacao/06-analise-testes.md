---
titulo: Análise e testes
subtitulo: ATC, ABAP Unit, profiling e SQL trace.
sap_learning: "Intermediate ABAP Programming · unidade 1 + 9"
duracao: "3 h 54 min"
icone: inspection
objetivos:
  - Rodar o ATC e interpretar prioridades
  - Escrever uma classe de teste
  - Rodar testes ABAP Unit
  - Medir com o profiler e o SQL trace
palavras_chave: atc abap unit for testing setup assert_equals profiler sql trace
---

## Análise estática com o ATC {ancora="ATC" icone="inspection"}

O **ABAP Test Cockpit** roda verificações estáticas sobre o código: sintaxe, performance, segurança e prontidão para cloud. No ADT, clique com o botão direito no objeto e escolha **Run As › ABAP Test Cockpit** (:kbd[Ctrl+Shift+F2]). Uma **variante de verificação** define quais checks rodam.

:::cartao{icone="checklist-item" subtitulo="Prioridade 1 bloqueia o transporte na maioria das configurações."}
### ATC Problems · exemplo de resultado

| Prioridade | Verificação | Achado | Objeto |
| --- | --- | --- | --- |
| :tag[1]{tipo="erro"} | Cloud readiness | Uso de objeto não liberado `MARA` | `ZCL_MATERIAL_INFO` |
| :tag[2]{tipo="aviso"} | Performance | SELECT dentro de LOOP | `ZCL_FLIGHT_REPORT` |
| :tag[3]{tipo="info"} | Clean code | Variável declarada e nunca usada | `ZCL_FLIGHT_REPORT` |
:::

## Testes unitários com ABAP Unit {ancora="ABAP Unit" icone="message-success"}

Classes de teste são locais, ficam na aba **Test Classes** e levam `FOR TESTING`. O método `setup` roda antes de cada teste; as asserções vêm de `CL_ABAP_UNIT_ASSERT`. Execute com :kbd[Ctrl+Shift+F10].

:::colunas{n="2"}
```abap title="Código testado · ZCL_PRICE_CALC"
METHOD apply_discount.
  " Desconto em %: 10 => 10%
  IF i_percent < 0 OR i_percent > 100.
    RAISE EXCEPTION TYPE cx_abap_invalid_value.
  ENDIF.
  r_price = i_price - i_price * i_percent / 100.
ENDMETHOD.
```

```abap title="Test Classes"
CLASS ltc_price_calc DEFINITION FINAL
  FOR TESTING DURATION SHORT RISK LEVEL HARMLESS.

  PRIVATE SECTION.
    DATA cut TYPE REF TO zcl_price_calc. " class under test
    METHODS setup.
    METHODS ten_percent       FOR TESTING RAISING cx_static_check.
    METHODS zero_percent      FOR TESTING RAISING cx_static_check.
    METHODS invalid_percent   FOR TESTING.
ENDCLASS.

CLASS ltc_price_calc IMPLEMENTATION.
  METHOD setup.
    cut = NEW #( ).
  ENDMETHOD.

  METHOD ten_percent.
    cl_abap_unit_assert=>assert_equals(
      exp = '90.00'
      act = cut->apply_discount( i_price = 100 i_percent = 10 ) ).
  ENDMETHOD.

  METHOD zero_percent.
    cl_abap_unit_assert=>assert_equals(
      exp = '100.00'
      act = cut->apply_discount( i_price = 100 i_percent = 0 ) ).
  ENDMETHOD.

  METHOD invalid_percent.
    TRY.
        cut->apply_discount( i_price = 100 i_percent = 120 ).
        cl_abap_unit_assert=>fail( `Esperava exceção` ).
      CATCH cx_abap_invalid_value.
    ENDTRY.
  ENDMETHOD.
ENDCLASS.
```
:::

::laboratorio{id="unitrunner"}

## Profiling e SQL trace {ancora="Profiling e SQL trace" icone="history"}

::::colunas{n="2"}
:::cartao
### ABAP Profiler

Em **Profile As › ABAP Application** o ADT mede tempo por método e por acesso ao banco. A visão *Hit List* mostra onde o tempo foi gasto e a *Call Timeline* revela leituras sequenciais repetidas.
:::

:::cartao
### SQL trace

Ative pela aplicação **ABAP Trace Requests** ou pela transação ST05 em sistemas on-premise. O trace lista cada comando enviado ao banco, com duração e quantidade de registros; comandos idênticos repetidos são o sinal de SELECT em loop.
:::
::::

:::nota
A documentação de classes e métodos com ABAP Doc está em [Comentários e documentação](#comentarios-e-documentacao).
:::

:::quiz
### Qual adição marca uma classe local como classe de teste?

- [x] `FOR TESTING`
- [ ] `TEST CLASS`
- [ ] `INHERITING FROM cl_test`
- [ ] `RISK LEVEL`

> FOR TESTING marca a classe e cada método de teste; DURATION e RISK LEVEL são atributos adicionais.

### Quando o método `setup` é executado?

- [ ] Uma vez por classe
- [x] Antes de cada método de teste
- [ ] Depois de todos os testes
- [ ] Só se falhar

> setup roda antes de cada teste; class_setup roda uma vez por classe.

### No SQL trace, o que indica um `SELECT` dentro de loop?

- [ ] Um comando com duração muito alta
- [x] O mesmo comando repetido muitas vezes
- [ ] Um comando sem `WHERE`
- [ ] Um `COMMIT WORK` entre os comandos

> Comandos idênticos em sequência, cada um lendo poucas linhas, são a assinatura do SELECT em loop.
:::

:::documentacao
- [Cheat sheet: ABAP Unit Tests](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/14_ABAP_Unit_Tests.md)
- [Cheat sheet: Performance Notes](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/32_Performance_Notes.md)
:::
