# Especificação - Document Management System

> Especificação completa do Document Management System (DMS), gerada a partir
> de [spec-template.md](./spec-template.md) para orientar o desenvolvimento
> guiado por especificação (Spec Driven Development).

## 1. Objetivo

Entregar um sistema web que permita ao usuário enviar, listar e baixar
documentos, com gestão simples por usuário e armazenamento estritamente local
à aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de documentos (multipart/form-data)
- Listagem de documentos (metadados), com filtro opcional por dono
- Download de documentos pelo identificador
- Gestão simples por usuário: cada documento possui um dono (`owner`),
  informado como campo do formulário no upload

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Autenticação e autorização reais (não há login nesta fase)
- Edição e exclusão de documentos
- Banco de dados persistente (metadados ficam em memória)

## 3. Requisitos funcionais

| ID    | Requisito                                                                                    |
| ----- | -------------------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento via multipart/form-data, informando o campo `owner`        |
| RF-02 | O usuário pode listar os documentos enviados, com filtro opcional por `owner` (query string)  |
| RF-03 | O usuário pode baixar um documento pelo identificador, recebendo o nome original do arquivo   |
| RF-04 | O sistema rejeita upload sem arquivo, sem `owner`, com extensão não permitida ou acima do limite de tamanho |
| RF-05 | O sistema responde 404 ao tentar baixar um documento inexistente                              |
| RF-06 | O sistema expõe verificação de saúde em `GET /health`                                         |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| RNF-01 | Arquivos gravados no filesystem local da aplicação (`backend/storage`) via `multer` com `diskStorage` |
| RNF-02 | Metadados mantidos em memória nesta fase (repositório in-memory)                                  |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor); ver tabela abaixo                             |
| RNF-04 | Nomes de arquivo em disco gerados a partir do id único do documento (evita colisões e path traversal) |
| RNF-05 | Erros tratados nos limites HTTP com corpo JSON `{ "error": "mensagem" }` e status apropriado      |
| RNF-06 | Testes do backend escritos com o runner nativo do Node (`node:test`), exercitando o `app` exportado |

### Variáveis de ambiente

| Variável             | Padrão                 | Descrição                                        |
| -------------------- | ---------------------- | ------------------------------------------------ |
| `PORT`               | `3000`                 | Porta HTTP do backend                            |
| `STORAGE_DIR`        | `backend/storage`      | Diretório local de gravação dos arquivos         |
| `MAX_UPLOAD_SIZE_MB` | `12`                   | Tamanho máximo por arquivo, em megabytes         |
| `ALLOWED_EXTENSIONS` | `pdf,docx,txt,png,jpg` | Lista de extensões permitidas, separada por vírgula |

## 5. Modelo de dados (metadados do documento)

Entidade `Document`, mantida em memória pelo repositório:

| Campo        | Tipo          | Descrição                                                  |
| ------------ | ------------- | ---------------------------------------------------------- |
| id           | string (UUID) | Identificador único do documento                           |
| originalName | string        | Nome original do arquivo enviado                           |
| storedName   | string        | Nome do arquivo em disco (`<id><extensão>`); uso interno   |
| mimeType     | string        | Tipo MIME informado no upload                              |
| size         | number        | Tamanho em bytes                                           |
| uploadedAt   | string        | Data/hora do upload (ISO 8601)                             |
| owner        | string        | Identificador do usuário dono (campo do formulário)        |

Observação: `storedName` é detalhe de persistência e não é exposto nas
respostas da API.

## 6. Contratos de API

O frontend consome a API com o prefixo `/api` (o proxy do Vite remove o
prefixo e encaminha para o backend na porta 3000).

### POST /upload

Envia um documento.

- Entrada: `multipart/form-data`
  - `file` (binário, obrigatório): arquivo a enviar
  - `owner` (string, obrigatório): identificador do usuário dono
- Validações:
  - Arquivo presente
  - `owner` presente e não vazio
  - Extensão do arquivo dentro da allowlist (`ALLOWED_EXTENSIONS`)
  - Tamanho até `MAX_UPLOAD_SIZE_MB` (padrão 12 MB)
- Saída de sucesso: `201 Created`

```json
{
  "id": "4f1c2e8a-9b3d-4a6e-8f0c-1d2e3f4a5b6c",
  "originalName": "relatorio.pdf",
  "mimeType": "application/pdf",
  "size": 348211,
  "uploadedAt": "2026-11-04T18:45:00.000Z",
  "owner": "maria"
}
```

- Erros:
  - `400 Bad Request`: arquivo ausente, `owner` ausente ou extensão não permitida

    ```json
    { "error": "Extensão de arquivo não permitida" }
    ```

  - `413 Payload Too Large`: arquivo acima do limite configurado

    ```json
    { "error": "Arquivo excede o tamanho máximo de 12 MB" }
    ```

### GET /documents

Lista os metadados dos documentos enviados.

- Entrada: query string opcional `owner` para filtrar por dono
  (ex.: `GET /documents?owner=maria`)
- Saída de sucesso: `200 OK`

```json
[
  {
    "id": "4f1c2e8a-9b3d-4a6e-8f0c-1d2e3f4a5b6c",
    "originalName": "relatorio.pdf",
    "mimeType": "application/pdf",
    "size": 348211,
    "uploadedAt": "2026-11-04T18:45:00.000Z",
    "owner": "maria"
  }
]
```

Sem documentos, retorna `200 OK` com `[]`.

### GET /documents/:id/download

Baixa o conteúdo binário de um documento.

- Entrada: `id` do documento no caminho
- Saída de sucesso: `200 OK`
  - Corpo: conteúdo binário do arquivo
  - Cabeçalhos: `Content-Disposition: attachment; filename="<originalName>"`
    e `Content-Type` com o MIME do documento
- Erros:
  - `404 Not Found`: documento inexistente

    ```json
    { "error": "Documento não encontrado" }
    ```

### GET /health

Verificação de saúde (já presente no seed).

- Saída: `200 OK`

```json
{ "status": "ok" }
```

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples, com camadas em `backend/src`:
  - `routes/`: definem os endpoints e delegam para os controllers
  - `controllers/`: tratam entrada/saída HTTP e validação básica
  - `services/`: concentram as regras de negócio
  - `repositories/`: cuidam da persistência (arquivos locais + metadados em memória)
- Fluxo de dependência: `routes -> controllers -> services -> repositories`;
  camadas internas não conhecem camadas externas
- `multer` com `diskStorage` configurado no limite HTTP (middleware na rota de
  upload), gravando em `STORAGE_DIR` com nome derivado do id único
- Repositório in-memory com interface simples (`save`, `findAll`, `findById`),
  facilitando a troca futura por persistência real sem alterar os services
- Frontend React baseado em componentes:
  - `components/`: `UploadComponent`, `DocumentList`, `DownloadButton`
  - `services/`: cliente da API via `fetch`, usando o prefixo `/api`
  - `pages/`: apenas se necessário (manter o seed simples)
- Armazenamento estritamente local: nenhum provedor externo de arquivos

## 8. Plano de execução

Etapas na ordem de implementação (nenhuma executada nesta fase de spec):

1. Backend — criar `repositories/` com o repositório in-memory de metadados
   (`save`, `findAll`, `findById`)
2. Backend — criar `services/` com as regras de negócio de documentos
   (criação de metadados, listagem com filtro por `owner`, localização para download)
3. Backend — criar `controllers/` e `routes/`, configurar o `multer`
   (`diskStorage`, limite de tamanho, allowlist de extensões) e registrar as
   rotas `/upload`, `/documents` e `/documents/:id/download` no `app`
4. Backend — escrever testes com `node:test` cobrindo upload, listagem,
   download, validações (400/413) e documento inexistente (404)
5. Frontend — criar `services/` com o cliente da API (`fetch` via `/api`)
6. Frontend — criar `components/` (`UploadComponent`, `DocumentList`,
   `DownloadButton`) e integrá-los no `App`
7. Integração ponta a ponta (backend + proxy Vite) e ajustes finais
