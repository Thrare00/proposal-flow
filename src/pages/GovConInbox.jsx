import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Clock, Users, Mail, Send, RefreshCw, Loader2,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { buildApiUrl } from '../lib/runtimeApi.js';

const URGENCY_COLORS = {
  stale: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  watch: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hot: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const WINDOW_COLORS = {
  expired: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  closing: 'bg-amber-100 text-amber-800 border-amber-200',
  open: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

function Badge({ children, className }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}

function Section({ title, icon: Icon, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {count > 0 && (
            <Badge className="bg-gray-100 text-gray-700 border-gray-200">{count}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}

function QuickDraft({ proposalId, templateId, contactEmail, contactName, addToast }) {
  const [busy, setBusy] = useState(false);

  async function send(lane) {
    setBusy(true);
    try {
      const res = await fetch(buildApiUrl(`/proposals/${proposalId}/draft-email`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          overrides: { contactName, contactEmail },
          createDraft: true,
          lane,
          officialGovcon: lane === 'official_govcon',
          transport: lane === 'official_govcon' ? 'smtp' : 'gmail',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      addToast?.({
        title: lane === 'official_govcon' ? 'Official email sent' : 'Gmail draft created',
        description: data.rendered?.subject || '',
        variant: 'default',
      });
    } catch (err) {
      addToast?.({ title: 'Email failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  if (!contactEmail) return <span className="text-xs text-gray-400">No email on file</span>;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => send('general')}
        disabled={busy}
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        title="Create Gmail draft"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
      </button>
      <button
        onClick={() => send('official_govcon')}
        disabled={busy}
        className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        title="Send via official GovCon SMTP"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
      </button>
    </div>
  );
}

export default function GovConInbox() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/govcon/alerts'));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load alerts');
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button onClick={fetchAlerts} className="mt-3 text-sm text-red-600 underline">Retry</button>
      </div>
    );
  }

  const { staleInbounds = [], teamingWindows = [], officialDispatches = [], counts = {} } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GovCon Inbox</h1>
          <p className="text-sm text-gray-500">
            Stale inbounds, teaming windows, and official email actions
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <Badge className={counts.staleInbounds > 0 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
          {counts.staleInbounds} stale inbound{counts.staleInbounds !== 1 ? 's' : ''}
        </Badge>
        <Badge className={counts.criticalTeaming > 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
          {counts.teamingWindows} teaming window{counts.teamingWindows !== 1 ? 's' : ''}
          {counts.criticalTeaming > 0 && ` (${counts.criticalTeaming} critical)`}
        </Badge>
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          {counts.officialDispatches} official dispatch{counts.officialDispatches !== 1 ? 'es' : ''}
        </Badge>
      </div>

      {/* Stale Inbounds */}
      <Section title="Stale Inbounds" icon={AlertTriangle} count={staleInbounds.length}>
        {staleInbounds.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No stale inbounds detected. All inquiries are current.</p>
        ) : (
          <div className="space-y-2">
            {staleInbounds.map((alert) => (
              <div
                key={alert.proposalId}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/proposals/${alert.proposalId}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                    >
                      {alert.title}
                    </Link>
                    <Badge className={URGENCY_COLORS[alert.urgency] || URGENCY_COLORS.watch}>
                      {alert.urgency}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                      {alert.daysSinceLastTouch}d ago
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {alert.agency && <span>{alert.agency} · </span>}
                    {alert.solicitationNumber && <span>{alert.solicitationNumber} · </span>}
                    {alert.contactEmail || 'No contact email'}
                    {alert.suggestedAction === 'escalate' && (
                      <span className="ml-2 text-red-600 font-medium">Escalate</span>
                    )}
                  </div>
                </div>
                <QuickDraft
                  proposalId={alert.proposalId}
                  templateId={alert.suggestedTemplate}
                  contactEmail={alert.contactEmail}
                  contactName={alert.contactName}
                  addToast={addToast}
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Teaming Windows */}
      <Section title="Teaming Windows" icon={Users} count={teamingWindows.length} defaultOpen={teamingWindows.length > 0}>
        {teamingWindows.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No active teaming windows.</p>
        ) : (
          <div className="space-y-2">
            {teamingWindows.map((tw) => (
              <div
                key={tw.proposalId}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/proposals/${tw.proposalId}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                    >
                      {tw.title}
                    </Link>
                    <Badge className={WINDOW_COLORS[tw.windowStatus] || WINDOW_COLORS.open}>
                      {tw.windowStatus === 'expired' ? 'Expired' :
                       tw.windowStatus === 'critical' ? `${tw.daysRemaining}d left` :
                       `${tw.daysRemaining}d remaining`}
                    </Badge>
                    {tw.teamingRole && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        {tw.teamingRole}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {tw.agency && <span>{tw.agency} · </span>}
                    {tw.teamingPartner && <span>Partner: {tw.teamingPartner} · </span>}
                    Deadline: {tw.teamingDeadline ? new Date(tw.teamingDeadline).toLocaleDateString() : 'TBD'}
                    {tw.proposalDueDate && <span> · Due: {new Date(tw.proposalDueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <QuickDraft
                  proposalId={tw.proposalId}
                  templateId={tw.suggestedTemplate}
                  contactEmail={tw.contactEmail}
                  contactName={tw.contactName}
                  addToast={addToast}
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Official Dispatch History */}
      <Section title="Official Email Log" icon={Mail} count={officialDispatches.length} defaultOpen={false}>
        {officialDispatches.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No official GovCon emails dispatched yet.</p>
        ) : (
          <div className="space-y-2">
            {officialDispatches.slice(0, 20).map((d, i) => (
              <div
                key={d.id || i}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {d.subject || '(no subject)'}
                  </div>
                  <div className="text-xs text-gray-500">
                    To: {Array.isArray(d.to) ? d.to.join(', ') : d.to || '—'}
                    {' · '}
                    {d.dispatchedAt ? new Date(d.dispatchedAt).toLocaleString() : d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
                    {d.proposalTitle && (
                      <span> · <Link to={`/proposals/${d.proposalId}`} className="text-blue-600 hover:underline">{d.proposalTitle}</Link></span>
                    )}
                  </div>
                </div>
                <Badge className={d.status === 'dispatched' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                  {d.status || 'unknown'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg border px-4 py-3 shadow-lg text-sm ${
                t.variant === 'destructive'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <div className="font-medium">{t.title}</div>
              {t.description && <div className="text-xs mt-0.5 opacity-75">{t.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
