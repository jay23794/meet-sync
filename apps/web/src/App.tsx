import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then(r => r.json())
      .then(d => setStatus(d.success ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  const color = { checking: '#f59e0b', ok: '#10b981', error: '#ef4444' }[status];

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
      <h1>VideoChat</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span>API server — {status}</span>
      </div>
    </div>
  );
}