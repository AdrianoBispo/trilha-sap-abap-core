---
titulo: RFC, BAPI e IDoc
subtitulo: As três tecnologias clássicas de integração e como o RFC aparece no ABAP Cloud.
duracao: "1 h"
icone: share-2
objetivos:
  - Distinguir as variantes de RFC
  - Tratar os erros de uma chamada remota
  - Chamar uma BAPI e confirmar a transação
  - Descrever a estrutura e o fluxo de um IDoc
  - Chamar um módulo RFC a partir do ABAP Cloud
palavras_chave: rfc srfc arfc trfc qrfc bgrfc destination system_failure communication_failure bapi bapiret2 bapi_transaction_commit idoc ale edidc edidd we02 we20 cl_rfc_destination_provider
---

## RFC {ancora="RFC" icone="share-2"}

**RFC** (*Remote Function Call*) é a chamada de um módulo de função que está em outro sistema. Do lado chamado, o módulo precisa ter o tipo de processamento *remote-enabled*, visto em [Módulos de função](#function-modules). Do lado chamador, acrescenta-se `DESTINATION`.

| Variante | Sintaxe | Comportamento |
| --- | --- | --- |
| **Síncrono** (sRFC) | `CALL FUNCTION … DESTINATION d` | Espera a resposta |
| **Assíncrono** (aRFC) | `… STARTING NEW TASK t` | Não espera; resultado opcional em callback. Veja [Programação paralela](#programacao-paralela) |
| **Transacional** (tRFC) | `… IN BACKGROUND TASK` | Executado uma única vez após o `COMMIT WORK`. Obsoleto |
| **Em fila** (qRFC) | tRFC com filas | Garante também a ordem. Obsoleto |
| **Background** (bgRFC) | `… IN BACKGROUND UNIT u` | Sucessor do tRFC e do qRFC, com unidades e filas |

```abap title="RFC síncrono com tratamento de erro"
DATA message    TYPE c LENGTH 200.
DATA free_seats TYPE i.

CALL FUNCTION 'Z_FLIGHT_GET_FREE_SEATS'
  DESTINATION 'ERP_PRD'
  EXPORTING  iv_carrier_id         = 'LH'
             iv_connection_id      = '0400'
  IMPORTING  ev_free_seats         = free_seats
  EXCEPTIONS flight_not_found      = 1
             system_failure        = 2 MESSAGE message
             communication_failure = 3 MESSAGE message
             OTHERS                = 4.

CASE sy-subrc.
  WHEN 0. out->write( free_seats ).
  WHEN 1. out->write( `Voo não encontrado` ).
  WHEN 2. out->write( |Erro no sistema remoto: { message }| ).
  WHEN 3. out->write( |Sistema inacessível: { message }| ).
ENDCASE.
```

:::termos
- `system_failure` — O módulo terminou com erro de runtime no sistema remoto.
- `communication_failure` — A conexão não pôde ser aberta ou caiu.
- `MESSAGE campo` — Recebe o texto do erro. Só existe para essas duas exceções.
:::

:::aviso
Uma chamada RFC síncrona provoca um **commit implícito** no banco do chamador. Não a coloque no meio de uma sequência de gravações que precisa ser atômica. Do lado chamado, o usuário da chamada precisa da autorização `S_RFC` para o módulo ou grupo de funções.
:::

## BAPI {ancora="BAPI" icone="product"}

Uma **BAPI** (*Business Application Programming Interface*) é um módulo RFC publicado como método de um objeto de negócio, com interface estável e documentada. A transação **BAPI** lista todas por área de aplicação. Elas seguem convenções próprias:

:::checklist
- O nome é `BAPI_<objeto>_<método>`, como `BAPI_SALESORDER_CREATEFROMDAT2`.
- Não lançam exceções. Erros e avisos voltam no parâmetro **`RETURN`**, do tipo `BAPIRET2`, com tipo, classe, número e texto da mensagem.
- Não fazem commit. Quem chama decide, com `BAPI_TRANSACTION_COMMIT` ou `BAPI_TRANSACTION_ROLLBACK`.
- Não abrem telas e podem ser chamadas de qualquer sistema.
:::

```abap title="Chamando uma BAPI"
DATA messages     TYPE STANDARD TABLE OF bapiret2 WITH EMPTY KEY.
DATA order_number TYPE vbeln_va.

CALL FUNCTION 'BAPI_SALESORDER_CREATEFROMDAT2'
  EXPORTING order_header_in = header
  IMPORTING salesdocument   = order_number
  TABLES    return          = messages
            order_items_in  = items
            order_partners  = partners.

IF line_exists( messages[ type = 'E' ] ) OR line_exists( messages[ type = 'A' ] ).
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
ELSE.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING wait = abap_true.          " espera a atualização terminar
ENDIF.
```

Esquecer o commit é o erro clássico: a BAPI devolve o número do documento, mas nada é gravado. Em chamadas remotas, as duas chamadas precisam ir pelo **mesmo destino**, na mesma conexão.

## IDoc {ancora="IDoc" icone="document-text"}

Um **IDoc** (*Intermediate Document*) é um contêiner de dados para troca **assíncrona** de documentos de negócio: pedidos, faturas, dados mestres. O remetente grava o IDoc e segue em frente; a entrega e o processamento acontecem depois e podem ser repetidos.

| Parte | Tabela | Conteúdo |
| --- | --- | --- |
| **Registro de controle** | `EDIDC` | Um por IDoc: remetente, destinatário, tipo de mensagem, tipo de IDoc |
| **Registros de dados** | `EDID4` | Os **segmentos**, em hierarquia: cabeçalho, itens, parceiros |
| **Registros de status** | `EDIDS` | O histórico do que aconteceu com o IDoc |

:::termos
- **Tipo de mensagem** — O significado de negócio: `ORDERS` (pedido), `MATMAS` (material), `DEBMAS` (cliente).
- **Tipo de IDoc** — A estrutura técnica: `ORDERS05`, `MATMAS05`. Um tipo de mensagem pode usar vários.
- **Perfil de parceiro** (WE20) — Para cada parceiro e mensagem, diz como enviar ou qual módulo processa a entrada.
- **Porta** (WE21) — O canal técnico: tRFC, arquivo, XML por HTTP.
- **ALE** — Camada que distribui IDocs entre sistemas conforme um modelo de distribuição (BD64).
:::

| Status | Direção | Significado |
| --- | --- | --- |
| `03` | Saída | Entregue à porta |
| `12` | Saída | Despachado com sucesso |
| `64` | Entrada | Pronto para ser processado |
| `53` | Entrada | Documento de aplicação gravado |
| `51` | Entrada | Erro na aplicação: corrigir e reprocessar |

Os IDocs são acompanhados nas transações **WE02** e **WE05** e reprocessados na **BD87**. Essa capacidade de ver, corrigir e reenviar cada mensagem é a principal razão de o IDoc continuar em uso.

## RFC no ABAP Cloud {ancora="ABAP Cloud" icone="cloud"}

No ABAP Cloud, o destino não é um nome da SM59: ele vem de um **communication arrangement**, por uma classe liberada.

```abap title="Chamada RFC de saída no ABAP Cloud"
TRY.
    DATA(destination) = cl_rfc_destination_provider=>create_by_comm_arrangement(
                          comm_scenario = 'ZFLIGHT_RFC_OUT' ).
    DATA(destination_name) = destination->get_destination_name( ).

    DATA message    TYPE c LENGTH 200.
    DATA free_seats TYPE i.

    CALL FUNCTION 'Z_FLIGHT_GET_FREE_SEATS'
      DESTINATION destination_name
      EXPORTING  iv_carrier_id         = 'LH'
                 iv_connection_id      = '0400'
      IMPORTING  ev_free_seats         = free_seats
      EXCEPTIONS system_failure        = 1 MESSAGE message
                 communication_failure = 2 MESSAGE message
                 OTHERS                = 3.

  CATCH cx_rfc_dest_provider_error INTO DATA(error).
    out->write( error->get_text( ) ).
ENDTRY.
```

O módulo chamado existe só no sistema remoto, então o compilador local não conhece a interface dele. O ADT resolve isso com um **service consumption model** do tipo RFC, que gera uma classe proxy com os tipos e a chamada prontos. BAPIs e IDocs continuam disponíveis em sistemas S/4HANA; para integrações novas, a SAP publica as APIs equivalentes em OData e SOAP.

:::documentacao
- [ABAP Integration and Connectivity (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-integration-connectivity/abap-integration-and-connectivity?locale=en-US)
- [ABAP Keyword Documentation: RFC](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenrfc.htm)
- [ABAP Keyword Documentation: CALL FUNCTION … DESTINATION](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapcall_function_destination.htm)
:::
