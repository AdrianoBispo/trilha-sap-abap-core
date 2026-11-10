---
titulo: A linguagem ABAP
subtitulo: Versões da linguagem, contratos de liberação e APIs liberadas.
duracao: "45 min"
icone: overview-chart
objetivos:
  - Dizer o que é ABAP e onde ele roda
  - Distinguir as versões da linguagem ABAP
  - Explicar os contratos de liberação C0 a C4
  - Encontrar APIs liberadas e seus sucessores
palavras_chave: abap language version standard abap cloud development key users release contract c0 c1 c2 c3 c4 released api clean core tier
---

## O que é ABAP {ancora="O que é ABAP" icone="overview-chart"}

**ABAP** (*Advanced Business Application Programming*) é a linguagem em que a SAP escreve seus sistemas de negócio desde os anos 80, e a mesma que clientes e parceiros usam para estendê-los. Três características a diferenciam de uma linguagem de uso geral:

:::checklist
- O código não vive em arquivos: cada programa, classe ou tabela é um **objeto de repositório** guardado no banco do próprio sistema, com versão ativa e inativa, pacote e transporte.
- O acesso ao banco faz parte da linguagem (**ABAP SQL**), assim como tabelas internas, autorizações e controle transacional.
- O programa roda sempre dentro do **servidor de aplicação ABAP** (AS ABAP), que cuida de usuários, sessões, memória e bloqueios. Veja [O servidor de aplicação ABAP](#servidor-de-aplicacao).
:::

Hoje existem três destinos para o seu código: o **SAP BTP ABAP environment**, o **SAP S/4HANA Cloud Public Edition** e o **SAP S/4HANA** privado ou on-premise. O que muda de um para o outro é quanto da linguagem você pode usar, e isso é definido pela *versão da linguagem*.

## Versões da linguagem ABAP {ancora="Versões da linguagem" icone="syntax"}

A versão da linguagem é um **atributo de cada objeto de repositório**. Ela define duas coisas: quais comandos a sintaxe aceita e quais outros objetos o seu código pode usar. No ADT ela aparece em **Properties › General › ABAP Language Version**.

| Versão | Sintaxe | Objetos que pode usar | Onde é usada |
| --- | --- | --- | --- |
| **Standard ABAP** | Completa, incluindo comandos obsoletos | Qualquer objeto do sistema | S/4HANA privado e on-premise (ABAP clássico) |
| **ABAP for Cloud Development** | Restrita: sem `WRITE`, dynpros, `CALL TRANSACTION`, SQL nativo | Só objetos **liberados** | BTP ABAP environment, S/4HANA Cloud e, por escolha, on-premise |
| **ABAP for Key Users** | Muito restrita | Só objetos liberados para key users | Lógica customizada criada em apps Fiori de extensibilidade |

:::nota
No BTP ABAP environment e no S/4HANA Cloud Public Edition só existe *ABAP for Cloud Development*. Em sistemas privados e on-premise as versões convivem: você escolhe por objeto, e o pacote ou componente de software define o padrão. A documentação ainda cita versões obsoletas, como *Static ABAP with restricted object use*, que não devem ser usadas em código novo.
:::

**ABAP Cloud** é o nome do modelo de desenvolvimento que usa essa versão restrita junto com CDS, RAP e as ferramentas do ADT. A restrição existe por um motivo prático: se o seu código só depende do que a SAP prometeu manter estável, um upgrade não o quebra. Esse é o princípio do **clean core**.

## Contratos de liberação {ancora="Contratos de liberação" icone="shield"}

Um objeto SAP só pode ser usado no ABAP Cloud se tiver um **contrato de liberação** (*release contract*). O contrato diz **para que** o objeto está liberado e garante que a SAP não fará mudanças incompatíveis naquele uso.

:::termos
- **C0 · Extend** — O objeto pode ser estendido: campos em uma tabela ou CDS view, comportamento de um business object.
- **C1 · Use System-Internally** — O objeto pode ser usado dentro do sistema, em código ABAP ou em outras CDS views. É o contrato da maioria das APIs liberadas.
- **C2 · Use as Remote API** — O objeto é uma interface estável para chamadas de fora do sistema, como um serviço OData ou um módulo RFC.
- **C3 · Manage Configuration Content** — O conteúdo de configuração do objeto pode ser lido e mantido por ferramentas de configuração.
- **C4 · Use in ABAP-Managed Database Procedures** — O objeto pode ser lido dentro de um procedimento AMDP.
:::

Cada contrato tem ainda um **estado** e uma **visibilidade**:

::::colunas{n="2"}
:::cartao
### Estado

| Estado | Significado |
| --- | --- |
| *Released* | Liberado e estável |
| *Deprecated* | Ainda funciona, mas já tem sucessor indicado |
| *Not Released* | Uso interno da SAP; o compilador bloqueia no ABAP Cloud |
:::

:::cartao
### Visibilidade

O contrato C1 indica onde vale: **Use in Cloud Development**, **Use in Key User Apps** ou os dois. Um objeto liberado só para key users não pode ser usado em uma classe sua, e vice-versa.
:::
::::

## Encontrando APIs liberadas {ancora="APIs liberadas" icone="search"}

```abap title="Mesma tarefa, duas versões da linguagem"
" Standard ABAP: acesso direto a tabela e campo de sistema
SELECT SINGLE name1 FROM kna1 WHERE kunnr = @customer INTO @DATA(name).
DATA(today) = sy-datum.

" ABAP for Cloud Development: CDS view e classe liberadas (contrato C1)
SELECT SINGLE CustomerName FROM I_Customer
  WHERE Customer = @customer INTO @DATA(customer_name).
DATA(today_cloud) = cl_abap_context_info=>get_system_date( ).
```

:::checklist
- No **Project Explorer** do ADT, a árvore **Released Objects** lista tudo o que está liberado, por tipo de objeto.
- Em qualquer objeto aberto, a aba **Properties › API State** mostra os contratos, o estado e o sucessor, se houver.
- Se você usar um objeto não liberado, o erro de sintaxe e o ATC apontam o **sucessor**: `KNA1` leva a `I_Customer`, `sy-datum` leva a `CL_ABAP_CONTEXT_INFO`.
- O **Cloudification Repository** da SAP, no GitHub, publica a lista de objetos liberados e sucessores por versão do S/4HANA.
:::

Quando não existe API liberada para o que você precisa em um sistema privado ou on-premise, a saída recomendada é um **wrapper**: uma classe em Standard ABAP que encapsula o objeto não liberado e que você mesmo libera com contrato C1 para o seu código ABAP Cloud. O acesso sujo fica isolado em um ponto só.

:::documentacao
- [ABAP Cloud (SAP Help Portal)](https://help.sap.com/docs/abap-cloud?locale=en-US)
- [SAP BTP ABAP environment (SAP Help Portal)](https://help.sap.com/docs/sap-btp-abap-environment?locale=en-US)
- [ABAP Keyword Documentation · ABAP Cloud](https://help.sap.com/docs/abap-cloud/abap-keywords/abap-keyword-documentation?locale=en-US)
- [Cheat sheet: ABAP for Cloud Development](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/19_ABAP_for_Cloud_Development.md)
- [Cloudification Repository (objetos liberados e sucessores)](https://github.com/SAP/abap-atc-cr-cv-s4hc)
:::
