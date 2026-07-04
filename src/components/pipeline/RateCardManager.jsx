import { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Pencil, X, Save, Ruler } from 'lucide-react';

const EMPTY_CARD = {
  service: '',
  sub_scope: '',
  base_rate: '',
  unit: '',
  property_type: '',
  notes: '',
};

function RateCardManager({ rates = [], serviceLabels = {}, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CARD);
  const [editingIndex, setEditingIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  const serviceOptions = Object.entries(serviceLabels || {});

  function openAddForm() {
    setForm(EMPTY_CARD);
    setEditingIndex(null);
    setShowForm(true);
  }

  function openEditForm(rate, index) {
    setForm({
      service: rate.service || '',
      sub_scope: rate.sub_scope || '',
      base_rate: rate.base_rate ?? '',
      unit: rate.unit || '',
      property_type: rate.property_type || '',
      notes: rate.notes || '',
    });
    setEditingIndex(index);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_CARD);
    setEditingIndex(null);
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.service || !form.base_rate || !form.unit) return;

    setSaving(true);
    try {
      const card = {
        ...form,
        base_rate: Number(form.base_rate),
        ...(editingIndex !== null ? { index: editingIndex } : {}),
      };
      await onSave(card);
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/95 dark:bg-rare-ink shadow-card rounded-xl p-5 font-rare-sans">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-rare-ink dark:text-rare-cream">
            Rate Cards
          </h3>
          <p className="text-sm text-rare-gray dark:text-rare-cream/60">
            Base pricing by service and property type
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="btn-primary inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          Add rate card
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-rare-cream dark:bg-white/5 rounded-lg p-4 mb-5 border border-rare-gray/20 dark:border-white/10"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-rare-ink dark:text-rare-cream">
              {editingIndex !== null ? 'Edit rate card' : 'New rate card'}
            </h4>
            <button
              type="button"
              onClick={closeForm}
              className="text-rare-gray hover:text-rare-crimson transition-colors"
              aria-label="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-rare-gray dark:text-rare-cream/70">
              Service
              <select
                value={form.service}
                onChange={(e) => handleChange('service', e.target.value)}
                required
                className="rounded-md border border-rare-gray/30 bg-white dark:bg-rare-ink dark:text-rare-cream px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rare-crimson/40"
              >
                <option value="" disabled>
                  Select a service
                </option>
                {serviceOptions.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-rare-gray dark:text-rare-cream/70">
              Sub-scope
              <input
                type="text"
                value={form.sub_scope}
                onChange={(e) => handleChange('sub_scope', e.target.value)}
                placeholder="e.g. Interior only"
                className="rounded-md border border-rare-gray/30 bg-white dark:bg-rare-ink dark:text-rare-cream px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rare-crimson/40"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-rare-gray dark:text-rare-cream/70">
              Base rate ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.base_rate}
                onChange={(e) => handleChange('base_rate', e.target.value)}
                placeholder="0.00"
                required
                className="rounded-md border border-rare-gray/30 bg-white dark:bg-rare-ink dark:text-rare-cream px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rare-crimson/40"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-rare-gray dark:text-rare-cream/70">
              Unit
              <input
                type="text"
                value={form.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="e.g. sq ft, hour, job"
                required
                className="rounded-md border border-rare-gray/30 bg-white dark:bg-rare-ink dark:text-rare-cream px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rare-crimson/40"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-rare-gray dark:text-rare-cream/70">
              Property type
              <input
                type="text"
                value={form.property_type}
                onChange={(e) => handleChange('property_type', e.target.value)}
                placeholder="e.g. Residential, Commercial"
                className="rounded-md border border-rare-gray/30 bg-white dark:bg-rare-ink dark:text-rare-cream px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rare-crimson/40"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-rare-gray dark:text-rare-cream/70 sm:col-span-2">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                placeholder="Any conditions, exclusions, or context"
                className="rounded-md border border-rare-gray/30 bg-white dark:bg-rare-ink dark:text-rare-cream px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rare-crimson/40 resize-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={closeForm}
              className="px-3 py-2 rounded-lg text-sm text-rare-gray hover:text-rare-ink dark:hover:text-rare-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save rate card'}
            </button>
          </div>
        </form>
      )}

      {rates && rates.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-rare-gray/20 dark:border-white/10 text-rare-gray dark:text-rare-cream/60">
                <th className="py-2 pr-3 font-medium">Service</th>
                <th className="py-2 pr-3 font-medium">Sub-scope</th>
                <th className="py-2 pr-3 font-medium">Base Rate</th>
                <th className="py-2 pr-3 font-medium">Property Type</th>
                <th className="py-2 pr-3 font-medium">Notes</th>
                <th className="py-2 pl-3 font-medium text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, index) => (
                <tr
                  key={`${rate.service}-${rate.sub_scope}-${index}`}
                  className="border-b border-rare-gray/10 dark:border-white/5 text-rare-ink dark:text-rare-cream"
                >
                  <td className="py-2.5 pr-3">
                    {serviceLabels?.[rate.service] || rate.service}
                  </td>
                  <td className="py-2.5 pr-3 text-rare-gray dark:text-rare-cream/70">
                    {rate.sub_scope || '—'}
                  </td>
                  <td className="py-2.5 pr-3 font-mono">
                    ${rate.base_rate}/{rate.unit}
                  </td>
                  <td className="py-2.5 pr-3">{rate.property_type || '—'}</td>
                  <td className="py-2.5 pr-3 text-rare-gray dark:text-rare-cream/70 max-w-xs truncate">
                    {rate.notes || '—'}
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditForm(rate, index)}
                      className="inline-flex items-center gap-1 text-rare-gray hover:text-rare-gold transition-colors"
                      aria-label={`Edit rate card for ${rate.service}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-rare-gray dark:text-rare-cream/60">
          <Ruler className="w-6 h-6" />
          <p className="text-sm">No rate cards yet — add your first.</p>
        </div>
      )}
    </div>
  );
}

RateCardManager.propTypes = {
  rates: PropTypes.arrayOf(
    PropTypes.shape({
      service: PropTypes.string,
      sub_scope: PropTypes.string,
      base_rate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      unit: PropTypes.string,
      property_type: PropTypes.string,
      notes: PropTypes.string,
    })
  ),
  serviceLabels: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default RateCardManager;
