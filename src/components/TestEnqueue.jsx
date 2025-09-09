import React, { useState } from 'react';
import { enqueue } from '../lib/enqueue';

export default function TestEnqueue() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const sendTest = async () => {
    setLoading(true);
    setStatus('Queuing…');

    try {
      // Example job payload (adjust fields to match your watcher's expectations)
      const job = {
        id: `test-${Date.now()}`,
        action: 'log_opportunity',
        payload: {
          Source: 'PF Test',
          URL: 'https://example.com/opportunity/123',
          Title: 'Sample Opportunity',
          Agency: 'Test Agency',
          NAICS: '562119',
          PSC: 'F108',
          EstValue: 125000,
          DueDate: '2025-10-15',
          Role: 'Sub',
          Notes: 'This is a PF enqueue smoke test.'
        }
      };

      const res = await enqueue(job);
      setStatus(`OK: ${JSON.stringify(res)}`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Test Enqueue</h2>
      <p>Click to push a single test job into the queue service.</p>
      <button 
        onClick={sendTest}
        disabled={loading}
        className={`px-4 py-2 rounded ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
      >
        {loading ? 'Sending…' : 'Send Test Job'}
      </button>
      {status && (
        <pre className="mt-4 p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
          {status}
        </pre>
      )}
    </div>
  );
}
