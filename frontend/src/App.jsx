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
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '56rem', margin: '0 auto' }}>
      <h1>Document Management System</h1>
      <UploadComponent onUploaded={refreshDocuments} />
      <section style={{ marginTop: '2rem' }}>
        <h2>Documentos</h2>
        <DocumentList documents={documents} loading={loading} error={error} />
      </section>
    </main>
  );
}
