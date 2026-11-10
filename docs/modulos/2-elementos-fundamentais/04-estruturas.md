---
titulo: Estruturas
subtitulo: Tipos estruturados, VALUE e CORRESPONDING.
sap_learning: "Basic ABAP Programming · unidade 5"
duracao: "1 h 06 min"
icone: table-view
objetivos:
  - Declarar tipos estruturados
  - Acessar componentes
  - "Preencher com VALUE #( )"
  - "Copiar com CORRESPONDING #( )"
palavras_chave: structure begin of end of value corresponding mapping except base include type
---

## Estruturas: vários campos, um nome {ancora="Estruturas" icone="table-view"}

Uma **estrutura** agrupa componentes de tipos diferentes, como uma linha de tabela. Você acessa cada componente com o seletor `-`. Estruturas podem ser aninhadas e podem herdar componentes com `INCLUDE TYPE`.

::figura{arquivo="estruturas-1.svg"}

```abap title="Tipos estruturados"
TYPES: BEGIN OF ty_connection,
         carrier_id      TYPE /dmo/carrier_id,
         connection_id   TYPE /dmo/connection_id,
         airport_from_id TYPE /dmo/airport_from_id,
         distance        TYPE /dmo/flight_distance,
       END OF ty_connection.

DATA connection TYPE ty_connection.

connection-carrier_id = 'LH'.
connection = VALUE #( carrier_id      = 'LH'
                      connection_id   = '0400'
                      airport_from_id = 'FRA'
                      distance        = 6162 ).

" Estrutura direto do SELECT
SELECT SINGLE FROM /dmo/connection
  FIELDS carrier_id, connection_id, airport_from_id, distance
  WHERE carrier_id = 'LH' AND connection_id = '0400'
  INTO @connection.
```

## Copiando entre estruturas diferentes {ancora="CORRESPONDING" icone="chain-link"}

`CORRESPONDING #( )` copia apenas os componentes com o **mesmo nome**. Com `MAPPING` você liga nomes diferentes; com `EXCEPT` você exclui componentes. Marque as opções e veja o que chega no destino.

::laboratorio{id="corr"}

:::quiz
### Qual caractere seleciona um componente de estrutura?

- [ ] `.`
- [ ] `~`
- [x] `-`
- [ ] `=>`

> connection-carrier_id usa o hífen como seletor de componente.

### O que `CORRESPONDING #( )` copia por padrão?

- [ ] Todos os componentes por posição
- [x] Componentes com o mesmo nome
- [ ] Apenas a chave
- [ ] Nada sem `MAPPING`

> Componentes com nomes iguais são copiados; MAPPING liga nomes diferentes.

### Para que serve `BASE` em `CORRESPONDING #( BASE ( alvo ) origem )`?

- [x] Manter valores do alvo que não vêm da origem
- [ ] Ordenar componentes
- [ ] Converter tipos
- [ ] Copiar só a chave

> Sem BASE, componentes não copiados ficam iniciais; com BASE, mantêm o valor original do alvo.
:::

:::documentacao
- [TYPES BEGIN OF](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abaptypes_struc.htm)
- [Cheat sheet: Structures](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/02_Structures.md)
- [Cheat sheet: Constructor Expressions](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/05_Constructor_Expressions.md)
:::
