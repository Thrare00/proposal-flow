import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Save, X } from 'lucide-react';
import { CPARS_OPTIONS, EMPTY_RECORD, OWNER_DEFAULT } from './constants.js';

const inputCls =
  'rounded-md border border-rare-gray/30 bg-white dark:bg-rare-ink dark:text-rare-cream px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rare-crimson/40';
const labelCls = 'flex flex-col gap-1 text-xs font-medium font-rare-sans text-rare-gray dark:text-rare-cream/70';

export default function PastPerformanceForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(initialData || EMPTY_RECORD);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData || EMPTY_RECORD);
  }, [initialData]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.contractName || !form.agency) return;

    setSaving(true);
    try {
      await onSave({
        ...form,
        value: form.value === '' ? '' : Number(form.value),
      });
    } finally {
      setSaving(false);
    }
  }

  const isEditing = Boolean(initialData);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-rare-cream dark:bg-white/5 rounded-lg p-4 mb-5 border border-rare-gray/20 dark:border-white/10 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-rare-serif text-base font-bold text-rare-ink dark:text-rare-cream">
          {isEditing ? 'Edit Past-Performance Record' : 'New Past-Performance Record'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-rare-gray hover:text-rare-crimson transition-colors"
          aria-label="Close form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelCls}>
          Contract name
          <input
            type="text"
            value={form.contractName}
            onChange={(e) => handleChange('contractName', e.target.value)}
            placeholder="e.g. Base Facilities Maintenance IDIQ"
            required
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          Agency
          <input
            type="text"
            value={form.agency}
            onChange={(e) => handleChange('agency', e.target.value)}
            placeholder="e.g. Dept. of Veterans Affairs"
            required
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          Owner
          <input
            type="text"
            value={form.owner ?? OWNER_DEFAULT}
            onChange={(e) => handleChange('owner', e.target.value)}
            placeholder={OWNER_DEFAULT}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          NAICS
          <input
            type="text"
            value={form.naics}
            onChange={(e) => handleChange('naics', e.target.value)}
            placeholder="e.g. 561210"
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          PSC
          <input
            type="text"
            value={form.psc}
            onChange={(e) => handleChange('psc', e.target.value)}
            placeholder="e.g. R499"
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          Contract value ($)
          <input
            type="number"
            min="0"
            step="1"
            value={form.value}
            onChange={(e) => handleChange('value', e.target.value)}
            placeholder="0"
            className={`${inputCls} font-mono`}
          />
        </label>

        <label className={labelCls}>
          CPARS rating
          <select
            value={form.cparsRating}
            onChange={(e) => handleChange('cparsRating', e.target.value)}
            className={inputCls}
          >
            {CPARS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          Period of performance — start
          <input
            type="date"
            value={form.popStart}
            onChange={(e) => handleChange('popStart', e.target.value)}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          Period of performance — end
          <input
            type="date"
            value={form.popEnd}
            onChange={(e) => handleChange('popEnd', e.target.value)}
            className={inputCls}
          />
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          Relevance blurb
          <textarea
            value={form.relevanceBlurb}
            onChange={(e) => handleChange('relevanceBlurb', e.target.value)}
            rows={3}
            placeholder="Why this contract is relevant to future bids — scope, scale, outcomes"
            className={`${inputCls} resize-none`}
          />
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          Tags (comma-separated)
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="e.g. facilities, IDIQ, small-business"
            className={inputCls}
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg text-sm font-rare-sans text-rare-gray hover:text-rare-ink dark:hover:text-rare-cream transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add record'}
        </button>
      </div>
    </form>
  );
}

PastPerformanceForm.propTypes = {
  initialData: PropTypes.shape({
    id: PropTypes.string,
    contractName: PropTypes.string,
    agency: PropTypes.string,
    naics: PropTypes.string,
    psc: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    popStart: PropTypes.string,
    popEnd: PropTypes.string,
    cparsRating: PropTypes.string,
    relevanceBlurb: PropTypes.string,
    tags: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    owner: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

PastPerformanceForm.defaultProps = {
  initialData: null,
};
