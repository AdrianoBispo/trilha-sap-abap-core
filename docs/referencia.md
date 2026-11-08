---
titulo: Referência rápida
subtitulo: Sintaxe essencial do ABAP Cloud e de CDS em uma página, com link para a lição de cada item.
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
| Segurança | `AUTHORITY-CHECK OBJECT 'obj' ID 'campo' FIELD val.` | Verifica autorização. | autorizacoes |
| CDS | `define view entity Z… as select from t { key … }` | View entity. | cds-basico |
| CDS | `association [0..*] to Z… as _a on $projection.k = _a.k` | Associação. | associacoes |
| CDS | `define table z… { key client : abap.clnt not null; … }` | Tabela de banco. | tabelas-bd |
| CDS | `annotate entity Z… with { @UI.lineItem: [{ position: 10 }] campo; }` | Metadata extension. | meta-objetos |
| Testes | `CLASS ltc DEFINITION FOR TESTING DURATION SHORT RISK LEVEL HARMLESS.` | Classe de teste. | analise-testes |
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

:::documentacao
- [ABAP Keyword Documentation · ABAP Cloud](https://help.sap.com/doc/abapdocu_cp_index_htm/CLOUD/en-US/index.htm)
- [ABAP Keyword Documentation · versão mais recente](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=index.htm)
- [ABAP cheat sheets (SAP-samples, GitHub)](https://github.com/SAP-samples/abap-cheat-sheets)
- [SAP Learning: Acquiring Core ABAP Skills](https://learning.sap.com/learning-journeys/acquire-core-abap-skills)
:::
