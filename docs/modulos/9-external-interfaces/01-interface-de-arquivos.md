---
titulo: Arquivos e data clusters
subtitulo: A interface de arquivos do servidor de aplicação, arquivos do usuário e o armazenamento de dados em clusters.
duracao: "55 min"
icone: open-folder
objetivos:
  - Situar as interfaces externas do ABAP
  - Ler e gravar arquivos no servidor de aplicação
  - Proteger nomes de arquivo com nomes lógicos
  - Transferir arquivos do computador do usuário
  - Serializar dados ABAP em um data cluster
palavras_chave: open dataset transfer read dataset close dataset text mode binary encoding utf-8 al11 arquivo lógico file_validate_name gui_upload gui_download export import data buffer cluster
---

## Interfaces externas {ancora="Visão geral" icone="share-2"}

O módulo 07 tratou de **comunicação**: um sistema chamando o outro. Este módulo trata do **formato dos dados** que cruzam a fronteira do programa ABAP. A documentação da linguagem reúne esses recursos sob o nome de *interfaces externas*.

| Interface | O que faz | Lição |
| --- | --- | --- |
| **Interface de arquivos** | Lê e grava arquivos no sistema de arquivos do servidor de aplicação | Esta |
| **Data clusters** | Guarda dados ABAP de qualquer tipo em formato binário próprio | Esta |
| **XML** | Converte dados ABAP de e para XML, com transformações | [XML e JSON](#xml-e-json) |
| **JSON** | Converte dados ABAP de e para JSON | [XML e JSON](#xml-e-json) |
| **Comunicação** | RFC, HTTP, OData, SOAP, eventos | Módulo 07 |

## Arquivos no servidor de aplicação {ancora="OPEN DATASET" icone="open-folder"}

Em Standard ABAP, quatro comandos acessam arquivos que estão **no servidor de aplicação**, não no computador do usuário: `OPEN DATASET`, `TRANSFER`, `READ DATASET` e `CLOSE DATASET`.

```abap title="Gravando um arquivo CSV (Standard ABAP)"
DATA(file) = `/usr/sap/trans/tmp/flights.csv`.

TRY.
    OPEN DATASET file FOR OUTPUT IN TEXT MODE ENCODING UTF-8.
    IF sy-subrc <> 0.
      RETURN.                                  " arquivo não pôde ser aberto
    ENDIF.

    LOOP AT flights INTO DATA(flight).
      TRANSFER |{ flight-carrier_id };{ flight-connection_id };{ flight-flight_date DATE = ISO }|
        TO file.                               " uma linha por TRANSFER
    ENDLOOP.

    CLOSE DATASET file.
  CATCH cx_sy_file_access_error INTO DATA(error).
    MESSAGE error TYPE 'I'.
ENDTRY.
```

```abap title="Lendo linha a linha"
DATA line TYPE string.

OPEN DATASET file FOR INPUT IN TEXT MODE ENCODING UTF-8.
IF sy-subrc = 0.
  DO.
    READ DATASET file INTO line.
    IF sy-subrc <> 0.
      EXIT.                                    " fim do arquivo
    ENDIF.
    SPLIT line AT ';' INTO DATA(carrier) DATA(connection) DATA(date).
  ENDDO.
  CLOSE DATASET file.
ENDIF.
```

:::termos
- `FOR INPUT`, `FOR OUTPUT`, `FOR APPENDING`, `FOR UPDATE` — Leitura, gravação (apaga o conteúdo anterior), acréscimo ao fim, leitura e gravação.
- `IN TEXT MODE ENCODING …` — Arquivo de texto, com conversão de codificação e quebras de linha. Informe sempre a codificação, de preferência `UTF-8`.
- `IN BINARY MODE` — Bytes sem interpretação. Para imagens, PDFs e arquivos compactados, lidos em um `xstring`.
- `sy-subrc` — `8` no `OPEN` se o arquivo não pôde ser aberto; `4` no `READ` ao chegar ao fim.
:::

A transação **AL11** mostra os diretórios do servidor. O objeto de autorização `S_DATASET` controla quem pode ler ou gravar cada arquivo.

### Nomes de arquivo são um risco de segurança

Se o nome do arquivo vem de uma tela ou de um parâmetro, o usuário pode apontar para qualquer caminho do servidor, por exemplo com `../`. A defesa é nunca usar um caminho físico vindo de fora.

:::checklist
- Defina um **nome de arquivo lógico** (transação FILE). O código conhece só o nome lógico, e o administrador o mapeia para o caminho físico de cada sistema.
- Converta com `FILE_GET_NAME` e valide com `FILE_VALIDATE_NAME` antes de abrir o arquivo.
- Em um sistema com várias instâncias, cada servidor tem seu sistema de arquivos. Use um diretório compartilhado, ou o arquivo gravado por um job não será encontrado por outro.
:::

## Arquivos do computador do usuário {ancora="Frontend" icone="download-from-cloud"}

Para arquivos no computador de quem está no SAP GUI, usa-se a classe `CL_GUI_FRONTEND_SERVICES`, com os métodos `gui_upload`, `gui_download` e `file_open_dialog`. Eles passam pela conexão do SAP GUI, então **não funcionam em background** nem em chamadas vindas de um navegador.

Em aplicações Fiori, o arquivo chega pelo protocolo: no RAP, um campo anotado como **large object** (`@Semantics.largeObject`) recebe o conteúdo binário, o tipo MIME e o nome, e o Fiori Elements já mostra o controle de upload e download.

:::aviso
No **ABAP Cloud** não há acesso ao sistema de arquivos: `OPEN DATASET` e `CL_GUI_FRONTEND_SERVICES` não existem. Dados entram e saem por serviços (OData com large objects, HTTP) ou por um armazenamento externo, como o serviço Object Store do SAP BTP, acessado por HTTP.
:::

## Data clusters {ancora="Data clusters" icone="database"}

Um **data cluster** é um pacote binário com um ou mais objetos de dados ABAP de **qualquer tipo**: estruturas aninhadas, tabelas internas, strings. `EXPORT` monta o pacote; `IMPORT` o desmonta. O destino pode ser a memória, uma tabela de banco ou uma simples variável.

| Destino | Sintaxe | Uso |
| --- | --- | --- |
| Variável `xstring` | `EXPORT … TO DATA BUFFER x` | Guardar ou transmitir dados complexos como um único campo binário |
| Tabela interna | `EXPORT … TO INTERNAL TABLE itab` | O mesmo, em linhas de tamanho fixo |
| Tabela de banco | `EXPORT … TO DATABASE dbtab(ar) ID id` | Persistir em uma tabela no formato `INDX` |
| ABAP Memory | `EXPORT … TO MEMORY ID id` | Passar dados entre programas da mesma sequência de chamadas |
| Shared memory | `EXPORT … TO SHARED BUFFER dbtab(ar) ID id` | Cache entre sessões da mesma instância |

```abap title="Guardando uma estrutura complexa em um campo"
DATA buffer TYPE xstring.

" Empacota: nome_no_cluster = objeto de dados
EXPORT settings = user_settings
       history  = last_searches
  TO DATA BUFFER buffer
  COMPRESSION ON.

" buffer pode ir para uma coluna RAWSTRING de uma tabela Z

" Desempacota: os tipos precisam ser compatíveis com os da gravação
TRY.
    IMPORT settings = user_settings
           history  = last_searches
      FROM DATA BUFFER buffer.
  CATCH cx_sy_import_mismatch_error.
    CLEAR: user_settings, last_searches.        " estrutura mudou desde a gravação
ENDTRY.
```

:::checklist
- O formato é **interno do ABAP**. Nenhum outro sistema consegue ler um data cluster: para trocar dados com terceiros, use XML ou JSON.
- O cluster depende dos **tipos** usados na gravação. Se a estrutura mudar de forma incompatível, o `IMPORT` de dados antigos falha. Trate a exceção e tenha um plano de migração.
- O conteúdo é opaco para o banco: não dá para filtrar com `WHERE` por um campo que está dentro do cluster.
- No ABAP Cloud só estão disponíveis os destinos `DATA BUFFER` e `INTERNAL TABLE`.
:::

:::documentacao
- [ABAP Keyword Documentation: interface de arquivos](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abenabap_language_files.htm)
- [ABAP Keyword Documentation: OPEN DATASET](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abapopen_dataset.htm)
- [ABAP Keyword Documentation: data clusters](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=abendata_cluster.htm)
:::
