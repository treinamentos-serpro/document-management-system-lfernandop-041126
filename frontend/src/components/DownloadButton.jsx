import { getDownloadUrl } from '../services/documentsApi.js';

// Botão de download: link direto para o endpoint de download do backend.
export default function DownloadButton({ documentId }) {
  return (
    <a href={getDownloadUrl(documentId)} download>
      <button type="button">Baixar</button>
    </a>
  );
}
