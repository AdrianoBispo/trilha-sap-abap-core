---
titulo: CDS view entities
subtitulo: Views, parâmetros e joins em CDS.
unidade: "4"
duracao: "2 h 13 min"
icone: detail-view
objetivos:
  - Definir uma CDS view entity
  - Usar nomes semânticos e chaves
  - Criar views com parâmetros
  - Escrever joins em CDS
palavras_chave: cds view entity define as select from parameters join data preview vdm
---

## CDS view entities {ancora="View entity" icone="detail-view"}

Uma **CDS view entity** é uma consulta com nome, definida em DDL, que vive no banco como view SQL. Ela renomeia campos para nomes semânticos, filtra, calcula e é a base do modelo de dados virtual (VDM) do S/4HANA.

```cds title="ZI_Connection"
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Conexões de voo'
define view entity ZI_Connection
  as select from /dmo/connection
{
  key carrier_id      as CarrierId,
  key connection_id   as ConnectionId,
      airport_from_id as AirportFromId,
      airport_to_id   as AirportToId,
      departure_time  as DepartureTime,
      @Semantics.quantity.unitOfMeasure: 'DistanceUnit'
      distance        as Distance,
      distance_unit   as DistanceUnit
}
where distance_unit = 'KM'
```

::::colunas{n="3"}
:::cartao{etiqueta="Nome" tipo="info"}
Convenção VDM: `I_` interface, `C_` consumo, `R_` raiz de BO. No cliente, prefixe com `Z`.
:::

:::cartao{etiqueta="Chave" tipo="info"}
`key` marca os elementos que identificam uma linha. Eles vêm primeiro na lista.
:::

:::cartao{etiqueta="Preview" tipo="info"}
:kbd[F8] na view abre o Data Preview; ABAP SQL lê a view como uma tabela.
:::
::::

## Views com parâmetros {ancora="Parâmetros" icone="filter"}

:::colunas{n="2"}
```cds title="ZI_FlightsFrom"
define view entity ZI_FlightsFrom
  with parameters
    p_from : /dmo/flight_date
  as select from /dmo/flight
{
  key carrier_id    as CarrierId,
  key connection_id as ConnectionId,
  key flight_date   as FlightDate,
      seats_max - seats_occupied as SeatsFree
}
where flight_date >= $parameters.p_from
```

```abap title="Lendo com parâmetro"
SELECT FROM zi_flightsfrom(
         p_from = @( cl_abap_context_info=>get_system_date( ) ) )
  FIELDS CarrierId, FlightDate, SeatsFree
  ORDER BY FlightDate
  INTO TABLE @DATA(next_flights)
  UP TO 20 ROWS.
```
:::

## Joins em CDS {ancora="Joins" icone="chain-link"}

```cds title="Join"
define view entity ZI_ConnectionWithCarrier
  as select from /dmo/connection as c
    inner join   /dmo/carrier    as a on c.carrier_id = a.carrier_id
{
  key c.carrier_id    as CarrierId,
  key c.connection_id as ConnectionId,
      a.name          as CarrierName
}
```

:::nota
Em CDS o separador é o ponto (`c.carrier_id`); em ABAP SQL é o til (`c~carrier_id`).
:::

:::quiz
### Qual palavra-chave cria uma CDS view entity?

- [x] `define view entity`
- [ ] `create view`
- [ ] `define table`
- [ ] `annotate view`

> define view entity Nome as select from fonte { … }.

### Como se referencia um parâmetro dentro da view?

- [ ] `@p_from`
- [x] `$parameters.p_from`
- [ ] `:p_from`
- [ ] `p_from#`

> Parâmetros são acessados com $parameters.nome.

### Qual prefixo VDM indica uma view de interface?

- [ ] `C_`
- [x] `I_`
- [ ] `R_`
- [ ] `P_`

> I_ interface, C_ consumo, R_ raiz de business object.
:::

:::documentacao
- [Cheat sheet: CDS View Entities](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/15_CDS_View_Entities.md)
:::
