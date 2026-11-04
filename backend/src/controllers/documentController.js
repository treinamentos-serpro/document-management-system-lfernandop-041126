// Controllers de documentos: tratam entrada/saída HTTP e validação básica,
// delegando as regras de negócio ao service.

const documentService = require('../services/documentService');
const fileStorageRepository = require('../repositories/fileStorageRepository');

// Mapeia o arquivo recebido pelo multer para um DTO neutro: a camada de
// serviço não conhece a estrutura de req.file.
function toUploadDto(file, owner) {
  return {
    id: file.documentId,
    storedName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    owner,
  };
}

function uploadDocument(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo é obrigatório' });
  }

  const owner = typeof req.body.owner === 'string' ? req.body.owner.trim() : '';
  if (!owner) {
    // Remove o arquivo já gravado pelo multer, pois o upload é inválido.
    fileStorageRepository.remove(req.file.filename);
    return res.status(400).json({ error: 'Campo owner é obrigatório' });
  }

  try {
    const document = documentService.createDocument(toUploadDto(req.file, owner));
    return res.status(201).json(document);
  } catch (err) {
    fileStorageRepository.remove(req.file.filename);
    return next(err);
  }
}

function listDocuments(req, res) {
  const documents = documentService.listDocuments({ owner: req.query.owner });
  return res.json(documents);
}

function downloadDocument(req, res) {
  const result = documentService.getDocumentForDownload(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Documento não encontrado' });
  }

  res.type(result.document.mimeType);
  return res.download(result.filePath, result.document.originalName, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'Documento não encontrado' });
    }
  });
}

module.exports = { uploadDocument, listDocuments, downloadDocument };
