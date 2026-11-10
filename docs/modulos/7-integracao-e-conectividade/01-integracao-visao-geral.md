---
titulo: Integração no ABAP
subtitulo: Direções, estilos, protocolos e a configuração de comunicação clássica e no ABAP Cloud.
duracao: "50 min"
icone: connected
objetivos:
  - Classificar uma integração por direção e por estilo
  - Comparar os protocolos disponíveis
  - Localizar a configuração de comunicação no sistema clássico
  - Explicar cenário, sistema e acordo de comunicação no ABAP Cloud
  - Escolher a tecnologia para um caso de integração
palavras_chave: integração inbound outbound rfc http odata soap idoc eventos sm59 sicf soamanager communication scenario arrangement system destination cloud connector
---

## Direção e estilo {ancora="Conceito" icone="connected"}

Toda integração responde a duas perguntas.

:::::colunas{n="2"}
::::cartao
### Quem começa a conversa?

:::termos
- **Inbound** — Outro sistema chama o sistema ABAP. O ABAP **oferece** um serviço.
- **Outbound** — O código ABAP chama outro sistema. O ABAP **consome** um serviço.
:::
::::

::::cartao
### Quem espera a resposta?

:::termos
- **Síncrono** — O chamador fica parado até a resposta. Simples, mas os dois lados precisam estar no ar.
- **Assíncrono** — A mensagem é entregue a uma fila e processada depois. Mais robusto, mais difícil de acompanhar.
:::
::::
:::::

## Protocolos {ancora="Protocolos" icone="list"}

| Protocolo | Estilo | Formato | Uso típico |
| --- | --- | --- | --- |
| **RFC** | Síncrono ou assíncrono | Binário, proprietário da SAP | Entre sistemas ABAP; BAPIs |
| **HTTP / REST** | Síncrono | JSON ou XML | APIs de terceiros e serviços próprios simples |
| **OData** | Síncrono | JSON sobre HTTP, com metadados | APIs SAP, apps Fiori, serviços RAP |
| **SOAP** | Síncrono ou assíncrono | XML com contrato WSDL | Serviços corporativos e integrações mais antigas |
| **IDoc** | Assíncrono | Documento estruturado em segmentos | Troca de documentos de negócio, EDI |
| **Eventos de negócio** | Assíncrono | Mensagem em um broker (CloudEvents) | Avisar que algo aconteceu, sem conhecer quem ouve |

RFC, BAPI e IDoc são o assunto da [próxima lição](#rfc-bapi-idoc); HTTP, OData e eventos, da [seguinte](#http-odata-eventos).

## Configuração no sistema clássico {ancora="Clássico" icone="settings"}

Em sistemas com SAP GUI, o código referencia um **nome lógico** e a configuração técnica fica em transações de administração.

| Transação | Configura |
| --- | --- |
| **SM59** | **Destinos RFC**: para onde vai uma chamada. Tipo 3 (sistema ABAP), G (HTTP para sistema externo), H (HTTP para sistema ABAP), T (programa externo) |
| **SICF** | Serviços HTTP de **entrada**: a árvore de caminhos que o ICM atende |
| **SOAMANAGER** | Web services SOAP: endpoints de entrada e portas lógicas de saída |
| **WE20, WE21** | IDoc: perfis de parceiro e portas |
| **STRUST** | Certificados para TLS e assinatura |

```abap title="Código clássico: só o nome do destino"
CALL FUNCTION 'Z_FLIGHT_GET_FREE_SEATS'
  DESTINATION 'ERP_PRD'              " definido na SM59
  EXPORTING  iv_carrier_id = 'LH'
  IMPORTING  ev_free_seats = free_seats
  EXCEPTIONS system_failure = 1 communication_failure = 2 OTHERS = 3.
```

## Gestão de comunicação no ABAP Cloud {ancora="ABAP Cloud" icone="cloud"}

No ABAP Cloud não há SM59 nem SICF. O desenvolvedor entrega um **contrato** e o administrador o preenche em apps Fiori. São quatro objetos.

:::termos
- **Communication scenario** — Objeto de desenvolvimento. Reúne os serviços de **entrada** e de **saída** de um caso de integração e os métodos de autenticação aceitos.
- **Communication system** — Criado pelo administrador. Representa o sistema parceiro: host, porta e credenciais para chamadas de saída.
- **Communication user** — Usuário técnico que o parceiro usa nas chamadas de **entrada**.
- **Communication arrangement** — Liga um cenário a um sistema. É aqui que a integração passa a existir em runtime.
:::

Para chamadas de saída, o desenvolvedor cria ainda um **outbound service** (HTTP, RFC ou SOAP) e o inclui no cenário. O código não conhece URL nem senha: pede o destino pelo nome do cenário.

```abap title="Destino por communication arrangement"
DATA(destination) = cl_http_destination_provider=>create_by_comm_arrangement(
                      comm_scenario = 'ZFLIGHT_WEATHER'
                      service_id    = 'ZFLIGHT_WEATHER_REST' ).
```

:::nota
No SAP BTP, o destino também pode vir do **serviço Destination** da subconta (`create_by_cloud_destination`). Para alcançar sistemas on-premise a partir da nuvem, o tráfego passa pelo **Cloud Connector**, um túnel iniciado de dentro da rede do cliente.
:::

## Segurança {ancora="Segurança" icone="shield"}

:::checklist
- **Autenticação.** Usuário e senha técnicos, certificado de cliente ou OAuth 2.0. Em cenários novos, prefira OAuth ou certificado.
- **Identidade do usuário.** Com *principal propagation*, a chamada chega ao outro sistema em nome do usuário real, e as autorizações dele valem lá.
- **Autorização.** Uma chamada de entrada roda com o usuário de comunicação. O que ele pode fazer vem do cenário, não de um perfil genérico.
- **APIs estáveis.** Consuma apenas APIs publicadas: no ABAP, as que têm contrato C2; do lado SAP, as listadas no SAP Business Accelerator Hub.
:::

## Qual tecnologia usar {ancora="Escolha" icone="compare"}

| Situação | Tecnologia |
| --- | --- |
| App Fiori ou parceiro lendo e gravando dados de negócio | Serviço **OData** sobre RAP |
| Chamar uma API REST de terceiros | Cliente **HTTP** com destino configurado |
| Dois sistemas ABAP clássicos trocando chamadas | **RFC**, por BAPIs quando existirem |
| Enviar documentos de negócio a parceiros, com reprocessamento | **IDoc** ou mensagens assíncronas |
| Avisar outros sistemas de uma mudança, sem acoplamento | **Evento de negócio** |
| Integrar vários sistemas com mapeamento e roteamento | Middleware, como o SAP Integration Suite, falando com o ABAP por um dos protocolos acima |

:::documentacao
- [ABAP Integration and Connectivity (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-integration-connectivity/abap-integration-and-connectivity?locale=en-US)
- [SAP BTP ABAP environment (SAP Help Portal)](https://help.sap.com/docs/sap-btp-abap-environment?locale=en-US)
- [SAP Business Accelerator Hub](https://api.sap.com/)
:::
