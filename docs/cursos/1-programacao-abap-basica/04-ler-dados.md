---
titulo: Lendo dados do banco
subtitulo: "ABAP SQL: SELECT SINGLE, SELECT INTO TABLE e CDS views como fonte."
unidade: "4"
duracao: "1 h 22 min"
icone: database
objetivos:
  - Ler uma linha com SELECT SINGLE
  - Ler várias linhas em uma tabela interna
  - Usar host variables e sy-subrc
  - Ler dados por CDS views liberadas
palavras_chave: select single into table where order by up to rows sy-subrc sy-dbcnt host variable data preview
---

## Lendo a base de dados com ABAP SQL {ancora="ABAP SQL" icone="database"}

ABAP SQL é o SQL integrado à linguagem. Ele é independente do banco, verificado em tempo de compilação e lê tanto tabelas do dicionário quanto **CDS view entities**. Variáveis ABAP dentro do comando levam o prefixo `@` (*host variables*).

:::colunas{n="2"}
```abap title="Uma linha"
SELECT SINGLE
  FROM /dmo/connection
  FIELDS airport_from_id, airport_to_id
  WHERE carrier_id    = @i_carrier_id
    AND connection_id = @i_connection_id
  INTO ( @airport_from_id, @airport_to_id ).

IF sy-subrc <> 0.
  RAISE EXCEPTION TYPE cx_abap_invalid_value.
ENDIF.
```

```abap title="Várias linhas"
SELECT FROM /dmo/connection
  FIELDS carrier_id, connection_id,
         airport_from_id, airport_to_id
  WHERE carrier_id = 'LH'
  ORDER BY connection_id
  INTO TABLE @DATA(connections)
  UP TO 10 ROWS.

out->write( |Lidas: { sy-dbcnt }| ).
```
:::

:::nota
**sy-subrc** = 0 quando pelo menos uma linha foi encontrada, 4 quando nenhuma. **sy-dbcnt** traz quantas linhas foram lidas. No ADT, :kbd[F8] sobre uma tabela ou CDS abre o **Data Preview**.
:::

## Construtor de SELECT {ancora="Construtor de SELECT" icone="filter"}

Monte a consulta e veja o comando ABAP SQL gerado e o resultado sobre um extrato de dados de exemplo inspirado no modelo de voos `/DMO/` que a SAP usa nos cursos.

::laboratorio{id="sqlbuilder"}

## Lendo de uma CDS view {ancora="CDS como fonte" icone="detail-view"}

O ABAP Cloud não permite ler tabelas SAP não liberadas. Em vez disso, você lê **CDS views liberadas** (por exemplo, `I_Country`), que expõem os dados com nomes semânticos em CamelCase.

```abap title="Lendo uma CDS view liberada"
SELECT FROM I_Country
  FIELDS Country, CountryThreeLetterISOCode
  WHERE Country IN ('BR', 'PT', 'DE')
  INTO TABLE @DATA(countries).
```

:::quiz
### O que o prefixo `@` indica em um comando ABAP SQL?

- [ ] Um campo da tabela
- [x] Uma host variable ABAP
- [ ] Um comentário
- [ ] Um parâmetro de CDS

> Variáveis e expressões ABAP dentro do SQL são escapadas com @.

### Após um `SELECT` que não encontra nenhuma linha, qual é o `sy-subrc`?

- [ ] 0
- [x] 4
- [ ] 8
- [ ] 12

> sy-subrc = 4 quando nenhuma linha é encontrada; 0 quando ao menos uma é lida.

### No ABAP Cloud, como ler dados de tabelas padrão SAP?

- [ ] Direto com `SELECT` na tabela
- [x] Por CDS views liberadas
- [ ] Com `CALL TRANSACTION`
- [ ] Pelo SAP GUI

> Tabelas SAP não são liberadas; o acesso é feito por CDS views liberadas como I_Country.
:::

:::documentacao
- [SELECT](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapselect.htm)
- [Cheat sheet: ABAP SQL](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/03_ABAP_SQL.md)
- [Cheat sheet: WHERE Conditions](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/31_WHERE_Conditions.md)
:::
