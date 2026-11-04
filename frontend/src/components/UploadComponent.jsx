import { useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';

// Formulário de upload de documento: arquivo + dono (owner).
export default function UploadComponent({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!file) {
      setError('Selecione um arquivo para enviar');
      return;
    }
    if (!owner.trim()) {
      setError('Informe o dono do documento');
      return;
    }

    setSending(true);
    try {
      const document = await uploadDocument({ file, owner: owner.trim() });
      setFile(null);
      event.target.reset();
      onUploaded?.(document);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <input
        type="file"
        className="file-input"
        onChange={(event) => setFile(event.target.files[0] ?? null)}
        disabled={sending}
      />
      <input
        type="text"
        className="input"
        placeholder="Dono do documento (ex.: maria)"
        value={owner}
        onChange={(event) => setOwner(event.target.value)}
        disabled={sending}
      />
      <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? 'Enviando...' : 'Enviar'}
      </button>
      {error && <p role="alert" className="form-error">{error}</p>}
    </form>
  );
}
