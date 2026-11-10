---
titulo: O servidor de aplicação ABAP
subtitulo: Como um programa é executado no AS ABAP e como sessões e memória são gerenciadas.
duracao: "1 h"
icone: it-system
objetivos:
  - Descrever as três camadas de um sistema ABAP
  - Explicar o papel do dispatcher e dos work processes
  - Seguir o caminho de uma requisição até o banco
  - Diferenciar sessão de usuário, sessão ABAP e sessão interna
  - Escolher a área de memória certa para cada alcance
palavras_chave: as abap dispatcher work process dialog update background enqueue spool icm gateway message server roll area extended memory heap sap memory abap memory shared objects sessão interna
---

## Três camadas {ancora="Arquitetura" icone="it-system"}

Um sistema ABAP tem três camadas. A de **apresentação** só mostra telas: SAP GUI, um navegador com apps SAP Fiori ou o ADT no Eclipse. A de **aplicação** executa os programas ABAP, em uma ou mais **instâncias** do servidor de aplicação. A de **banco de dados** guarda tudo, inclusive o próprio código-fonte.

:::figura{arquivo="servidor-de-aplicacao-1.svg"}
Toda requisição entra por um ponto de comunicação (ICM, dispatcher ou gateway), espera na fila do dispatcher e é executada por um work process livre.
:::

:::termos
- **Dispatcher** — Recebe as requisições, mantém a fila e entrega cada uma a um work process livre do tipo certo.
- **Work process** — Processo do sistema operacional que executa o programa ABAP. Cada um tem sua conexão com o banco.
- **ICM** — *Internet Communication Manager*: recebe e envia HTTP(S) e SMTP. É a porta de entrada do Fiori, do OData e do ADT.
- **Gateway** — Ponto de entrada e saída das chamadas RFC entre sistemas.
- **Message Server** — Faz as instâncias se conhecerem e distribui os logons entre elas.
- **Enqueue Server** — Mantém a tabela de bloqueios lógicos (bloqueios SAP), válida para o sistema inteiro.
:::

O Message Server e o Enqueue Server formam os **ABAP Central Services (ASCS)** e existem uma única vez por sistema.

## Tipos de work process {ancora="Work processes" icone="process"}

| Tipo | Sigla | O que executa |
| --- | --- | --- |
| Diálogo | DIA | Requisições interativas: passos de diálogo do SAP GUI, HTTP, RFC |
| Atualização | UPD, UP2 | Módulos de função de update registrados durante uma SAP LUW |
| Background | BTC | Jobs agendados, sem usuário esperando |
| Spool | SPO | Saída para impressoras e dispositivos |
| Enqueue | ENQ | Gerência de bloqueios, quando não há um Enqueue Server separado |

A quantidade de cada tipo é configurada por instância. Um work process de diálogo que demora demais é cancelado pelo sistema (parâmetro `rdisp/max_wprun_time`); trabalho longo pertence a um job em background, tema do módulo 04.

## O caminho de uma requisição {ancora="Execução" icone="journey-arrive"}

1. O usuário aperta Enter no SAP GUI ou o app Fiori envia uma chamada OData. A requisição chega ao dispatcher (direto ou pelo ICM).
2. O dispatcher a coloca na **fila** e a entrega ao primeiro work process de diálogo livre.
3. O work process carrega o **contexto do usuário** (*roll-in*): variáveis, tabelas internas e objetos da sessão.
4. O interpretador ABAP executa o programa. O código executável (*load*) vem do **buffer de programas**; se a versão ativa mudou, o programa é recompilado na hora.
5. Comandos ABAP SQL passam pela **interface de banco de dados**, que os traduz para o SQL do banco e consulta os buffers de tabela.
6. A resposta volta ao cliente e o contexto é liberado (*roll-out*). O work process fica livre para **outro usuário**.

:::aviso
O intervalo entre uma tela e a seguinte chama-se **passo de diálogo**. Entre dois passos o usuário não ocupa nenhum work process, e o passo seguinte pode cair em outro. Por isso cada passo termina com um commit implícito no banco, o que leva ao conceito de [SAP LUW](#luw).
:::

## Sessões {ancora="Sessões" icone="group-2"}

:::figura{arquivo="servidor-de-aplicacao-2.svg"}
Cada nível de sessão tem sua área de memória. O contexto inteiro do usuário é carregado no work process a cada passo de diálogo.
:::

:::termos
- **Sessão de usuário** — Criada no logon. Reúne tudo o que pertence àquele usuário naquela instância.
- **Sessão ABAP** — Também chamada de sessão principal. No SAP GUI é uma janela; por padrão um usuário abre até 6.
- **Sessão interna** — Criada a cada programa chamado. Guarda os dados e objetos daquele programa. Uma sequência de chamadas empilha até 9 sessões internas.
:::

`SUBMIT … AND RETURN` e `CALL TRANSACTION` abrem uma nova sessão interna e voltam para a anterior ao terminar. `LEAVE TO TRANSACTION` e `SUBMIT` sem `AND RETURN` substituem a sequência atual. Uma chamada de método ou de módulo de função **não** cria sessão interna: ela roda dentro da sessão de quem chamou.

## Áreas de memória {ancora="Memória" icone="database"}

| Área | Quem enxerga | Como acessar | Vive até |
| --- | --- | --- | --- |
| Memória da sessão interna | Só o programa em execução | `DATA`, objetos, tabelas internas | O programa terminar |
| **ABAP Memory** | Programas da mesma sequência de chamadas | `EXPORT … TO MEMORY ID` / `IMPORT … FROM MEMORY ID` | A sequência de chamadas terminar |
| **SAP Memory** | Todas as sessões ABAP do usuário | `SET PARAMETER ID` / `GET PARAMETER ID` | O logoff |
| **Shared memory** | Todos os usuários da instância | Shared Objects (`CL_SHM_AREA`), buffers de tabela | A instância parar ou a área ser invalidada |
| Banco de dados | Todo o sistema | ABAP SQL | Ser apagado |

```abap title="Passando dados entre programas (Standard ABAP)"
" Programa A: grava na ABAP Memory e chama o programa B
EXPORT carrier = carrier_id TO MEMORY ID 'ZFLIGHT_CARRIER'.
SUBMIT zflight_report AND RETURN.

" Programa B: lê o que A deixou
IMPORT carrier = carrier_id FROM MEMORY ID 'ZFLIGHT_CARRIER'.

" SAP Memory: valor padrão de um campo em qualquer janela do usuário
SET PARAMETER ID 'CAR' FIELD carrier_id.
GET PARAMETER ID 'CAR' FIELD carrier_id.
```

Dentro do work process, o contexto do usuário ocupa primeiro uma pequena **roll area**, depois a **Extended Memory**, compartilhada entre os work processes, e por último a **heap**, memória privada. Um work process que entra em heap fica preso àquele usuário (modo PRIV) até o fim da transação, o que reduz a capacidade da instância.

:::nota
No **ABAP Cloud** não existem `EXPORT … TO MEMORY`, `SET PARAMETER` nem `SUBMIT`. Cada chamada OData é uma requisição independente, e o estado entre requisições fica no banco: nas tabelas ativas ou nas tabelas de rascunho (*draft*) do RAP.
:::

:::documentacao
- [ABAP Keyword Documentation: veja os tópicos Program Execution e Memory Organization](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm)
- [Cheat sheet: SAP LUW (sessões e passos de diálogo)](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/17_SAP_LUW.md)
- [SAP Help Portal: ABAP Platform](https://help.sap.com/docs/ABAP_PLATFORM_NEW?locale=en-US)
:::
