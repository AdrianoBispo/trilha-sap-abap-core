---
titulo: Módulos de função
subtitulo: Grupos de funções, a interface na SE37, tipos de processamento e um simulador do Function Builder.
duracao: "1 h 15 min"
icone: fx
objetivos:
  - Explicar o que é um grupo de funções e como ele guarda estado
  - Definir a interface de um módulo de função
  - Chamar um módulo e tratar suas exceções
  - Escolher entre módulo normal, RFC e de update
  - Ler o código que o Function Builder gera
palavras_chave: function module function group se37 function builder call function importing exporting changing tables exceptions rfc update task function-pool sapl
---

## Grupo de funções e módulo de função {ancora="Conceito" icone="fx"}

Um **módulo de função** é um procedimento com nome único em todo o sistema, guardado em uma biblioteca central. Ele nunca existe sozinho: pertence a um **grupo de funções**, que é um programa (tipo F) com o nome técnico `SAPL<grupo>`.

:::checklist
- Um grupo reúne módulos que trabalham sobre os mesmos dados.
- Os **dados globais** do grupo, declarados no include TOP, são visíveis a todos os seus módulos e **sobrevivem entre as chamadas**, enquanto durar a sessão interna de quem chamou.
- Na primeira chamada a qualquer módulo, o grupo inteiro é carregado na memória.
:::

Essa memória compartilhada é o que permite, por exemplo, um módulo "abrir" algo e outro "fechar". Também é a origem de erros difíceis: o resultado de uma chamada pode depender de chamadas anteriores.

## A interface no Function Builder {ancora="Function Builder" icone="create-form"}

No SAP GUI, o módulo é mantido no **Function Builder (transação SE37)**. A interface não é digitada no código: é preenchida em abas.

| Aba | O que define |
| --- | --- |
| **Attributes** | Texto, grupo de funções e **tipo de processamento** |
| **Import** | Entradas. Podem ser opcionais ou ter valor padrão |
| **Export** | Saídas. Para o chamador, são sempre opcionais |
| **Changing** | Entrada e saída no mesmo parâmetro |
| **Tables** | Tabelas internas no formato antigo (obsoleto) |
| **Exceptions** | Exceções clássicas, ou classes de exceção |
| **Source code** | A lógica, entre `FUNCTION` e `ENDFUNCTION` |

No **ADT**, o mesmo objeto é criado em **New › ABAP Function Group** e **New › ABAP Function Module**, e a interface aparece como texto, junto ao comando `FUNCTION`.

## Simulador do Function Builder {ancora="Simulador" icone="simulate"}

Altere parâmetros, exceções e o tipo de processamento. Compare as três visões do resultado: o include do módulo, com o bloco de comentário que o sistema gera; a estrutura do grupo; e a chamada que o botão **Pattern** insere no programa chamador.

::laboratorio{id="functionbuilder"}

## Chamando um módulo de função {ancora="CALL FUNCTION" icone="source-code"}

```abap title="Chamada com exceções clássicas"
DATA free_seats TYPE i.

CALL FUNCTION 'Z_FLIGHT_GET_FREE_SEATS'
  EXPORTING
    iv_carrier_id    = 'LH'          " entra pelo IMPORTING do módulo
    iv_connection_id = '0400'
  IMPORTING
    ev_free_seats    = free_seats    " sai pelo EXPORTING do módulo
  EXCEPTIONS
    flight_not_found = 1
    OTHERS           = 2.

CASE sy-subrc.
  WHEN 0. out->write( |Livres: { free_seats }| ).
  WHEN 1. out->write( `Voo não encontrado` ).
  WHEN OTHERS. out->write( `Erro inesperado` ).
ENDCASE.
```

:::aviso
O nome do módulo é um **literal de texto**, e os parâmetros só são conferidos em **tempo de execução**. Um parâmetro obrigatório esquecido gera o dump `CALL_FUNCTION_PARM_MISSING`; um tipo incompatível, `CALL_FUNCTION_CONFLICT_TYPE`. Com métodos, os dois erros apareceriam na ativação. Use sempre o **Pattern** (:kbd[Ctrl+F6] na SE38) ou o autocompletar do ADT para inserir a chamada completa.
:::

Se uma exceção clássica for lançada e o chamador **não** a listar em `EXCEPTIONS` (nem usar `OTHERS`), o programa termina com erro de runtime. Dentro do módulo, a exceção é lançada com `RAISE nome.` ou `MESSAGE … RAISING nome.`.

## Tipos de processamento {ancora="Tipos" icone="process"}

::::colunas{n="3"}
:::cartao{etiqueta="Normal" tipo="neutro"}
Chamada local e síncrona, dentro da sessão interna do chamador.

`CALL FUNCTION 'Z_…'`
:::

:::cartao{etiqueta="Remote-enabled" tipo="info"}
Pode ser chamado de outro sistema por **RFC**. Parâmetros por valor, com tipos do Dictionary. É a base das **BAPIs**.

`CALL FUNCTION 'Z_…' DESTINATION dest`
:::

:::cartao{etiqueta="Update" tipo="c5"}
Não roda na hora: fica registrado e é executado no `COMMIT WORK`, pelo work process de atualização. Veja [LUW](#luw).

`CALL FUNCTION 'Z_…' IN UPDATE TASK`
:::
::::

## Onde os módulos de função ainda fazem sentido {ancora="Uso atual" icone="lightbulb"}

:::checklist
- **RFC e BAPIs**: a interface remota clássica entre sistemas ABAP e de fora para dentro.
- **Módulos de update**: agrupamento de gravações na SAP LUW clássica.
- **Bloqueios**: os módulos `ENQUEUE_…` e `DEQUEUE_…` gerados a partir de um objeto de bloqueio.
- **APIs existentes**: grande parte das funções do sistema clássico só existe como módulo de função.
:::

Para lógica nova, a regra é manter o módulo fino e colocar o trabalho em uma classe. No ABAP Cloud é possível criar módulos de função, em geral para oferecer uma interface RFC, mas só podem ser chamados os que tiverem contrato de liberação.

```abap title="Módulo como fachada de uma classe"
FUNCTION z_flight_get_free_seats.
  " Interface definida no Function Builder; a lógica mora na classe
  TRY.
      ev_free_seats = NEW zcl_flight_booking( iv_carrier_id )->free_seats( iv_connection_id ).
    CATCH cx_abap_invalid_value.
      RAISE flight_not_found.
  ENDTRY.
ENDFUNCTION.
```

:::documentacao
- [ABAP Keyword Documentation: FUNCTION](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapfunction.htm)
- [ABAP Keyword Documentation: CALL FUNCTION](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapcall_function.htm)
- [ABAP Development Tools: User Guide](https://help.sap.com/docs/abap-cloud/abap-development-tools-user-guide/about-abap-development-tools-user-guide?locale=en-US)
:::
