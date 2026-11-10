---
titulo: Referência rápida
subtitulo: Sintaxe essencial de ABAP e de CDS em uma página, com link para a lição de cada item.
icone: syntax
cor: 6
---

<!--
  A tabela "Sintaxe" alimenta o filtro da página.
  Colunas: Categoria (vira um botão de filtro) | Sintaxe (entre crases) | O que faz | Lição (nome do arquivo da lição, sem número nem .md).
  Linhas da categoria CDS são realçadas como CDS; as demais, como ABAP.
-->

## Sintaxe {ancora="Sintaxe" icone="syntax"}

| Categoria | Sintaxe | O que faz | Lição |
| --- | --- | --- | --- |
| Dados | `DATA name TYPE type [VALUE val].` | Declara variável. | tecnicas-basicas |
| Dados | `DATA(name) = expr.` | Declaração inline com tipo deduzido. | tecnicas-basicas |
| Dados | `TYPES ty TYPE p LENGTH 8 DECIMALS 2.` | Declara tipo local. | tecnicas-basicas |
| Dados | `CONSTANTS c TYPE i VALUE 10.` | Declara constante. | tecnicas-basicas |
| Dados | `CONV type( expr )` | Converte para o tipo indicado. | tipos-conversoes |
| Dados | `EXACT type( expr )` | Converte sem perdas ou lança exceção. | tipos-conversoes |
| Dados | `VALUE #( comp = val … )` | Constrói estrutura ou tabela. | estruturas |
| Dados | `CORRESPONDING #( src [MAPPING a = b] [EXCEPT c] )` | Copia componentes de mesmo nome. | estruturas |
| Controle | `IF … ELSEIF … ELSE … ENDIF.` | Condição. | tecnicas-basicas |
| Controle | `CASE x. WHEN … WHEN OTHERS. ENDCASE.` | Desvio por valor. | tecnicas-basicas |
| Controle | `DO n TIMES. … ENDDO.` | Repetição contada (sy-index). | tecnicas-basicas |
| Controle | `WHILE cond. … ENDWHILE.` | Repetição condicional. | tecnicas-basicas |
| Controle | `xsdbool( cond )` | Condição como abap_bool. | tecnicas-basicas |
| OO | `CLASS lcl DEFINITION. … ENDCLASS.` | Define classe. | classes-locais |
| OO | `DATA(obj) = NEW lcl( p = v ).` | Cria instância. | classes-locais |
| OO | `obj->meth( ) / lcl=>static( )` | Chama método de instância / estático. | classes-locais |
| OO | `CLASS lcl2 DEFINITION INHERITING FROM lcl.` | Herança. | oo-avancado |
| OO | `METHODS m REDEFINITION.` | Redefine método herdado. | oo-avancado |
| OO | `INTERFACES lif.` | Implementa interface. | oo-avancado |
| OO | `CAST type( ref ) / IS INSTANCE OF` | Downcast e verificação de tipo. | oo-avancado |
| SQL | `SELECT SINGLE FROM t FIELDS … WHERE … INTO @DATA(wa).` | Lê uma linha. | ler-dados |
| SQL | `SELECT FROM t FIELDS … INTO TABLE @DATA(itab).` | Lê várias linhas. | ler-dados |
| SQL | `… ORDER BY f … UP TO n ROWS.` | Ordena e limita. | ler-dados |
| SQL | `COUNT( * ), SUM( ), AVG( ), MIN( ), MAX( ) … GROUP BY … HAVING` | Agregações no banco. | sql-pushdown |
| SQL | `INNER JOIN / LEFT OUTER JOIN … ON a~f = b~f` | Junções. | sql-pushdown |
| SQL | `CASE WHEN … THEN … ELSE … END` | Expressão condicional. | sql-pushdown |
| SQL | `\_assoc-campo` | Expressão de caminho em ABAP SQL. | associacoes |
| Tabelas | `TYPE STANDARD\|SORTED\|HASHED TABLE OF … WITH … KEY` | Declara tabela interna. | tabelas-internas |
| Tabelas | `APPEND wa TO itab. / INSERT wa INTO TABLE itab.` | Insere linhas. | tabelas-internas |
| Tabelas | `READ TABLE itab INTO wa WITH KEY …` | Lê linha (sy-subrc). | tabelas-internas |
| Tabelas | `itab[ key = val ]` | Expressão de tabela (exceção se não achar). | tabelas-internas |
| Tabelas | `LOOP AT itab ASSIGNING FIELD-SYMBOL(<fs>) WHERE …` | Percorre sem cópia. | tabelas-internas |
| Tabelas | `line_exists( itab[ … ] ) / lines( itab )` | Existe? / quantas linhas. | tabelas-internas |
| Tabelas | `VALUE #( FOR x IN itab ( … ) )` | Constrói tabela a partir de outra. | tabelas-internas |
| Tabelas | `WITH NON-UNIQUE SORTED KEY k COMPONENTS …` | Chave secundária. | performance-tabelas |
| Texto | `\|texto { expr WIDTH = 10 ALIGN = RIGHT }\|` | String template. | strings |
| Texto | `condense( ) / to_upper( ) / strlen( )` | Funções de texto. | strings |
| Texto | `substring( val = s off = o len = l )` | Parte do texto (off baseado em 0). | strings |
| Texto | `find( ) / replace( ) / segment( )` | Busca, troca, separa. | strings |
| Texto | ``matches( val = s pcre = `…` )`` | Teste com expressão regular. | strings |
| Exceções | `TRY. … CATCH cx INTO DATA(e). … CLEANUP. … ENDTRY.` | Trata exceções. | excecoes |
| Exceções | `RAISE EXCEPTION NEW zcx( … ).` | Lança exceção. | excecoes |
| RAP | `READ ENTITIES OF bo ENTITY e … RESULT DATA(r).` | Lê pelo BO. | business-objects |
| RAP | `MODIFY ENTITIES OF bo ENTITY e UPDATE FIELDS ( f ) WITH …` | Altera no buffer. | business-objects |
| RAP | `COMMIT ENTITIES.` | Persiste o buffer. | business-objects |
| Sistema | `AUTHORITY-CHECK OBJECT 'obj' ID 'campo' FIELD val.` | Verifica autorização. | autorizacoes |
| CDS | `define view entity Z… as select from t { key … }` | View entity. | cds-basico |
| CDS | `association [0..*] to Z… as _a on $projection.k = _a.k` | Associação. | associacoes |
| CDS | `define table z… { key client : abap.clnt not null; … }` | Tabela de banco. | tabelas-bd |
| CDS | `annotate entity Z… with { @UI.lineItem: [{ position: 10 }] campo; }` | Metadata extension. | meta-objetos |
| Testes | `CLASS ltc DEFINITION FOR TESTING DURATION SHORT RISK LEVEL HARMLESS.` | Classe de teste. | analise-testes |
| Dados | `sy-subrc / sy-tabix / sy-index / sy-dbcnt` | Retorno, índice de linha, volta do laço, linhas no banco. | variaveis-do-sistema |
| Dados | `cl_abap_context_info=>get_system_date( )` | Data do sistema no ABAP Cloud. | variaveis-do-sistema |
| Controle | `xsdbool( cond ) / contains( val = s sub = t )` | Funções lógicas. | funcoes-embutidas |
| Dados | `round( val = x dec = 2 ) / ceil( ) / floor( ) / trunc( )` | Arredondamento. | funcoes-embutidas |
| Dados | `utclong_current( ) / utclong_add( ) / utclong_diff( )` | Carimbos de tempo UTC. | funcoes-embutidas |
| Tabelas | `lines( itab ) / line_index( itab[ … ] )` | Quantidade e índice de linhas. | funcoes-embutidas |
| OO | `CLASS zcl DEFINITION PUBLIC FINAL CREATE PRIVATE.` | Cabeçalho de classe global. | classes-globais |
| OO | `"! @parameter p \| texto` | ABAP Doc. | comentarios-e-documentacao |
| Sistema | `FORM f USING a CHANGING b. … ENDFORM. / PERFORM f` | Sub-rotina (obsoleta). | modularizacao |
| Sistema | `CALL FUNCTION 'Z_FM' EXPORTING … IMPORTING … EXCEPTIONS e = 1.` | Chama módulo de função. | function-modules |
| Sistema | `CALL FUNCTION 'Z_FM' IN UPDATE TASK … / COMMIT WORK.` | Registra gravação e encerra a SAP LUW. | luw |
| Sistema | `ROLLBACK WORK.` | Descarta os registros da SAP LUW. | luw |
| Sistema | `cl_abap_tx=>modify( ) / cl_abap_tx=>save( )` | Fases da SAP LUW controlada. | luw |
| Sistema | `SUBMIT prog VIA JOB name NUMBER n AND RETURN.` | Step de um job em background. | background-jobs |
| Sistema | `cl_apj_rt_api=>schedule_job( … )` | Agenda application job. | application-jobs |
| Sistema | `CALL FUNCTION 'Z_FM' STARTING NEW TASK t … CALLING m ON END OF TASK` | RFC assíncrono. | programacao-paralela |
| Sistema | `CALL FUNCTION 'Z_FM' DESTINATION dest …` | RFC síncrono. | rfc-bapi-idoc |
| Sistema | `cl_web_http_client_manager=>create_by_http_destination( d )` | Cliente HTTP no ABAP Cloud. | http-odata-eventos |
| Sistema | `GET BADI b FILTERS f = v. / CALL BADI b->m …` | Chama BAdI. | badis |
| Sistema | `OPEN DATASET f FOR OUTPUT IN TEXT MODE ENCODING UTF-8.` | Abre arquivo no servidor. | interface-de-arquivos |
| Sistema | `EXPORT a = b TO DATA BUFFER x. / IMPORT … FROM DATA BUFFER x.` | Data cluster. | interface-de-arquivos |
| Sistema | `CALL TRANSFORMATION id SOURCE a = b RESULT XML x.` | Serializa em XML ou JSON. | xml-e-json |
| Exceções | `MESSAGE e001(zmsg) WITH v1 INTO DATA(text).` | Monta mensagem sem exibir. | mensagens-e-logs |
| Exceções | `RAISE EXCEPTION TYPE zcx MESSAGE e001(zmsg) WITH v1.` | Exceção com mensagem. | mensagens-e-logs |
| Exceções | `ASSERT cond.` | Encerra o programa se a condição for falsa. | erros-visao-geral |
| SQL | `METHOD m BY DATABASE PROCEDURE FOR HDB LANGUAGE SQLSCRIPT OPTIONS READ-ONLY USING t.` | Método AMDP. | amdp |
| SQL | `SELECT … FOR ALL ENTRIES IN @itab WHERE f = @itab-f` | Leitura guiada por tabela interna. | performance-consultas |
| CDS | `@Analytics.dataCategory: #CUBE / @Aggregation.default: #SUM` | Cubo e medida analítica. | modelos-analiticos |
| CDS | `extend view entity I_… with { … }` | Extensão de view liberada. | extensibilidade-cloud |
| RAP | `RAISE ENTITY EVENT bo~Evento FROM VALUE #( … ).` | Dispara evento de negócio. | http-odata-eventos |
| Testes | `cl_abap_unit_assert=>assert_equals( exp = … act = … ).` | Asserção. | analise-testes |

## Glossário {ancora="Glossário" icone="course-book"}

| Termo | Definição |
| --- | --- |
| ADT | ABAP Development Tools: plug-ins do Eclipse para desenvolver ABAP. |
| ABAP Cloud | Modelo de desenvolvimento com linguagem restrita a APIs liberadas, para extensões seguras para upgrade. |
| Clean core | Princípio de manter o núcleo SAP sem modificações, estendendo apenas por pontos liberados. |
| Pacote | Contêiner de objetos de desenvolvimento; define transporte e visibilidade. |
| Host variable | Variável ABAP usada dentro do ABAP SQL, escapada com @. |
| Work area | Estrutura que recebe uma cópia de uma linha de tabela interna. |
| Field-symbol | Ponteiro nomeado para um objeto de dados existente, ex.: <fs>. |
| EML | Entity Manipulation Language: comandos ABAP para ler e alterar business objects RAP. |
| Buffer transacional | Memória onde o RAP guarda alterações até o commit. |
| RAP | ABAP RESTful Application Programming Model, para serviços OData e apps Fiori. |
| BDEF | Behavior definition: descreve operações e regras de um business object. |
| Service binding | Liga uma service definition a um protocolo (OData V2/V4, UI ou API). |
| CDS | Core Data Services: linguagem para modelos de dados semânticos no banco. |
| VDM | Virtual Data Model: conjunto de CDS views padronizadas do S/4HANA. |
| DCL | Data Control Language: access controls que filtram linhas de CDS por autorização. |
| ATC | ABAP Test Cockpit: ferramenta de verificações estáticas. |
| Code pushdown | Executar cálculos no banco em vez do servidor de aplicação. |
| SAP LUW | Unidade lógica de trabalho: alterações confirmadas ou desfeitas juntas. |
| LUW de banco | Unidade de trabalho do banco, encerrada por commit ou rollback; termina a cada passo de diálogo. |
| AS ABAP | Servidor de aplicação ABAP: executa os programas e gerencia sessões, memória e bloqueios. |
| Work process | Processo do servidor que executa programas ABAP: diálogo, atualização, background, spool. |
| Dispatcher | Componente que enfileira as requisições e as entrega a um work process livre. |
| Contrato de liberação | Garantia de estabilidade de um objeto SAP para um uso: C0 estender, C1 usar, C2 API remota. |
| Módulo de função | Procedimento global de um grupo de funções; base de RFC, BAPIs e módulos de update. |
| RFC | Remote Function Call: chamada de um módulo de função em outro sistema. |
| BAPI | Módulo RFC publicado como método estável de um objeto de negócio. |
| IDoc | Documento intermediário para troca assíncrona de dados de negócio entre sistemas. |
| BAdI | Business Add-In: ponto de ampliação baseado em interface, implementado por uma classe. |
| AMDP | Método de classe implementado em SQLScript e executado no SAP HANA. |
| Application job | Processamento em background agendável no ABAP Cloud, definido por classe, catalog entry e template. |
| bgPF | background Processing Framework: execução assíncrona e confiável, disparada após o commit. |
| Communication arrangement | Configuração que liga um cenário de comunicação a um sistema parceiro no ABAP Cloud. |

:::documentacao
- [ABAP Keyword Documentation · ABAP Cloud](https://help.sap.com/docs/abap-cloud/abap-keywords/abap-keyword-documentation?locale=en-US)
- [ABAP Keyword Documentation · versão mais recente](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=index.htm)
- [ABAP Cloud](https://help.sap.com/docs/abap-cloud?locale=en-US)
- [SAP BTP ABAP environment](https://help.sap.com/docs/sap-btp-abap-environment?locale=en-US)
- [ABAP Concepts: Controlled SAP LUW](https://help.sap.com/docs/abap-cloud/abap-concepts/controlled-sap-luw?locale=en-US)
- [ABAP Concepts: Background Processing Framework](https://help.sap.com/docs/abap-cloud/abap-concepts/background-processing-framework?locale=en-US)
- [ABAP Data Models](https://help.sap.com/docs/abap-cloud/abap-data-models/abap-data-models?locale=en-US)
- [ABAP Analytics](https://help.sap.com/docs/abap-cloud/abap-analytics/abap-analytics?locale=en-US)
- [ABAP RESTful Application Programming Model](https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model?locale=en-US)
- [ABAP Integration and Connectivity](https://help.sap.com/docs/abap-cloud/abap-integration-connectivity/abap-integration-and-connectivity?locale=en-US)
- [ABAP Development Tools: User Guide](https://help.sap.com/docs/abap-cloud/abap-development-tools-user-guide/about-abap-development-tools-user-guide?locale=en-US)
- [ABAP Development Tools: atalhos de teclado](https://help.sap.com/docs/abap-cloud/abap-development-tools-user-guide/keyboard-shortcuts-for-abap-development?locale=en-US)
- [ABAP Development Tools para Visual Studio Code](https://help.sap.com/docs/abap-cloud/abap-development-tools-for-visual-studio-code/abap-development-tools-for-visual-studio-code?locale=en-US)
- [ABAP Programming Model for SAP Fiori](https://help.sap.com/docs/ABAP_PLATFORM_NEW/cc0c305d2fab47bd808adcad3ca7ee9d/3b77569ca8ee4226bdab4fcebd6f6ea6.html?locale=en-US)
- [ABAP Platform · tópico 4355509b](https://help.sap.com/docs/ABAP_PLATFORM_NEW/7bfe8cdcfbb040dcb6702dada8c3e2f0/4355509bf8a75f6be10000000a1553f6.html?locale=en-US)
- [ABAP Platform · tópico efd94b78](https://help.sap.com/docs/ABAP_PLATFORM_NEW/bd833c8355f34e96a6e83096b38bf192/efd94b78ebf811d295b100a0c94260a5.html?locale=en-US)
- [ABAP Platform · tópico 485bc57c](https://help.sap.com/docs/ABAP_PLATFORM_NEW/753088fc00704d0a80e7fbd6803c8adb/485bc57cd004501ee10000000a421937.html?locale=en-US)
- [ABAP Platform · tópico e5ea9085](https://help.sap.com/docs/ABAP_PLATFORM_NEW/aa7fc5c3c1524844b811735b9373252a/e5ea9085cfe2494faacae415ff8131da.html?locale=en-US)
- [ABAP Platform · tópico 49325d4e](https://help.sap.com/docs/ABAP_PLATFORM_NEW/f146e75588924fa4987b6c8f1a7a8c7e/49325d4ee93934ffe10000000a421937.html?locale=en-US)
- [SAP Support Content · ABAP](https://help.sap.com/docs/SUPPORT_CONTENT/abap/3353524058.html?locale=en-US)
- [ABAP cheat sheets (SAP-samples, GitHub)](https://github.com/SAP-samples/abap-cheat-sheets)
- [SAP Learning: Acquiring Core ABAP Skills](https://learning.sap.com/learning-journeys/acquire-core-abap-skills)
:::
