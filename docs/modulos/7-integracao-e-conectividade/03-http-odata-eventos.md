---
titulo: HTTP, OData e eventos
subtitulo: Consumir e expor serviços no ABAP Cloud e avisar outros sistemas com eventos de negócio.
duracao: "1 h 10 min"
icone: internet-browser
objetivos:
  - Chamar uma API REST com o cliente HTTP liberado
  - Consumir um serviço OData com um service consumption model
  - Expor um serviço OData e um serviço HTTP próprio
  - Declarar e disparar um evento de negócio em RAP
  - Comparar chamada direta e evento
palavras_chave: http client cl_web_http_client_manager cl_http_destination_provider odata service consumption model cl_web_odata_client_factory if_http_service_extension web api soap evento raise entity event event binding
---

## Chamando uma API REST {ancora="Cliente HTTP" icone="internet-browser"}

No ABAP Cloud, uma chamada HTTP de saída tem três passos: obter o **destino**, criar o **cliente** e executar a **requisição**.

```abap title="GET em uma API externa"
TRY.
    " 1. Destino: host e credenciais vêm do communication arrangement
    DATA(destination) = cl_http_destination_provider=>create_by_comm_arrangement(
                          comm_scenario = 'ZFLIGHT_WEATHER'
                          service_id    = 'ZFLIGHT_WEATHER_REST' ).

    " 2. Cliente
    DATA(client) = cl_web_http_client_manager=>create_by_http_destination( destination ).

    " 3. Requisição
    DATA(request) = client->get_http_request( ).
    request->set_uri_path( `/v1/forecast?airport=FRA` ).
    request->set_header_field( i_name = `Accept` i_value = `application/json` ).

    DATA(response) = client->execute( if_web_http_client=>get ).

    IF response->get_status( )-code = 200.
      DATA(json) = response->get_text( ).       " conversão do JSON: módulo 09
    ENDIF.

    client->close( ).

  CATCH cx_http_dest_provider_error cx_web_http_client_error INTO DATA(error).
    out->write( error->get_text( ) ).
ENDTRY.
```

Para enviar dados, preencha o corpo com `request->set_text( )` e execute com `if_web_http_client=>post`. `cl_http_destination_provider=>create_by_url( )` existe, mas deixa host e credenciais no código: use só em testes.

:::nota
Em Standard ABAP, o equivalente é a classe `CL_HTTP_CLIENT` (`create_by_destination`, com um destino da SM59 dos tipos G ou H), com os métodos `send` e `receive`.
:::

## Consumindo OData {ancora="Consumir OData" icone="download-from-cloud"}

Dá para chamar um serviço OData com o cliente HTTP e montar as URLs à mão. O caminho recomendado é o **service consumption model**: um assistente do ADT que lê o arquivo de metadados (`$metadata`) do serviço remoto e gera os tipos de dados e um **proxy** tipado.

```abap title="Leitura por proxy OData V2"
DATA partners TYPE STANDARD TABLE OF zsc_business_partner=>tys_a_business_partner_type
              WITH EMPTY KEY.

DATA(proxy) = cl_web_odata_client_factory=>create_v2_remote_proxy(
                iv_service_definition_name = 'ZSC_BUSINESS_PARTNER'
                io_http_client             = client
                iv_relative_service_root   = '/sap/opu/odata/sap/API_BUSINESS_PARTNER' ).

DATA(read) = proxy->create_resource_for_entity_set( 'A_BUSINESS_PARTNER'
                 )->create_request_for_read( ).
read->set_top( 20 ).

read->execute( )->get_business_data( IMPORTING et_business_data = partners ).
```

O próprio assistente mostra um trecho como esse, pronto para copiar, com os nomes gerados para o seu modelo. Filtros, ordenação e paginação são montados por métodos do proxy, sem concatenar texto na URL.

## Expondo serviços {ancora="Expor" icone="upload-to-cloud"}

::::colunas{n="2"}
:::cartao{etiqueta="OData" tipo="info"}
### Serviço RAP como API

Um business object RAP vira API com uma **service binding** do tipo **OData V4 - Web API** (ou V2). A diferença para o tipo UI é que as anotações de tela não são publicadas. O binding entra em um **communication scenario** como serviço de entrada.
:::

:::cartao{etiqueta="HTTP" tipo="c5"}
### Serviço HTTP próprio

Para um formato que não é OData, crie no ADT um **HTTP service**. Ele gera uma classe com o método que recebe a requisição e monta a resposta.
:::
::::

```abap title="Handler de um HTTP service"
CLASS zcl_flight_status_http DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_http_service_extension.
ENDCLASS.

CLASS zcl_flight_status_http IMPLEMENTATION.
  METHOD if_http_service_extension~handle_request.
    IF request->get_method( ) <> `GET`.
      response->set_status( i_code = 405 i_reason = `Method Not Allowed` ).
      RETURN.
    ENDIF.

    DATA(carrier) = request->get_form_field( `carrier` ).

    SELECT COUNT(*) FROM /dmo/flight
      WHERE carrier_id = @carrier
      INTO @DATA(flights).

    response->set_content_type( `application/json` ).
    response->set_text( |\{ "carrier": "{ carrier }", "flights": { flights } \}| ).
  ENDMETHOD.
ENDCLASS.
```

:::aviso
Um HTTP service próprio não ganha nada de graça: verificação de autorização (`AUTHORITY-CHECK` no handler), paginação, filtros, tratamento de erros, controle de concorrência e documentação do contrato ficam por sua conta. Se os dados pertencem a um business object, exponha-o por OData.
:::

Serviços **SOAP** seguem a mesma ideia do OData no consumo: um service consumption model criado a partir do **WSDL** gera a classe proxy. Em sistemas clássicos, os proxies são criados na SE80 ou na SPROXY e configurados na SOAMANAGER.

## Eventos de negócio {ancora="Eventos" icone="paper-plane"}

Uma chamada direta acopla os dois lados: quem chama precisa conhecer quem recebe e esperar por ele. Um **evento de negócio** inverte a relação. O sistema apenas anuncia que algo aconteceu, e quem tiver interesse se inscreve. O RAP tem suporte nativo.

```bdl title="Declaração na behavior definition"
define behavior for ZR_Booking alias Booking
…
{
  create; update; delete;

  event BookingConfirmed parameter ZD_BookingConfirmed;
}
```

```abap title="Disparo na sequência de save"
METHOD save_modified.
  IF update-booking IS NOT INITIAL.
    RAISE ENTITY EVENT zr_booking~BookingConfirmed
      FROM VALUE #( FOR booking IN update-booking
                    ( %key              = booking-%key
                      %param-flightdate = booking-FlightDate ) ).
  ENDIF.
ENDMETHOD.
```

:::termos
- `event … parameter` — Declara o evento e, opcionalmente, uma entidade abstrata com os dados que acompanham a chave.
- `RAISE ENTITY EVENT` — Dispara o evento. Só é permitido na fase de save, para que o evento corresponda a dados gravados.
- **Event binding** — Objeto do ADT que dá ao evento um nome externo (namespace, objeto, operação e versão) e o publica.
- **Canal** — A configuração, feita pelo administrador, que envia os eventos a um broker como o SAP Event Mesh.
:::

Dentro do mesmo sistema, outro código pode reagir ao evento com um **handler local** de eventos RAP, executado de forma assíncrona. Para eventos vindos de fora, cria-se um **event consumption model**.

## Chamada ou evento {ancora="Comparação" icone="compare"}

| | Chamada direta (HTTP, OData, RFC) | Evento de negócio |
| --- | --- | --- |
| Quem conhece quem | O chamador conhece o destino | O emissor não conhece os consumidores |
| Resposta | Imediata | Não há; o consumidor age por conta própria |
| Destino fora do ar | A chamada falha | O broker guarda a mensagem |
| Novo consumidor | Exige mudança no emissor | Basta uma nova inscrição |
| Bom para | Consultas e comandos que precisam de retorno | Notificar mudanças e disparar processos em outros sistemas |

:::documentacao
- [ABAP Integration and Connectivity (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-integration-connectivity/abap-integration-and-connectivity?locale=en-US)
- [ABAP RESTful Application Programming Model (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model?locale=en-US)
- [ABAP Keyword Documentation: RAISE ENTITY EVENT](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapraise_entity_event.htm)
- [Cheat sheet: Released ABAP Classes](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/22_Released_ABAP_Classes.md)
:::
