---
titulo: Variáveis do sistema
subtitulo: Os campos sy-, o que cada comando grava neles e as alternativas do ABAP Cloud.
duracao: "40 min"
icone: sys-monitor
objetivos:
  - Dizer o que é a estrutura sy
  - Usar sy-subrc, sy-tabix, sy-index e sy-dbcnt corretamente
  - Evitar as armadilhas clássicas dos campos de sistema
  - Trocar campos não liberados por CL_ABAP_CONTEXT_INFO
palavras_chave: sy syst sy-subrc sy-tabix sy-index sy-dbcnt sy-datum sy-uzeit sy-uname sy-langu sy-mandt sy-batch cl_abap_context_info xco_cp
---

## A estrutura sy {ancora="Estrutura sy" icone="sys-monitor"}

O runtime ABAP mantém, em cada sessão interna, uma estrutura chamada `sy` (tipo `SYST` do Dictionary). Seus componentes são os **campos de sistema**: depois de quase todo comando, o runtime grava ali o resultado, a posição ou o contexto. Você lê com `sy-campo`.

Duas regras valem para todos eles:

:::checklist
- **Leia logo depois do comando.** O próximo comando pode sobrescrever o valor. Se precisar dele mais tarde, copie para uma variável.
- **Nunca atribua.** Tecnicamente os campos aceitam atribuição, mas alterar `sy-subrc` ou `sy-tabix` à mão quebra a lógica de quem lê o código e, em alguns casos, a do runtime.
:::

## Os campos do dia a dia {ancora="Campos principais" icone="list"}

| Campo | Conteúdo | Quem preenche |
| --- | --- | --- |
| `sy-subrc` | Código de retorno. `0` significa sucesso | `SELECT`, `READ TABLE`, `ASSIGN`, `AUTHORITY-CHECK`, `CALL FUNCTION` e muitos outros |
| `sy-tabix` | Índice da linha atual ou encontrada em uma tabela interna de índice | `LOOP AT`, `READ TABLE`, `APPEND` |
| `sy-index` | Número da volta atual, começando em 1 | `DO`, `WHILE` |
| `sy-dbcnt` | Quantidade de linhas lidas ou alteradas no banco | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MODIFY` |
| `sy-fdpos` | Posição encontrada em comparações de texto | Operadores `CS`, `CP`, `CA` |
| `sy-uname` | Usuário conectado | Logon |
| `sy-langu` | Idioma de logon | Logon |
| `sy-mandt` | Mandante (*client*) atual | Logon |
| `sy-datum`, `sy-uzeit` | Data e hora **do servidor** | Runtime |
| `sy-datlo`, `sy-timlo`, `sy-zonlo` | Data, hora e fuso **do usuário** | Runtime |
| `sy-batch` | `'X'` quando o programa roda em background | Runtime |
| `sy-msgid`, `sy-msgty`, `sy-msgno`, `sy-msgv1…4` | Última mensagem enviada | `MESSAGE`, exceções clássicas de módulos de função |

### sy-subrc muda de significado a cada comando

| Comando | 0 | 4 | Outros |
| --- | --- | --- | --- |
| `SELECT` | Achou ao menos uma linha | Nenhuma linha | 8 em casos especiais |
| `READ TABLE` | Linha encontrada | Não encontrada | 8 com `BINARY SEARCH`, se a busca passou do fim |
| `ASSIGN` dinâmico | Atribuição feita | Não foi possível | |
| `AUTHORITY-CHECK` | Autorizado | Sem autorização para os valores | 12 sem o objeto no perfil |
| `CALL FUNCTION` | Sem exceção | O número que você deu a cada exceção | |

## Armadilhas {ancora="Armadilhas" icone="quality-issue"}

```abap title="Três erros comuns"
" 1. Testar sy-subrc tarde demais
SELECT SINGLE carrier_id FROM /dmo/carrier
  WHERE carrier_id = @id INTO @DATA(found).
DATA(count) = lines( carriers ).       " não altera sy-subrc, mas…
CLEAR result.                          " …qualquer comando no meio é um risco
IF sy-subrc = 0. ENDIF.                " teste sempre na linha seguinte

" 2. sy-tabix dentro de um LOOP com leitura aninhada
LOOP AT flights INTO DATA(flight).
  DATA(row) = sy-tabix.                " guarde antes
  READ TABLE carriers INTO DATA(carrier)
    WITH KEY carrier_id = flight-carrier_id.
  " aqui sy-tabix já é o índice em carriers, não em flights
ENDLOOP.

" 3. Confundir sy-index com sy-tabix
DO 3 TIMES.
  out->write( sy-index ).              " 1, 2, 3  (sy-tabix não muda em DO)
ENDDO.
```

:::aviso
`sy-datum` é a data do **servidor**. Em um sistema usado em vários fusos, o dia do usuário pode ser outro: para o que o usuário vê, use a data local. Para registrar quando algo aconteceu, grave um carimbo de tempo UTC (`utclong_current( )`).
:::

## Campos de sistema no ABAP Cloud {ancora="ABAP Cloud" icone="cloud"}

Na versão *ABAP for Cloud Development* só uma parte da estrutura `sy` está liberada. Os campos ligados ao fluxo do programa continuam valendo: `sy-subrc`, `sy-tabix`, `sy-index`, `sy-dbcnt`, `sy-fdpos`. Os de contexto têm substitutos em classes liberadas, e o compilador avisa quando você usa o campo antigo.

| Em vez de | Use |
| --- | --- |
| `sy-datum` | `cl_abap_context_info=>get_system_date( )` |
| `sy-uzeit` | `cl_abap_context_info=>get_system_time( )` |
| `sy-uname` | `cl_abap_context_info=>get_user_technical_name( )` |
| `sy-zonlo` | `cl_abap_context_info=>get_user_time_zone( )` |
| `sy-langu` | `cl_abap_context_info=>get_user_language_abap_format( )` |
| `sy-datum` + `sy-uzeit` como instante | `utclong_current( )` |

```abap title="Contexto no ABAP Cloud"
DATA(today)     = cl_abap_context_info=>get_system_date( ).
DATA(user)      = cl_abap_context_info=>get_user_technical_name( ).
DATA(timestamp) = utclong_current( ).

out->write( |{ user } em { today DATE = ISO }, UTC { timestamp }| ).
```

Em CDS, as informações equivalentes vêm das variáveis de sessão: `$session.user`, `$session.client`, `$session.system_language`, `$session.system_date` e `$session.user_date`.

:::documentacao
- [ABAP Keyword Documentation: campos de sistema](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abensystem_fields.htm)
- [ABAP Keyword Documentation · ABAP Cloud](https://help.sap.com/docs/abap-cloud/abap-keywords/abap-keyword-documentation?locale=en-US)
- [Cheat sheet: Date, Time and Time Stamps](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/23_Date_and_Time.md)
:::
