---
titulo: Primeiros passos
subtitulo: ABAP Cloud, Eclipse ADT, pacotes e sua primeira classe executável.
unidade: "1"
duracao: "1 h 25 min"
icone: play
objetivos:
  - Explicar o que é ABAP Cloud e clean core
  - Criar um projeto ABAP Cloud e um pacote
  - Criar e ativar uma classe
  - Executar um Hello World no console
palavras_chave: eclipse adt pacote package hello world if_oo_adt_classrun out write ativar f9
---

## O que muda com o ABAP Cloud {ancora="ABAP Cloud" icone="cloud"}

ABAP é a linguagem de negócio da SAP. Hoje ela roda em três cenários: o **SAP BTP, ABAP environment** (conhecido como “Steampunk”), o **SAP S/4HANA Cloud Public Edition** e o S/4HANA privado ou on-premise. A trilha *Acquiring Core ABAP Skills* ensina o modelo **ABAP Cloud**, que vale para todos eles.

No ABAP Cloud você programa com a versão de linguagem **ABAP for Cloud Development**: um subconjunto moderno da linguagem, que só usa APIs liberadas (*released*) pela SAP. Isso mantém o núcleo do sistema limpo (*clean core*) e torna as extensões seguras para upgrade.

:::figura{arquivo="primeiros-passos-1.svg"}
Você escreve código no Eclipse (ADT). Todo objeto de desenvolvimento vive dentro de um pacote, e o pacote pertence a um componente de software.
:::

## Projeto ABAP Cloud e pacote {ancora="Projeto e pacote" icone="open-folder"}

::::colunas{n="2"}
:::cartao
### Passo a passo no ADT

1. **File › New › ABAP Cloud Project** e informe a URL do sistema (ou a chave de serviço do trial no BTP).
2. Clique com o botão direito no projeto: **New › ABAP Package**. Nome iniciando com `Z` ou `Y`, superpacote `ZLOCAL` para estudos.
3. Adicione o pacote aos **Favorite Packages** para encontrá-lo rápido.
4. Crie objetos com **New › ABAP Class** e ative com :kbd[Ctrl+F3].
:::

:::cartao
### Atalhos que você vai usar todo dia

| Atalho | Ação |
| --- | --- |
| :kbd[Ctrl+F3] | Ativar objeto |
| :kbd[F9] | Executar classe como aplicação de console |
| :kbd[Ctrl+Espaço] | Completar código |
| :kbd[Ctrl+1] | Quick fix (ex.: criar método) |
| :kbd[Shift+F1] | Pretty printer (formatar) |
| :kbd[F2] | Element info (documentação do elemento) |
| :kbd[Ctrl+Shift+A] | Abrir objeto de desenvolvimento |
:::
::::

## Sua primeira classe: Hello World {ancora="Hello World" icone="play"}

No ABAP Cloud não há relatórios com `WRITE`. Para ver uma saída, a classe implementa a interface `IF_OO_ADT_CLASSRUN` e escreve no console do Eclipse através do objeto `out`.

```abap title="ZCL_HELLO_WORLD"
CLASS zcl_hello_world DEFINITION
  PUBLIC FINAL CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_hello_world IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    " Saída no console do ADT (F9)
    out->write( `Hello World` ).
  ENDMETHOD.
ENDCLASS.
```

::laboratorio{id="hello"}

## Regras do jogo no ABAP Cloud {ancora="Regras" icone="shield"}

::::colunas{n="3"}
:::cartao{etiqueta="Permitido" tipo="sucesso"}
Classes, CDS, tabelas, RAP, ABAP SQL e APIs com contrato de liberação (C1).
:::

:::cartao{etiqueta="Fora do escopo" tipo="erro"}
Dynpro, `WRITE`, `CALL TRANSACTION`, acesso direto a tabelas SAP não liberadas.
:::

:::cartao{etiqueta="Verificação" tipo="info"}
O compilador e o ATC bloqueiam o que não é liberado. Veja as APIs em *Released Objects* no Project Explorer.
:::
::::

:::quiz
### Qual interface uma classe implementa para escrever no console do ADT com :kbd[F9]?

- [x] `IF_OO_ADT_CLASSRUN`
- [ ] `IF_SERIALIZABLE_OBJECT`
- [ ] `IF_T100_MESSAGE`
- [ ] `IF_ABAP_CONSOLE`

> O método IF_OO_ADT_CLASSRUN~MAIN recebe o objeto out, usado para escrever no console.

### O que caracteriza a versão de linguagem ABAP for Cloud Development?

- [ ] Permite qualquer tabela do sistema
- [x] Usa apenas APIs liberadas e sintaxe moderna
- [ ] Só funciona no SAP GUI
- [ ] É uma linguagem diferente do ABAP

> É um subconjunto do ABAP restrito a objetos liberados, garantindo extensões seguras para upgrade.

### Qual atalho ativa o objeto de desenvolvimento aberto no ADT?

- [ ] :kbd[F8]
- [x] :kbd[Ctrl+F3]
- [ ] :kbd[Ctrl+1]
- [ ] :kbd[Shift+F1]

> Ctrl+F3 ativa. F8 abre o Data Preview, Ctrl+1 é quick fix e Shift+F1 formata.
:::

:::documentacao
- [ABAP for Cloud Development (Keyword Documentation)](https://help.sap.com/doc/abapdocu_cp_index_htm/CLOUD/en-US/index.htm)
- [Cheat sheet: ABAP for Cloud Development](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/19_ABAP_for_Cloud_Development.md)
:::
