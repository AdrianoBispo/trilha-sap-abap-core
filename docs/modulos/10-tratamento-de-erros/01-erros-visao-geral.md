---
titulo: Erros no ABAP
subtitulo: Códigos de retorno, exceções clássicas, erros de runtime e asserções.
duracao: "50 min"
icone: quality-issue
objetivos:
  - Classificar uma situação de erro
  - Comparar os mecanismos de sinalização de erro
  - Tratar exceções clássicas de módulos de função
  - Analisar um erro de runtime
  - Usar ASSERT para estados impossíveis
palavras_chave: erro sy-subrc exceção clássica raise exceptions runtime error dump st22 assert assertion_failed message type x catchable
---

## Três tipos de erro {ancora="Conceito" icone="quality-issue"}

Antes de escolher um comando, vale perguntar **de quem é a culpa** e **quem pode resolver**.

::::colunas{n="3"}
:::cartao{etiqueta="Esperado" tipo="info"}
### Situação de negócio

O voo está lotado, a data é inválida, o usuário não tem autorização. Faz parte do processo. **Quem resolve é o usuário**: ele precisa de uma mensagem clara.
:::

:::cartao{etiqueta="Recuperável" tipo="aviso"}
### Falha técnica

O sistema remoto não respondeu, o registro está bloqueado, o arquivo não existe. **O programa pode reagir**: tentar de novo, seguir por outro caminho, registrar e continuar.
:::

:::cartao{etiqueta="Bug" tipo="erro"}
### Erro de programação

Um índice fora da tabela, uma referência inicial, um estado que "nunca acontece". **Ninguém resolve em runtime**: o programa deve parar e deixar o máximo de informação para o desenvolvedor.
:::
::::

## Mecanismos {ancora="Mecanismos" icone="list"}

| Mecanismo | Como sinaliza | Como se trata | Situação |
| --- | --- | --- | --- |
| **Código de retorno** | `sy-subrc` diferente de zero | `IF sy-subrc <> 0` logo depois | Comandos da linguagem |
| **Exceção clássica** | `RAISE nome` | `EXCEPTIONS nome = n` na chamada | Módulos de função; obsoleta em métodos |
| **Exceção baseada em classe** | `RAISE EXCEPTION` | `TRY … CATCH` | O padrão atual. Veja [Classes de exceção](#excecoes) |
| **Mensagem** | `MESSAGE` | Exibida ao usuário ou coletada | Diálogo com o usuário. Veja [Mensagens e logs](#mensagens-e-logs) |
| **Erro de runtime** | O runtime encerra o programa | Não se trata: analisa-se o dump | Erros de programação e de recursos |
| **Asserção** | `ASSERT condição` | Não se trata | Estados que o código garante serem impossíveis |

## Códigos de retorno {ancora="sy-subrc" icone="number-sign"}

Muitos comandos não lançam exceção: gravam o resultado em `sy-subrc` e seguem. O programa continua com dados errados se você não testar.

```abap title="Convertendo sy-subrc em exceção na fronteira"
METHOD get_carrier.
  SELECT SINGLE carrier_id, name, currency_code
    FROM /dmo/carrier
    WHERE carrier_id = @i_carrier_id
    INTO @r_carrier.

  IF sy-subrc <> 0.
    " Quem chamou não precisa saber que houve um SELECT
    RAISE EXCEPTION NEW zcx_carrier_not_found( carrier_id = i_carrier_id ).
  ENDIF.
ENDMETHOD.
```

Essa é a regra prática: `sy-subrc` é testado **onde o comando está** e não sobe na pilha. Um método não devolve um código de retorno para o chamador testar; ele lança uma exceção. Os valores e as armadilhas estão em [Variáveis do sistema](#variaveis-do-sistema).

## Exceções clássicas {ancora="Exceções clássicas" icone="history"}

São as exceções declaradas na aba **Exceptions** de um módulo de função. Não são objetos: são nomes, convertidos em números por quem chama.

```abap title="Lançando, dentro do módulo de função"
IF free_seats < iv_seats.
  " Só o nome
  RAISE no_seats_available.
ENDIF.

IF flight IS INITIAL.
  " Com mensagem: preenche sy-msgid, sy-msgno, sy-msgv1…
  MESSAGE e010(zflight) WITH iv_carrier_id iv_connection_id RAISING flight_not_found.
ENDIF.
```

```abap title="Tratando, em quem chama"
CALL FUNCTION 'Z_FLIGHT_BOOK'
  EXPORTING  iv_carrier_id      = carrier
             iv_connection_id   = connection
             iv_seats           = 2
  EXCEPTIONS no_seats_available = 1
             flight_not_found   = 2
             OTHERS             = 3.

CASE sy-subrc.
  WHEN 0.
    " reserva feita
  WHEN 1.
    RAISE EXCEPTION NEW zcx_no_seats( ).
  WHEN OTHERS.
    " A mensagem do módulo está nos campos sy-msg…
    RAISE EXCEPTION TYPE zcx_booking_failed
      MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
      WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
ENDCASE.
```

:::aviso
Uma exceção clássica não listada em `EXCEPTIONS`, nem coberta por `OTHERS`, vira erro de runtime (`RAISE_EXCEPTION`). Sempre inclua `OTHERS`. E sempre converta o resultado em uma exceção baseada em classe antes de devolvê-lo às camadas de cima: assim o restante do programa lida com um único mecanismo.
:::

## Erros de runtime {ancora="Dumps" icone="error"}

Quando o runtime encontra uma situação que não pode continuar, ele encerra o programa e grava um **short dump**. O que acontece nesse momento:

:::checklist
- A LUW de banco em andamento é **desfeita** (rollback).
- A sessão interna termina. Em diálogo, o usuário vê a tela do erro; em um job, o status vira Canceled; em OData, a resposta é um erro HTTP 500.
- O dump registra o ponto exato do código, a pilha de chamadas e o valor das variáveis.
:::

| Erro de runtime | Causa | Exceção tratável correspondente |
| --- | --- | --- |
| `COMPUTE_INT_ZERODIVIDE` | Divisão por zero | `CX_SY_ZERODIVIDE` |
| `ITAB_LINE_NOT_FOUND` | Expressão de tabela sem linha | `CX_SY_ITAB_LINE_NOT_FOUND` |
| `OBJECTS_OBJREF_NOT_ASSIGNED` | Acesso por referência inicial | `CX_SY_REF_IS_INITIAL` |
| `CONVT_NO_NUMBER` | Texto que não é número | `CX_SY_CONVERSION_NO_NUMBER` |
| `UNCAUGHT_EXCEPTION` | Exceção de classe que ninguém tratou | A própria exceção |
| `TIME_OUT` | Tempo máximo de diálogo excedido | Nenhuma |
| `TSV_TNEW_PAGE_ALLOC_FAILED` | Memória esgotada | Nenhuma |
| `MESSAGE_TYPE_X` | Mensagem do tipo X: término proposital | Nenhuma |

Os erros da parte de cima só chegam a ser dump quando a exceção correspondente **não foi tratada**. Os de baixo não têm tratamento: a correção está no desenho do programa.

Os dumps são analisados na transação **ST22**. No ADT, a visão **Feed Reader** lista os erros do seu usuário e abre o dump com a linha de código já posicionada. No BTP ABAP environment, o app **ABAP Runtime Errors** faz o mesmo papel.

## Asserções {ancora="ASSERT" icone="flag"}

`ASSERT` documenta, em código executável, algo que **tem de ser verdade** naquele ponto. Se não for, o programa termina com o erro de runtime `ASSERTION_FAILED`.

```abap title="ASSERT para estados impossíveis"
METHOD apply_discount.
  " Pré-condição garantida por quem chama: a validação já ocorreu
  ASSERT i_percent BETWEEN 0 AND 100.

  r_price = i_price * ( 100 - i_percent ) / 100.

  CASE status.
    WHEN c_status-open OR c_status-accepted.
      " …
    WHEN OTHERS.
      ASSERT 1 = 0.          " novo status criado e este método não foi atualizado
  ENDCASE.
ENDMETHOD.
```

:::checklist
- Use `ASSERT` para **erros de programação**: violações de contrato entre partes do seu próprio código.
- **Não** use para validar entrada de usuário ou dados externos. Isso é uma situação esperada e merece uma exceção com mensagem.
- Prefira parar cedo. Um dump no ponto do problema custa menos do que dados inconsistentes gravados três telas depois.
:::

## Uma estratégia {ancora="Estratégia" icone="lightbulb"}

1. **Dentro do código**, um único mecanismo: exceções baseadas em classe.
2. **Nas fronteiras de entrada**, converta o que vier de comandos e de APIs antigas (`sy-subrc`, exceções clássicas, tabelas `RETURN` de BAPIs) em exceções.
3. **Nas fronteiras de saída**, converta exceções no que o consumidor entende: mensagens em uma tela, a estrutura `reported` em RAP, um status HTTP em um serviço, uma linha no application log em um job.
4. **Nunca engula** um erro com um `CATCH` vazio. Se a decisão for ignorar, deixe o motivo escrito.

:::documentacao
- [ABAP Keyword Documentation: tratamento de erros](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenabap_exceptions.htm)
- [ABAP Keyword Documentation: ASSERT](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapassert.htm)
- [Cheat sheet: Exceptions and Runtime Errors](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/27_Exceptions.md)
:::
