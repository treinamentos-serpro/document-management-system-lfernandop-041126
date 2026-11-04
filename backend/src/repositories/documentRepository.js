// Repositório in-memory de metadados de documentos.
// Nesta fase os metadados vivem apenas em memória (ver RNF-02 da spec).

const documents = [];

function save(document) {
  documents.push(document);
  return document;
}

function findAll() {
  return [...documents];
}

function findById(id) {
  return documents.find((document) => document.id === id) || null;
}

// Utilizado apenas pelos testes para isolar cenários.
function clear() {
  documents.length = 0;
}

module.exports = { save, findAll, findById, clear };
