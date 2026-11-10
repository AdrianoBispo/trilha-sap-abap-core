---
titulo: Programação paralela
subtitulo: RFC assíncrono, grupos de servidores e a classe CL_ABAP_PARALLEL.
duracao: "1 h"
icone: combine
objetivos:
  - Dizer quando paralelizar vale a pena
  - Paralelizar com RFC assíncrono e callback
  - Usar CL_ABAP_PARALLEL
  - Dividir o trabalho em pacotes independentes
  - Evitar esgotar os work processes do sistema
palavras_chave: paralelo arfc starting new task destination in group calling on end of task receive results wait for asynchronous tasks cl_abap_parallel if_abap_parallel spta rz12
---

## Quando paralelizar {ancora="Conceito" icone="combine"}

Um programa ABAP roda em **um** work process, em sequência. Se o volume é grande e o trabalho pode ser dividido em partes que não dependem umas das outras, várias partes podem rodar ao mesmo tempo, cada uma em um work process diferente. O tempo total cai, mas o **consumo de recursos sobe**: paralelizar troca tempo por carga no sistema.

:::checklist
- Vale a pena quando o gargalo é processamento por registro e os registros são **independentes**.
- Não ajuda quando o gargalo é uma única consulta lenta: nesse caso o trabalho é levar o cálculo ao banco, com [code pushdown](#sql-pushdown).
- Piora quando as tarefas disputam os mesmos bloqueios ou as mesmas linhas de uma tabela.
:::

## RFC assíncrono {ancora="aRFC" icone="process"}

A técnica clássica é o **aRFC**: chamar um módulo de função *remote-enabled* com `STARTING NEW TASK`. A chamada volta imediatamente e o módulo roda em outra sessão, em um work process de diálogo do próprio sistema ou de outra instância.

```abap title="Distribuindo pacotes com aRFC (Standard ABAP)"
CLASS lcl_parallel DEFINITION.
  PUBLIC SECTION.
    METHODS run IMPORTING packages TYPE ty_packages.
    METHODS on_end IMPORTING p_task TYPE clike.      " callback
  PRIVATE SECTION.
    DATA started  TYPE i.
    DATA finished TYPE i.
ENDCLASS.

CLASS lcl_parallel IMPLEMENTATION.
  METHOD run.
    LOOP AT packages INTO DATA(package).
      DATA(task) = |PKG{ sy-tabix }|.

      CALL FUNCTION 'Z_FLIGHT_RECALC_PACKAGE'
        STARTING NEW TASK task
        DESTINATION IN GROUP DEFAULT
        CALLING on_end ON END OF TASK
        EXPORTING  it_keys               = package-keys
        EXCEPTIONS resource_failure      = 1
                   system_failure        = 2
                   communication_failure = 3.

      IF sy-subrc = 0.
        started += 1.
      ELSE.
        " Sem work process livre: espere uma tarefa terminar e tente de novo
        WAIT FOR ASYNCHRONOUS TASKS UNTIL finished >= started UP TO 30 SECONDS.
      ENDIF.
    ENDLOOP.

    " Aguarda todas as tarefas iniciadas
    WAIT FOR ASYNCHRONOUS TASKS UNTIL finished >= started.
  ENDMETHOD.

  METHOD on_end.
    DATA count TYPE i.
    RECEIVE RESULTS FROM FUNCTION 'Z_FLIGHT_RECALC_PACKAGE'
      IMPORTING  ev_processed          = count
      EXCEPTIONS system_failure        = 1
                 communication_failure = 2.
    finished += 1.
  ENDMETHOD.
ENDCLASS.
```

:::termos
- `STARTING NEW TASK` — Torna a chamada assíncrona. O nome da tarefa identifica o retorno.
- `DESTINATION IN GROUP` — Deixa o sistema escolher a instância dentro de um **grupo de servidores RFC** (transação RZ12). `DEFAULT` usa todas as instâncias.
- `CALLING … ON END OF TASK` — Método chamado quando a tarefa termina. Ele roda na sessão original, durante um `WAIT`.
- `RECEIVE RESULTS` — Recebe os parâmetros de saída e as exceções da tarefa. Só pode ser usado no callback.
- `resource_failure` — Não havia work process disponível. A chamada não foi iniciada.
:::

O grupo de servidores define quanto do sistema o paralelismo pode usar: por exemplo, deixar sempre uma parte dos work processes de diálogo livres para os usuários. Em código clássico existe ainda o framework **SPTA** (`SPTA_PARA_PROCESS_START_2`), que empacota esse padrão de distribuição e coleta.

## CL_ABAP_PARALLEL {ancora="CL_ABAP_PARALLEL" icone="puzzle"}

A classe `CL_ABAP_PARALLEL` esconde o aRFC atrás de uma API de objetos e está **liberada para o ABAP Cloud**. Cada tarefa é um objeto de uma classe sua que implementa `IF_ABAP_PARALLEL`; o framework serializa o objeto, executa o método `do` em outra sessão e devolve o objeto com o resultado.

```abap title="ZCL_FLIGHT_RECALC_TASK"
CLASS zcl_flight_recalc_task DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_abap_parallel.
    METHODS constructor IMPORTING i_carrier_id TYPE /dmo/carrier_id.
    DATA carrier_id TYPE /dmo/carrier_id READ-ONLY.
    DATA processed  TYPE i READ-ONLY.          " resultado
ENDCLASS.

CLASS zcl_flight_recalc_task IMPLEMENTATION.
  METHOD constructor.
    carrier_id = i_carrier_id.
  ENDMETHOD.

  METHOD if_abap_parallel~do.
    " Roda em outra sessão. Só enxerga os atributos do próprio objeto.
    SELECT COUNT(*) FROM /dmo/flight
      WHERE carrier_id = @carrier_id
      INTO @processed.
  ENDMETHOD.
ENDCLASS.
```

```abap title="Executando as tarefas"
DATA(parallel) = NEW cl_abap_parallel( p_percentage = 30 ).   " no máximo 30% dos recursos livres

parallel->run_inst(
  EXPORTING p_in_tab  = VALUE #( ( NEW zcl_flight_recalc_task( 'LH' ) )
                                 ( NEW zcl_flight_recalc_task( 'AA' ) )
                                 ( NEW zcl_flight_recalc_task( 'SQ' ) ) )
  IMPORTING p_out_tab = DATA(results) ).

LOOP AT results INTO DATA(result).
  IF result-inst IS BOUND.
    DATA(task) = CAST zcl_flight_recalc_task( result-inst ).
    out->write( |{ task->carrier_id }: { task->processed } voos| ).
  ELSE.
    out->write( |Falha: { result-message }| ).
  ENDIF.
ENDLOOP.
```

`run_inst` só volta quando todas as tarefas terminaram. A classe da tarefa precisa ser **global**, porque é recriada em outra sessão, e seus atributos precisam ser serializáveis.

## Regras para dividir o trabalho {ancora="Boas práticas" icone="lightbulb"}

:::checklist
- **Pacotes independentes.** Nenhum pacote pode ler o que outro grava. Divida por uma chave natural: companhia, centro, intervalo de documentos.
- **Tamanho equilibrado.** Pacotes pequenos demais gastam mais em comunicação do que em trabalho; grandes demais desperdiçam o paralelismo e estouram memória.
- **Uma LUW por tarefa.** Cada sessão tem a própria LUW. Se uma tarefa falhar, as outras já gravaram: planeje como reprocessar só o que faltou.
- **Colete os erros.** Devolva, para cada pacote, o que foi processado e o que falhou. Não deixe uma falha silenciosa.
- **Limite o grau de paralelismo.** Mais tarefas do que work processes livres só gera fila e `resource_failure`. Comece baixo e meça.
- **Nada de estado global.** Variáveis estáticas e memória da sessão original não existem nas sessões paralelas.
:::

| | aRFC | `CL_ABAP_PARALLEL` |
| --- | --- | --- |
| Disponível no ABAP Cloud | Não | Sim |
| Unidade de trabalho | Módulo de função remote-enabled | Objeto que implementa `IF_ABAP_PARALLEL` |
| Controle de recursos | Grupo de servidores RFC | Parâmetros do construtor (percentual, número de tarefas) |
| Coleta de resultados | Callback com `RECEIVE RESULTS` | Tabela de saída de `run_inst` |

:::quiz
### O que a adição `STARTING NEW TASK` faz em um `CALL FUNCTION`?

- [ ] Agenda um job em background
- [x] Executa o módulo de forma assíncrona, em outra sessão
- [ ] Registra o módulo para o `COMMIT WORK`
- [ ] Repete a chamada em caso de erro

> A chamada volta imediatamente e o módulo roda em paralelo, em outro work process.

### O que significa a exceção `resource_failure` em uma chamada aRFC?

- [ ] O módulo terminou com erro
- [ ] A rede caiu
- [x] Não havia work process disponível para iniciar a tarefa
- [ ] O banco estava bloqueado

> A tarefa nem começou. O programa deve esperar uma tarefa terminar e tentar de novo.

### Por que a classe usada com `CL_ABAP_PARALLEL` precisa ser global?

- [ ] Porque classes locais não têm atributos
- [x] Porque o objeto é serializado e recriado em outra sessão, que precisa conhecer a classe
- [ ] Porque `run_inst` é um método estático
- [ ] Porque o framework grava a classe no banco

> A outra sessão não tem acesso às classes locais do programa que disparou as tarefas.

### Qual destes casos é um bom candidato à paralelização?

- [ ] Uma única consulta SQL lenta
- [ ] Um loop em que cada volta depende do resultado da anterior
- [x] O recálculo de milhares de documentos que não se relacionam
- [ ] A gravação de um único registro

> O ganho vem de tarefas independentes. Dependência entre elas elimina o benefício.
:::

:::documentacao
- [ABAP Keyword Documentation: CALL FUNCTION … STARTING NEW TASK](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapcall_function_starting.htm)
- [ABAP Keyword Documentation: WAIT FOR ASYNCHRONOUS TASKS](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapwait_arfc.htm)
- [Cheat sheet: Released ABAP Classes](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/22_Released_ABAP_Classes.md)
:::
