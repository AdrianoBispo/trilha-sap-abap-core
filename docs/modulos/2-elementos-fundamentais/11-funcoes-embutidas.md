---
titulo: Funções embutidas
subtitulo: Funções lógicas, numéricas, de texto, de bytes, de carimbo de tempo e de tabelas internas.
duracao: "1 h"
icone: fx
objetivos:
  - Reconhecer as famílias de funções embutidas
  - Usar funções lógicas em condições e atribuições
  - Arredondar e truncar com as funções numéricas
  - Calcular com carimbos de tempo UTC
  - Consultar tabelas internas com lines, line_index e line_exists
palavras_chave: built-in functions boolc xsdbool contains matches abs sign ceil floor trunc frac ipow nmax nmin round rescale xstrlen bit-set utclong_current utclong_add utclong_diff lines line_index line_exists
---

## O que são {ancora="Visão geral" icone="fx"}

**Funções embutidas** fazem parte da própria linguagem: não pertencem a nenhuma classe, não precisam de declaração e podem ser usadas em qualquer posição de operando, inclusive dentro de outras expressões. Elas substituem comandos antigos (`DESCRIBE TABLE`, `TRANSLATE`, `CONDENSE`) por chamadas que cabem em uma linha.

| Família | Exemplos | Devolvem |
| --- | --- | --- |
| Lógicas | `boolc`, `xsdbool`, `contains`, `matches`, `line_exists` | Um valor de verdade |
| Numéricas | `abs`, `sign`, `ceil`, `floor`, `trunc`, `frac`, `ipow`, `nmax`, `nmin`, `round`, `rescale` | Um número |
| De texto | `strlen`, `to_upper`, `condense`, `substring`, `replace`, `segment` | Texto ou posição |
| De cadeias de bytes | `xstrlen`, `bit-set` | Tamanho ou `xstring` |
| De carimbo de tempo | `utclong_current`, `utclong_add`, `utclong_diff` | `utclong` ou segundos |
| De tabelas internas | `lines`, `line_index`, `line_exists` | Quantidade, índice ou verdade |

Funções com um único argumento sem nome aceitam a forma curta, `abs( x )`. As demais usam parâmetros nomeados, `round( val = x dec = 2 )`.

## Funções lógicas {ancora="Lógicas" icone="accept"}

Uma **função de predicado** pode ser usada direto em `IF`, `WHILE`, `CHECK` e `COND`, sem comparação com `abap_true`.

```abap title="Predicados e funções booleanas"
IF contains( val = email sub = `@` ) AND matches( val = code pcre = `^[A-Z]{2}\d{4}$` ).
  out->write( `Dados válidos` ).
ENDIF.

IF line_exists( flights[ carrier_id = 'LH' ] ).
  out->write( `Há voos da Lufthansa` ).
ENDIF.

" Guardar o resultado de uma condição em um flag
DATA(is_full) = xsdbool( seats_occupied >= seats_max ).   " abap_bool: 'X' ou ' '
```

:::aviso
`boolc( )` devolve um `string` com `X` ou **um espaço**. Comparado com `abap_false`, esse espaço não é igual ao valor inicial e o teste falha. Para trabalhar com `abap_bool`, use sempre `xsdbool( )`.
:::

## Funções numéricas {ancora="Numéricas" icone="measure"}

```abap title="Sinal, arredondamento e potência"
DATA(value) = CONV decfloat34( '-2.75' ).

out->write( abs( value ) ).      "  2.75   valor absoluto
out->write( sign( value ) ).     " -1      sinal: -1, 0 ou 1
out->write( ceil( value ) ).     " -2      menor inteiro maior ou igual
out->write( floor( value ) ).    " -3      maior inteiro menor ou igual
out->write( trunc( value ) ).    " -2      parte inteira
out->write( frac( value ) ).     " -0.75   parte decimal

out->write( ipow( base = 2 exp = 10 ) ).                 " 1024, sem ponto flutuante
out->write( nmax( val1 = 7 val2 = 12 val3 = 3 ) ).       " 12  (de 2 a 9 argumentos)
out->write( nmin( val1 = 7 val2 = 12 val3 = 3 ) ).       " 3

" Arredondamento comercial para 2 casas
out->write( round( val = CONV decfloat34( '2.345' ) dec = 2 ) ).    " 2.35
" Outro modo de arredondamento: sempre para baixo
out->write( round( val  = CONV decfloat34( '2.349' ) dec = 2
                   mode = cl_abap_math=>round_down ) ).             " 2.34
```

`round( )` e `rescale( )` trabalham com números decimais de ponto flutuante (`decfloat16`, `decfloat34`). `rescale( )` muda a escala sem alterar o valor: útil para forçar duas casas na saída. Existem ainda as funções de ponto flutuante clássicas, como `sqrt`, `exp`, `log`, `log10`, `sin` e `cos`.

## Funções de texto {ancora="Texto" icone="text"}

São a família mais numerosa. A lição [Processando texto](#strings) tem um laboratório só para elas; aqui fica o mapa por finalidade.

| Finalidade | Funções |
| --- | --- |
| Tamanho | `strlen` (com espaços finais em `string`), `numofchar` (sem espaços finais) |
| Caixa | `to_upper`, `to_lower`, `to_mixed`, `from_mixed` |
| Limpeza | `condense`, `shift_left`, `shift_right` |
| Recorte | `substring`, `substring_before`, `substring_after`, `substring_from`, `substring_to`, `segment` |
| Busca | `find`, `find_end`, `find_any_of`, `count`, `count_any_of` |
| Troca | `replace`, `translate`, `insert`, `reverse`, `repeat` |
| Comparação | `distance` (distância de edição entre dois textos) |
| Junção | `concat_lines_of` (linhas de uma tabela em um texto) |
| Escape | `escape` (HTML, JSON, URL, com constantes de `CL_ABAP_FORMAT`) |

```abap title="Algumas em uma linha"
DATA(parts) = VALUE string_table( ( `LH` ) ( `0400` ) ( `2026-11-17` ) ).

out->write( concat_lines_of( table = parts sep = `-` ) ).              " LH-0400-2026-11-17
out->write( segment( val = `LH;0400;FRA` index = 3 sep = `;` ) ).      " FRA
out->write( substring_after( val = `user@sap.com` sub = `@` ) ).       " sap.com
out->write( to_mixed( val = `TOTAL_PRICE` sep = `_` ) ).               " totalPrice
out->write( count( val = `banana` sub = `a` ) ).                       " 3
```

## Funções de cadeias de bytes {ancora="Bytes" icone="number-sign"}

Dados binários ficam nos tipos `x` (tamanho fixo) e `xstring` (tamanho variável), mostrados em hexadecimal. Aparecem em arquivos, anexos, hashes e conversões de codificação.

```abap title="Bytes"
DATA(text)  = `Olá`.
DATA(bytes) = cl_abap_conv_codepage=>create_out( )->convert( text ).   " UTF-8

out->write( strlen( text ) ).      " 3 caracteres
out->write( xstrlen( bytes ) ).    " 4 bytes: "á" ocupa dois em UTF-8

" bit-set( n ): cadeia de bytes só com o bit n ligado, contado da esquerda
DATA(mask) = bit-set( 5 ).         " 08  (00001000)

" Operadores de bits entre cadeias de bytes
DATA(flags) = CONV xstring( '0C' ) BIT-AND mask.                        " 08
```

## Funções de carimbo de tempo {ancora="Carimbos de tempo" icone="date-time"}

O tipo `utclong` guarda um instante em UTC com precisão de 100 nanossegundos. É o tipo indicado para campos como "criado em" e "alterado em".

```abap title="utclong"
DATA(now) = utclong_current( ).                             " instante atual em UTC

DATA(deadline) = utclong_add( val = now days = 2 hours = 12 ).

" Diferença em segundos (decfloat34)
DATA(seconds) = utclong_diff( high = deadline low = now ).  " 216000

" Para mostrar ao usuário, converta para a data e a hora do fuso dele
CONVERT UTCLONG now
  INTO DATE DATA(local_date) TIME DATA(local_time)
  TIME ZONE cl_abap_context_info=>get_user_time_zone( ).
```

## Funções de tabelas internas {ancora="Tabelas internas" icone="table-view"}

```abap title="lines, line_index e line_exists"
DATA(total) = lines( flights ).                                      " quantidade de linhas

DATA(position) = line_index( flights[ connection_id = '0400' ] ).    " 0 se não achar

IF line_exists( flights[ carrier_id = 'LH' connection_id = '0400' ] ).
  DATA(flight) = flights[ carrier_id = 'LH' connection_id = '0400' ].
ENDIF.
```

`line_exists( )` e `line_index( )` recebem uma expressão de tabela, mas **não** lançam exceção quando a linha não existe. São a forma segura de testar antes de ler. Para ler direto com um valor de reserva, use `VALUE #( itab[ … ] OPTIONAL )`.

:::quiz
### Qual função devolve um valor do tipo `abap_bool`?

- [ ] `boolc( )`
- [x] `xsdbool( )`
- [ ] `contains( )`
- [ ] `sign( )`

> xsdbool devolve c de tamanho 1, compatível com abap_true e abap_false. boolc devolve string.

### Quanto vale `floor( CONV decfloat34( '-2.75' ) )`?

- [ ] -2
- [x] -3
- [ ] 2
- [ ] -2.75

> floor devolve o maior inteiro que não ultrapassa o argumento. Para negativos, isso é "mais para baixo".

### O que `line_index( itab[ id = 99 ] )` devolve quando a linha não existe?

- [ ] Lança `CX_SY_ITAB_LINE_NOT_FOUND`
- [x] 0
- [ ] -1
- [ ] O número de linhas da tabela

> Dentro de line_index e line_exists, a expressão de tabela não lança exceção.

### Em que unidade `utclong_diff( )` devolve a diferença?

- [ ] Dias
- [ ] Minutos
- [x] Segundos
- [ ] Milissegundos

> O resultado é um decfloat34 com a diferença em segundos, incluindo frações.
:::

:::documentacao
- [ABAP Keyword Documentation: funções embutidas](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenbuilt_in_functions_overview.htm)
- [Cheat sheet: Built-In Functions](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/24_Builtin_Functions.md)
- [Cheat sheet: Bits and Bytes](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/09_Bits_and_Bytes.md)
:::
