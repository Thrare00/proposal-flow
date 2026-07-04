import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Calculator,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Info,
  TrendingUp,
  ListChecks,
  Gauge,
} from 'lucide-react';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Industrial', 'Municipal'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

const EMPTY_PAYLOAD = {
  service: '',
  subScope: '',
  quantity: '',
  unit: '',
  miles: '',
  propertyType: PROPERTY_TYPES[0],
  condition: CONDITIONS[1],
  rush: false,
};

/** Normalize a catalog list (array of strings, or object map of key->label) into [{value,label}]. */
function normalizeOptions(source) {
  if (!source) return [];
  if (Array.isArray(source)) {
    return source.map((item) => {
      if (item && typeof item === 'object') {
        return {
          value: item.value ?? item.key ?? item.id ?? String(item.label ?? ''),
          label: item.label ?? item.name ?? String(item.value ?? item.key ?? item.id ?? ''),
        };
      }
      return { value: item, label: item };
    });
  }
  if (typeof source === 'object') {
    return Object.entries(source).map(([key, label]) => ({
      value: key,
      label: typeof label === 'string' ? label : key,
    }));
  }
  return [];
}

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `$${value}`;
  }
}

function formatLabel(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function KeyValueList({ data }) {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-baseline justify-between gap-3 border-b border-rare-gray/20 dark:border-rare-gray/30 py-1">
          <dt className="text-xs uppercase tracking-wide text-rare-gray dark:text-rare-cream/60 font-rare-sans">
            {formatLabel(key)}
          </dt>
          <dd className="text-sm font-medium text-rare-ink dark:text-rare-cream font-rare-sans">
            {typeof value === 'number' ? (formatCurrency(value) ?? value) : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

KeyValueList.propTypes = {
  data: PropTypes.object,
};

function BreakdownList({ breakdown }) {
  if (!breakdown) return null;
  const rows = Array.isArray(breakdown)
    ? breakdown
    : Object.entries(breakdown).map(([label, amount]) => ({ label, amount }));
  if (rows.length === 0) return null;
  return (
    <ul className="divide-y divide-rare-gray/20 dark:divide-rare-gray/30">
      {rows.map((row, idx) => {
        const label = row.label ?? row.name ?? row.key ?? `Item ${idx + 1}`;
        const amount = row.amount ?? row.value ?? row.total ?? row.price;
        return (
          <li key={`${label}-${idx}`} className="flex items-center justify-between py-1.5 text-sm font-rare-sans">
            <span className="text-rare-ink/80 dark:text-rare-cream/80">{label}</span>
            <span className="font-medium text-rare-ink dark:text-rare-cream">
              {typeof amount === 'number' ? (formatCurrency(amount) ?? amount) : (amount ?? '—')}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

BreakdownList.propTypes = {
  breakdown: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
};

export default function EstimateCalculator({ catalog, serviceLabels = {}, onEstimate }) {
  const [payload, setPayload] = useState(EMPTY_PAYLOAD);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const services = catalog && typeof catalog.services === 'object' ? catalog.services : {};
  const serviceOptions = Object.keys(services).map((key) => ({
    value: key,
    label: (serviceLabels && serviceLabels[key]) || services[key]?.label || formatLabel(key),
  }));

  const activeService = payload.service ? services[payload.service] : null;
  const subScopeOptions = normalizeOptions(activeService?.subScopes);
  const unitOptions = normalizeOptions(activeService?.units || activeService?.unit);
  const singleUnit = !Array.isArray(activeService?.units) && typeof activeService?.unit === 'string'
    ? activeService.unit
    : null;

  function updateField(field, value) {
    setPayload((prev) => ({ ...prev, [field]: value }));
  }

  function handleServiceChange(value) {
    setPayload((prev) => ({
      ...prev,
      service: value,
      subScope: '',
      unit: services[value]?.unit && typeof services[value].unit === 'string' ? services[value].unit : '',
    }));
  }

  async function runEstimate(currentPayload) {
    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await onEstimate(currentPayload);
      if (!response || response.error) {
        setStatus('error');
        setErrorMessage((response && response.error) || '');
        setResult(null);
        return;
      }
      setResult(response);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err?.message || '');
      setResult(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runEstimate(payload);
  }

  function handleRetry() {
    runEstimate(payload);
  }

  const isLoading = status === 'loading';

  const marginFloorWarning =
    result?.marginFloorWarning ||
    result?.warnings?.marginFloor ||
    (Array.isArray(result?.warnings) ? result.warnings.find((w) => /margin/i.test(String(w))) : null);

  return (
    <div className="rounded-xl border border-rare-gray/30 dark:border-rare-gray/40 bg-rare-cream dark:bg-rare-ink shadow-sm">
      <div className="flex items-center gap-2 px-5 pt-5">
        <Calculator className="h-5 w-5 text-rare-crimson" aria-hidden="true" />
        <h3 className="font-rare-serif text-lg text-rare-ink dark:text-rare-cream">Estimate Calculator</h3>
      </div>

      <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
            Service
          </span>
          <select
            value={payload.service}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="rounded-md border border-rare-gray/40 bg-white dark:bg-rare-ink dark:text-rare-cream px-3 py-2 text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson"
          >
            <option value="">Select a service…</option>
            {serviceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
            Sub-scope
          </span>
          <select
            value={payload.subScope}
            onChange={(e) => updateField('subScope', e.target.value)}
            disabled={!payload.service || subScopeOptions.length === 0}
            className="rounded-md border border-rare-gray/40 bg-white dark:bg-rare-ink dark:text-rare-cream px-3 py-2 text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson disabled:opacity-50"
          >
            <option value="">Select a sub-scope…</option>
            {subScopeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
            Quantity
          </span>
          <input
            type="number"
            min="0"
            value={payload.quantity}
            onChange={(e) => updateField('quantity', e.target.value)}
            placeholder="e.g. 1000"
            className="rounded-md border border-rare-gray/40 bg-white dark:bg-rare-ink dark:text-rare-cream px-3 py-2 text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
            Unit
          </span>
          {unitOptions.length > 0 ? (
            <select
              value={payload.unit}
              onChange={(e) => updateField('unit', e.target.value)}
              className="rounded-md border border-rare-gray/40 bg-white dark:bg-rare-ink dark:text-rare-cream px-3 py-2 text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson"
            >
              <option value="">Select a unit…</option>
              {unitOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={payload.unit || singleUnit || ''}
              onChange={(e) => updateField('unit', e.target.value)}
              placeholder="e.g. sq ft"
              readOnly={Boolean(singleUnit)}
              className="rounded-md border border-rare-gray/40 bg-white dark:bg-rare-ink dark:text-rare-cream px-3 py-2 text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson read-only:opacity-70"
            />
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
            Distance (miles)
          </span>
          <input
            type="number"
            min="0"
            value={payload.miles}
            onChange={(e) => updateField('miles', e.target.value)}
            placeholder="e.g. 25"
            className="rounded-md border border-rare-gray/40 bg-white dark:bg-rare-ink dark:text-rare-cream px-3 py-2 text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
            Property Type
          </span>
          <select
            value={payload.propertyType}
            onChange={(e) => updateField('propertyType', e.target.value)}
            className="rounded-md border border-rare-gray/40 bg-white dark:bg-rare-ink dark:text-rare-cream px-3 py-2 text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson"
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
            Condition
          </span>
          <select
            value={payload.condition}
            onChange={(e) => updateField('condition', e.target.value)}
            className="rounded-md border border-rare-gray/40 bg-white dark:bg-rare-ink dark:text-rare-cream px-3 py-2 text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 md:col-span-2 mt-1">
          <input
            type="checkbox"
            checked={payload.rush}
            onChange={(e) => updateField('rush', e.target.checked)}
            className="h-4 w-4 rounded border-rare-gray/50 text-rare-crimson focus:ring-rare-crimson"
          />
          <Zap className="h-4 w-4 text-rare-gold" aria-hidden="true" />
          <span className="text-sm font-rare-sans text-rare-ink dark:text-rare-cream">Rush job</span>
        </label>

        <div className="md:col-span-2 flex items-center gap-3 pt-1">
          <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-60">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Calculating…
              </span>
            ) : (
              'Calculate Estimate'
            )}
          </button>
        </div>
      </form>

      <div className="border-t border-rare-gray/20 dark:border-rare-gray/30 px-5 py-5">
        {status === 'idle' && (
          <div className="flex items-start gap-2 text-sm font-rare-sans text-rare-gray dark:text-rare-cream/60">
            <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p>Fill out the form and calculate to generate a live estimate. No price is shown until the server responds.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm font-rare-sans text-rare-gray dark:text-rare-cream/60">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Requesting estimate from server…
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-lg border border-rare-crimson/40 bg-rare-crimson/10 dark:bg-rare-crimson/15 px-4 py-3 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-rare-crimson shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-rare-sans font-medium text-rare-crimson">
                  Estimate service unreachable — no price generated.
                </p>
                {errorMessage && (
                  <p className="text-xs font-rare-sans text-rare-crimson/80 mt-0.5">{errorMessage}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="self-start inline-flex items-center gap-1.5 rounded-md border border-rare-crimson/50 px-3 py-1.5 text-xs font-rare-sans font-medium text-rare-crimson hover:bg-rare-crimson/10 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {status === 'success' && result && (
          <div className="flex flex-col gap-4">
            {typeof result.price === 'number' && (
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
                    Estimated Price
                  </p>
                  <p className="font-rare-serif text-3xl text-rare-lime-dark">
                    {formatCurrency(result.price) ?? result.price}
                  </p>
                </div>
                {typeof result.margin === 'number' && (
                  <div className="flex items-center gap-1.5 text-sm font-rare-sans text-rare-ink/80 dark:text-rare-cream/80">
                    <TrendingUp className="h-4 w-4 text-rare-lime" aria-hidden="true" />
                    Margin: {(result.margin * (result.margin <= 1 ? 100 : 1)).toFixed(1)}%
                  </div>
                )}
              </div>
            )}

            {marginFloorWarning && (
              <p className="flex items-start gap-1.5 text-xs font-rare-sans text-rare-gold">
                <Gauge className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                {typeof marginFloorWarning === 'string' ? marginFloorWarning : 'This estimate is near the margin floor.'}
              </p>
            )}

            {result.details && (
              <div>
                <p className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60 mb-1.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  Details
                </p>
                <KeyValueList data={result.details} />
              </div>
            )}

            {result.adjusters && (
              <div>
                <p className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60 mb-1.5 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                  Adjusters
                </p>
                <KeyValueList data={result.adjusters} />
              </div>
            )}

            {result.breakdown && (
              <div>
                <p className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60 mb-1.5 flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                  Breakdown
                </p>
                <BreakdownList breakdown={result.breakdown} />
              </div>
            )}

            {result.marketRange && (
              <div className="rounded-md border border-rare-gray/30 dark:border-rare-gray/40 px-3 py-2">
                <p className="text-xs font-rare-sans uppercase tracking-wide text-rare-gray dark:text-rare-cream/60">
                  Market Range
                </p>
                <p className="text-sm font-rare-sans text-rare-ink dark:text-rare-cream">
                  {formatCurrency(result.marketRange.low) ?? result.marketRange.low}
                  {' – '}
                  {formatCurrency(result.marketRange.high) ?? result.marketRange.high}
                </p>
                {result.marketRange.source && (
                  <p className="text-[11px] font-rare-sans text-rare-gray dark:text-rare-cream/50 mt-0.5">
                    Source: {result.marketRange.source}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

EstimateCalculator.propTypes = {
  catalog: PropTypes.shape({
    services: PropTypes.object,
  }).isRequired,
  serviceLabels: PropTypes.object,
  onEstimate: PropTypes.func.isRequired,
};
