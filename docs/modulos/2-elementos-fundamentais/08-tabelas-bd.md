---
titulo: Tabelas de banco
subtitulo: define table, chaves, classe de entrega e campos de moeda.
sap_learning: "Data Modeling in ABAP Dictionary and ABAP CDS · unidade 2"
duracao: "3 h 24 min"
icone: table-view
objetivos:
  - Definir uma tabela com define table
  - Configurar anotações técnicas
  - Modelar campos de valor e moeda
  - Preencher dados de teste
palavras_chave: define table key client delivery class curr cuky foreign key insert
---

## Definindo uma tabela de banco {ancora="DEFINE TABLE" icone="table-view"}

No ADT, tabelas são definidas em código fonte com `define table`. As anotações informam categoria de entrega, possibilidade de manutenção e extensibilidade. Campos monetários precisam apontar para o campo de moeda.

```ddl title="ZTRAVEL"
@EndUserText.label : 'Viagens'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table ztravel {
  key client      : abap.clnt not null;
  key travel_uuid : sysuuid_x16 not null;
  travel_id       : /dmo/travel_id;
  agency_id       : /dmo/agency_id;
  description     : /dmo/description;
  begin_date      : /dmo/begin_date;
  end_date        : /dmo/end_date;
  @Semantics.amount.currencyCode : 'ztravel.currency_code'
  total_price     : /dmo/total_price;
  currency_code   : /dmo/currency_code;
  status          : /dmo/travel_status;
  local_last_changed_at : abp_locinst_lastchange_tstmpl;
}
```

::::colunas{n="3"}
:::cartao
### Classe de entrega

`#A` dados de aplicação (mestre e movimento); `#C` customizing; `#L` dados temporários.
:::

:::cartao
### Chave primária

Campos `key` vêm primeiro e são `not null`. O mandante (`abap.clnt`) abre a chave em tabelas dependentes de mandante.
:::

:::cartao
### Tabelas de verificação

Chaves estrangeiras (`with foreign key`) documentam relações e alimentam ajudas de pesquisa.
:::
::::

## Construtor de tabela {ancora="Construtor" icone="create"}

Adicione campos e veja a definição gerada. As validações seguem as regras do Dictionary: nome da tabela com até 16 caracteres no namespace do cliente, campos com até 30, chave antes dos demais campos.

::laboratorio{id="tablebuilder"}

## Gravando dados de teste {ancora="Gravando dados" icone="refresh"}

Para tabelas próprias sem business object, uma classe de console pode preencher dados de teste com ABAP SQL. Em aplicações, prefira sempre a EML.

```abap title="Preenchendo a tabela"
DELETE FROM ztravel.

INSERT ztravel FROM TABLE @( VALUE #(
  ( client = sy-mandt travel_uuid = cl_system_uuid=>create_uuid_x16_static( )
    travel_id = '00000001' description = 'Congresso em Lisboa'
    begin_date = '20261110' end_date = '20261114'
    total_price = '2450.00' currency_code = 'EUR' status = 'N' ) ) ).

out->write( |Inseridas: { sy-dbcnt }| ).
```

:::documentacao
- [Cheat sheet: ABAP Dictionary](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/26_ABAP_Dictionary.md)
:::
