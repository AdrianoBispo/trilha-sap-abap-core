---
titulo: BAdIs
subtitulo: Business Add-Ins clássicas e novas, com definição, chamada, filtros e implementação.
duracao: "1 h"
icone: puzzle
objetivos:
  - Explicar o que é uma BAdI
  - Diferenciar BAdI clássica e BAdI nova
  - Ler a chamada de uma BAdI em código standard
  - Implementar uma BAdI com filtro
  - Encontrar BAdIs liberadas no ABAP Cloud
palavras_chave: badi business add-in se18 se19 enhancement spot get badi call badi filter fallback multiple use cl_exithandler if_badi_interface enhancement implementation
---

## O que é uma BAdI {ancora="Conceito" icone="puzzle"}

Uma **BAdI** (*Business Add-In*) é um ponto de ampliação orientado a objetos. A SAP define uma **interface** com os métodos que serão chamados e os parâmetros que eles recebem. O cliente cria uma **classe** que implementa essa interface. Em runtime, o programa standard procura as implementações ativas e chama o método.

Comparada aos exits anteriores, a BAdI trouxe três vantagens: uma **interface estável**, várias implementações ao mesmo tempo e a possibilidade de escolher a implementação por um **filtro**, como país ou tipo de documento.

| | BAdI clássica | BAdI nova |
| --- | --- | --- |
| Disponível desde | Release 4.6 | NetWeaver 7.0 |
| Definição | SE18, objeto isolado | SE18, dentro de um **enhancement spot** |
| Implementação | SE19 | SE19 ou ADT, em uma **enhancement implementation** |
| Chamada | `CL_EXITHANDLER=>GET_INSTANCE` | Comandos `GET BADI` e `CALL BADI` |
| Seleção | Em ABAP, a cada chamada | No kernel, bem mais rápida |
| Disponível no ABAP Cloud | Não | Sim, quando liberada |

## Como o standard chama {ancora="Chamada" icone="source-code"}

```abap title="BAdI nova"
DATA badi TYPE REF TO zbadi_flight_price.

" Seleciona as implementações ativas para este filtro
GET BADI badi
  FILTERS carrier = flight-carrier_id.

" Chama o método em todas as implementações selecionadas
CALL BADI badi->adjust_price
  EXPORTING i_flight = flight
  CHANGING  c_price  = price.
```

```abap title="BAdI clássica"
DATA exit TYPE REF TO if_ex_flight_price.

cl_exithandler=>get_instance( CHANGING instance = exit ).
exit->adjust_price( EXPORTING i_flight = flight CHANGING c_price = price ).
```

Reconhecer esses dois padrões é o que permite achar BAdIs depurando uma transação: um breakpoint no comando `GET BADI` ou no método `GET_INSTANCE` para em todos os pontos por onde o processo passa.

## Definindo uma BAdI {ancora="Definição" icone="create-form"}

Quem cria uma BAdI, a SAP ou você mesmo em um framework próprio, define quatro coisas dentro de um **enhancement spot**:

:::termos
- **Interface** — Os métodos da BAdI. Ela inclui a interface de marcação `IF_BADI_INTERFACE`.
- **Uso múltiplo** — Se marcado, várias implementações podem estar ativas e todas são chamadas. Se não, exatamente uma.
- **Filtros** — Parâmetros que selecionam a implementação. Cada implementação declara para quais valores vale.
- **Classe fallback** — Implementação padrão, chamada quando nenhuma outra está ativa.
:::

```abap title="Interface da BAdI"
INTERFACE zif_badi_flight_price PUBLIC.
  INTERFACES if_badi_interface.

  METHODS adjust_price
    IMPORTING i_flight TYPE /dmo/flight
    CHANGING  c_price  TYPE /dmo/flight_price.
ENDINTERFACE.
```

:::aviso
O número de implementações muda o comportamento. Em uma BAdI de **uso único** sem fallback e sem implementação ativa, `GET BADI` lança `CX_BADI_NOT_IMPLEMENTED`. Em uma de **uso múltiplo**, a ausência de implementações é normal: `CALL BADI` simplesmente não chama nada. Por isso métodos de BAdIs de uso múltiplo não devolvem valores com `RETURNING`: não haveria como juntar as respostas.
:::

## Implementando {ancora="Implementação" icone="create"}

No ADT, com o botão direito sobre o enhancement spot: **New › BAdI Enhancement Implementation**. O assistente pede o nome da implementação, a classe e os valores de filtro. No SAP GUI, o mesmo é feito na **SE19**.

```abap title="Classe de implementação"
CLASS zcl_flight_price_lh DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES zif_badi_flight_price.
ENDCLASS.

CLASS zcl_flight_price_lh IMPLEMENTATION.
  METHOD zif_badi_flight_price~adjust_price.
    " Só é chamada quando o filtro carrier = 'LH'
    IF i_flight-seats_occupied * 100 / i_flight-seats_max > 90.
      c_price = c_price * '1.10'.          " alta ocupação: +10%
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

:::checklist
- A implementação só é chamada se estiver **ativa**. Desativar é a forma segura de desligar o código sem apagá-lo.
- Em BAdIs de uso múltiplo, a **ordem** de chamada não é garantida. Uma implementação não pode depender do efeito de outra.
- Mantenha o método curto e delegue a lógica a uma classe testável. A BAdI é só o ponto de entrada.
- Não faça `COMMIT WORK` dentro de uma BAdI: você encerraria a LUW do processo standard no meio.
:::

## BAdIs no ABAP Cloud {ancora="ABAP Cloud" icone="cloud"}

No ABAP Cloud só podem ser implementadas as BAdIs **liberadas** pela SAP para desenvolvimento em nuvem. Elas aparecem no Project Explorer em **Released Objects › Enhancements › BAdI Enhancement Spots**, e a documentação de cada uma descreve os métodos, os filtros e o momento da chamada.

Existe ainda um segundo público: BAdIs liberadas para **key users** são implementadas no app Fiori **Custom Logic**, em um editor web, com a versão *ABAP for Key Users* da linguagem. O código é mais restrito, mas não exige ADT nem transporte de desenvolvedor.

:::nota
Uma BAdI liberada tem contrato estável, e a própria interface limita o que o seu código pode alterar: só os parâmetros `CHANGING` e `EXPORTING` do método. É isso que mantém a ampliação compatível com o clean core.
:::

:::documentacao
- [ABAP Keyword Documentation: GET BADI](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapget_badi.htm)
- [ABAP Keyword Documentation: CALL BADI](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapcall_badi.htm)
- [Cheat sheet: BAdIs](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/35_BAdIs.md)
- [ABAP Cloud (SAP Help Portal)](https://help.sap.com/docs/abap-cloud?locale=en-US)
:::
