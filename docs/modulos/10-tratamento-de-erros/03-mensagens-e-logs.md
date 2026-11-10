---
titulo: Mensagens e logs
subtitulo: Classes de mensagens, o comando MESSAGE, mensagens em exceções e em RAP, e o application log.
duracao: "1 h"
icone: message-information
objetivos:
  - Criar e usar mensagens de uma classe de mensagens
  - Prever o efeito de cada tipo de mensagem
  - Associar uma mensagem a uma exceção
  - Devolver mensagens em um business object RAP
  - Gravar um application log
palavras_chave: message classe de mensagens se91 t100 tipo a e i s w x message into if_t100_message if_t100_dyn_msg reported new_message bapiret2 application log bal cl_bali_log slg1
---

## Classes de mensagens {ancora="Classe de mensagens" icone="message-information"}

Textos mostrados ao usuário não ficam espalhados pelo código. Eles são mantidos em uma **classe de mensagens**, um objeto de repositório traduzível (transação SE91; no ADT, **New › Message Class**).

| Número | Texto breve |
| --- | --- |
| `001` | Companhia aérea &1 não existe |
| `002` | Voo &1 &2 em &3 não tem &4 assentos livres |
| `003` | Reserva &1 criada |

Cada mensagem tem um número de três dígitos, um texto breve com até quatro **variáveis** (`&1` a `&4`) e, se necessário, um texto longo com causa e procedimento. Uma mensagem é identificada pelo par classe e número: `ZFLIGHT` / `002`.

## O comando MESSAGE {ancora="MESSAGE" icone="source-code"}

```abap title="Formas do comando"
" Forma curta: tipo + número + (classe)
MESSAGE e001(zflight) WITH carrier_id.

" Forma longa, útil quando os valores vêm de variáveis
MESSAGE ID 'ZFLIGHT' TYPE 'E' NUMBER '002'
  WITH carrier_id connection_id flight_date seats.

" Sem exibir: monta o texto e preenche os campos sy-msg…
MESSAGE e002(zflight) WITH carrier_id connection_id flight_date seats
  INTO DATA(text).
```

O **tipo** define o que acontece depois da mensagem, e o efeito depende de onde o programa está rodando.

| Tipo | Nome | Em diálogo clássico | Em background |
| --- | --- | --- | --- |
| `S` | Sucesso | Barra de status da próxima tela; o programa continua | Vai para o job log |
| `I` | Informação | Pop-up; continua após a confirmação | Vai para o job log |
| `W` | Aviso | Volta à tela; o usuário corrige ou confirma | Vai para o job log |
| `E` | Erro | Volta à tela e exige correção | **Cancela o job** |
| `A` | Término | Encerra a transação | Cancela o job |
| `X` | Saída | Erro de runtime `MESSAGE_TYPE_X`, com dump | Dump |

:::aviso
Uma mensagem dos tipos `E`, `W` ou `I` em uma classe ou módulo de função chamado por um serviço não tem tela para onde voltar, e o resultado varia com o contexto. Em código reutilizável, use `MESSAGE … INTO` ou uma exceção, e deixe a exibição para a camada que conhece a interface. No **ABAP Cloud**, `MESSAGE` só é permitido com `INTO`.
:::

## Mensagens em exceções {ancora="Exceções" icone="error"}

O texto de uma exceção baseada em classe pode vir de uma classe de mensagens. A exceção implementa a interface `IF_T100_MESSAGE`; com `IF_T100_DYN_MSG`, a mensagem pode ser informada direto no lançamento.

```abap title="Classe de exceção com mensagem dinâmica"
CLASS zcx_flight DEFINITION PUBLIC
  INHERITING FROM cx_static_check FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_t100_dyn_msg.
ENDCLASS.
```

```abap title="Lançando e lendo"
TRY.
    RAISE EXCEPTION TYPE zcx_flight
      MESSAGE e002(zflight) WITH carrier_id connection_id flight_date seats.

  CATCH zcx_flight INTO DATA(error).
    DATA(text) = error->get_text( ).              " texto no idioma do usuário
    DATA(number) = error->if_t100_message~t100key-msgno.
ENDTRY.
```

A exceção carrega a identificação da mensagem, não o texto pronto. Quem a recebe decide como mostrar: em uma tela, em uma resposta OData ou em um log. Os fundamentos estão em [Classes de exceção](#excecoes).

## Mensagens em RAP {ancora="RAP" icone="product"}

Em um business object RAP não há `MESSAGE` nem exceções saindo dos handlers. Erros de validação voltam em duas estruturas de resposta: `failed`, que marca **quais** instâncias falharam, e `reported`, que traz as **mensagens**.

```abap title="Validação com mensagem ligada a um campo"
METHOD validate_seats.
  READ ENTITIES OF zr_booking IN LOCAL MODE
    ENTITY Booking FIELDS ( Seats ) WITH CORRESPONDING #( keys )
    RESULT DATA(bookings).

  LOOP AT bookings INTO DATA(booking) WHERE Seats <= 0.
    APPEND VALUE #( %tky = booking-%tky ) TO failed-booking.

    APPEND VALUE #( %tky           = booking-%tky
                    %element-Seats = if_abap_behv=>mk-on     " destaca o campo na tela
                    %msg           = new_message( id       = 'ZFLIGHT'
                                                  number   = '004'
                                                  severity = if_abap_behv_message=>severity-error
                                                  v1       = booking-Seats ) )
      TO reported-booking.
  ENDLOOP.
ENDMETHOD.
```

O Fiori Elements mostra essas mensagens no popover de mensagens e marca o campo indicado em `%element`. Em chamadas por EML, quem consome lê `reported` após o `MODIFY` ou o `COMMIT ENTITIES`.

Em APIs clássicas, o papel equivalente é o da tabela `RETURN` do tipo `BAPIRET2`, vista em [RFC, BAPI e IDoc](#rfc-bapi-idoc).

## Application log {ancora="Application log" icone="log"}

Mensagens na tela somem. Para processos sem usuário, como jobs, interfaces e processamentos em massa, o resultado precisa ficar **gravado** e consultável depois. O **application log** guarda mensagens agrupadas por **objeto** e **subobjeto**, que identificam a aplicação e a parte dela.

```abap title="Application log no ABAP Cloud"
TRY.
    DATA(log) = cl_bali_log=>create_with_header(
                  cl_bali_header_setter=>create( object      = 'ZFLIGHT'
                                                 subobject   = 'RECALC'
                                                 external_id = 'Recálculo LH' ) ).

    " Mensagem de uma classe de mensagens
    log->add_item( cl_bali_message_setter=>create(
                     severity   = if_bali_constants=>c_severity_warning
                     id         = 'ZFLIGHT'
                     number     = '002'
                     variable_1 = 'LH'
                     variable_2 = '0400' ) ).

    " Texto livre
    log->add_item( cl_bali_free_text_setter=>create(
                     severity = if_bali_constants=>c_severity_status
                     text     = '1.250 voos recalculados' ) ).

    " Uma exceção capturada, com a cadeia de exceções anteriores
    log->add_item( cl_bali_exception_setter=>create(
                     severity  = if_bali_constants=>c_severity_error
                     exception = error ) ).

    cl_bali_log_db=>get_instance( )->save_log( log                        = log
                                               assign_to_current_appl_job = abap_true ).
  CATCH cx_bali_runtime INTO DATA(log_error).
    " Falha ao gravar o log não deve derrubar o processo principal
ENDTRY.
```

O objeto e o subobjeto são criados antes, no ADT (**New › Application Log Object**). Os logs são consultados no app Fiori **Application Logs** e, quando gravados dentro de um application job, aparecem junto com a execução do job.

:::nota
Em Standard ABAP, o mesmo recurso é usado pelos módulos de função `BAL_LOG_CREATE`, `BAL_LOG_MSG_ADD` e `BAL_DB_SAVE`. Os objetos são definidos na transação SLG0 e os logs, exibidos na SLG1.
:::

## Qual canal para qual público {ancora="Resumo" icone="compare"}

| Quem precisa saber | Canal |
| --- | --- |
| O usuário, agora, para corrigir algo | Mensagem na tela: `reported` em RAP, `MESSAGE` em diálogo clássico |
| O código que chamou | Exceção baseada em classe |
| Outro sistema que chamou | Estrutura de retorno, erro OData ou status HTTP |
| Quem opera o processo, depois | Application log |
| O desenvolvedor, diante de um bug | Dump, com `ASSERT` ou exceção não tratada |

:::documentacao
- [ABAP Keyword Documentation: MESSAGE](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapmessage.htm)
- [ABAP Keyword Documentation: mensagens em classes de exceção](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenmessage_interfaces.htm)
- [ABAP RESTful Application Programming Model (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model?locale=en-US)
- [Cheat sheet: Released ABAP Classes](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/22_Released_ABAP_Classes.md)
:::
