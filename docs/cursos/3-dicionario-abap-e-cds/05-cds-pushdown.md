---
titulo: Code pushdown em CDS
subtitulo: Expressões, funções, CASE e agregações em views.
unidade: "6"
duracao: "3 h 36 min"
icone: syntax
objetivos:
  - Calcular em CDS
  - Usar funções embutidas
  - Classificar com CASE
  - Agregar com group by
palavras_chave: "case cast division concat dats_days_between $session sum count avg group by having"
---

## Expressões e funções em CDS {ancora="Expressões" icone="syntax"}

:::::colunas{n="2"}
```cds title="Cálculos na view"
define view entity ZI_FlightLoad
  as select from /dmo/flight
{
  key carrier_id    as CarrierId,
  key connection_id as ConnectionId,
  key flight_date   as FlightDate,
      seats_max - seats_occupied as SeatsFree,
      division( seats_occupied * 100, seats_max, 2 ) as LoadPercent,
      cast( price as abap.dec( 16, 2 ) ) as Price,
      concat_with_space( carrier_id, connection_id, 1 ) as FlightCode,
      dats_days_between( $session.system_date, flight_date ) as DaysToGo,
      case
        when seats_occupied >= seats_max      then 'Lotado'
        when seats_occupied >= seats_max * 0.8 then 'Quase cheio'
        else 'Disponível'
      end as Availability
}
```

::::cartao
### Funções frequentes

:::termos
- `cast( )` — Converte tipos, ex.: `abap.dec(16,2)`.
- `division( a, b, n )` — Divisão com *n* casas decimais.
- `concat( )` — Concatena textos; `concat_with_space` insere espaços.
- `substring( ), upper( )` — Manipulação de texto.
- `round( ), abs( ), div( ), mod( )` — Matemática.
- `dats_days_between( )` — Dias entre duas datas.
- `$session.system_date` — Data atual do sistema.
- `currency_conversion( )` — Converte valores entre moedas.
:::
::::
:::::

## Laboratório de CASE {ancora="Laboratório de CASE" icone="filter"}

Ajuste os limites de distância e veja a expressão CDS e a classificação das conexões de exemplo, calculadas como o banco faria.

::laboratorio{id="caselab"}

## Agregação em CDS {ancora="Agregação" icone="overview-chart"}

```cds title="ZI_CarrierStats"
define view entity ZI_CarrierStats
  as select from /dmo/flight
{
  key carrier_id                      as CarrierId,
      count( * )                      as Flights,
      sum( seats_occupied )           as Passengers,
      avg( seats_occupied as abap.dec( 10, 2 ) ) as AvgPassengers,
      max( price )                    as MaxPrice,
      currency_code                   as CurrencyCode
}
group by carrier_id, currency_code
having count( * ) > 1
```

:::nota
Todo elemento fora de uma função de agregação precisa estar no `group by`. `avg` exige `as` com um tipo decimal ou de ponto flutuante.
:::

:::quiz
### Qual função CDS divide com número definido de casas decimais?

- [ ] `div( )`
- [x] `division( )`
- [ ] `round( )`
- [ ] `mod( )`

> division( a, b, n ) retorna o quociente com n casas decimais.

### Como obter a data atual do sistema em uma CDS view?

- [ ] `sy-datum`
- [x] `$session.system_date`
- [ ] `current_date( )`
- [ ] `@today`

> $session.system_date é a variável de sessão com a data do sistema.

### O que `avg( )` exige em CDS?

- [ ] Um alias numérico
- [x] A adição `as` com tipo decimal ou flutuante
- [ ] Um parâmetro
- [ ] Nada

> avg( campo as abap.dec( 10, 2 ) ) define o tipo do resultado.
:::

:::documentacao
- [Cheat sheet: CDS View Entities](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/15_CDS_View_Entities.md)
:::
