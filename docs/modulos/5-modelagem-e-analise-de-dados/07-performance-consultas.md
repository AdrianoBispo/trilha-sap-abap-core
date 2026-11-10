---
titulo: Performance de consultas
subtitulo: As regras de ouro do acesso ao banco, os erros mais comuns e as ferramentas para medir.
duracao: "1 h"
icone: performance
objetivos:
  - Aplicar as cinco regras de ouro do acesso ao banco
  - Eliminar SELECT dentro de loop
  - Usar FOR ALL ENTRIES sem cair nas armadilhas
  - Reconhecer o que torna uma CDS view lenta
  - Medir com SQL trace e plano de execução
palavras_chave: performance select em loop for all entries join índice sql trace st05 explain plan buffer tabela cds view stack filtro pushdown atc
---

## Cinco regras de ouro {ancora="Regras de ouro" icone="performance"}

Em uma aplicação de negócio, a maior parte do tempo de resposta costuma estar no acesso ao banco. As regras abaixo são antigas e continuam valendo no SAP HANA.

| Regra | Na prática |
| --- | --- |
| **1. Poucas linhas** | Filtre no `WHERE`, não no ABAP. Use `UP TO n ROWS` quando só precisa de algumas. |
| **2. Poucas colunas** | Liste os campos. Nunca `SELECT *` por comodidade. |
| **3. Poucos acessos** | Uma consulta para muitas linhas, em vez de muitas consultas de uma linha. |
| **4. Busca barata** | Condições sobre campos de chave ou de índice, sem funções aplicadas à coluna. |
| **5. Pouca carga no banco** | Não leia duas vezes a mesma coisa; aproveite o buffer de tabelas para dados de configuração. |

:::nota
No HANA os dados ficam em **colunas**. Ler uma coluna a mais custa de verdade, e por isso a regra 2 ganhou peso. Agregações e filtros, por outro lado, ficaram muito mais baratos, o que favorece o code pushdown.
:::

## SELECT dentro de loop {ancora="SELECT em loop" icone="quality-issue"}

É o problema de performance mais frequente em código ABAP: uma consulta por linha de uma tabela interna. Com mil linhas, são mil idas ao banco.

```abap title="Antes: uma consulta por voo"
LOOP AT flights ASSIGNING FIELD-SYMBOL(<flight>).
  SELECT SINGLE name FROM /dmo/carrier
    WHERE carrier_id = @<flight>-carrier_id
    INTO @<flight>-carrier_name.
ENDLOOP.
```

```abap title="Depois: um join"
SELECT f~carrier_id, f~connection_id, f~flight_date, c~name AS carrier_name
  FROM /dmo/flight AS f
  INNER JOIN /dmo/carrier AS c ON c~carrier_id = f~carrier_id
  WHERE f~flight_date >= @start_date
  INTO TABLE @DATA(flights_with_name).
```

Quando os dados de partida já estão em uma tabela interna e não vêm do banco, há duas saídas.

```abap title="Tabela interna como fonte de dados"
" Opção moderna: a própria tabela interna entra no join
SELECT c~carrier_id, c~name
  FROM /dmo/carrier AS c
  INNER JOIN @flights AS f ON f~carrier_id = c~carrier_id
  INTO TABLE @DATA(carriers).

" Opção clássica: FOR ALL ENTRIES
IF flights IS NOT INITIAL.                           " indispensável
  SELECT carrier_id, name FROM /dmo/carrier
    FOR ALL ENTRIES IN @flights
    WHERE carrier_id = @flights-carrier_id
    INTO TABLE @DATA(carriers_fae).
ENDIF.
```

:::aviso
Duas armadilhas do `FOR ALL ENTRIES`. Se a tabela de entrada estiver **vazia**, a condição é ignorada e a consulta lê a tabela do banco **inteira**: sempre teste antes. E o resultado tem as linhas duplicadas **removidas**, o que distorce contagens e somas se a lista de campos não incluir a chave completa.
:::

## Outras causas comuns {ancora="Outras causas" icone="list"}

::::colunas{n="2"}
:::cartao
### No comando SQL

- `SELECT *` em tabelas ou views largas.
- Função sobre a coluna filtrada (`WHERE upper( name ) = …`), que impede o uso de índice.
- `SELECT … ENDSELECT` processando linha a linha, em vez de `INTO TABLE`.
- `SELECT COUNT( * )` só para saber se existe uma linha: use `SELECT SINGLE @abap_true`.
- `ORDER BY` em um conjunto enorme sem necessidade.
:::

:::cartao
### No programa

- A mesma leitura repetida em métodos diferentes da mesma requisição.
- `INSERT` ou `UPDATE` linha a linha dentro de loop, em vez de operações com tabela interna.
- Leituras em tabela interna standard com `READ TABLE … WITH KEY` dentro de loop. Veja [Performance de tabelas internas](#performance-tabelas).
- Filtrar em ABAP depois de ler tudo.
:::
::::

```abap title="Existe pelo menos uma linha?"
SELECT SINGLE @abap_true FROM /dmo/flight
  WHERE carrier_id = @carrier AND seats_occupied < seats_max
  INTO @DATA(has_free_seats).
```

## Performance de CDS views {ancora="CDS views" icone="detail-view"}

Uma CDS view não guarda dados: a cada leitura, o banco executa a consulta completa da view e de todas as views abaixo dela. O que parece um `SELECT` simples pode esconder dezenas de joins.

:::checklist
- **Pilhas profundas.** Cada camada soma joins e cálculos. Antes de consumir uma view, olhe o que há embaixo com **Open With › Dependency Analyzer** no ADT.
- **Filtro sobre campo calculado.** Um `WHERE` sobre o resultado de `CASE`, `CAST` ou concatenação não desce até a tabela, e o banco calcula todas as linhas antes de filtrar.
- **Joins em campos convertidos.** Condição de join com `CAST` ou tipos diferentes impede a otimização.
- **Associações são sob demanda.** Uma associação só vira join quando algum campo dela é pedido. Peça só o que precisa.
- **Agregações cedo demais.** `GROUP BY` em uma view intermediária obriga o banco a agregar tudo antes dos filtros de quem consome.
- **Controle de acesso.** Uma DCL com condições complexas entra em toda consulta à view.
:::

Para dados de configuração pequenos e muito lidos, o **buffer de tabelas** evita a ida ao banco. Ele só é usado em acessos simples à tabela: joins, agregações e a maioria das leituras por CDS o ignoram.

## Medir antes de mudar {ancora="Ferramentas" icone="stethoscope"}

| Ferramenta | Onde | Responde |
| --- | --- | --- |
| **ABAP Profiler** | ADT: Profile As › ABAP Application | Onde o tempo foi gasto: ABAP ou banco, e em que método |
| **SQL trace** | ADT: ABAP Trace Requests · SAP GUI: ST05 | Que comandos foram ao banco, quantas vezes, com que duração |
| **Plano de execução** | A partir do SQL trace: Explain | Como o banco executou: tabelas, joins, filtros aplicados |
| **ATC** | ADT: Run As › ABAP Test Cockpit | Problemas detectáveis sem executar, como `SELECT` em loop |
| **SQL Monitor** | SAP GUI: SQLM e SWLT | Quais comandos mais consomem em produção |
| **Technical Monitoring Cockpit** | BTP ABAP environment | Consumo por comando SQL e por requisição no ambiente cloud |

No SQL trace, procure primeiro por **comandos idênticos repetidos**: é a assinatura do `SELECT` em loop. Depois, pelos comandos de maior duração total, e só então por comandos individuais lentos.

:::quiz
### Qual é o risco de `FOR ALL ENTRIES` com a tabela de entrada vazia?

- [ ] A consulta devolve erro de sintaxe
- [ ] Nenhuma linha é lida
- [x] A tabela do banco é lida por inteiro
- [ ] O programa entra em loop

> Sem linhas na tabela de entrada, a condição que depende dela é descartada.

### O que caracteriza um `SELECT` em loop no SQL trace?

- [ ] Um comando com duração muito alta
- [x] Muitas execuções do mesmo comando, cada uma lendo uma linha
- [ ] Um comando sem `WHERE`
- [ ] Um `COMMIT` entre os comandos

> A repetição de comandos idênticos é o sinal. Cada execução é rápida; o total, não.

### Por que filtrar por um campo calculado em uma CDS view costuma ser lento?

- [ ] Campos calculados não aceitam `WHERE`
- [x] O banco precisa calcular o campo para todas as linhas antes de filtrar
- [ ] O filtro é aplicado no servidor ABAP
- [ ] A view deixa de usar o mandante

> O filtro não pode ser levado até a tabela de origem, então nenhuma linha é descartada cedo.

### Qual é a forma eficiente de verificar se existe ao menos uma linha?

- [ ] `SELECT *` e testar `lines( )`
- [ ] `SELECT COUNT( * )` e comparar com zero
- [x] `SELECT SINGLE @abap_true … INTO @DATA(found)`
- [ ] `LOOP` com `EXIT` na primeira volta

> O banco para na primeira linha encontrada e não transporta nenhuma coluna.
:::

:::documentacao
- [ABAP Keyword Documentation: notas de performance do ABAP SQL](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenabap_sql_perfo.htm)
- [ABAP Data Models (SAP Help Portal)](https://help.sap.com/docs/abap-cloud/abap-data-models/abap-data-models?locale=en-US)
- [Cheat sheet: Performance Notes](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/32_Performance_Notes.md)
:::
