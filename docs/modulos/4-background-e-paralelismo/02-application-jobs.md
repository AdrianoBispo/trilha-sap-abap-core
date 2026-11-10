---
titulo: Application jobs e bgPF
subtitulo: Processamento em background no ABAP Cloud, agendado ou disparado pela transação.
duracao: "1 h"
icone: time-entry-request
objetivos:
  - Descrever os artefatos de um application job
  - Implementar a classe de um job com seus parâmetros
  - Agendar um job pelo app Fiori e por código
  - Explicar o que o bgPF resolve
  - Escolher entre application job e bgPF
palavras_chave: application job catalog entry job template if_apj_dt_exec_object if_apj_rt_exec_object cl_apj_rt_api bgpf background processing framework cl_bgmc_process_factory if_bgmc_op_single
---

## Application jobs {ancora="Application jobs" icone="time-entry-request"}

No ABAP Cloud, o agendamento de programas foi refeito sobre classes. Um **application job** é montado com três artefatos, todos criados no ADT:

:::termos
- **Classe do job** — Contém a lógica. Implementa duas interfaces: uma descreve os parâmetros, a outra executa.
- **Job catalog entry** — Registra a classe como algo que pode ser agendado.
- **Job template** — Um catalog entry com valores de parâmetros já preenchidos. É o que o usuário escolhe ao agendar.
:::

O agendamento é feito no app Fiori **Application Jobs**, onde também ficam o status, o log e a opção de repetir, ou por código.

```abap title="ZCL_FLIGHT_RECALC_JOB"
CLASS zcl_flight_recalc_job DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_apj_dt_exec_object.     " tempo de design: parâmetros
    INTERFACES if_apj_rt_exec_object.     " tempo de execução: lógica
ENDCLASS.

CLASS zcl_flight_recalc_job IMPLEMENTATION.

  METHOD if_apj_dt_exec_object~get_parameters.
    " Parâmetros que o app Application Jobs mostra ao agendar
    et_parameter_def = VALUE #(
      ( selname        = 'P_CARR'
        kind           = if_apj_dt_exec_object=>parameter
        datatype       = 'C'
        length         = 3
        param_text     = 'Companhia aérea'
        changeable_ind = abap_true ) ).

    " Valores padrão
    et_parameter_val = VALUE #(
      ( selname = 'P_CARR' kind = if_apj_dt_exec_object=>parameter
        sign = 'I' option = 'EQ' low = 'LH' ) ).
  ENDMETHOD.

  METHOD if_apj_rt_exec_object~execute.
    DATA carrier TYPE /dmo/carrier_id.

    LOOP AT it_parameters INTO DATA(parameter).
      CASE parameter-selname.
        WHEN 'P_CARR'. carrier = parameter-low.
      ENDCASE.
    ENDLOOP.

    " Aqui entra o processamento, de preferência por meio de EML
    " sobre um business object. Erros: RAISE EXCEPTION … cx_apj_rt_content.
  ENDMETHOD.

ENDCLASS.
```

Os parâmetros fazem o papel da tela de seleção e da variante do job clássico: `kind` distingue um parâmetro simples de um intervalo (*select-option*), e os valores chegam em `it_parameters` no formato sinal, opção, de, até.

```abap title="Agendando por código"
TRY.
    cl_apj_rt_api=>schedule_job(
      EXPORTING iv_job_template_name = 'ZFLIGHT_RECALC_TEMPLATE'
                iv_job_text          = 'Recálculo de assentos LH'
                is_start_info        = VALUE #( start_immediately = abap_true )
      IMPORTING ev_jobname           = DATA(job_name)
                ev_jobcount          = DATA(job_count) ).
  CATCH cx_apj_rt INTO DATA(error).
    out->write( error->get_text( ) ).
ENDTRY.
```

:::nota
Mensagens para quem opera o job vão para o **application log**, criado com as classes `CL_BALI_…`. O app Application Jobs mostra esse log junto com o resultado da execução. Veja [Mensagens e logs](#mensagens-e-logs).
:::

## bgPF: background Processing Framework {ancora="bgPF" icone="paper-plane"}

Nem todo trabalho em background é um job agendado. Às vezes a transação precisa **terminar rápido** e deixar uma tarefa para depois: enviar um e-mail, chamar um sistema externo, recalcular algo caro. Se essa tarefa rodasse dentro da requisição, o usuário esperaria; se rodasse antes do commit e falhasse, a gravação se perderia.

O **bgPF** resolve isso com execução **assíncrona, confiável e ligada ao commit**:

:::checklist
- A operação é registrada durante a transação e só é enfileirada se o **commit** acontecer. Com rollback, ela some.
- Depois do commit, roda em outra sessão, **exatamente uma vez**. Se falhar, pode ser reprocessada.
- A operação é uma classe sua, que implementa uma interface do framework.
:::

| Interface | Tipo de operação | Uso |
| --- | --- | --- |
| `IF_BGMC_OP_SINGLE` | **Controlada**: segue as fases da [SAP LUW controlada](#luw) | O padrão, especialmente junto com RAP |
| `IF_BGMC_OP_SINGLE_TX_UNCONTR` | **Não controlada**: sem verificação de fases | Código que faz o próprio controle transacional |

```abap title="A operação"
CLASS zcl_send_confirmation DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_bgmc_op_single.
    METHODS constructor IMPORTING i_booking_id TYPE /dmo/booking_id.
  PRIVATE SECTION.
    DATA booking_id TYPE /dmo/booking_id.    " estado serializado junto com o objeto
ENDCLASS.

CLASS zcl_send_confirmation IMPLEMENTATION.
  METHOD constructor.
    booking_id = i_booking_id.
  ENDMETHOD.

  METHOD if_bgmc_op_single~execute.
    cl_abap_tx=>modify( ).
    " monta a confirmação da reserva booking_id
    cl_abap_tx=>save( ).
    " grava o registro de envio e dispara a comunicação
  ENDMETHOD.
ENDCLASS.
```

```abap title="Registrando a operação"
TRY.
    DATA(process) = cl_bgmc_process_factory=>get_default( )->create( ).

    process->set_name( 'Confirmação de reserva'
          )->set_operation( NEW zcl_send_confirmation( booking_id ) ).

    process->save_for_execution( ).     " enfileira para depois do commit
    COMMIT WORK.                        " fora do RAP; dentro dele, o framework faz o commit
  CATCH cx_bgmc INTO DATA(error).
    out->write( error->get_text( ) ).
ENDTRY.
```

O objeto da operação é **serializado** e recriado na sessão de background, então guarde nele apenas chaves e dados simples. Em um business object RAP, o registro costuma ficar na sequência de save, para que a tarefa só exista se a gravação tiver sucesso.

## Qual usar {ancora="Comparação" icone="compare"}

| | Application job | bgPF |
| --- | --- | --- |
| Quem dispara | Um usuário ou um agendamento | O código da própria transação |
| Quando roda | Em data e hora, periodicamente ou sob demanda | Logo após o commit |
| Parâmetros | Definidos pela classe e mostrados no app | Atributos do objeto da operação |
| Monitoramento | App Application Jobs e application log | Monitor do bgPF e tratamento de erro da operação |
| Caso típico | Fechamento noturno, carga em massa | Efeito colateral de uma gravação |

:::quiz
### Qual artefato torna uma classe disponível para agendamento como application job?

- [ ] Service binding
- [x] Job catalog entry
- [ ] Behavior definition
- [ ] Communication scenario

> O catalog entry registra a classe; o template acrescenta valores padrão para os parâmetros.

### Em que método da classe do job fica a lógica executada em background?

- [ ] `if_apj_dt_exec_object~get_parameters`
- [x] `if_apj_rt_exec_object~execute`
- [ ] `if_oo_adt_classrun~main`
- [ ] `constructor`

> A interface de tempo de design descreve os parâmetros; a de runtime executa.

### O que acontece com uma operação bgPF registrada se a transação terminar em rollback?

- [ ] É executada mesmo assim
- [ ] Fica pendente para a próxima transação
- [x] É descartada
- [ ] Gera um dump

> A operação só entra na fila com o commit. É o que garante que a tarefa corresponda a dados gravados.

### Por que o objeto de uma operação bgPF deve guardar apenas dados simples?

- [ ] Para economizar memória da sessão atual
- [x] Porque ele é serializado e recriado em outra sessão
- [ ] Porque o framework só aceita o tipo `string`
- [ ] Porque a operação roda no navegador

> Referências a objetos vivos da sessão original não fazem sentido na sessão de background.
:::

:::documentacao
- [Background Processing Framework (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-concepts/background-processing-framework?locale=en-US)
- [Controlled SAP LUW (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-concepts/controlled-sap-luw?locale=en-US)
- [SAP BTP ABAP environment (SAP Help Portal)](https://help.sap.com/docs/sap-btp-abap-environment?locale=en-US)
- [Cheat sheet: Released ABAP Classes](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/22_Released_ABAP_Classes.md)
:::
