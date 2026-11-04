// Servidor backend do Document Management System.
//
// Camadas (Clean Architecture simples): routes -> controllers -> services ->
// repositories. Uploads são gravados no filesystem local da aplicação usando
// multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const config = require('./config');
const documentRoutes = require('./routes/documentRoutes');
const fileStorageRepository = require('./repositories/fileStorageRepository');

const app = express();
const PORT = config.port;

// Bootstrap de infraestrutura: garante o diretório de armazenamento local.
fileStorageRepository.ensureStorageDir();

app.use(express.json());

// Endpoint de verificação de saúde.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
