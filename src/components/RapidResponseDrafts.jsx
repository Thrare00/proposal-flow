import { useState, useEffect } from 'react';
import { Loader2, Mail, Send, Eye, CheckCircle2 } from 'lucide-react';
import { buildApiUrl } from '../lib/runtimeApi.js';

export default function RapidResponseDrafts({ proposal, addToast }) {
  const [templates, setTemplates] = useState([]);
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [lane, setLane] = useState('general');

  useEffect(() => {
    fetch(buildApiUrl('/rapid-response/templates'))
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setTemplates(data.templates);
      })
      .catch(() => {});
  }, []);

  const contactEmail = proposal?.metadata?.contactEmail || proposal?.contactEmail || '';
  const contactName = proposal?.metadata?.contactName || proposal?.contactName || '';

  const officialGovcon = lane === 'official_govcon';

  async function handleAction(templateId, createDraft) {
    const label = createDraft ? (officialGovcon ? 'Sending official email' : 'Creating draft') : 'Previewing';
    setBusy(`${templateId}-${createDraft ? 'draft' : 'preview'}`);
    try {
      const res = await fetch(buildApiUrl(`/proposals/${proposal.id}/draft-email`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          overrides: {
            contactName: overrides.contactName || contactName,
            contactEmail: overrides.contactEmail || contactEmail,
            ...overrides,
          },
          createDraft,
          lane,
          officialGovcon,
          transport: officialGovcon ? 'smtp' : 'gmail',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

      if (createDraft && data.draft) {
        addToast?.({
          title: officialGovcon ? 'Official GovCon Email Sent' : 'Gmail Draft Created',
          description: officialGovcon
            ? `Sent "${data.rendered.subject}" from admin@thrarecontracting.com`
            : `Draft "${data.rendered.subject}" created in Gmail`,
          variant: 'default',
        });
        setPreview(null);
      } else {
        setPreview({ templateId, ...data.rendered });
      }
    } catch (err) {
      addToast?.({
        title: `${label} failed`,
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  }

  if (!templates.length) return null;

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Rapid Response Drafts</h2>
            <p className="text-sm text-gray-500">
              Create Gmail drafts from templates (3-5 min SLA)
            </p>
          </div>
          <Mail className="h-5 w-5 text-blue-500" />
        </div>
      </div>

      {/* Override fields */}
      <div className="border-b border-gray-100 px-6 py-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email Lane</label>
          <select
            value={lane}
            onChange={(e) => setLane(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="general">General outreach, Gmail draft</option>
            <option value="official_govcon">Official GovCon lane, send via admin@thrarecontracting.com SMTP</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Recipient Name</label>
            <input
              type="text"
              value={overrides.contactName ?? contactName}
              onChange={(e) => setOverrides((o) => ({ ...o, contactName: e.target.value }))}
              placeholder="Contact name"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Recipient Email</label>
            <input
              type="email"
              value={overrides.contactEmail ?? contactEmail}
              onChange={(e) => setOverrides((o) => ({ ...o, contactEmail: e.target.value }))}
              placeholder="email@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">{t.label}</div>
              <div className="text-xs text-gray-500 truncate">{t.description}</div>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <button
                onClick={() => handleAction(t.id, false)}
                disabled={Boolean(busy)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === `${t.id}-preview` ? (
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <Eye className="mr-1.5 h-3 w-3" />
                )}
                Preview
              </button>
              <button
                onClick={() => handleAction(t.id, true)}
                disabled={Boolean(busy) || !(overrides.contactEmail || contactEmail)}
                title={!(overrides.contactEmail || contactEmail) ? 'Enter a recipient email first' : 'Create Gmail draft'}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === `${t.id}-draft` ? (
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3 w-3" />
                )}
                {officialGovcon ? 'Send Official Email' : 'Create Draft'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview pane */}
      {preview && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700">Preview</h3>
            <button
              onClick={() => setPreview(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Close
            </button>
          </div>
          {preview.to && (
            <div className="text-xs text-gray-500 mb-1">
              <span className="font-medium">To:</span> {preview.to}
            </div>
          )}
          <div className="text-xs text-gray-500 mb-2">
            <span className="font-medium">Subject:</span> {preview.subject}
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap font-sans">
            {preview.body}
          </pre>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => handleAction(preview.templateId, true)}
              disabled={Boolean(busy) || !(overrides.contactEmail || contactEmail)}
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === `${preview.templateId}-draft` ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {officialGovcon ? 'Send Official Email' : 'Create Gmail Draft'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
