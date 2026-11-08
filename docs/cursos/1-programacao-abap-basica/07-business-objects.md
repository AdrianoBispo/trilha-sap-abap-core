---
titulo: Business objects e EML
subtitulo: Alterando dados pelo comportamento RAP com READ, MODIFY e COMMIT ENTITIES.
unidade: "7"
duracao: "1 h"
icone: product
objetivos:
  - Explicar por que usar business objects
  - Ler com READ ENTITIES
  - Alterar com MODIFY ENTITIES
  - Persistir com COMMIT ENTITIES
palavras_chave: eml modify entities read entities commit entities rollback failed reported buffer transacional luw
---

## Por que não usar UPDATE direto? {ancora="Business objects" icone="product"}

No ABAP Cloud, dados de negócio pertencem a **business objects RAP**. Um BO junta validações, determinações, autorizações e bloqueios. Se você escrever na tabela com `UPDATE` você pula todas essas regras. Por isso as alterações passam pela **EML** (*Entity Manipulation Language*).

A EML trabalha em duas fases: `MODIFY ENTITIES` grava no **buffer transacional**; `COMMIT ENTITIES` valida e persiste tudo de uma vez no banco (a SAP LUW).

::laboratorio{id="eml"}

## Sintaxe EML {ancora="Sintaxe EML" icone="source-code"}

:::colunas{n="2"}
```abap title="Ler e alterar"
READ ENTITIES OF /dmo/r_agencytp
  ENTITY /dmo/agency
  FIELDS ( name city ) WITH
    VALUE #( ( agencyid = '070050' ) )
  RESULT DATA(agencies)
  FAILED DATA(failed_read).

MODIFY ENTITIES OF /dmo/r_agencytp
  ENTITY /dmo/agency
  UPDATE FIELDS ( name ) WITH
    VALUE #( ( agencyid = '070050'
               name     = 'Agência Recife' ) )
  FAILED DATA(failed)
  REPORTED DATA(reported).
```

```abap title="Gravar"
COMMIT ENTITIES
  RESPONSE OF /dmo/r_agencytp
  FAILED   DATA(failed_commit)
  REPORTED DATA(reported_commit).

IF failed_commit IS INITIAL.
  out->write( `Agência atualizada` ).
ELSE.
  " Mensagens de validação ficam em reported_commit
  ROLLBACK ENTITIES.
ENDIF.
```
:::

:::aviso
Dentro de implementações de comportamento (behavior pool) você **não** chama `COMMIT ENTITIES`: quem controla a transação é o framework RAP.
:::

:::quiz
### Onde `MODIFY ENTITIES` grava as alterações?

- [ ] Direto no banco
- [x] No buffer transacional
- [ ] Num arquivo
- [ ] No cache do navegador

> As alterações ficam no buffer transacional até COMMIT ENTITIES.

### Por que não usar `UPDATE` direto em tabelas de um business object?

- [ ] `UPDATE` não existe no ABAP Cloud
- [x] Ignoraria validações, determinações e bloqueios do BO
- [ ] É mais lento
- [ ] Não grava em HANA

> O BO concentra a lógica de negócio; escrever na tabela pula todas essas regras.

### Em uma implementação de comportamento (behavior pool), você deve chamar `COMMIT ENTITIES`?

- [ ] Sim, sempre
- [x] Não, o framework RAP controla a transação
- [ ] Só em validações
- [ ] Só com draft

> Dentro do comportamento quem decide o commit é o framework; COMMIT ENTITIES é para consumidores externos.
:::

:::documentacao
- [Cheat sheet: ABAP EML in RAP](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/08_EML_ABAP_for_RAP.md)
- [Cheat sheet: SAP LUW](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/17_SAP_LUW.md)
:::
