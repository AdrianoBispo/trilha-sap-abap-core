---
titulo: Orientação a objetos eficaz
subtitulo: Herança, interfaces, polimorfismo, casting e padrões de projeto.
sap_learning: "Intermediate ABAP Programming · unidade 7"
duracao: "3 h"
icone: tree
objetivos:
  - Usar herança e redefinição
  - Implementar interfaces
  - Aplicar polimorfismo e casting
  - Usar factory e singleton
palavras_chave: inheriting from redefinition interface abstract final polimorfismo cast is instance of factory singleton create private
---

## Herança, interfaces e polimorfismo {ancora="Herança e interfaces" icone="tree"}

**Herança** (`INHERITING FROM`) reaproveita implementação: a subclasse recebe tudo da superclasse e pode **redefinir** métodos com `REDEFINITION`. **Interfaces** definem um contrato sem implementação; uma classe pode implementar várias.

**Polimorfismo**: uma referência do tipo da superclasse ou interface pode apontar para qualquer subclasse. O método chamado é decidido em tempo de execução pelo tipo real do objeto.

::figura{arquivo="oo-avancado-1.svg"}

## Polimorfismo na prática {ancora="Polimorfismo" icone="puzzle"}

::laboratorio{id="poly"}

## Factory e singleton {ancora="Padrões" icone="process"}

Com `CREATE PRIVATE` só a própria classe instancia objetos. Isso permite um método de fábrica que valida os dados antes de criar, ou um singleton que garante uma única instância.

:::colunas{n="2"}
```abap title="Factory"
CLASS lcl_connection DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
    CLASS-METHODS create
      IMPORTING i_carrier_id    TYPE /dmo/carrier_id
                i_connection_id TYPE /dmo/connection_id
      RETURNING VALUE(r_result) TYPE REF TO lcl_connection
      RAISING   cx_abap_invalid_value.
ENDCLASS.

CLASS lcl_connection IMPLEMENTATION.
  METHOD create.
    " valida antes de existir o objeto
    IF i_carrier_id IS INITIAL.
      RAISE EXCEPTION TYPE cx_abap_invalid_value.
    ENDIF.
    r_result = NEW #( ).
  ENDMETHOD.
ENDCLASS.
```

```abap title="Singleton"
CLASS lcl_config DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
    CLASS-METHODS get_instance
      RETURNING VALUE(r_instance) TYPE REF TO lcl_config.
  PRIVATE SECTION.
    CLASS-DATA instance TYPE REF TO lcl_config.
ENDCLASS.

CLASS lcl_config IMPLEMENTATION.
  METHOD get_instance.
    IF instance IS NOT BOUND.
      instance = NEW #( ).
    ENDIF.
    r_instance = instance.
  ENDMETHOD.
ENDCLASS.
```
:::

:::documentacao
- [INTERFACE](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapinterface.htm)
- [Cheat sheet: ABAP Object Orientation](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/04_ABAP_Object_Orientation.md)
- [Cheat sheet: OO Design Patterns](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/34_OO_Design_Patterns.md)
:::
