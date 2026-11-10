---
titulo: Modelos analíticos em CDS
subtitulo: Cubos, dimensões e consultas analíticas com ABAP Analytics.
duracao: "50 min"
icone: multiple-bar-chart
objetivos:
  - Diferenciar acesso transacional e acesso analítico
  - Distinguir medidas e dimensões
  - Modelar um cubo e uma dimensão em CDS
  - Definir uma consulta analítica como projeção
  - Dizer como a consulta chega ao usuário
palavras_chave: analytics cube dimension measure aggregation default analytical query provider contract transient view entity ina sap analytics cloud star schema
---

## Transacional e analítico {ancora="Conceito" icone="multiple-bar-chart"}

Uma tela transacional mostra **documentos**: uma viagem, uma reserva. Uma tela analítica mostra **números agregados** que o usuário reorganiza na hora: ocupação por companhia, depois por mês, depois só para um aeroporto. O que muda de uma pergunta para outra é o agrupamento, e ninguém quer uma CDS view com `GROUP BY` para cada combinação.

O **ABAP Analytics** resolve isso com um modelo descrito em CDS e um **mecanismo analítico** que monta a agregação conforme a navegação do usuário. Dois conceitos sustentam o modelo:

:::termos
- **Medida** — Um valor numérico que se agrega: assentos, preço, quantidade. Cada medida declara **como** é agregada.
- **Dimensão** — Um critério pelo qual se agrupa e filtra: companhia, conexão, data, moeda.
:::

O desenho é um **esquema em estrela**: no centro, um **cubo** com as medidas e as chaves; em volta, **views de dimensão** com os atributos e textos de cada chave.

## O cubo {ancora="Cubo" icone="database"}

```cds title="ZI_FlightCube"
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Cubo de voos'
@Analytics.dataCategory: #CUBE
define view entity ZI_FlightCube
  as select from /dmo/flight
  association [1..1] to ZI_CarrierDim as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
{
      @ObjectModel.foreignKey.association: '_Carrier'
  key carrier_id     as CarrierId,
  key connection_id  as ConnectionId,
  key flight_date    as FlightDate,

      @Aggregation.default: #SUM
      seats_max      as SeatsMax,

      @Aggregation.default: #SUM
      seats_occupied as SeatsOccupied,

      @Aggregation.default: #SUM
      @Semantics.amount.currencyCode: 'CurrencyCode'
      price          as Price,

      currency_code  as CurrencyCode,

      _Carrier
}
```

:::termos
- `@Analytics.dataCategory: #CUBE` — Declara a view como fonte de fatos do modelo analítico.
- `@Aggregation.default: #SUM` — Transforma o campo em **medida** e define a agregação. Outros valores: `#MIN`, `#MAX`, `#AVG`, `#COUNT_DISTINCT`.
- Campos sem `@Aggregation.default` — São **dimensões**.
- `@ObjectModel.foreignKey.association` — Liga a chave à view de dimensão que a descreve.
:::

Repare que o cubo **não tem `GROUP BY`**. Ele entrega as linhas no nível mais fino; quem agrega é o mecanismo analítico, de acordo com as dimensões que o usuário colocou na tela.

## A dimensão {ancora="Dimensão" icone="org-chart"}

```cds title="ZI_CarrierDim"
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Companhia aérea'
@Analytics.dataCategory: #DIMENSION
@ObjectModel.representativeKey: 'CarrierId'
define view entity ZI_CarrierDim
  as select from /dmo/carrier
{
      @ObjectModel.text.element: ['CarrierName']
  key carrier_id    as CarrierId,

      @Semantics.text: true
      name          as CarrierName,

      currency_code as CurrencyCode
}
```

A dimensão dá ao código da companhia um **texto** (`@ObjectModel.text.element`) e atributos extras, que passam a ficar disponíveis para exibição e filtro em qualquer consulta sobre o cubo. A mesma dimensão serve a vários cubos.

## A consulta analítica {ancora="Consulta" icone="filter"}

A **consulta analítica** escolhe o que do cubo será mostrado e como: o que vai nas linhas, o que vai nas colunas, quais medidas calculadas existem. No ABAP Cloud ela é uma **projeção transiente** sobre o cubo: uma view que não cria nada no banco e só existe para o mecanismo analítico.

```cds title="ZC_FlightOccupancyQuery"
@AccessControl.authorizationCheck: #NOT_ALLOWED
@EndUserText.label: 'Ocupação de voos'
define transient view entity ZC_FlightOccupancyQuery
  provider contract analytical_query
  as projection on ZI_FlightCube
{
  @AnalyticsDetails.query.axis: #ROWS
  CarrierId,

  @AnalyticsDetails.query.axis: #ROWS
  ConnectionId,

  FlightDate,

  SeatsMax,
  SeatsOccupied,

  @EndUserText.label: 'Assentos livres'
  @Aggregation.default: #FORMULA
  SeatsMax - SeatsOccupied as SeatsFree
}
```

:::termos
- `transient` — A view não gera objeto no banco e não pode ser lida com ABAP SQL.
- `provider contract analytical_query` — Diz ao sistema que a projeção é uma consulta analítica.
- `@AnalyticsDetails.query.axis` — Posição inicial da dimensão: `#ROWS`, `#COLUMNS` ou `#FREE` (disponível, mas fora da tela).
- `@Aggregation.default: #FORMULA` — Medida calculada a partir de outras, **depois** da agregação.
:::

:::nota
Em sistemas mais antigos, a consulta analítica é uma CDS view comum com a anotação `@Analytics.query: true` sobre o cubo. O papel é o mesmo.
:::

## Do modelo ao usuário {ancora="Consumo" icone="show"}

:::checklist
- A consulta é incluída em uma **service definition** e exposta por uma **service binding** do tipo **InA - UI**. InA (*Information Access*) é o protocolo analítico da SAP.
- Publicado o binding, o **preview** do ADT abre a consulta em uma grade analítica, onde você arrasta dimensões entre linhas e colunas.
- O **SAP Analytics Cloud** consome a mesma consulta por conexão ao vivo, sem copiar os dados.
- A autorização vem dos controles de acesso (DCL) definidos sobre o cubo e as dimensões.
:::

| | View transacional | Modelo analítico |
| --- | --- | --- |
| Pergunta | "Mostre este documento" | "Some por estes critérios" |
| Agregação | Fixa, escrita na view | Dinâmica, decidida na navegação |
| Protocolo | OData | InA |
| Camadas | Interface e projeção de consumo | Cubo, dimensões e consulta |

:::documentacao
- [ABAP Analytics (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-analytics/abap-analytics?locale=en-US)
- [ABAP Data Models (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-data-models/abap-data-models?locale=en-US)
- [Cheat sheet: CDS View Entities](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/15_CDS_View_Entities.md)
:::
