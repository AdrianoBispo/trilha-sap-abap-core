---
titulo: Extensibilidade no ABAP Cloud
subtitulo: Key user, on-stack e side-by-side, e os pontos de extensão liberados em CDS e RAP.
duracao: "1 h"
icone: cloud
objetivos:
  - Explicar o princípio do clean core
  - Diferenciar extensibilidade key user, on-stack e side-by-side
  - Estender uma CDS view liberada
  - Estender o comportamento de um business object RAP
  - Escolher o tipo de extensão para um requisito
palavras_chave: extensibilidade clean core key user custom fields custom logic developer extensibility on-stack side-by-side extend view entity extension include behavior extension extensible c0
---

## Clean core {ancora="Clean core" icone="shield"}

No modelo clássico, uma ampliação podia depender de qualquer detalhe interno do sistema. O resultado, depois de anos, é um sistema em que cada upgrade vira um projeto. O **clean core** inverte a regra: uma extensão só pode usar o que a SAP **liberou** para esse fim, com contrato de estabilidade. Os contratos são os mesmos vistos em [A linguagem ABAP](#linguagem-abap): **C1** para usar, **C0** para estender.

Em vez de pontos de ampliação espalhados e implícitos, existem três **tipos de extensibilidade**, cada um com seu público e suas ferramentas.

## Três tipos de extensibilidade {ancora="Tipos" icone="split"}

::::colunas{n="3"}
:::cartao{etiqueta="Key user" tipo="info"}
### No próprio app

Feita por usuários-chave, em apps Fiori, sem ADT: **Custom Fields**, **Custom Logic** (BAdIs em um editor web), **Custom CDS Views** e **Custom Business Objects**. Código na versão *ABAP for Key Users*.
:::

:::cartao{etiqueta="On-stack" tipo="c5"}
### Desenvolvedor, no mesmo sistema

Feita no ADT, com **ABAP Cloud**, dentro do S/4HANA. Acessa os dados em tempo real, na mesma LUW, por APIs liberadas. Estende views, business objects e BAdIs liberados.
:::

:::cartao{etiqueta="Side-by-side" tipo="c7"}
### Em outra plataforma

Aplicação separada no **SAP BTP** (ABAP environment ou CAP). Conversa com o S/4HANA por APIs remotas e eventos. Ciclo de vida independente do core.
:::
::::

| | Key user | On-stack | Side-by-side |
| --- | --- | --- | --- |
| Quem faz | Usuário-chave | Desenvolvedor ABAP | Desenvolvedor ABAP ou de outra stack |
| Ferramenta | Apps Fiori | ADT | ADT, SAP Business Application Studio |
| Acesso aos dados | Local | Local, por CDS e EML liberados | Remoto, por OData, SOAP, RFC, eventos |
| Acoplamento ao core | Alto, mas por contrato | Alto, mas por contrato | Baixo |
| Bom para | Campos, regras simples, relatórios | Lógica próxima dos dados e da transação | Apps novos, outros públicos, picos de carga |

## Estendendo o modelo de dados {ancora="Dados" icone="detail-view"}

Uma CDS view liberada com contrato **C0** pode receber campos seus. Você não toca na view: cria uma **extensão**.

```cds title="ZX_I_TRAVEL_REGION"
// I_TravelTP representa aqui uma view liberada pela SAP com contrato C0
extend view entity I_TravelTP with
{
  _Extension.ZZRegionCode as ZZRegionCode
}
```

Para o campo existir fisicamente, a tabela por trás da view precisa prever a extensão. A SAP faz isso com uma **extension include**: uma estrutura vazia incluída na tabela, à qual o cliente acrescenta campos com um *append*. A view expõe essa estrutura por uma associação de extensão (`_Extension` no exemplo), e é por ela que o campo novo chega às camadas de cima.

:::termos
- `@AbapCatalog.extensibility.extensible: true` — Anotação na view da SAP que autoriza extensões.
- `@AbapCatalog.extensibility.elementSuffix` — Sufixo obrigatório nos campos acrescentados, como `ZZ…`, para evitar colisão de nomes.
- `@AbapCatalog.extensibility.dataSources` — Fontes de dados da view que a extensão pode usar.
- `@AbapCatalog.extensibility.quota` — Limite de campos e de bytes que as extensões podem acrescentar.
:::

Pelo app **Custom Fields**, um key user faz esse mesmo percurso sem ver código: o app cria o campo na extension include e o propaga pelas views, serviços e telas que a SAP marcou como extensíveis.

## Estendendo o comportamento {ancora="Comportamento" icone="workflow-tasks"}

Um business object RAP declarado como **extensible** aceita validações, determinações, ações e controles de campo acrescentados por uma **behavior extension**.

```bdl title="Behavior extension"
extension using interface I_TravelTP
  implementation in class zbp_x_travel unique;

extend behavior for Travel
{
  validation zzCheckRegion on save { create; field ZZRegionCode; }

  determination zzSetDefaultRegion on modify { create; }

  field ( mandatory ) ZZRegionCode;
}
```

```abap title="Implementação da extensão"
CLASS lhc_travel DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS zzcheckregion FOR VALIDATE ON SAVE
      IMPORTING keys FOR Travel~zzCheckRegion.
ENDCLASS.

CLASS lhc_travel IMPLEMENTATION.
  METHOD zzcheckregion.
    READ ENTITIES OF I_TravelTP IN LOCAL MODE
      ENTITY Travel FIELDS ( ZZRegionCode ) WITH CORRESPONDING #( keys )
      RESULT DATA(travels).

    LOOP AT travels INTO DATA(travel) WHERE ZZRegionCode IS INITIAL.
      APPEND VALUE #( %tky = travel-%tky ) TO failed-travel.
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.
```

A extensão roda **dentro** da transação do business object original: a validação participa do mesmo save, e uma falha impede a gravação. Os nomes começam com um prefixo do cliente para não colidirem com elementos que a SAP venha a acrescentar.

## Os demais pontos de extensão {ancora="Outros pontos" icone="list"}

:::checklist
- **BAdIs liberadas**: lógica em momentos definidos de processos standard. Veja [BAdIs](#badis).
- **Projeções e serviços próprios**: uma view de projeção sua sobre um business object liberado, com service definition e binding próprios, para um app novo sobre dados standard.
- **Business objects próprios**: tabelas Z e RAP gerenciado para dados que o standard não tem, ligados ao standard por associações a views liberadas.
- **Eventos de negócio**: o standard publica o evento, e a extensão, local ou no BTP, reage. Veja [HTTP, OData e eventos](#http-odata-eventos).
- **APIs remotas liberadas (C2)**: a base de toda extensão side-by-side.
:::

## Escolhendo {ancora="Escolha" icone="compare"}

| Requisito | Caminho |
| --- | --- |
| Um campo a mais em um documento standard, visível nas telas | Custom Fields (key user) |
| Uma regra simples em um ponto previsto | Custom Logic (key user) ou BAdI liberada no ADT |
| Validação ou ação nova em um business object standard | Behavior extension (on-stack) |
| App novo que lê e grava dados do core com resposta imediata | Business object próprio e projeções, on-stack |
| App para parceiros externos, ou com ciclo de vida próprio | Side-by-side no SAP BTP |
| Reagir a uma mudança sem atrasar a transação original | Evento de negócio |

:::aviso
Em sistemas S/4HANA privados e on-premise, as técnicas clássicas do módulo continuam disponíveis. A recomendação da SAP é usá-las só quando não existir ponto liberado e isolar o acesso não liberado em uma classe wrapper, para que o restante do código possa seguir o modelo ABAP Cloud.
:::

:::documentacao
- [ABAP Cloud (SAP Help Portal)](https://help.sap.com/docs/abap-cloud?locale=en-US)
- [ABAP RESTful Application Programming Model (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model?locale=en-US)
- [ABAP Data Models (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-data-models/abap-data-models?locale=en-US)
- [ABAP Keyword Documentation: EXTEND VIEW ENTITY](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abencds_extend_view_entity.htm)
:::
