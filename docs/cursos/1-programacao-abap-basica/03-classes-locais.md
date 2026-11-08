---
titulo: Classes locais
subtitulo: Classes, objetos, referências, atributos, métodos e construtores.
unidade: "3"
duracao: "4 h 16 min"
icone: puzzle
objetivos:
  - Definir e implementar uma classe local
  - Criar instâncias com NEW
  - Distinguir componentes de instância e estáticos
  - Escrever métodos com parâmetros e exceções
palavras_chave: class definition implementation new ref to constructor methods importing returning static class-data me
---

## Classes, objetos e encapsulamento {ancora="Conceitos" icone="puzzle"}

Uma **classe** é o molde; um **objeto** (instância) é criado na memória a partir dele com `NEW`. Variáveis do tipo `REF TO` guardam **referências** para os objetos. Classes locais ficam dentro de uma classe global, na aba **Local Types** do ADT.

Cada classe tem uma parte de **definição** (o que existe) e uma de **implementação** (como funciona). As seções `PUBLIC`, `PROTECTED` e `PRIVATE` controlam quem enxerga cada componente.

```abap title="Local Types · lcl_connection"
CLASS lcl_connection DEFINITION.
  PUBLIC SECTION.
    CLASS-DATA conn_counter TYPE i READ-ONLY.   " estático: um por classe

    METHODS constructor
      IMPORTING i_carrier_id    TYPE /dmo/carrier_id
                i_connection_id TYPE /dmo/connection_id
      RAISING   cx_abap_invalid_value.

    METHODS get_output RETURNING VALUE(r_output) TYPE string.

  PRIVATE SECTION.
    DATA carrier_id    TYPE /dmo/carrier_id.        " instância
    DATA connection_id TYPE /dmo/connection_id.
ENDCLASS.

CLASS lcl_connection IMPLEMENTATION.
  METHOD constructor.
    IF i_carrier_id IS INITIAL OR i_connection_id IS INITIAL.
      RAISE EXCEPTION TYPE cx_abap_invalid_value.
    ENDIF.
    me->carrier_id    = i_carrier_id.
    me->connection_id = i_connection_id.
    conn_counter += 1.
  ENDMETHOD.

  METHOD get_output.
    r_output = |{ carrier_id } { connection_id }|.
  ENDMETHOD.
ENDCLASS.
```

## Laboratório: referências e instâncias {ancora="Laboratório" icone="org-chart"}

Crie objetos, aponte duas referências para o mesmo objeto e limpe referências. Observe que o atributo estático `conn_counter` é compartilhado, e que um objeto sem nenhuma referência é recolhido pelo *garbage collector*.

::laboratorio{id="objlab"}

## Assinaturas e chamadas de métodos {ancora="Métodos" icone="source-code"}

:::::colunas{n="2"}
::::cartao
### Tipos de parâmetro

:::termos
- `IMPORTING` — Entrada; não pode ser alterado no método.
- `EXPORTING` — Saída; o chamador recebe o valor.
- `CHANGING` — Entrada e saída.
- `RETURNING` — Um único retorno, sempre `VALUE( )`. Torna o método **funcional**.
- `RAISING` — Exceções baseadas em classe que o método pode propagar.
:::
::::

```abap title="Usando a classe"
TRY.
    DATA(connection) = NEW lcl_connection(
                         i_carrier_id    = 'LH'
                         i_connection_id = '0400' ).

    " Chamada funcional: o retorno é usado direto
    out->write( connection->get_output( ) ).

    " Componente estático: classe=>componente
    out->write( lcl_connection=>conn_counter ).

  CATCH cx_abap_invalid_value.
    out->write( `Dados de entrada inválidos` ).
ENDTRY.
```
:::::

:::quiz
### Como se chama um componente estático de uma classe a partir de fora?

- [ ] `objeto->componente`
- [x] `classe=>componente`
- [ ] `classe-componente`
- [ ] `classe~componente`

> O seletor => acessa componentes estáticos; -> acessa componentes de instância via referência.

### Quantos parâmetros `RETURNING` um método pode ter?

- [ ] Nenhum
- [x] Exatamente um
- [ ] Até dez
- [ ] Ilimitados

> Um método funcional tem um único parâmetro RETURNING, sempre passado por valor.

### O que acontece com um objeto quando nenhuma referência aponta mais para ele?

- [ ] Continua até o fim da sessão
- [ ] Gera um dump
- [x] É removido pelo garbage collector
- [ ] É salvo no banco

> Objetos sem referências são recolhidos automaticamente pelo garbage collector.
:::

:::documentacao
- [CLASS](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapclass.htm)
- [METHODS](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapmethods.htm)
- [Cheat sheet: ABAP Object Orientation](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/04_ABAP_Object_Orientation.md)
:::
