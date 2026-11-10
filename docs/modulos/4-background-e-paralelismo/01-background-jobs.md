---
titulo: Background jobs
subtitulo: Processamento sem usuário esperando, com SM36, SM37 e agendamento por código.
duracao: "50 min"
icone: history
objetivos:
  - Explicar quando um processamento deve ir para background
  - Descrever job, step, variante e condição de início
  - Acompanhar o ciclo de vida de um job
  - Agendar um job por código com JOB_OPEN, SUBMIT e JOB_CLOSE
  - Escrever programas que se comportam bem em background
palavras_chave: background job sm36 sm37 job_open job_close submit via job variante btc sy-batch step evento job log spool
---

## Por que background {ancora="Conceito" icone="history"}

Um work process de **diálogo** existe para responder rápido. Se um programa passa do tempo limite configurado para o diálogo, o sistema o cancela (dump `TIME_OUT`). Processamentos longos ou periódicos, como fechamentos, cargas, recálculos e envios em massa, pertencem aos work processes de **background** (BTC), que não têm esse limite e não precisam de um usuário conectado.

:::termos
- **Job** — Unidade agendada, com nome e número. Contém um ou mais steps, executados em sequência.
- **Step** — Um programa ABAP com uma **variante**, ou um comando externo. Cada step roda com um usuário definido no job.
- **Variante** — Conjunto gravado de valores da tela de seleção. É assim que o programa recebe parâmetros sem ninguém digitando.
- **Condição de início** — Imediato, data e hora, após outro job, após um **evento** ou em um modo de operação.
- **Periodicidade** — Repetição automática: a cada hora, dia, semana, mês.
:::

## Definindo e monitorando {ancora="SM36 e SM37" icone="sys-monitor"}

Em sistemas com SAP GUI, o job é definido na **SM36** e acompanhado na **SM37**. O ciclo de vida aparece na coluna de status:

| Status | Significado |
| --- | --- |
| **Scheduled** | Definido, mas ainda sem liberação para rodar |
| **Released** | Liberado, aguardando a condição de início |
| **Ready** | Condição satisfeita; espera um work process BTC livre |
| **Active** | Em execução |
| **Finished** | Todos os steps terminaram sem erro |
| **Canceled** | Um step terminou com erro, ou o job foi cancelado |

Para cada job a SM37 oferece o **job log** (mensagens emitidas pelo programa), o **spool** (listas geradas) e os dados do step. Liberar jobs exige autorização própria (objeto `S_BTCH_JOB`); administrar jobs de outros usuários, `S_BTCH_ADM`.

## Agendando por código {ancora="Por código" icone="source-code"}

Três chamadas, sempre nesta ordem: abrir o job, acrescentar os steps, fechar com a condição de início.

```abap title="Job imediato com um step (Standard ABAP)"
DATA job_name   TYPE btcjob VALUE 'ZFLIGHT_RECALC'.
DATA job_number TYPE btcjobcnt.

CALL FUNCTION 'JOB_OPEN'
  EXPORTING  jobname  = job_name
  IMPORTING  jobcount = job_number
  EXCEPTIONS OTHERS   = 1.
IF sy-subrc <> 0.
  RETURN.
ENDIF.

" O step: o programa roda no job, com estes valores de seleção
SUBMIT zflight_recalc
  WITH p_carr = 'LH'
  VIA JOB job_name NUMBER job_number
  AND RETURN.

CALL FUNCTION 'JOB_CLOSE'
  EXPORTING  jobname   = job_name
             jobcount  = job_number
             strtimmed = abap_true        " iniciar imediatamente
  EXCEPTIONS OTHERS    = 1.
```

Para agendar em vez de iniciar na hora, troque `strtimmed` por `sdlstrtdt` e `sdlstrttm` (data e hora). Para iniciar após um evento, informe `event_id`; o evento é disparado por outro programa com `cl_batch_event=>raise( )`.

## Programas que funcionam bem em background {ancora="Boas práticas" icone="lightbulb"}

:::checklist
- **Sem diálogo.** Não há tela: nada de pop-ups nem de `CALL SCREEN`. O campo `sy-batch` vale `'X'` quando o programa roda em job.
- **Mensagens viram log.** `MESSAGE` do tipo I, S e W vai para o job log. Tipos E e A **cancelam** o job.
- **Processe em pacotes.** Leia e grave blocos de tamanho fixo, com um commit por pacote, para limitar memória e o tamanho da LUW de banco.
- **Seja reiniciável.** Registre o que já foi processado. Um job cancelado na metade precisa poder rodar de novo sem duplicar nada.
- **Registre o resultado.** Use o application log para quantidades, erros por registro e totais; o job log é curto demais para isso.
- **Respeite os bloqueios.** Peça os mesmos bloqueios SAP que a transação de diálogo pede e trate o caso de o registro estar em uso.
:::

```abap title="Leitura em pacotes"
SELECT carrier_id, connection_id, flight_date, seats_max, seats_occupied
  FROM /dmo/flight
  WHERE carrier_id = @p_carr
  INTO TABLE @DATA(flights)
  PACKAGE SIZE 5000.

  process_package( flights ).       " regra de negócio do pacote
  COMMIT WORK.                      " uma LUW por pacote

ENDSELECT.
```

:::aviso
`COMMIT WORK` dentro de `SELECT … ENDSELECT` fecha o cursor do banco em alguns cenários. Quando isso for um problema, leia primeiro só as chaves e processe cada pacote com uma leitura separada.
:::

No ABAP Cloud não existem SM36, `SUBMIT` nem variantes. O equivalente são os **application jobs**, tema da [próxima lição](#application-jobs).

:::quiz
### O que acontece com um programa de diálogo que excede o tempo máximo configurado?

- [ ] Passa automaticamente para background
- [x] É cancelado com erro de runtime
- [ ] Continua em um work process de atualização
- [ ] Fica em espera até o usuário confirmar

> O limite protege os work processes de diálogo. Trabalho longo deve ser agendado como job.

### Qual status indica que o job já pode iniciar, mas ainda espera um work process livre?

- [ ] Scheduled
- [ ] Released
- [x] Ready
- [ ] Active

> Released espera a condição de início; Ready já a satisfez e aguarda um work process BTC.

### Qual é a sequência correta para criar um job por código?

- [ ] `SUBMIT`, `JOB_OPEN`, `JOB_CLOSE`
- [x] `JOB_OPEN`, `SUBMIT … VIA JOB`, `JOB_CLOSE`
- [ ] `JOB_CLOSE`, `JOB_OPEN`, `SUBMIT`
- [ ] `JOB_OPEN`, `JOB_CLOSE`, `SUBMIT`

> JOB_OPEN devolve o número do job, SUBMIT acrescenta o step e JOB_CLOSE define o início.

### Em um job, o que uma mensagem do tipo E provoca?

- [ ] Um pop-up para o administrador
- [ ] Nada: é ignorada
- [x] O cancelamento do job
- [ ] O reinício do step

> Sem tela para corrigir a entrada, a mensagem de erro encerra o step e o job fica Canceled.
:::

:::documentacao
- [ABAP Keyword Documentation: SUBMIT … VIA JOB](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapsubmit_via_job.htm)
- [SAP Help Portal: ABAP Platform](https://help.sap.com/docs/ABAP_PLATFORM_NEW?locale=en-US)
:::
