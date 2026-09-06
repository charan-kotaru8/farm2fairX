import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import BuyerBadge from '../../components/ui/BuyerBadge';
import { Search, Filter, ChevronDown } from 'lucide-react';

function OfferModal({ lot, crops, buyers, onClose, onSuccess }) {
  const [buyerId, setBuyerId] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(lot?.quantity || '');
  const [paymentTerms, setPaymentTerms] = useState('Immediate UPI');
  const [pickupTerms, setPickupTerms] = useState('Farmgate Pickup');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifiedBuyers = buyers.filter(b => b.verification_status === 'approved');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buyerId) { setError('Please select your buyer profile.'); return; }
    if (!price || isNaN(parseFloat(price))) { setError('Please enter a valid price.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.submitOffer({
        lot_id: lot.id,
        buyer_id: buyerId,
        price_per_quintal: parseFloat(price),
        offered_quantity: parseFloat(quantity) || lot.quantity,
        payment_terms: paymentTerms,
        pickup_terms: pickupTerms,
        valid_until: validUntil || null,
        notes
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">
            Submit Offer on {lot.crops?.icon} {lot.crops?.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lot.quantity} {lot.crops?.unit} • Grade {lot.quality_grade} • Farmer's lot
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-red-500 mt-0.5">⚠</span> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Your Buyer Profile</label>
            <select
              value={buyerId}
              onChange={e => setBuyerId(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select your business...</option>
              {verifiedBuyers.map(b => (
                <option key={b.id} value={b.id}>
                  {b.business_name} ({b.verification_tier})
                </option>
              ))}
            </select>
            {verifiedBuyers.length === 0 && (
              <p className="text-xs text-red-600 mt-1">No verified buyers available. Buyers must be approved by admin to submit offers.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Offer Price (₹/{lot.crops?.unit || 'quintal'})</label>
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="e.g. 4800" min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity ({lot.crops?.unit || 'quintals'})</label>
              <input
                type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                max={lot.quantity}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Terms</label>
              <select
                value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option>Immediate UPI</option>
                <option>Advance 50%</option>
                <option>Escrow on delivery</option>
                <option>Net 7 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pickup Terms</label>
              <select
                value={pickupTerms} onChange={e => setPickupTerms(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option>Farmgate Pickup</option>
                <option>Delivered to APMC</option>
                <option>Buyer Warehouse</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Offer Valid Until</label>
            <input
              type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes to Farmer (Optional)</label>
            <textarea
              rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              placeholder="e.g. We can arrange farm-gate pickup by Friday morning..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors border border-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={loading || verifiedBuyers.length === 0} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold py-2.5 px-4 rounded-xl transition-colors shadow disabled:opacity-60">
              {loading ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BuyerMarketplace() {
  const [lots, setLots] = useState([]);
  const [crops, setCrops] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCrop, setFilterCrop] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [offerModal, setOfferModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [allLots, allCrops, allBuyers] = await Promise.all([
          api.getLots(),
          api.getCrops(),
          api.getBuyers()
        ]);
        setLots(allLots.filter(l => ['active', 'offer_received'].includes(l.status) && !l.parent_aggregated_lot_id));
        setCrops(allCrops);
        setBuyers(allBuyers);
      } catch (err) {
        console.error('Failed to load marketplace:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredLots = lots.filter(lot => {
    if (filterCrop && lot.crop_id !== filterCrop) return false;
    if (filterGrade && lot.quality_grade !== filterGrade) return false;
    return true;
  });

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-7xl mx-auto">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="h-56 bg-white rounded-2xl border border-border animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-2">
          ✅ {toast}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Crop Marketplace</h1>
        <p className="text-muted-foreground">Browse and bid on verified farmer crop lots from across Maharashtra.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-xs flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Filter by Crop</label>
          <select
            value={filterCrop} onChange={e => setFilterCrop(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">All Crops</option>
            {crops.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Grade</label>
          <select
            value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">All Grades</option>
            <option value="A">Grade A (Premium)</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground pt-6">{filteredLots.length} lots available</div>
      </div>

      {/* Lot Grid */}
      {filteredLots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <div className="text-5xl mb-4">🌾</div>
          <h3 className="text-lg font-semibold mb-1">No matching lots</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters, or check back soon as farmers add new listings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredLots.map(lot => (
            <div key={lot.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col">
              <div className="bg-gradient-to-br from-primary/5 to-transparent p-5 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{lot.crops?.icon || '📦'}</div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{lot.crops?.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${lot.quality_grade === 'A' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : lot.quality_grade === 'B' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          Grade {lot.quality_grade}
                        </span>
                        {lot.is_aggregated && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1 shadow-2xs" title={`${lot.member_count || 2} member farmers pooled`}>
                            🌾 FPO Pool ({lot.member_count || 2} members)
                          </span>
                        )}
                        {lot.status === 'offer_received' && (
                          <span className="text-xs text-blue-700 font-medium">Active Offers</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 flex-1 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-semibold">{lot.quantity} {lot.crops?.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available From</span>
                  <span className="font-semibold">{lot.available_from ? new Date(lot.available_from).toLocaleDateString() : 'Immediate'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage Required</span>
                  <span className="font-semibold">{lot.storage_required ? 'Yes' : 'No'}</span>
                </div>
                {lot.description && (
                  <p className="text-xs text-muted-foreground italic border-t border-border/60 pt-2">{lot.description.slice(0, 100)}{lot.description.length > 100 ? '...' : ''}</p>
                )}
              </div>
              <div className="p-5 pt-3 border-t border-border">
                <button
                  onClick={() => setOfferModal(lot)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Make an Offer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {offerModal && (
        <OfferModal
          lot={offerModal}
          crops={crops}
          buyers={buyers}
          onClose={() => setOfferModal(null)}
          onSuccess={() => {
            setOfferModal(null);
            showToast('Your offer has been submitted to the farmer!');
          }}
        />
      )}
    </div>
  );
}
