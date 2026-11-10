---
titulo: Tabelas internas
subtitulo: "Standard, sorted e hashed: chaves, leitura, laços e expressões de tabela."
sap_learning: "Basic ABAP Programming · unidade 6"
duracao: "1 h 13 min"
icone: list
objetivos:
  - Escolher o tipo de tabela adequado
  - Inserir e ler linhas pela chave
  - Percorrer com LOOP AT
  - Usar expressões de tabela e FOR
palavras_chave: internal table standard sorted hashed key append insert read table loop at field-symbol line_exists lines sort delete for
---

## Tabelas internas: standard, sorted e hashed {ancora="Tipos de tabela" icone="list"}

Uma **tabela interna** guarda várias linhas do mesmo tipo na memória do programa. O tipo de tabela define como as linhas são organizadas e, por consequência, quanto custa encontrar uma linha pela chave.

| Tipo | Organização | Chave | Leitura pela chave | Quando usar |
| --- | --- | --- | --- | --- |
| **STANDARD** | Ordem de inserção | NON-UNIQUE (opcional) | :tag[linear · n]{tipo="aviso"} | Listas pequenas, acesso por índice, APPEND |
| **SORTED** | Sempre ordenada pela chave | UNIQUE ou NON-UNIQUE | :tag[binária · log₂ n]{tipo="info"} | Leituras parciais pela chave, LOOP WHERE |
| **HASHED** | Função hash, sem índice | Sempre UNIQUE | :tag[constante · 1]{tipo="sucesso"} | Muitas leituras pela chave completa |

```abap title="Declarações"
TYPES ty_flights TYPE STANDARD TABLE OF /dmo/flight
                 WITH NON-UNIQUE KEY carrier_id connection_id flight_date.

DATA flights  TYPE ty_flights.
DATA by_id    TYPE SORTED TABLE OF /dmo/connection
                   WITH UNIQUE KEY carrier_id connection_id.
DATA carriers TYPE HASHED TABLE OF /dmo/carrier
                   WITH UNIQUE KEY carrier_id.
```

## Laboratório: inserir e ler pela chave {ancora="Laboratório" icone="sorting-ranking"}

Insira chaves e depois procure uma delas. Compare como cada tipo guarda as linhas, o que acontece com duplicatas e quantas comparações a leitura precisa.

::laboratorio{id="itab"}

## Operações essenciais {ancora="Operações" icone="source-code"}

:::colunas{n="2"}
```abap title="Preencher e ler"
" Preencher
APPEND VALUE #( carrier_id = 'LH' connection_id = '0400' )
       TO flights.
INSERT VALUE #( carrier_id = 'AA' connection_id = '0017' )
       INTO TABLE by_id.

" Ler uma linha (READ TABLE define sy-subrc)
READ TABLE by_id INTO DATA(conn)
     WITH TABLE KEY carrier_id = 'AA' connection_id = '0017'.

" Expressão de tabela (lança exceção se não achar)
TRY.
    DATA(lh) = by_id[ carrier_id = 'LH' connection_id = '0400' ].
  CATCH cx_sy_itab_line_not_found.
ENDTRY.

IF line_exists( by_id[ carrier_id = 'UA' ] ).
ENDIF.
DATA(total) = lines( flights ).
```

```abap title="Percorrer e alterar"
" Cópia em work area
LOOP AT flights INTO DATA(flight)
     WHERE carrier_id = 'LH'.
  out->write( flight-flight_date ).
ENDLOOP.

" Acesso direto à linha com field-symbol
LOOP AT flights ASSIGNING FIELD-SYMBOL(<flight>).
  <flight>-price = <flight>-price * '1.1'.
ENDLOOP.

SORT flights BY flight_date DESCENDING.
DELETE flights WHERE seats_occupied = 0.

" Construir tabela a partir de outra
DATA(dates) = VALUE string_table(
  FOR f IN flights ( CONV string( f-flight_date ) ) ).
```
:::

:::documentacao
- [LOOP AT itab](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abaploop_at_itab.htm)
- [READ TABLE](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapread_table.htm)
- [Cheat sheet: Internal Tables](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/01_Internal_Tables.md)
:::
