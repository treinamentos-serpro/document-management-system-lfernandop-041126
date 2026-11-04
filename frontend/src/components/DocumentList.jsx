import DownloadButton from './DownloadButton.jsx';

// Formata o tamanho em bytes para leitura humana.
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Lista de documentos com metadados e botão de download.
export default function DocumentList({ documents, loading, error }) {
  if (loading) return <p className="muted">Carregando documentos...</p>;
  if (error) return <p role="alert" className="alert-error">{error}</p>;
  if (documents.length === 0) return <p className="muted">Nenhum documento enviado ainda.</p>;

  return (
    <div className="table-wrapper">
      <table className="doc-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Dono</th>
            <th>Tamanho</th>
            <th>Enviado em</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="doc-name">{doc.originalName}</td>
              <td><span className="badge">{doc.owner}</span></td>
              <td>{formatSize(doc.size)}</td>
              <td>{new Date(doc.uploadedAt).toLocaleString('pt-BR')}</td>
              <td>
                <DownloadButton documentId={doc.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
