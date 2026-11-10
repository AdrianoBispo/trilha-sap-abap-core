---
titulo: Enhancements clássicos
subtitulo: Modificação e ampliação, user exits, customer exits e o Enhancement Framework.
duracao: "1 h"
icone: wrench
objetivos:
  - Diferenciar modificação e ampliação
  - Reconhecer user exits e customer exits em código standard
  - Explicar pontos de ampliação explícitos e implícitos
  - Estender tabelas com append structures
  - Encontrar as ampliações disponíveis em um programa
palavras_chave: enhancement modification user exit customer exit smod cmod call customer-function enhancement-point enhancement-section implicit enhancement spot append structure spau
---

## Modificar ou ampliar {ancora="Conceito" icone="wrench"}

Todo cliente precisa adaptar o sistema SAP ao próprio negócio. Há duas formas de fazer isso no código standard.

::::colunas{n="2"}
:::cartao{etiqueta="Modificação" tipo="erro"}
Você **altera** o objeto da SAP. Exige chave de acesso, e a cada upgrade ou nota a alteração precisa ser reconciliada à mão nas transações SPDD e SPAU. Quanto mais modificações, mais caro e arriscado fica cada upgrade.
:::

:::cartao{etiqueta="Ampliação" tipo="sucesso"}
Você **acrescenta** código em um ponto que a SAP preparou. O objeto original continua intacto, o seu código fica em objetos seus e o upgrade mantém a ligação entre os dois.
:::
::::

As técnicas de ampliação (*enhancement*) surgiram em gerações. Em um sistema S/4HANA on-premise convivem todas elas.

| Geração | Técnica | Como o standard chama o seu código |
| --- | --- | --- |
| 1 | **User exit** | `PERFORM` para uma sub-rotina em um include reservado ao cliente |
| 2 | **Customer exit** | `CALL CUSTOMER-FUNCTION` para um módulo de função |
| 3 | **BAdI clássica** | Método de uma interface, via `CL_EXITHANDLER` |
| 4 | **Enhancement Framework** | Pontos explícitos e implícitos, e as **BAdIs novas** |

As BAdIs têm uma [lição própria](#badis).

## User exits {ancora="User exits" icone="history"}

Os **user exits** são sub-rotinas vazias que a SAP deixou em includes separados, sobretudo em Vendas. O programa standard as chama em momentos fixos; o cliente preenche o corpo.

```abap title="Include MV45AFZZ (ordem de venda)"
FORM userexit_save_document_prepare.
  " Código do cliente, executado antes de gravar a ordem.
  " Enxerga os dados globais do programa SAPMV45A, como VBAK e XVBAP.
  IF vbak-auart = 'ZOR' AND vbak-bstnk IS INITIAL.
    MESSAGE 'Informe o número do pedido do cliente' TYPE 'E'.
  ENDIF.
ENDFORM.
```

Tecnicamente é uma modificação consentida: o include pertence à SAP, e você o altera. Não há interface. O código acessa as variáveis globais do programa principal, o que torna o resultado dependente de detalhes internos que podem mudar.

## Customer exits {ancora="Customer exits" icone="create-form"}

Os **customer exits** trouxeram uma interface definida. A SAP agrupa os pontos em uma **ampliação** (transação SMOD); o cliente a ativa dentro de um **projeto** (transação CMOD).

```abap title="No programa standard"
CALL CUSTOMER-FUNCTION '001'
  EXPORTING i_header = header
  CHANGING  c_status = status.
```

```abap title="Módulo EXIT_SAPLXXXX_001, criado pela SAP"
FUNCTION exit_saplxxxx_001.
  INCLUDE zxxxxu01.          " este include é seu: é aqui que você escreve
ENDFUNCTION.
```

:::termos
- **Function exit** — O caso acima. A chamada só acontece se o projeto na CMOD estiver ativo.
- **Menu exit** — Um código de função reservado (`+XXX`) para uma entrada de menu do cliente.
- **Screen exit** — Uma área de subtela reservada para campos do cliente.
:::

A limitação é estrutural: cada ampliação só pode pertencer a **um** projeto, então duas equipes não conseguem implementar o mesmo ponto de forma independente.

## Enhancement Framework {ancora="Enhancement Framework" icone="puzzle"}

A partir do NetWeaver 7.0, o **Enhancement Framework** unificou as técnicas e passou a permitir ampliações em quase qualquer objeto, inclusive onde a SAP não previu.

### Pontos explícitos

A SAP marca o lugar no código standard. Todo ponto pertence a um **enhancement spot**.

```abap title="No código standard"
" Ponto: o cliente pode ACRESCENTAR código aqui
ENHANCEMENT-POINT ep_before_save SPOTS es_flight_booking.

" Seção: o cliente pode SUBSTITUIR este trecho
ENHANCEMENT-SECTION es_calc_price SPOTS es_flight_booking.
  price = base_price * rate.
END-ENHANCEMENT-SECTION.
```

```abap title="A implementação do cliente"
ENHANCEMENT 1 zflight_booking_impl.
  IF booking-seats > 9.
    booking-needs_approval = abap_true.
  ENDIF.
ENDENHANCEMENT.
```

Um `ENHANCEMENT-POINT` aceita várias implementações, de equipes diferentes. Uma `ENHANCEMENT-SECTION` aceita só uma ativa, porque ela troca o código original.

### Pontos implícitos

Existem sem que a SAP tenha feito nada. O framework os oferece em posições fixas de todo objeto:

:::checklist
- No **início e no fim** de sub-rotinas, módulos de função e métodos.
- No **fim** de includes e de definições de estruturas.
- Em **classes globais**: novos atributos e métodos, e métodos *pre*, *post* e *overwrite* para os métodos existentes.
- Em **módulos de função**: novos parâmetros opcionais na interface.
:::

No editor do SAP GUI, **Edit › Enhancement Operations › Show Implicit Enhancement Options** mostra os pontos disponíveis.

:::aviso
Um ponto implícito não é um contrato. A SAP pode mudar o corpo de um método ou a ordem das instruções em qualquer nota, e a sua ampliação, que dependia de variáveis internas, passa a se comportar de outro jeito sem nenhum erro de ativação. Use pontos implícitos só quando não houver BAdI nem ponto explícito, e documente a dependência.
:::

## Ampliando dados {ancora="Dados" icone="table-view"}

| Técnica | O que permite |
| --- | --- |
| **Append structure** | Acrescentar campos (`ZZ…` ou `YY…`) a uma tabela ou estrutura standard, sem alterá-la |
| **Customizing include** | Um include `CI_…` previsto pela SAP na tabela, que o cliente cria e preenche |
| **Extensão de domínio** | Acrescentar valores fixos a um domínio standard |
| **Extensão de CDS view** | `extend view entity`, visto em [Anotações e meta objetos](#meta-objetos) |

Os campos acrescentados precisam de um prefixo do cliente, para não colidirem com campos que a SAP venha a criar.

## Encontrando ampliações {ancora="Como encontrar" icone="search"}

:::checklist
- **Customer exits**: na SMOD, procure pelo pacote da transação. No depurador, um breakpoint no comando `CALL CUSTOMER-FUNCTION` para em todos os pontos.
- **BAdIs**: breakpoint no método `CL_EXITHANDLER=>GET_INSTANCE` (clássicas) ou no comando `GET BADI` (novas).
- **Enhancement spots**: na SE80, o **Enhancement Information System** lista spots, pontos e implementações.
- **No ADT**: implementações de ampliações aparecem com um marcador na margem do editor, e :kbd[F2] sobre ele mostra o conteúdo.
:::

No ABAP Cloud nada disto está disponível, com exceção das BAdIs liberadas. A extensibilidade passa a depender de pontos que a SAP libera de forma explícita, tema de [Extensibilidade no ABAP Cloud](#extensibilidade-cloud).

:::documentacao
- [ABAP Keyword Documentation: enhancements com BAdIs](https://help.sap.com/docs/abap-cloud/abap-keyword/enhancements-using-badis)
- [ABAP Keyword Documentation: ENHANCEMENT-POINT](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapenhancement-point.htm)
- [SAP Help Portal: ABAP Platform](https://help.sap.com/docs/ABAP_PLATFORM_NEW?locale=en-US)
:::
