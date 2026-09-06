import React, { useState, useEffect } from 'react';
import { Warehouse, Calendar, Package, IndianRupee, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function StorageBookingModal({ facility, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(50);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [selectedLotId, setSelectedLotId] = useState('');
  const [availableLots, setAvailableLots] = useState([]);
  const [notes, setNotes] = useState('Buffer storage reservation for seasonal price optimization');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch lots to offer optional lot-attachment (§6.4)
  useEffect(() => {
    async function loadLots() {
      try {
        const allLots = await api.getLots();
        const activeLots = allLots.filter((l) => ['active', 'draft', 'offer_received'].includes(l.status));
        setAvailableLots(activeLots);
      } catch (_) {}
    }
    loadLots();
  }, []);

  // Compute duration in months
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  const diffTime = Math.max(d2 - d1, 30 * 24 * 60 * 60 * 1000);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const durationMonths = Math.max(Math.round(diffDays / 30), 1);

  const ratePerQ = parseFloat(facility?.price_per_quintal_month || 45.0);
  const totalCost = Math.round(quantity * ratePerQ * durationMonths);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }
    if (quantity > parseFloat(facility.available_capacity_quintals || 0)) {
      setError(`Quantity exceeds available warehouse capacity (${facility.available_capacity_quintals}q).`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        facility_id: facility.id,
        quantity_quintals: parseFloat(quantity),
        start_date: startDate,
        end_date: endDate,
        lot_id: selectedLotId || null,
        notes: notes,
      };

      const res = await api.bookStorageSpace(payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      console.error('Failed to book storage:', err);
      setError(err.message || 'Failed to book storage space');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Book Storage Space</h2>
              <p className="text-xs text-muted-foreground">{facility?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Facility quick stats */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between text-xs">
            <div>
              <span className="text-muted-foreground block">Monthly Rate:</span>
              <span className="font-bold text-slate-800 text-sm">₹{ratePerQ} / q / mo</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Available Capacity:</span>
              <span className="font-bold text-emerald-700 text-sm">{facility?.available_capacity_quintals}q</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Distance:</span>
              <span className="font-bold text-slate-800 text-sm">{facility?.computed_distance_km} km</span>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to Store (Quintals)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={facility?.available_capacity_quintals || 5000}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-primary shadow-2xs"
              />
              <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">quintals</span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-primary shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-primary shadow-2xs"
              />
            </div>
          </div>

          {/* Standalone vs Lot-Attachment Linkage (§6.4) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attach to Existing Lot (Optional)
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary shadow-2xs bg-white"
            >
              <option value="">None (Keep as Standalone Buffer Storage)</option>
              {availableLots.map((l) => (
                <option key={l.id} value={l.id}>
                  Attach to: {l.crops?.name || 'Crop'} ({l.quantity}q) — Grade {l.quality_grade}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              {selectedLotId
                ? 'This booking will be linked to the selected lot and shown on its timeline.'
                : 'Standalone bookings can be stored now and attached to any lot later.'}
            </p>
          </div>

          {/* Cost Preview */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex justify-between items-center text-xs">
            <div>
              <span className="text-emerald-800 font-bold block">Estimated Storage Cost</span>
              <span className="text-emerald-600 text-[11px]">
                {quantity}q × ₹{ratePerQ} × {durationMonths} month(s)
              </span>
            </div>
            <div className="text-right">
              <span className="font-heading font-extrabold text-emerald-800 text-lg">₹{totalCost}</span>
              <span className="text-[10px] text-emerald-600 block">GST & Insurance included</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Confirming Booking...' : 'Confirm & Reserve Space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
