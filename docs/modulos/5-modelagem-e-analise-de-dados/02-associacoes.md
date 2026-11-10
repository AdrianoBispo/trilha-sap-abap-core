---
titulo: Relações e associações
subtitulo: Associações, cardinalidade e expressões de caminho.
sap_learning: "Data Modeling in ABAP Dictionary and ABAP CDS · unidade 5"
duracao: "3 h 34 min"
icone: chain-link
objetivos:
  - Declarar associações
  - Escolher a cardinalidade
  - Usar expressões de caminho
  - Consumir associações em ABAP SQL
palavras_chave: "association cardinalidade path expression caminho $projection _carrier"
---

## Associações: joins sob demanda {ancora="Associações" icone="chain-link"}

Uma **associação** declara a relação entre duas entidades sem executar o join. O join só acontece quando alguém usa a associação numa **expressão de caminho**, como `_Carrier.Name`. Por convenção, o nome começa com sublinhado.

A **cardinalidade** diz quantas linhas do destino correspondem a uma da origem. Ela ajuda o otimizador e evita multiplicar linhas por engano.

::figura{arquivo="associacoes-1.svg"}

```cds title="ZI_Connection com associações"
define view entity ZI_Connection
  as select from /dmo/connection
  association [1..1] to ZI_Carrier as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
  association [0..*] to ZI_Flight  as _Flights
    on  $projection.CarrierId    = _Flights.CarrierId
    and $projection.ConnectionId = _Flights.ConnectionId
{
  key carrier_id    as CarrierId,
  key connection_id as ConnectionId,
      airport_from_id as AirportFromId,
      airport_to_id   as AirportToId,
      _Carrier.Name   as CarrierName,   " expressão de caminho
      /* expostas para quem consome a view */
      _Carrier,
      _Flights
}
```

## Explorador de expressões de caminho {ancora="Explorador de caminhos" icone="detail-view"}

Escolha o que projetar a partir de `ZI_Connection`. Repare como o caminho por uma associação `[0..*]` multiplica as linhas do resultado, e como o filtro na associação resolve isso.

::laboratorio{id="pathlab"}

## Usando associações em ABAP SQL {ancora="Em ABAP SQL" icone="source-code"}

```abap title="Caminho em ABAP SQL"
SELECT FROM zi_connection
  FIELDS CarrierId, ConnectionId,
         \_Carrier-Name AS CarrierName,
         \_Carrier-CurrencyCode AS Currency
  WHERE CarrierId = 'LH'
  INTO TABLE @DATA(result).
```

:::nota
Em ABAP SQL o caminho começa com barra invertida e usa hífen: `\_Carrier-Name`. Filtros e cardinalidade entram entre colchetes.
:::

:::quiz
### Quando o join de uma associação é executado?

- [ ] Sempre que a view é ativada
- [x] Somente quando uma expressão de caminho usa a associação
- [ ] Nunca
- [ ] Só em ABAP SQL

> Associações são joins sob demanda: só viram SQL quando usadas.

### O que `[0..*]` indica?

- [ ] Exatamente uma linha
- [x] Nenhuma ou muitas linhas no destino
- [ ] No máximo uma
- [ ] Uma ou mais

> A cardinalidade 0..* permite nenhuma ou várias linhas correspondentes.

### Como escrever o caminho para `Name` via `_Carrier` em ABAP SQL?

- [ ] `_Carrier.Name`
- [x] `\_Carrier-Name`
- [ ] `_Carrier~Name`
- [ ] `_Carrier=>Name`

> ABAP SQL usa barra invertida e hífen; CDS usa _Carrier.Name.
:::

:::documentacao
- [Cheat sheet: CDS View Entities](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/15_CDS_View_Entities.md)
- [Cheat sheet: ABAP SQL](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/03_ABAP_SQL.md)
:::
