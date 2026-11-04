// Configuração central do backend, lida de variáveis de ambiente (12-Factor).

const path = require('path');

const config = {
  port: Number(process.env.PORT) || 3000,
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(__dirname, '..', 'storage'),
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 12,
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'pdf,docx,txt,png,jpg')
    .split(',')
    .map((ext) => ext.trim().toLowerCase())
    .filter(Boolean),
};

module.exports = config;
