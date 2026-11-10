---
titulo: Classes globais
subtitulo: Class pool, opções de instanciação, interfaces globais e um simulador do Class Builder.
duracao: "1 h 15 min"
icone: puzzle
objetivos:
  - Diferenciar classe local e classe global
  - Explicar as opções Final, Abstract e de instanciação
  - Relacionar as abas do Class Builder com o código-fonte
  - Criar uma interface global e uma classe que a implementa
  - Usar os atalhos do ADT para criar e navegar em classes
palavras_chave: classe global class builder se24 class pool create public private protected final abstract interface zcl zif friends local types test classes ccimp ccau
---

## Local ou global {ancora="Conceito" icone="puzzle"}

Na lição [Classes locais](#classes-locais) a classe existia dentro de outro objeto e só ali podia ser usada. Uma **classe global** é um objeto de repositório próprio: tem nome único no sistema, pacote, transporte, e pode ser usada por qualquer programa que tenha visibilidade sobre ela.

| | Classe local | Classe global |
| --- | --- | --- |
| Onde é definida | Dentro de um programa, grupo de funções ou classe global | Objeto próprio na biblioteca de classes |
| Nome | Livre, por convenção `lcl_…` | Único no sistema, `ZCL_…` no namespace do cliente |
| Quem pode usar | Só o objeto que a contém | Qualquer código do sistema |
| Uso típico | Auxiliares, classes de teste, handlers RAP | APIs, regras de negócio, serviços reutilizáveis |

A sintaxe das duas é a mesma, com uma diferença na primeira linha: a classe global leva `PUBLIC` e, em geral, as opções de instanciação.

```abap title="Cabeçalho de uma classe global"
CLASS zcl_flight_booking DEFINITION
  PUBLIC                  " classe global
  FINAL                   " não pode ter subclasses
  CREATE PUBLIC.          " quem pode criar instâncias com NEW
```

:::termos
- `CREATE PUBLIC` — Qualquer código pode instanciar. É o padrão.
- `CREATE PROTECTED` — Só a classe e suas subclasses instanciam.
- `CREATE PRIVATE` — Só a própria classe instancia. Usado com um método estático de fábrica ou em um singleton.
- `FINAL` — Impede herança. Bom padrão: deixe a classe aberta só quando a herança for planejada.
- `ABSTRACT` — Não pode ser instanciada; existe para ser herdada.
- `GLOBAL FRIENDS` — Lista classes que enxergam os componentes protegidos e privados.
:::

## Class Builder e ADT {ancora="Class Builder" icone="create-form"}

No SAP GUI, classes globais são mantidas no **Class Builder (transação SE24)**. No modo baseado em formulário, cada aba cuida de uma parte: **Properties**, **Interfaces**, **Friends**, **Attributes**, **Methods**, **Events** e **Types**. Os parâmetros e as exceções de um método são preenchidos em telas próprias, abertas a partir da linha do método. O botão **Source Code-Based** mostra o texto completo, que é o que o ADT edita.

No **ADT** a classe é um arquivo de texto com abas na parte de baixo do editor:

| Aba do ADT | Conteúdo |
| --- | --- |
| **Global Class** | `CLASS … DEFINITION` e `CLASS … IMPLEMENTATION` |
| **Class-relevant Local Types** | Tipos e definições locais usados na parte privada da classe |
| **Local Types** | Classes locais auxiliares |
| **Test Classes** | Classes de teste ABAP Unit |
| **Macros** | Macros locais |

## Simulador do Class Builder {ancora="Simulador" icone="simulate"}

Preencha atributos, métodos e parâmetros como nas abas da SE24. Veja o código-fonte gerado e, na segunda visão, os includes em que o sistema divide a classe.

::laboratorio{id="classbuilder"}

## Interfaces globais {ancora="Interfaces" icone="chain-link"}

Uma classe global bem desenhada costuma ser usada por meio de uma **interface global** (`ZIF_…`). Quem consome depende só da interface, o que permite trocar a implementação e criar dublês para testes.

```abap title="ZIF_FLIGHT_BOOKING"
INTERFACE zif_flight_booking PUBLIC.
  METHODS book
    IMPORTING i_seats     TYPE i DEFAULT 1
    RETURNING VALUE(r_ok) TYPE abap_bool
    RAISING   cx_abap_invalid_value.
ENDINTERFACE.
```

```abap title="ZCL_FLIGHT_BOOKING"
CLASS zcl_flight_booking DEFINITION PUBLIC FINAL CREATE PRIVATE.
  PUBLIC SECTION.
    INTERFACES zif_flight_booking.

    "! Fábrica: único ponto de criação, devolve a interface
    CLASS-METHODS create
      IMPORTING i_carrier_id    TYPE /dmo/carrier_id
      RETURNING VALUE(r_result) TYPE REF TO zif_flight_booking.

  PRIVATE SECTION.
    DATA carrier_id TYPE /dmo/carrier_id.
    DATA seats_free TYPE i VALUE 180.
ENDCLASS.

CLASS zcl_flight_booking IMPLEMENTATION.
  METHOD create.
    DATA(booking) = NEW zcl_flight_booking( ).
    booking->carrier_id = i_carrier_id.
    r_result = booking.
  ENDMETHOD.

  METHOD zif_flight_booking~book.
    IF i_seats <= 0.
      RAISE EXCEPTION NEW cx_abap_invalid_value( ).
    ENDIF.
    r_ok = xsdbool( i_seats <= seats_free ).
    IF r_ok = abap_true.
      seats_free -= i_seats.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

```abap title="Quem usa só conhece a interface"
DATA(booking) = zcl_flight_booking=>create( 'LH' ).
IF booking->book( 2 ).
  out->write( `Reserva confirmada` ).
ENDIF.
```

## Trabalhando com classes no ADT {ancora="Atalhos" icone="developer-settings"}

| Atalho | Ação |
| --- | --- |
| :kbd[Ctrl+N] › ABAP Class | Criar classe global |
| :kbd[Ctrl+1] na declaração do método | Quick fix: criar a implementação |
| :kbd[Ctrl+1] em uma chamada ainda inexistente | Criar o método a partir da chamada |
| :kbd[F3] | Navegar para a definição |
| :kbd[Ctrl+Shift+G] | Lista de utilizações (*where-used*) |
| :kbd[Alt+Shift+R] | Renomear em todos os lugares |
| :kbd[Alt+Shift+M] | Extrair o trecho selecionado para um método |
| :kbd[Ctrl+O] | Outline rápido da classe |
| :kbd[Ctrl+Shift+F10] | Executar os testes ABAP Unit |

Herança, polimorfismo e padrões de projeto continuam em [Orientação a objetos eficaz](#oo-avancado); o tratamento de exceções, no módulo 10, em [Classes de exceção](#excecoes).

:::documentacao
- [ABAP Keyword Documentation: CLASS … DEFINITION](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapclass_definition.htm)
- [ABAP Keyword Documentation: INTERFACE](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapinterface.htm)
- [ABAP Development Tools: atalhos de teclado](https://help.sap.com/docs/abap-cloud/abap-development-tools-user-guide/keyboard-shortcuts-for-abap-development?locale=en-US)
- [ABAP Development Tools para Visual Studio Code](https://help.sap.com/docs/abap-cloud/abap-development-tools-for-visual-studio-code/abap-development-tools-for-visual-studio-code?locale=en-US)
- [Cheat sheet: ABAP Object Orientation](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/04_ABAP_Object_Orientation.md)
:::
