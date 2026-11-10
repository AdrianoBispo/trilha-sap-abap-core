---
titulo: Code pushdown em ABAP SQL
subtitulo: Agregações, GROUP BY, CASE, joins e expressões no banco.
sap_learning: "Intermediate ABAP Programming · unidade 4"
duracao: "5 h 40 min"
icone: process
objetivos:
  - Explicar code pushdown
  - Agregar com GROUP BY e HAVING
  - Usar CASE e funções SQL
  - Combinar tabelas com joins
palavras_chave: pushdown count sum avg min max group by having case join inner left outer cast concat
---

## Leve o código até os dados {ancora="Code pushdown" icone="process"}

Com o SAP HANA, o banco é muito mais rápido para agregar e filtrar do que o servidor de aplicação. **Code pushdown** significa calcular no banco e trazer só o resultado, em vez de ler milhares de linhas e somar em ABAP.

::figura{arquivo="sql-pushdown-1.svg"}

## Agregações, GROUP BY e CASE {ancora="Agregações" icone="overview-chart"}

Escolha a função de agregação, a condição `HAVING` e a classificação por `CASE`. O resultado é calculado sobre os voos de exemplo exatamente como o banco faria.

::laboratorio{id="agglab"}

## Joins e expressões SQL {ancora="Joins e expressões" icone="chain-link"}

:::colunas{n="2"}
```abap title="INNER e LEFT OUTER JOIN"
SELECT FROM /dmo/connection AS c
         INNER JOIN /dmo/carrier AS a
           ON c~carrier_id = a~carrier_id
         LEFT OUTER JOIN /dmo/airport AS ap
           ON c~airport_to_id = ap~airport_id
  FIELDS c~carrier_id, a~name AS carrier_name,
         c~connection_id, ap~city AS destination
  WHERE c~carrier_id IN ('LH', 'AA')
  INTO TABLE @DATA(routes).
```

```abap title="Expressões no SELECT"
SELECT FROM /dmo/flight
  FIELDS carrier_id, connection_id, flight_date,
         seats_max - seats_occupied AS seats_free,
         CAST( seats_occupied AS FLTP ) * 100
           / CAST( seats_max AS FLTP ) AS load_pct,
         concat_with_space( carrier_id,
                            connection_id, 1 ) AS flight_code,
         CASE WHEN seats_occupied >= seats_max THEN 'X'
              ELSE ' ' END AS is_full
  WHERE flight_date >= @( cl_abap_context_info=>get_system_date( ) )
  INTO TABLE @DATA(flights).
```
:::

:::documentacao
- [SELECT](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapselect.htm)
- [Cheat sheet: ABAP SQL](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/03_ABAP_SQL.md)
:::
