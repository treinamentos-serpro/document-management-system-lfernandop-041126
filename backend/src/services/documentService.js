// Regras de negócio de documentos: criação de metadados, listagem com filtro
// por dono e localização de documento para download.
//
// A camada de serviço recebe DTOs neutros (não conhece multer/HTTP) e delega
// a persistência aos repositórios de metadados e de arquivos.

const documentRepository = require('../repositories/documentRepository');
const fileStorageRepository = require('../repositories/fileStorageRepository');

// Remove o campo interno storedName das respostas da API.
function toPublicDocument(document) {
  const { storedName, ...publicDocument } = document;
  return publicDocument;
}

function createDocument({ id, storedName, originalName, mimeType, size, owner }) {
  const document = {
    id,
    originalName,
    storedName,
    mimeType,
    size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  documentRepository.save(document);
  return toPublicDocument(document);
}

function listDocuments({ owner } = {}) {
  const documents = owner
    ? documentRepository.findAll().filter((document) => document.owner === owner)
    : documentRepository.findAll();
  return documents.map(toPublicDocument);
}

function getDocumentForDownload(id) {
  const document = documentRepository.findById(id);
  if (!document) {
    return null;
  }
  return {
    document: toPublicDocument(document),
    filePath: fileStorageRepository.resolvePath(document.storedName),
  };
}

module.exports = { createDocument, listDocuments, getDocumentForDownload };
