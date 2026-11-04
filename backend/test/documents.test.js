// Testes de integração dos endpoints de documentos (upload, listagem e
// download), usando o runner nativo node:test e fetch contra um servidor
// HTTP real em porta efêmera.

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Configuração de teste: storage temporário e limite baixo para o caso 413.
const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_UPLOAD_SIZE_MB = '1';

const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(storageDir, { recursive: true, force: true });
});

beforeEach(() => {
  documentRepository.clear();
  // Limpa arquivos deixados por testes anteriores no storage temporário.
  for (const file of fs.readdirSync(storageDir)) {
    fs.rmSync(path.join(storageDir, file), { force: true });
  }
});

// Monta um multipart/form-data de upload.
function buildUploadForm({ fileName = 'teste.txt', content = 'conteúdo', owner = 'maria' } = {}) {
  const form = new FormData();
  if (fileName) {
    form.append('file', new Blob([content], { type: 'text/plain' }), fileName);
  }
  if (owner !== null) {
    form.append('owner', owner);
  }
  return form;
}

async function uploadDocument(options) {
  return fetch(`${baseUrl}/upload`, { method: 'POST', body: buildUploadForm(options) });
}

test('POST /upload cria o documento e retorna os metadados', async () => {
  const response = await uploadDocument({ fileName: 'relatorio.txt', owner: 'maria' });
  assert.strictEqual(response.status, 201);

  const body = await response.json();
  assert.ok(body.id, 'deve retornar um id');
  assert.strictEqual(body.originalName, 'relatorio.txt');
  assert.strictEqual(body.owner, 'maria');
  assert.ok(body.size > 0);
  assert.ok(body.uploadedAt);
  assert.strictEqual(body.storedName, undefined, 'storedName não deve ser exposto');

  // O arquivo deve existir em disco com o nome <id><ext>.
  assert.ok(fs.existsSync(path.join(storageDir, `${body.id}.txt`)));
});

test('POST /upload sem arquivo responde 400', async () => {
  const response = await uploadDocument({ fileName: null });
  assert.strictEqual(response.status, 400);
  const body = await response.json();
  assert.strictEqual(body.error, 'Arquivo é obrigatório');
});

test('POST /upload sem owner responde 400 e remove o arquivo do storage', async () => {
  const response = await uploadDocument({ owner: null });
  assert.strictEqual(response.status, 400);
  const body = await response.json();
  assert.strictEqual(body.error, 'Campo owner é obrigatório');

  // Aguarda a remoção assíncrona do arquivo órfão.
  await new Promise((resolve) => setTimeout(resolve, 100));
  const files = fs.readdirSync(storageDir);
  assert.deepStrictEqual(files, [], 'o arquivo órfão deve ser removido');
});

test('POST /upload com extensão não permitida responde 400', async () => {
  const response = await uploadDocument({ fileName: 'script.exe' });
  assert.strictEqual(response.status, 400);
  const body = await response.json();
  assert.strictEqual(body.error, 'Extensão de arquivo não permitida');
});

test('POST /upload acima do limite de tamanho responde 413', async () => {
  const bigContent = 'x'.repeat(2 * 1024 * 1024); // 2 MB > limite de 1 MB
  const response = await uploadDocument({ content: bigContent });
  assert.strictEqual(response.status, 413);
  const body = await response.json();
  assert.match(body.error, /tamanho máximo/);
});

test('GET /documents lista os documentos enviados', async () => {
  await uploadDocument({ fileName: 'a.txt', owner: 'maria' });
  await uploadDocument({ fileName: 'b.txt', owner: 'joao' });

  const response = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(response.status, 200);
  const documents = await response.json();
  assert.strictEqual(documents.length, 2);
});

test('GET /documents filtra por owner', async () => {
  await uploadDocument({ fileName: 'a.txt', owner: 'maria' });
  await uploadDocument({ fileName: 'b.txt', owner: 'joao' });

  const response = await fetch(`${baseUrl}/documents?owner=joao`);
  const documents = await response.json();
  assert.strictEqual(documents.length, 1);
  assert.strictEqual(documents[0].owner, 'joao');
});

test('GET /documents retorna lista vazia sem documentos', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), []);
});

test('GET /documents/:id/download baixa o arquivo com o nome original', async () => {
  const uploadResponse = await uploadDocument({
    fileName: 'contrato.txt',
    content: 'conteúdo do contrato',
  });
  const { id } = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${id}/download`);
  assert.strictEqual(response.status, 200);
  assert.match(
    response.headers.get('content-disposition'),
    /attachment; filename="contrato.txt"/
  );
  assert.strictEqual(await response.text(), 'conteúdo do contrato');
});

test('GET /documents/:id/download responde 404 para id inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`);
  assert.strictEqual(response.status, 404);
  const body = await response.json();
  assert.strictEqual(body.error, 'Documento não encontrado');
});
