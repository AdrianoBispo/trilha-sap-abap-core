---
titulo: Comentários e documentação
subtitulo: Comentários, pragmas, ABAP Doc e o que vale a pena documentar.
duracao: "35 min"
icone: comment
objetivos:
  - Escrever comentários de linha e de fim de linha
  - Diferenciar comentário, pragma e pseudocomentário
  - Documentar classes e métodos com ABAP Doc
  - Decidir o que merece um comentário
palavras_chave: comentário asterisco aspas abap doc "! @parameter @raising shorttext synchronized pragma pseudo comment ##needed #ec element info f2 clean abap
---

## Dois tipos de comentário {ancora="Comentários" icone="comment"}

```abap title="Comentários em ABAP"
* Asterisco na PRIMEIRA coluna: a linha inteira é comentário
* (não pode ser indentado, e o pretty printer não o move)

" Aspas duplas: comentário a partir daqui, em qualquer coluna
DATA(price) = base_price * rate.   " também serve no fim da linha

    " Indentado junto com o código que explica
    IF price > limit.
```

Em código novo, prefira as **aspas duplas**: o comentário acompanha a indentação do bloco e sobrevive ao pretty printer (:kbd[Shift+F1]). No ADT, :kbd[Ctrl+<] comenta e :kbd[Ctrl+>] descomenta as linhas selecionadas.

Em CDS, os comentários são `//` até o fim da linha e `/* … */` para blocos.

## Pragmas e pseudocomentários {ancora="Pragmas" icone="flag"}

Nem tudo que parece comentário é comentário. Dois recursos servem para **silenciar avisos** de forma explícita e localizada.

| Recurso | Forma | Silencia |
| --- | --- | --- |
| Pragma | `##NOME` no fim do comando, antes do ponto | Avisos da verificação de sintaxe e da verificação estendida |
| Pseudocomentário | `"#EC NOME` no fim da linha | Achados do ATC e do Code Inspector |

```abap title="Silenciando um aviso de propósito"
" Variável declarada só para satisfazer uma assinatura
DATA unused TYPE i ##NEEDED.

" Exceção capturada e ignorada conscientemente
TRY.
    cleanup_temp_data( ).
  CATCH cx_root ##NO_HANDLER.
ENDTRY.

SELECT SINGLE carrier_id FROM /dmo/carrier INTO @DATA(any_carrier). "#EC CI_NOWHERE
```

Use com parcimônia: cada pragma é uma dívida assumida. O nome certo aparece na própria mensagem do aviso, e o quick fix (:kbd[Ctrl+1]) do ADT o insere para você.

## ABAP Doc {ancora="ABAP Doc" icone="document-text"}

Comentários que começam com `"!` logo **antes** de uma declaração viram documentação. Ela aparece no **Element Info** (:kbd[F2]) para quem usa a sua classe, sem precisar abrir o código. Vale para classes, interfaces, métodos, atributos, tipos e constantes.

```abap title="ABAP Doc em uma classe"
"! <p class="shorttext synchronized">Cálculo de preços de voos</p>
"! Aplica descontos e impostos sobre o preço base de uma conexão.
CLASS zcl_flight_pricing DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    "! Limite de desconto aceito, em porcentagem
    CONSTANTS c_max_discount TYPE i VALUE 60.

    "! <p class="shorttext synchronized">Calcula preço com desconto</p>
    "! O resultado é arredondado para <strong>duas casas</strong>.
    "!
    "! @parameter i_price   | Preço original
    "! @parameter i_percent | Desconto entre 0 e {@link .c_max_discount}
    "! @parameter r_price   | Preço final
    "! @raising cx_abap_invalid_value | Percentual fora da faixa
    METHODS apply_discount
      IMPORTING i_price        TYPE /dmo/total_price
                i_percent      TYPE i
      RETURNING VALUE(r_price) TYPE /dmo/total_price
      RAISING   cx_abap_invalid_value.
ENDCLASS.
```

:::termos
- `@parameter nome | texto` — Documenta um parâmetro, inclusive o `RETURNING`.
- `@raising classe | texto` — Documenta uma exceção baseada em classe. Para exceções clássicas, `@exception`.
- `<p class="shorttext synchronized">` — Sincroniza o texto com a **descrição breve** do objeto, a mesma mostrada nas listas e no SAP GUI.
- `{@link …}` — Cria um link para outro elemento: `{@link zcl_outra.METH:metodo}` ou, na mesma classe, `{@link .atributo}`.
- HTML simples — `<p>`, `<br/>`, `<em>`, `<strong>`, `<ul>`, `<ol>`, `<li>` e `<h1>` a `<h3>` são aceitos.
:::

O ADT ajuda: com o cursor no nome do método, o quick fix **Add ABAP Doc** gera o esqueleto com todos os parâmetros. A visão **ABAP Element Info** mostra a documentação enquanto você navega.

## O que documentar {ancora="Boas práticas" icone="lightbulb"}

:::::colunas{n="2"}
::::cartao{etiqueta="Vale a pena" tipo="sucesso"}
:::checklist
- O **porquê** de uma decisão que o código não revela.
- A interface pública: o que o método garante, unidades, faixas de valores, efeitos colaterais.
- Regras de negócio com a referência de onde vieram.
- Contornos temporários, com o motivo e a condição para remover.
:::
::::

::::cartao{etiqueta="Evite" tipo="erro"}
:::checklist
- Repetir o que a linha já diz (`" incrementa o contador`).
- Código comentado "para o caso de precisar": o histórico de versões guarda isso.
- Cabeçalhos com autor, data e lista de alterações: o transporte e o Git já registram.
- Comentar um nome ruim em vez de trocar o nome.
:::
::::
:::::

:::nota
Comentários que começam com `TODO`, `FIXME` ou `XXX` aparecem na visão **Tasks** do ADT. É um jeito simples de não perder pendências dentro do código.
:::

:::documentacao
- [ABAP Keyword Documentation: comentários](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abencomment.htm)
- [ABAP Keyword Documentation: ABAP Doc](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abendoccomment.htm)
- [ABAP Development Tools: User Guide](https://help.sap.com/docs/abap-cloud/abap-development-tools-user-guide/about-abap-development-tools-user-guide?locale=en-US)
- [Clean ABAP: Comments](https://github.com/SAP/styleguides/blob/main/clean-abap/CleanABAP.md#comments)
:::
