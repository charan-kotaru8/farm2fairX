import React, { useState, useEffect } from 'react';
import { Warehouse, Calendar, Link2, CheckCircle2, AlertCircle, FileText, Phone, MapPin, X } from 'lucide-react';
import { api } from '../../services/api';

export default function MyStorageBookings({ onRefreshTrigger }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attachModalBooking, setAttachModalBooking] = useState(null);
  const [availableLots, setAvailableLots] = useState([]);
  const [selectedAttachLotId, setSelectedAttachLotId] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsList, lotsList] = await Promise.all([
        api.getStorageBookings(),
        api.getLots(),
      ]);
      setBookings(bookingsList);
      setAvailableLots(lotsList.filter((l) => ['active', 'draft', 'offer_received'].includes(l.status)));
    } catch (err) {
      console.error('Failed to load storage bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [onRefreshTrigger]);

  const handleAttachSubmit = async (e) => {
    e.preventDefault();
    if (!attachModalBooking || !selectedAttachLotId) return;
    setAttaching(true);

    try {
      await api.attachStorageBookingToLot(attachModalBooking.id, selectedAttachLotId);
      showToast('Storage booking successfully attached to crop lot!');
      setAttachModalBooking(null);
      setSelectedAttachLotId('');
      loadData();
    } catch (err) {
      console.error('Failed to attach booking:', err);
      alert(err.message || 'Failed to attach booking to lot');
    } finally {
      setAttaching(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-36 bg-white rounded-2xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-3xl">
          🏬
        </div>
        <h3 className="text-base font-bold text-slate-800">No storage bookings yet</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Reserve buffer storage at certified WDRA warehouses to preserve grain quality and wait for seasonal market price highs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-bold bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map((b) => {
          const isAttached = Boolean(b.lot_id);

          return (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-border shadow-xs hover:shadow-md transition-all p-5 space-y-4 flex flex-col justify-between"
            >
              {/* Receipt & Facility */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {b.receipt_number || 'WH-REC-2026-XXXX'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                    {b.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {b.storage_facilities?.name || 'Warehouse Facility'}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" /> {b.storage_facilities?.address || b.storage_facilities?.district}
                  </p>
                </div>

                {/* Booking metrics */}
                <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 rounded-xl px-3 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Quantity</span>
                    <span className="font-bold text-slate-900">{b.quantity_quintals} quintals</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Duration</span>
                    <span className="font-bold text-slate-900">{b.duration_months} month(s)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Total Rent</span>
                    <span className="font-bold text-emerald-700">₹{b.total_cost}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Valid: {new Date(b.start_date).toLocaleDateString()} — {new Date(b.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Linkage Section (§6.4) */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                {isAttached ? (
                  <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="font-semibold">Attached to Crop Lot</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Standalone Buffer Storage
                    </span>
                    <button
                      onClick={() => {
                        setAttachModalBooking(b);
                        setSelectedAttachLotId(availableLots[0]?.id || '');
                      }}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Attach to Lot
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Attach to Lot Modal */}
      {attachModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" /> Attach Storage to Crop Lot
              </h3>
              <button
                onClick={() => setAttachModalBooking(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Link receipt <span className="font-bold text-slate-800">{attachModalBooking.receipt_number}</span> ({attachModalBooking.quantity_quintals}q) directly to one of your active crop listings (§6.4).
            </p>

            <form onSubmit={handleAttachSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Crop Lot</label>
                <select
                  value={selectedAttachLotId}
                  onChange={(e) => setSelectedAttachLotId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-primary bg-white shadow-2xs"
                >
                  {availableLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.crops?.icon || '🌾'} {l.crops?.name} ({l.quantity}q) — Grade {l.quality_grade} [{l.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAttachModalBooking(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={attaching || !selectedAttachLotId}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {attaching ? 'Attaching...' : 'Attach Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
