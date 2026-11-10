---
titulo: AMDP
subtitulo: Procedimentos e funções de banco em SQLScript, gerenciados pelo ABAP.
duracao: "1 h"
icone: database
objetivos:
  - Explicar o que é um AMDP e quando ele se justifica
  - Declarar e implementar um método AMDP
  - Tratar o mandante de forma explícita
  - Implementar uma CDS table function
  - Listar as restrições de um AMDP
palavras_chave: amdp if_amdp_marker_hdb by database procedure function sqlscript hdb options read-only using table function cds session client window function rank
---

## O que é um AMDP {ancora="Conceito" icone="database"}

**AMDP** (*ABAP Managed Database Procedure*) é um método de classe cujo corpo não é ABAP: é **SQLScript**, a linguagem de procedimentos do SAP HANA. O servidor ABAP cria o procedimento no banco na primeira chamada e o mantém sincronizado com a classe. Para quem chama, é um método comum; para o transporte, é só mais uma classe.

A ordem de escolha para levar lógica ao banco é sempre esta:

1. **ABAP SQL**, quando uma consulta resolve. Veja [Code pushdown em ABAP SQL](#sql-pushdown).
2. **CDS view entities**, quando a consulta será reutilizada ou exposta. Veja [Code pushdown em CDS](#cds-pushdown).
3. **AMDP**, só quando as duas anteriores não expressam a lógica: funções de janela encadeadas, lógica procedural sobre conjuntos, funções específicas do HANA.

:::aviso
Um AMDP amarra o código ao SAP HANA, não passa pelo buffer de tabelas e não aplica automaticamente nem o mandante nem os controles de acesso de CDS. É a opção mais poderosa e a que mais exige cuidado.
:::

## Um procedimento AMDP {ancora="Procedimento" icone="source-code"}

```abap title="ZCL_FLIGHT_AMDP · definição"
CLASS zcl_flight_amdp DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_amdp_marker_hdb.            " marca a classe como AMDP para HANA

    TYPES: BEGIN OF ty_ranking,
             carrier_id    TYPE /dmo/carrier_id,
             connection_id TYPE /dmo/connection_id,
             occupancy     TYPE p LENGTH 8 DECIMALS 2,
             position      TYPE i,
           END OF ty_ranking,
           ty_rankings TYPE STANDARD TABLE OF ty_ranking WITH EMPTY KEY.

    METHODS rank_connections
      IMPORTING VALUE(i_client)  TYPE sy-mandt
      EXPORTING VALUE(e_ranking) TYPE ty_rankings
      RAISING   cx_amdp_error.
ENDCLASS.
```

```abap title="ZCL_FLIGHT_AMDP · implementação em SQLScript"
CLASS zcl_flight_amdp IMPLEMENTATION.
  METHOD rank_connections BY DATABASE PROCEDURE
                          FOR HDB
                          LANGUAGE SQLSCRIPT
                          OPTIONS READ-ONLY
                          USING /dmo/flight.

    -- Ocupação por conexão, em uma variável de tabela
    totals = SELECT carrier_id, connection_id,
                    CAST( SUM( seats_occupied ) * 100 / SUM( seats_max ) AS DECIMAL(15,2) ) AS occupancy
               FROM "/DMO/FLIGHT"
              WHERE client = :i_client
              GROUP BY carrier_id, connection_id;

    -- Posição de cada conexão dentro da sua companhia
    e_ranking = SELECT carrier_id, connection_id, occupancy,
                       CAST( RANK ( ) OVER ( PARTITION BY carrier_id
                                             ORDER BY occupancy DESC ) AS INTEGER ) AS position
                  FROM :totals
                 ORDER BY carrier_id, position;
  ENDMETHOD.
ENDCLASS.
```

:::termos
- `IF_AMDP_MARKER_HDB` — Interface de marcação. Sem ela a classe não pode ter métodos AMDP.
- `BY DATABASE PROCEDURE` — O corpo é um procedimento de banco. Para funções, `BY DATABASE FUNCTION`.
- `FOR HDB LANGUAGE SQLSCRIPT` — Banco e linguagem. Na prática, sempre HANA e SQLScript.
- `OPTIONS READ-ONLY` — O procedimento só lê. É obrigatório no ABAP Cloud.
- `USING` — Lista todas as tabelas, views e outros AMDPs usados no corpo. O que não estiver aqui não pode ser acessado.
- `VALUE( )` — Todos os parâmetros são por valor e têm tipo elementar ou de tabela. Não existe `RETURNING` em procedimentos.
:::

Dentro do corpo valem as regras do SQLScript: comentários com `--`, parâmetros e variáveis lidos com dois-pontos (`:i_client`, `:totals`), nomes de tabelas com namespace entre aspas e em maiúsculas.

```abap title="Chamando"
TRY.
    NEW zcl_flight_amdp( )->rank_connections(
      EXPORTING i_client  = sy-mandt
      IMPORTING e_ranking = DATA(ranking) ).
  CATCH cx_amdp_error INTO DATA(error).
    out->write( error->get_text( ) ).
ENDTRY.
```

## Mandante {ancora="Mandante" icone="shield"}

ABAP SQL acrescenta o filtro de mandante sozinho. SQLScript **não**. No exemplo, o mandante entra como parâmetro e é aplicado no `WHERE`; esquecer disso faz o procedimento ler dados de todos os mandantes.

Em versões recentes, e obrigatoriamente no ABAP Cloud, o método é declarado como seguro quanto ao mandante e lê apenas objetos que já fazem o filtro, como CDS view entities:

```abap title="AMDP seguro quanto ao mandante"
METHODS rank_connections
  AMDP OPTIONS READ-ONLY
               CDS SESSION CLIENT DEPENDENT
  EXPORTING VALUE(e_ranking) TYPE ty_rankings
  RAISING   cx_amdp_error.
```

## CDS table functions {ancora="Table function" icone="detail-view"}

Um AMDP também pode ser a implementação de uma **CDS table function**: uma entidade CDS cujo resultado vem de SQLScript. Ela é consumida em ABAP SQL e em outras views como qualquer entidade, o que integra o AMDP ao modelo de dados.

```cds title="ZI_ConnectionRanking"
@EndUserText.label: 'Ranking de conexões por ocupação'
@ClientHandling.type: #CLIENT_DEPENDENT
define table function ZI_ConnectionRanking
  returns
  {
    client        : abap.clnt;
    carrier_id    : /dmo/carrier_id;
    connection_id : /dmo/connection_id;
    occupancy     : abap.dec(15,2);
    position      : abap.int4;
  }
  implemented by method zcl_flight_amdp=>connection_ranking;
```

```abap title="Método da table function"
" Na definição da classe:
CLASS-METHODS connection_ranking FOR TABLE FUNCTION ZI_ConnectionRanking.

" Na implementação:
METHOD connection_ranking BY DATABASE FUNCTION FOR HDB
                          LANGUAGE SQLSCRIPT
                          OPTIONS READ-ONLY
                          USING /dmo/flight.
  RETURN SELECT client, carrier_id, connection_id,
                CAST( SUM( seats_occupied ) * 100 / SUM( seats_max ) AS DECIMAL(15,2) ) AS occupancy,
                CAST( RANK ( ) OVER ( PARTITION BY client, carrier_id
                                      ORDER BY SUM( seats_occupied ) * 100 / SUM( seats_max ) DESC ) AS INTEGER ) AS position
           FROM "/DMO/FLIGHT"
          GROUP BY client, carrier_id, connection_id;
ENDMETHOD.
```

```abap title="Consumo em ABAP SQL"
SELECT carrier_id, connection_id, occupancy
  FROM ZI_ConnectionRanking
  WHERE position = 1
  INTO TABLE @DATA(best_connections).
```

## Restrições e cuidados {ancora="Restrições" icone="quality-issue"}

:::checklist
- Só roda em SAP HANA. Não há alternativa para outros bancos.
- A sintaxe do corpo é verificada pelo banco, na ativação. Erros de SQLScript aparecem como erros de ativação da classe.
- O depurador ABAP não entra no corpo. Use o **AMDP debugger** do ADT, com breakpoints próprios.
- Erros de execução chegam como exceções `CX_AMDP_ERROR`, que devem estar declaradas em `RAISING`.
- Controles de acesso de CDS (DCL) não se aplicam ao que o procedimento lê direto das tabelas.
- Testes unitários precisam de dados reais ou de dublês de banco, o que encarece a manutenção.
:::

:::documentacao
- [ABAP Keyword Documentation: AMDP](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenamdp.htm)
- [ABAP Data Models (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-data-models/abap-data-models?locale=en-US)
- [Cheat sheet: AMDP](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/12_AMDP.md)
:::
