// Rotas de documentos: configuram o multer (diskStorage local, allowlist de
// extensões e limite de tamanho) e delegam aos controllers.

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const multer = require('multer');
const config = require('../config');
const documentController = require('../controllers/documentController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storageDir),
  filename: (req, file, cb) => {
    // O id do documento nasce aqui e é propagado via file.documentId:
    // storedName = `<id><extensão>` (UUID evita colisões e path traversal).
    file.documentId = crypto.randomUUID();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.documentId}${extension}`);
  },
});

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (!config.allowedExtensions.includes(extension)) {
    const error = new Error('Extensão de arquivo não permitida');
    error.code = 'INVALID_EXTENSION';
    return cb(error);
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxUploadSizeMb * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

// Tratamento dos erros de upload no limite HTTP (ver RNF-05 da spec).
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `Arquivo excede o tamanho máximo de ${config.maxUploadSizeMb} MB`,
    });
  }
  if (err.code === 'INVALID_EXTENSION') {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
});

module.exports = router;
