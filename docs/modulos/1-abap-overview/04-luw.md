---
titulo: LUW, a unidade lógica de trabalho
subtitulo: LUW de banco, SAP LUW, técnicas de agrupamento, bloqueios e a LUW controlada do ABAP Cloud.
duracao: "1 h"
icone: synchronize
objetivos:
  - Diferenciar LUW de banco e SAP LUW
  - Listar o que provoca um commit implícito
  - Agrupar gravações com módulos de update
  - Usar COMMIT WORK e ROLLBACK WORK
  - Explicar as fases da SAP LUW controlada
palavras_chave: luw logical unit of work commit work rollback work update task perform on commit enqueue dequeue commit implícito cl_abap_tx commit entities
---

## Tudo ou nada {ancora="Conceito" icone="synchronize"}

Uma **LUW** (*Logical Unit of Work*) é um conjunto de alterações que só faz sentido inteiro: ou todas são gravadas, ou nenhuma. Transferir assentos de um voo para outro são dois `UPDATE`; se só o primeiro for gravado, os dados ficam inconsistentes.

O banco de dados já oferece isso: uma **LUW de banco** começa na primeira alteração e termina em um `COMMIT` (grava tudo) ou `ROLLBACK` (desfaz tudo). O problema está em **quando** esse commit acontece no servidor ABAP.

## Commits implícitos {ancora="Commit implícito" icone="hint"}

Como visto em [O servidor de aplicação ABAP](#servidor-de-aplicacao), o work process é liberado ao fim de cada passo de diálogo, e a conexão com o banco vai junto. Por isso o sistema faz um **commit implícito** sempre que o work process pode ser trocado:

:::checklist
- Ao fim de um passo de diálogo, quando a tela é enviada ao usuário.
- Em chamadas RFC síncronas e assíncronas, e em comunicação HTTP.
- No comando `WAIT` e ao enviar mensagens de diálogo (tipos I, W e E).
- Ao fim de uma requisição HTTP ou de um job.
:::

Consequência: se você gravar com `UPDATE` na primeira tela e o usuário cancelar na terceira, a primeira gravação **já está no banco** e não há como desfazê-la. Uma transação de negócio dura várias telas; uma LUW de banco, não.

## A SAP LUW {ancora="SAP LUW" icone="process"}

A **SAP LUW** é a resposta da plataforma: uma unidade lógica que atravessa vários passos de diálogo. A ideia é **adiar** as gravações. Durante os passos o programa só lê, valida e *registra* o que quer gravar; no final, `COMMIT WORK` executa tudo de uma vez, dentro de uma única LUW de banco.

:::figura{arquivo="luw-1.svg"}
Três passos de diálogo, três LUWs de banco sem gravações. As alterações registradas são executadas juntas no work process de atualização.
:::

```abap title="Agrupando gravações com um módulo de update (Standard ABAP)"
" Passo 1: bloqueia o voo para outros usuários
CALL FUNCTION 'ENQUEUE_EZFLIGHT'
  EXPORTING  carrid = carrier connid = connection fldate = flight_date
  EXCEPTIONS foreign_lock = 1 OTHERS = 2.
IF sy-subrc <> 0.
  MESSAGE 'Voo em edição por outro usuário' TYPE 'E'.
ENDIF.

" Passo 2: registra a gravação. Nada é executado ainda.
CALL FUNCTION 'Z_FLIGHT_UPDATE' IN UPDATE TASK
  EXPORTING is_flight = flight.

" Passo 3: encerra a SAP LUW
IF user_confirmed = abap_true.
  COMMIT WORK.          " dispara os módulos registrados
ELSE.
  ROLLBACK WORK.        " descarta os registros e libera os bloqueios
ENDIF.
```

### Técnicas de agrupamento

| Técnica | Como registra | Onde executa |
| --- | --- | --- |
| Módulo de update | `CALL FUNCTION … IN UPDATE TASK` | Work process de atualização, após o `COMMIT WORK` |
| Update local | `SET UPDATE TASK LOCAL` antes dos registros | No próprio work process, dentro do `COMMIT WORK` |
| Sub-rotina | `PERFORM … ON COMMIT` | No próprio work process, no `COMMIT WORK` (obsoleta) |
| RFC transacional | `CALL FUNCTION … IN BACKGROUND UNIT` (bgRFC) | Em outro sistema ou sessão, após o commit |
| Buffer transacional do RAP | `MODIFY ENTITIES` | Na sequência de save, disparada por `COMMIT ENTITIES` |

`COMMIT WORK` devolve o controle assim que as requisições de update são entregues; `COMMIT WORK AND WAIT` espera a atualização terminar e informa o resultado em `sy-subrc`. Se um módulo de update falhar, o banco desfaz a LUW da atualização inteira e o usuário recebe um aviso (transação SM13).

## Bloqueios SAP {ancora="Bloqueios" icone="locked"}

Os bloqueios do banco terminam a cada commit implícito, então não protegem um registro durante várias telas. Para isso existem os **bloqueios SAP**: registros lógicos na tabela do Enqueue Server, definidos por um **objeto de bloqueio** do Dictionary (nome iniciado por `E`). Ao ativar o objeto, o sistema gera os módulos `ENQUEUE_<objeto>` e `DEQUEUE_<objeto>`.

:::aviso
O bloqueio SAP é **cooperativo**: ele só funciona se todo programa que altera aquele dado pedir o bloqueio antes. Um `UPDATE` direto na tabela ignora o Enqueue Server. Os bloqueios pedidos com o modo padrão são liberados automaticamente ao fim da atualização ou no `ROLLBACK WORK`.
:::

## A SAP LUW controlada no ABAP Cloud {ancora="LUW controlada" icone="cloud"}

No ABAP Cloud não há módulos de update nem telas com vários passos: cada requisição OData é um ciclo completo, e as alterações ficam no **buffer transacional** do RAP. A plataforma divide a SAP LUW em **fases transacionais** e verifica em tempo de execução se cada operação é permitida na fase atual. Isso é a **SAP LUW controlada**.

| Fase | O que acontece | O que é proibido |
| --- | --- | --- |
| **Modificação** (interação) | Leitura, validações, alterações no buffer com EML | Gravar no banco, `COMMIT WORK`, `ROLLBACK WORK` |
| **Save** | O framework chama a sequência de save e grava no banco | Novas alterações com EML, commit explícito |

```abap title="Marcando as fases fora de um business object RAP"
" Classe própria que grava em tabela Z sem RAP
cl_abap_tx=>modify( ).            " fase de modificação
DATA(booking) = prepare_booking( input ).   " só lógica e leituras

cl_abap_tx=>save( ).              " fase de save: gravação liberada
INSERT zbooking FROM @booking.

COMMIT WORK.                      " fora de implementações RAP
```

Uma violação, como um `INSERT` na fase de modificação ou um `COMMIT WORK` dentro de um handler RAP, termina em erro de runtime (por exemplo, `BEHAVIOR_ILLEGAL_STATEMENT`). Dentro de uma behavior pool você **nunca** faz commit: quem consome o business object chama `COMMIT ENTITIES`, que por baixo executa um `COMMIT WORK`. No ABAP Cloud a atualização é sempre local e síncrona.

:::documentacao
- [Controlled SAP LUW (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-concepts/controlled-sap-luw?locale=en-US)
- [ABAP Keyword Documentation: SAP LUW](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abensap_luw.htm)
- [ABAP Keyword Documentation: COMMIT WORK](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapcommit.htm)
- [Cheat sheet: SAP LUW](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/17_SAP_LUW.md)
:::
