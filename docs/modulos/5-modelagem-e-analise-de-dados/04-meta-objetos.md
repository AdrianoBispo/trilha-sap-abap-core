---
titulo: Anotações e meta objetos
subtitulo: Anotações, metadata extensions, camadas e extensões.
sap_learning: "Data Modeling in ABAP Dictionary and ABAP CDS · unidade 7"
duracao: "3 h 51 min"
icone: tag
objetivos:
  - Classificar anotações
  - "Usar @UI para Fiori Elements"
  - Separar anotações em metadata extensions
  - Estender views
palavras_chave: "annotation anotação @ui lineitem selectionfield metadata extension layer extend view"
---

## Anotações: metadados para quem consome {ancora="Anotações" icone="tag"}

**Anotações** começam com `@` e acrescentam significado a uma view ou elemento. Algumas são lidas pelo compilador (`@AccessControl`), outras pelo framework (`@Semantics`), outras pela interface Fiori (`@UI`).

::::colunas{n="3"}
:::cartao{etiqueta="@Semantics" tipo="c5"}
Relaciona valor e moeda, quantidade e unidade, textos e idiomas.
:::

:::cartao{etiqueta="@ObjectModel" tipo="c7"}
Define texto do elemento, ajuda de valor, categoria de representação.
:::

:::cartao{etiqueta="@UI" tipo="info"}
Posição em listas, filtros, facetas do Object Page, botões de ação.
:::
::::

## Anotações @UI e a list report {ancora="Pré-visualização Fiori" icone="show"}

Ative `@UI.lineItem` e `@UI.selectionField` para cada elemento e veja como o Fiori Elements monta a tela a partir da metadata extension.

::laboratorio{id="uilab"}

## Metadata extensions e camadas {ancora="Metadata extension" icone="document-text"}

Para não poluir a view com anotações de UI, a view permite extensões com `@Metadata.allowExtensions: true` e as anotações vão para uma **metadata extension**. Camadas (`#CORE`, `#LOCALIZATION`, `#INDUSTRY`, `#PARTNER`, `#CUSTOMER`) definem quem sobrescreve quem: a de cima vence.

```cds title="ZC_Travel · metadata extension"
@Metadata.layer: #CUSTOMER
@UI.headerInfo: { typeName: 'Viagem', typeNamePlural: 'Viagens',
                  title: { value: 'TravelId' } }
annotate entity ZC_Travel with
{
  @UI.facet: [{ id: 'Travel', purpose: #STANDARD,
                type: #IDENTIFICATION_REFERENCE, label: 'Viagem', position: 10 }]
  @UI.lineItem:       [{ position: 10, importance: #HIGH }]
  @UI.selectionField: [{ position: 10 }]
  @UI.identification: [{ position: 10 }]
  TravelId;

  @UI.lineItem: [{ position: 20 }]
  Description;

  @UI.lineItem: [{ position: 30, criticality: 'StatusCriticality' }]
  Status;
}
```

## Estendendo views sem modificar {ancora="Extensões" icone="create"}

```cds title="Extensão de view"
extend view entity ZI_Connection with
{
  /dmo/connection.departure_time as ZZDepartureTime
}
```

:::sucesso
Extensões são o caminho *clean core*: você acrescenta campos sem tocar no objeto original, e o upgrade não sobrescreve seu código.
:::

:::quiz
### Qual anotação permite metadata extensions em uma view?

- [x] `@Metadata.allowExtensions: true`
- [ ] `@UI.extend`
- [ ] `@AbapCatalog.extensible`
- [ ] `@ObjectModel.extension`

> Sem @Metadata.allowExtensions: true, a view não aceita metadata extensions.

### Qual anotação coloca um campo como coluna na list report?

- [ ] `@UI.selectionField`
- [x] `@UI.lineItem`
- [ ] `@UI.facet`
- [ ] `@UI.headerInfo`

> @UI.lineItem define colunas; @UI.selectionField define filtros.

### Entre as camadas `#CORE` e `#CUSTOMER`, qual prevalece?

- [ ] `#CORE`
- [x] `#CUSTOMER`
- [ ] A mais antiga
- [ ] Nenhuma, dá erro

> Camadas mais altas sobrescrevem as inferiores; #CUSTOMER fica no topo.
:::

:::documentacao
- [Cheat sheet: CDS View Entities](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/15_CDS_View_Entities.md)
:::
