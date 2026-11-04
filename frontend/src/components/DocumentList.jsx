import DownloadButton from './DownloadButton.jsx';

// Formata o tamanho em bytes para leitura humana.
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Lista de documentos com metadados e botão de download.
export default function DocumentList({ documents, loading, error }) {
  if (loading) return <p>Carregando documentos...</p>;
  if (error) return <p role="alert" style={{ color: 'crimson' }}>{error}</p>;
  if (documents.length === 0) return <p>Nenhum documento enviado ainda.</p>;

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Nome</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Dono</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Tamanho</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Enviado em</th>
          <th style={{ padding: '0.5rem' }} />
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id} style={{ borderTop: '1px solid #ddd' }}>
            <td style={{ padding: '0.5rem' }}>{doc.originalName}</td>
            <td style={{ padding: '0.5rem' }}>{doc.owner}</td>
            <td style={{ padding: '0.5rem' }}>{formatSize(doc.size)}</td>
            <td style={{ padding: '0.5rem' }}>
              {new Date(doc.uploadedAt).toLocaleString('pt-BR')}
            </td>
            <td style={{ padding: '0.5rem' }}>
              <DownloadButton documentId={doc.id} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
