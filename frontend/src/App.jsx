import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentsApi.js';

// Componente raiz do DMS: upload, listagem e download de documentos.
export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDocuments(await listDocuments());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  return (
    <main className="app">
      <header className="app-header">
        <h1>Document Management System</h1>
        <p>Envie, liste e baixe documentos — armazenamento local.</p>
      </header>
      <section className="card">
        <h2>Enviar documento</h2>
        <UploadComponent onUploaded={refreshDocuments} />
      </section>
      <section className="card">
        <h2>Documentos</h2>
        <DocumentList documents={documents} loading={loading} error={error} />
      </section>
    </main>
  );
}
