---
titulo: Modelo RAP
subtitulo: Camadas, comportamento e serviço OData de uma aplicação Fiori.
sap_learning: "Basic ABAP Programming · unidade 8"
duracao: "2 h 24 min"
icone: overview-chart
objetivos:
  - Descrever as camadas do RAP
  - Diferenciar managed, unmanaged e draft
  - Reconhecer determinations, validations e actions
  - Publicar um serviço com service binding
palavras_chave: rap behavior definition managed draft determination validation action service definition binding odata fiori elements
---

## As camadas de uma aplicação RAP {ancora="Camadas" icone="overview-chart"}

O **ABAP RESTful Application Programming Model** organiza uma aplicação Fiori em camadas, da tabela ao navegador. Clique em cada camada para ver o artefato correspondente.

::laboratorio{id="rap"}

## Comportamento transacional {ancora="Comportamento" icone="workflow-tasks"}

::::colunas{n="3"}
:::cartao{etiqueta="Managed" tipo="c5"}
O framework implementa create, update, delete e bloqueios. Você só adiciona a lógica específica. É o caminho para aplicações novas.
:::

:::cartao{etiqueta="Unmanaged" tipo="c7"}
Você implementa a persistência, geralmente reaproveitando código legado (BAPIs, funções de update).
:::

:::cartao{etiqueta="Draft" tipo="info"}
Salva rascunhos no servidor enquanto o usuário edita, com tabela própria de rascunho e ações `Edit`/`Activate`.
:::
::::

::::colunas{n="2"}
:::cartao
### Determinations

Calculam valores automaticamente, ex.: preencher o status inicial ao criar.
:::

:::cartao
### Validations

Verificam consistência antes de salvar, ex.: data final depois da inicial.
:::

:::cartao
### Actions

Operações de negócio que o usuário dispara, ex.: `acceptTravel`.
:::

:::cartao
### Feature control

Ativa ou desativa campos e botões conforme o estado do registro.
:::
::::

```bdl title="Behavior definition · ZR_TRAVEL"
managed implementation in class zbp_r_travel unique;
strict ( 2 );

define behavior for ZR_Travel alias Travel
persistent table ztravel
lock master
authorization master ( instance )
etag master LocalLastChanged
{
  create; update; delete;
  field ( readonly, numbering : managed ) TravelUUID;

  determination setStatusNew on modify { create; }
  validation validateDates on save { create; field BeginDate, EndDate; }
  action acceptTravel result [1] $self;
}
```

:::quiz
### Qual artefato define quais entidades um serviço OData expõe?

- [ ] Service binding
- [x] Service definition
- [ ] Behavior definition
- [ ] Metadata extension

> A service definition lista as entidades expostas; o service binding define protocolo e tipo (UI, API).

### Em um BO managed, quem implementa create, update e delete?

- [ ] O desenvolvedor, em ABAP
- [x] O framework RAP
- [ ] O Fiori Elements
- [ ] O ATC

> No cenário managed o framework cuida da persistência padrão; você adiciona apenas lógica específica.

### Qual elemento de comportamento verifica a consistência dos dados antes de salvar?

- [ ] Determination
- [ ] Action
- [x] Validation
- [ ] Feature control

> Validations rodam no save e podem rejeitar dados inconsistentes.
:::

:::documentacao
- [Cheat sheet: RAP Behavior Definition Language](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/36_RAP_Behavior_Definition_Language.md)
- [Cheat sheet: CDS View Entities](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/15_CDS_View_Entities.md)
:::
