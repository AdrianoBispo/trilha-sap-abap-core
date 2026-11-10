---
titulo: XML e JSON
subtitulo: Serialização e desserialização com transformações, a biblioteca sXML e as APIs de JSON.
duracao: "1 h"
icone: source-code
objetivos:
  - Explicar serialização e desserialização
  - Converter dados ABAP em JSON e de volta
  - Usar CALL TRANSFORMATION com a transformação de identidade
  - Ler uma Simple Transformation
  - Evitar os erros comuns de mapeamento de nomes e tipos
palavras_chave: xml json call transformation id identity simple transformation st xslt sxml cl_sxml_string_writer asxml asjson xco_cp_json /ui2/cl_json serialize deserialize camel case
---

## Serializar e desserializar {ancora="Conceito" icone="source-code"}

Dados ABAP vivem na memória em formato binário. Para sair do sistema, em uma chamada HTTP ou em um arquivo, precisam virar **texto** em um formato que o outro lado entenda. **Serializar** é converter dados ABAP em XML ou JSON; **desserializar** é o caminho inverso.

| Ferramenta | Formatos | Quando usar |
| --- | --- | --- |
| `xco_cp_json` | JSON | ABAP Cloud; conversão direta com ajuste de nomes |
| `/ui2/cl_json` | JSON | Muito difundida; uma chamada para cada direção |
| `CALL TRANSFORMATION id` | XML e JSON | Conversão fiel dos dados ABAP, sem mapeamento |
| Simple Transformation (ST) | XML e JSON | Formato definido por terceiros, nos dois sentidos, com bom desempenho |
| XSLT | XML | Reestruturações complexas de um XML em outro |
| Biblioteca sXML | XML e JSON | Leitura e escrita token a token, para documentos grandes |

## JSON {ancora="JSON" icone="syntax"}

```abap title="Dados de exemplo"
TYPES: BEGIN OF ty_flight,
         carrier_id    TYPE /dmo/carrier_id,
         connection_id TYPE /dmo/connection_id,
         flight_date   TYPE d,
         seats_free    TYPE i,
       END OF ty_flight.

DATA(flight) = VALUE ty_flight( carrier_id = 'LH' connection_id = '0400'
                                flight_date = '20261117' seats_free = 43 ).
```

```abap title="XCO (ABAP Cloud)"
" ABAP → JSON, com nomes em camelCase
DATA(json) = xco_cp_json=>data->from_abap( flight )->apply( VALUE #(
               ( xco_cp_json=>transformation->underscore_to_camel_case ) ) )->to_string( ).
" {"carrierId":"LH","connectionId":"0400","flightDate":"2026-11-17","seatsFree":43}

" JSON → ABAP
xco_cp_json=>data->from_string( json )->apply( VALUE #(
  ( xco_cp_json=>transformation->camel_case_to_underscore ) ) )->write_to( REF #( flight ) ).
```

```abap title="/UI2/CL_JSON"
DATA(json2) = /ui2/cl_json=>serialize( data        = flight
                                       pretty_name = /ui2/cl_json=>pretty_mode-camel_case ).

/ui2/cl_json=>deserialize( EXPORTING json        = json2
                                     pretty_name = /ui2/cl_json=>pretty_mode-camel_case
                           CHANGING  data        = flight ).
```

:::aviso
O problema mais comum é o **nome dos campos**. Componentes ABAP são `CARRIER_ID`; a API do outro lado espera `carrierId`. Sem a opção de conversão de nomes, a desserialização não encontra correspondência e deixa os campos **vazios, sem erro**. Sempre teste com um exemplo real da API.
:::

## Transformação de identidade {ancora="CALL TRANSFORMATION" icone="process"}

O comando `CALL TRANSFORMATION` executa um programa de transformação. O mais simples é `id`, a **transformação de identidade**, que já vem com o sistema: ela converte qualquer dado ABAP em um formato canônico e de volta, sem que você escreva nada.

```abap title="ABAP ↔ XML (asXML)"
DATA xml TYPE string.

CALL TRANSFORMATION id
  SOURCE flight = flight               " nome_no_xml = objeto ABAP
  RESULT XML xml.

" <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
"   <asx:values>
"     <FLIGHT>
"       <CARRIER_ID>LH</CARRIER_ID>
"       <CONNECTION_ID>0400</CONNECTION_ID>
"       <FLIGHT_DATE>2026-11-17</FLIGHT_DATE>
"       <SEATS_FREE>43</SEATS_FREE>
"     </FLIGHT>
"   </asx:values>
" </asx:abap>

CALL TRANSFORMATION id
  SOURCE XML xml
  RESULT flight = flight.
```

```abap title="A mesma transformação gerando JSON (asJSON)"
DATA(writer) = cl_sxml_string_writer=>create( type = if_sxml=>co_xt_json ).

CALL TRANSFORMATION id
  SOURCE flight = flight
  RESULT XML writer.

DATA(json_asjson) = cl_abap_conv_codepage=>create_in( )->convert( writer->get_output( ) ).
" {"FLIGHT":{"CARRIER_ID":"LH","CONNECTION_ID":"0400","FLIGHT_DATE":"2026-11-17","SEATS_FREE":43}}
```

O resultado é fiel aos dados, mas o formato é o do ABAP: nomes em maiúsculas e um elemento raiz com o nome dado em `SOURCE`. Serve muito bem para guardar e recuperar dados ou trocar entre sistemas ABAP. Para um formato definido por terceiros, é preciso uma transformação própria.

## Simple Transformations {ancora="Simple Transformation" icone="create-form"}

Uma **Simple Transformation (ST)** é um modelo do documento XML com marcações que dizem de onde vem cada valor. O mesmo programa serve nos **dois sentidos**: serializa e desserializa. É criada como objeto de repositório (no ADT: **New › Transformation**, tipo Simple Transformation).

```xml title="ZFLIGHT_ST"
<?sap.transform simple?>
<tt:transform xmlns:tt="http://www.sap.com/transformation-templates">

  <tt:root name="FLIGHT"/>

  <tt:template>
    <flight>
      <tt:attribute name="carrier" value-ref="FLIGHT.CARRIER_ID"/>
      <connection>
        <tt:value ref="FLIGHT.CONNECTION_ID"/>
      </connection>
      <date>
        <tt:value ref="FLIGHT.FLIGHT_DATE"/>
      </date>
      <freeSeats>
        <tt:value ref="FLIGHT.SEATS_FREE"/>
      </freeSeats>
    </flight>
  </tt:template>

</tt:transform>
```

```abap title="Usando a transformação"
CALL TRANSFORMATION zflight_st
  SOURCE flight = flight
  RESULT XML xml.
" <flight carrier="LH"><connection>0400</connection><date>2026-11-17</date><freeSeats>43</freeSeats></flight>

CALL TRANSFORMATION zflight_st
  SOURCE XML xml
  RESULT flight = flight.
```

:::termos
- `tt:root` — Declara o dado ABAP ligado à transformação. O nome coincide com o usado em `SOURCE` e `RESULT`.
- `tt:value` — Insere ou lê o valor de um campo elementar.
- `tt:attribute` — O mesmo, como atributo XML.
- `tt:loop` — Repete um trecho para cada linha de uma tabela interna.
- `tt:cond` — Torna um trecho opcional, por exemplo quando o campo está inicial.
:::

**XSLT** é a alternativa quando o XML precisa ser reorganizado de formas que um modelo fixo não descreve. É mais poderoso e mais lento, e funciona em um só sentido por programa.

## Mapeamento de tipos e erros {ancora="Cuidados" icone="quality-issue"}

| Tipo ABAP | Em XML e JSON |
| --- | --- |
| `d` | `2026-11-17` (ISO). A data inicial `00000000` não é uma data válida e pode gerar erro |
| `t` | `14:30:00` |
| `utclong` | `2026-11-17T14:30:00.0000000Z` |
| `p`, `decfloat` | Número com ponto decimal |
| `abap_bool` | `X` e vazio em asXML; `true` e `false` nas APIs de JSON, com a opção correta |
| `xstring` | Texto em Base64 |

:::checklist
- Trate `CX_TRANSFORMATION_ERROR` em toda chamada de `CALL TRANSFORMATION`. Um documento malformado ou um valor fora do tipo lança essa exceção.
- Campos que existem no documento e não na estrutura ABAP são ignorados; campos da estrutura ausentes no documento ficam com o valor anterior. Limpe a estrutura antes de desserializar.
- Trabalhe em **UTF-8**. Ao receber bytes (`xstring`), converta para texto com `CL_ABAP_CONV_CODEPAGE` antes de interpretar.
- Não monte XML ou JSON concatenando strings: aspas, quebras de linha e caracteres especiais nos dados quebram o documento. A função `escape( )` existe para os casos em que isso é inevitável.
:::

:::documentacao
- [ABAP Keyword Documentation: ABAP e XML](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenabap_xml.htm)
- [ABAP Keyword Documentation: ABAP e JSON](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenabap_json.htm)
- [ABAP Keyword Documentation: CALL TRANSFORMATION](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapcall_transformation.htm)
- [Cheat sheet: Working with XML and JSON](https://github.com/SAP-samples/abap-cheat-sheets/blob/main/21_XML_JSON.md)
:::
