// Controllers de documentos: tratam entrada/saída HTTP e validação básica,
// delegando as regras de negócio ao service.

const fs = require('fs');
const documentService = require('../services/documentService');

function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo é obrigatório' });
  }

  const owner = typeof req.body.owner === 'string' ? req.body.owner.trim() : '';
  if (!owner) {
    // Remove o arquivo já gravado pelo multer, pois o upload é inválido.
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Campo owner é obrigatório' });
  }

  const document = documentService.createDocument({ file: req.file, owner });
  return res.status(201).json(document);
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
