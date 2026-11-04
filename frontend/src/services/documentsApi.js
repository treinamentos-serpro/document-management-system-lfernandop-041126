// Cliente da API do DMS. Todas as chamadas usam o prefixo /api, que o proxy
// do Vite encaminha ao backend durante o desenvolvimento.

const API_PREFIX = '/api';

// Extrai a mensagem de erro do corpo JSON ou usa uma mensagem padrão.
async function parseError(response) {
  try {
    const body = await response.json();
    return body.error || 'Erro inesperado ao comunicar com o servidor';
  } catch {
    return 'Erro inesperado ao comunicar com o servidor';
  }
}

export async function uploadDocument({ file, owner }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner', owner);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function listDocuments(owner) {
  const query = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const response = await fetch(`${API_PREFIX}/documents${query}`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export function getDownloadUrl(id) {
  return `${API_PREFIX}/documents/${encodeURIComponent(id)}/download`;
}
