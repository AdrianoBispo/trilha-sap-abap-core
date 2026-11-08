---
titulo: Processando texto
subtitulo: String templates, funções de texto e expressões regulares.
unidade: "3"
duracao: "2 h 10 min"
icone: text
objetivos:
  - Formatar com string templates
  - Usar funções embutidas de texto
  - Aplicar expressões regulares PCRE
palavras_chave: string template condense substring find replace segment strlen to_upper pcre regex matches
---

## String templates {ancora="String templates" icone="text"}

Entre barras verticais `|…|` você mistura texto e expressões dentro de `{ }`. As opções de formatação substituem o antigo `WRITE TO`.

```abap title="Formatação em templates"
DATA(carrier) = `LH`.
DATA(price)   = CONV decfloat34( '1234.5' ).
DATA(today)   = cl_abap_context_info=>get_system_date( ).

out->write( |Voo { carrier } custa { price NUMBER = USER }| ).
out->write( |{ carrier WIDTH = 8 ALIGN = RIGHT PAD = '.' }| ).  " ......LH
out->write( |{ `abap` CASE = UPPER }| ).                       " ABAP
out->write( |Data: { today DATE = ISO }| ).                    " 2026-10-27
out->write( |{ 7 / 2 DECIMALS = 2 }| ).
out->write( |Linha 1\nLinha 2| ).                              " quebra de linha
```

## Laboratório de funções de texto {ancora="Laboratório de funções" icone="syntax"}

Funções embutidas recebem parâmetros nomeados como `val`, `sub`, `off` e `len`. Escolha uma função, altere o texto e os parâmetros e veja a expressão ABAP e o resultado.

::laboratorio{id="strlab"}

## Expressões regulares {ancora="Regex" icone="search"}

No ABAP Cloud, use a sintaxe PCRE com `PCRE =` nas funções e comandos, ou as classes `CL_ABAP_REGEX` e `CL_ABAP_MATCHER`.

```abap title="PCRE"
DATA(email) = `ana.souza@exemplo.com.br`.

IF matches( val = email pcre = `^[\w.+-]+@[\w-]+(\.[\w-]+)+$` ).
  out->write( `E-mail válido` ).
ENDIF.

DATA(digits) = replace( val = `(81) 3333-4444` pcre = `\D` with = `` occ = 0 ).
" 8133334444

FIND ALL OCCURRENCES OF PCRE `\d{4}` IN `Voos 0400 e 0401`
     RESULTS DATA(hits).
out->write( lines( hits ) ).   " 2
```

:::quiz
### O que ``condense( val = `  a   b  ` )`` retorna?

- [x] `` `a b` ``
- [ ] `` `ab` ``
- [ ] `` `  a   b` ``
- [ ] `` `a   b` ``

> condense remove espaços nas pontas e reduz sequências internas a um espaço.

### Quanto vale ``find( val = `ABAP` sub = `X` )``?

- [ ] 0
- [x] -1
- [ ] 4
- [ ] Exceção

> find retorna o deslocamento da ocorrência ou -1 quando não encontra.

### Em ``substring( val = `Trilha` off = 1 len = 3 )``, qual o resultado?

- [ ] `` `Tri` ``
- [x] `` `ril` ``
- [ ] `` `rilh` ``
- [ ] `` `ilh` ``

> off é baseado em zero: começa no segundo caractere e pega três.
:::

:::documentacao
- [Cheat sheet: String Processing](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/07_String_Processing.md)
- [Cheat sheet: Regular Expressions](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/28_Regular_Expressions.md)
- [Cheat sheet: Built-in Functions](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/24_Builtin_Functions.md)
:::
