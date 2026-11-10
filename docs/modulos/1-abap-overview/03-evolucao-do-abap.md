---
titulo: Do ABAP clássico à nuvem
subtitulo: Reports, ALV, SAP Gateway e OData, BOPF e o caminho até o RAP.
duracao: "1 h"
icone: history
objetivos:
  - Reconhecer a estrutura de um report clássico
  - Comparar as gerações de ALV
  - Explicar o papel do SAP Gateway e do OData
  - Situar o BOPF e o modelo de programação para SAP Fiori
  - Dizer o que o RAP unificou
palavras_chave: report write selection-screen start-of-selection alv reuse_alv_grid_display cl_gui_alv_grid cl_salv_table dynpro gateway odata segw dpc mpc bopf fiori rap
---

## Cinco gerações {ancora="Linha do tempo" icone="history"}

Quem trabalha com ABAP encontra, no mesmo sistema, código de todas as épocas. Saber de que geração é um programa ajuda a ler, manter e decidir como reescrever.

::figura{arquivo="evolucao-do-abap-1.svg"}

## Reports clássicos {ancora="Reports" icone="document-text"}

O **report** (programa executável, transação SE38) foi a primeira forma de aplicação ABAP. Ele é dirigido por **eventos**: o runtime chama os blocos na ordem certa.

```abap title="ZFLIGHT_LIST · report clássico (Standard ABAP)"
REPORT zflight_list.

PARAMETERS p_carr TYPE s_carr_id OBLIGATORY.          " tela de seleção

START-OF-SELECTION.                                    " após Executar (F8)
  SELECT carrid, connid, fldate, price, currency
    FROM sflight
    WHERE carrid = @p_carr
    INTO TABLE @DATA(flights).

  LOOP AT flights INTO DATA(flight).
    WRITE: / flight-connid, flight-fldate, flight-price, flight-currency.
  ENDLOOP.
```

:::termos
- `PARAMETERS`, `SELECT-OPTIONS` — Geram a **tela de seleção** sem que você desenhe nada.
- `INITIALIZATION`, `AT SELECTION-SCREEN` — Eventos para valores iniciais e validação da entrada.
- `START-OF-SELECTION` — Bloco principal, executado depois da tela de seleção.
- `WRITE` — Escreve na **lista**, a saída em texto do report.
:::

Telas com campos de entrada e botões eram feitas com **dynpros** (Screen Painter, SE51) e a lógica `PROCESS BEFORE OUTPUT` / `PROCESS AFTER INPUT`. Em ambos os casos, leitura do banco, regra de negócio e tela ficam no mesmo programa, e o único cliente possível é o SAP GUI.

## Reports ALV {ancora="ALV" icone="table-view"}

O **ALV** (*SAP List Viewer*) substituiu as listas feitas com `WRITE` por uma grade com ordenação, filtro, totais, layouts salvos e exportação, tudo pronto. Foram três gerações de API:

| Geração | Como se usa | Observação |
| --- | --- | --- |
| Módulos de função | `REUSE_ALV_GRID_DISPLAY` com um *field catalog* montado à mão | Procedural; ainda muito comum em código antigo |
| Controle OO | `CL_GUI_ALV_GRID` dentro de um contêiner em um dynpro | Permite edição e eventos; exige tela própria |
| Modelo de objetos | `CL_SALV_TABLE=>factory( )` | Poucas linhas, catálogo deduzido da tabela interna; só exibição |

```abap title="ALV com CL_SALV_TABLE"
START-OF-SELECTION.
  SELECT carrid, connid, fldate, price, currency, seatsmax, seatsocc
    FROM sflight WHERE carrid = @p_carr INTO TABLE @DATA(flights).

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(alv)
                              CHANGING  t_table      = flights ).
      alv->get_functions( )->set_all( ).       " barra de funções padrão
      alv->get_columns( )->set_optimize( ).
      alv->display( ).
    CATCH cx_salv_msg INTO DATA(error).
      MESSAGE error TYPE 'I'.
  ENDTRY.
```

## SAP Gateway e OData {ancora="Gateway e OData" icone="internet-browser"}

Com o SAP Fiori, a tela saiu do servidor ABAP: passou a ser um app SAPUI5 no navegador, que conversa com o backend por **OData**, um protocolo REST com metadados. O **SAP Gateway** é o componente que publica serviços OData a partir do ABAP.

No modelo original, o serviço era montado no **Service Builder (transação SEGW)**: você desenhava entidades e o sistema gerava duas classes para completar.

:::termos
- **MPC** (*Model Provider Class*) — Define o modelo: entidades, propriedades, associações. Vira o documento `$metadata`.
- **DPC** (*Data Provider Class*) — Implementa as operações. Você redefinia métodos como `…_GET_ENTITYSET` e `…_CREATE_ENTITY` na subclasse `…_DPC_EXT`.
- **Registro do serviço** — Transação `/IWFND/MAINT_SERVICE`, que ativa o serviço no hub do Gateway.
:::

Funcionava, mas cada serviço repetia muito código manual de leitura, paginação, filtro e gravação, e a regra de negócio acabava presa à classe DPC.

## BOPF e o modelo de programação para SAP Fiori {ancora="BOPF" icone="business-objects-experience"}

O **BOPF** (*Business Object Processing Framework*) trouxe um modelo declarativo de objeto de negócio: nós, **determinations**, **validations**, **actions** e bloqueios, com um buffer transacional gerenciado pelo framework. Esses conceitos reaparecem com os mesmos nomes no RAP.

A partir do AS ABAP 7.50, o **ABAP programming model for SAP Fiori** juntou três peças:

::::colunas{n="3"}
:::cartao{etiqueta="Dados" tipo="info"}
**CDS views** descrevem o modelo e, com anotações `@UI`, também a tela do Fiori Elements.
:::

:::cartao{etiqueta="Comportamento" tipo="c5"}
**BOPF** gerado a partir da CDS (`@ObjectModel.transactionalProcessingEnabled`) cuida de gravação, rascunho e regras.
:::

:::cartao{etiqueta="Serviço" tipo="c7"}
**SAP Gateway** expõe a CDS como OData, por `@OData.publish: true` ou como fonte de dados na SEGW.
:::
::::

O ganho foi grande, mas eram três tecnologias com ferramentas e conceitos diferentes, ligadas por anotações.

## RAP {ancora="RAP" icone="overview-chart"}

O **ABAP RESTful Application Programming Model** substituiu esse conjunto por artefatos nativos da linguagem, todos editados no ADT:

| Necessidade | Antes | No RAP |
| --- | --- | --- |
| Modelo de dados | CDS view | CDS view entity |
| Comportamento transacional | BOPF | Behavior definition (BDEF) e behavior pool |
| Acesso por código | API do BOPF | EML (`READ ENTITIES`, `MODIFY ENTITIES`) |
| Serviço | SEGW ou `@OData.publish` | Service definition e service binding (OData V2 ou V4) |

O RAP é o único modelo transacional disponível no ABAP Cloud e o recomendado para código novo também on-premise. O módulo 06 mostra as camadas em detalhe, começando por [Modelo RAP](#rap).

:::nota
Reports, ALV, dynpros, SEGW e BOPF **continuam funcionando** em sistemas S/4HANA privados e on-premise com Standard ABAP. Eles só não existem no ABAP Cloud. Uma lista em ALV vira um app *list report* do Fiori Elements sobre um serviço RAP.
:::

:::documentacao
- [ABAP RESTful Application Programming Model (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model?locale=en-US)
- [ABAP Programming Model for SAP Fiori (SAP Help Portal)](https://help.sap.com/docs/ABAP_PLATFORM_NEW/cc0c305d2fab47bd808adcad3ca7ee9d/3b77569ca8ee4226bdab4fcebd6f6ea6.html?locale=en-US)
- [ABAP Keyword Documentation: REPORT](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapreport.htm)
- [Cheat sheet: Selection Screens and Classic Lists](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/20_Selection_Screens_Lists.md)
:::
