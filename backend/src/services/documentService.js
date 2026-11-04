// Regras de negócio de documentos: criação de metadados, listagem com filtro
// por dono e localização de documento para download.

const path = require('path');
const config = require('../config');
const documentRepository = require('../repositories/documentRepository');

// Remove o campo interno storedName das respostas da API.
function toPublicDocument(document) {
  const { storedName, ...publicDocument } = document;
  return publicDocument;
}

function createDocument({ file, owner }) {
  // O id do documento é o nome do arquivo em disco sem a extensão
  // (storedName = `<id><extensão>`, gerado pelo multer).
  const extension = path.extname(file.filename);
  const id = path.basename(file.filename, extension);

  const document = {
    id,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  documentRepository.save(document);
  return toPublicDocument(document);
}

function listDocuments({ owner } = {}) {
  let documents = documentRepository.findAll();
  if (owner) {
    documents = documents.filter((document) => document.owner === owner);
  }
  return documents.map(toPublicDocument);
}

function getDocumentForDownload(id) {
  const document = documentRepository.findById(id);
  if (!document) {
    return null;
  }
  return {
    document: toPublicDocument(document),
    filePath: path.join(config.storageDir, document.storedName),
  };
}

module.exports = { createDocument, listDocuments, getDocumentForDownload };
