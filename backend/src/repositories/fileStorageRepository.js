// Repositório de arquivos no filesystem local. Centraliza todo o conhecimento
// sobre onde e como os arquivos dos documentos vivem em disco (SRP).

const fs = require('fs');
const path = require('path');
const config = require('../config');

// Garante que o diretório de armazenamento exista (bootstrap da aplicação).
function ensureStorageDir() {
  fs.mkdirSync(config.storageDir, { recursive: true });
}

function resolvePath(storedName) {
  return path.join(config.storageDir, storedName);
}

// Remove um arquivo gravado; falhas são apenas registradas (arquivo órfão).
function remove(storedName) {
  fs.unlink(resolvePath(storedName), (err) => {
    if (err) {
      console.error('Falha ao remover arquivo do storage:', err.message);
    }
  });
}

module.exports = { ensureStorageDir, resolvePath, remove };
