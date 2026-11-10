---
titulo: Verificações de autorização
subtitulo: Objetos de autorização, AUTHORITY-CHECK e access control em CDS.
sap_learning: "Intermediate ABAP Programming · unidade 6"
duracao: "50 min"
icone: shield
objetivos:
  - Explicar objeto de autorização e role
  - Codificar AUTHORITY-CHECK
  - Interpretar sy-subrc
  - Proteger CDS com DCL
palavras_chave: authority-check objeto de autorização role actvt dcl access control pfcg_auth
---

## Como o SAP decide quem pode o quê {ancora="Conceito" icone="shield"}

Um **objeto de autorização** agrupa até dez campos, como país e atividade. Uma **role** atribuída ao usuário concede valores para esses campos. O código pergunta ao sistema com `AUTHORITY-CHECK` e decide com base em `sy-subrc`.

::figura{arquivo="autorizacoes-1.svg"}

## Simulador de AUTHORITY-CHECK {ancora="Simulador" icone="key"}

Configure o que a role do usuário concede e o que o código pede. Os códigos de atividade padrão são `01` criar, `02` alterar, `03` exibir e `06` eliminar.

::laboratorio{id="authsim"}

## Autorização declarativa em CDS {ancora="CDS access control" icone="detail-view"}

Para leituras via CDS, um **access control** (DCL) filtra as linhas automaticamente em todo `SELECT` na view. Você não precisa repetir a verificação em cada programa.

```dcl title="Access control · ZI_TRAVEL"
@EndUserText.label: 'Viagens por país autorizado'
@MappingRole: true
define role ZI_TRAVEL {
  grant select on ZI_Travel
    where ( CountryCode ) =
          aspect pfcg_auth( /DMO/TRVL, /DMO/CNTRY, ACTVT = '03' );
}
```

:::documentacao
- [AUTHORITY-CHECK](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapauthority-check.htm)
- [Cheat sheet: Authorization Checks](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/25_Authorization_Checks.md)
:::
