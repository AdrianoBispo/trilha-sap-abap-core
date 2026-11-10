---
titulo: Performance de tabelas internas
subtitulo: Custo de acesso, chaves secundárias e acesso sem cópia.
sap_learning: "Intermediate ABAP Programming · unidade 5"
duracao: "3 h 10 min"
icone: sorting-ranking
objetivos:
  - Comparar custos de leitura
  - Definir chaves secundárias
  - Escolher entre work area, field-symbol e referência
palavras_chave: performance secondary key chave secundária using key field-symbol reference into binary hash select em loop
---

## Quanto custa encontrar uma linha {ancora="Custo de leitura" icone="overview-chart"}

Arraste o controle para mudar o tamanho da tabela e veja o número médio de comparações para ler uma linha pela chave. A diferença entre linear e binário é pequena com 20 linhas e enorme com 100 mil.

::laboratorio{id="perfchart"}

## Chaves secundárias {ancora="Chaves secundárias" icone="key"}

Uma tabela pode ter uma chave primária e várias **chaves secundárias**, sorted ou hashed. Assim você lê rápido por critérios diferentes sem manter cópias da tabela.

```abap title="Chave secundária"
DATA flights TYPE STANDARD TABLE OF /dmo/flight
  WITH NON-UNIQUE KEY carrier_id connection_id flight_date
  WITH NON-UNIQUE SORTED KEY by_plane COMPONENTS plane_type_id.

" Leitura usando a chave secundária
LOOP AT flights INTO DATA(f) USING KEY by_plane
     WHERE plane_type_id = 'A380-800'.
ENDLOOP.

DATA(first_a380) = flights[ KEY by_plane plane_type_id = 'A380-800' ].
```

## Work area, field-symbol ou referência {ancora="Acesso às linhas" icone="activity-assigned-to-goal"}

::::colunas{n="3"}
:::cartao{etiqueta="INTO wa" tipo="aviso"}
Copia a linha. Simples, mas caro para linhas largas e não altera a tabela sem `MODIFY`.
:::

:::cartao{etiqueta="ASSIGNING <fs>" tipo="sucesso"}
Aponta direto para a linha na tabela. Sem cópia; alterações refletem na hora.
:::

:::cartao{etiqueta="REFERENCE INTO ref" tipo="info"}
Como field-symbol, mas a referência pode ser guardada ou passada adiante.
:::
::::

:::aviso
Evite `SELECT` dentro de `LOOP`. Leia tudo de uma vez com JOIN ou `FOR ALL ENTRIES` e depois combine em memória com tabelas sorted ou hashed.
:::

```abap title="Antes e depois"
" Lento: uma ida ao banco por linha
LOOP AT connections INTO DATA(c).
  SELECT SINGLE name FROM /dmo/carrier
    WHERE carrier_id = @c-carrier_id INTO @DATA(name).
ENDLOOP.

" Rápido: uma leitura + tabela hashed
SELECT FROM /dmo/carrier FIELDS carrier_id, name
  INTO TABLE @DATA(carriers).
DATA carrier_by_id TYPE HASHED TABLE OF /dmo/carrier
     WITH UNIQUE KEY carrier_id.
carrier_by_id = CORRESPONDING #( carriers ).

LOOP AT connections ASSIGNING FIELD-SYMBOL(<c>).
  DATA(carrier_name) = VALUE #( carrier_by_id[ carrier_id = <c>-carrier_id ]-name OPTIONAL ).
ENDLOOP.
```

:::documentacao
- [Cheat sheet: Internal Tables](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/01_Internal_Tables.md)
- [Cheat sheet: Performance Notes](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/32_Performance_Notes.md)
:::
