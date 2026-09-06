import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import BuyerBadge from '../../components/ui/BuyerBadge';
import BuyerMatchCard from './BuyerMatchCard';
import { Check, X, Package, Star, Zap, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const OFFER_RIBBONS = [
  { key: 'best_price', label: 'Best Price', color: 'bg-amber-500 text-white', icon: TrendingUp },
  { key: 'fastest_payment', label: 'Fastest Payment', color: 'bg-blue-500 text-white', icon: Zap },
  { key: 'most_reliable', label: 'Most Reliable', color: 'bg-emerald-500 text-white', icon: Star },
];

const PAYMENT_SPEED = {
  'Immediate UPI': 0,
  'Advance 50%': 1,
  'Escrow on delivery': 2,
  'Net 7 Days': 3,
};

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  offer_received: 'bg-blue-100 text-blue-800 border-blue-200',
  offer_accepted: 'bg-purple-100 text-purple-800 border-purple-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
};

function computeRibbons(offers) {
  if (!offers || offers.length === 0) return {};
  const ribbons = {};
  // Best Price
  const sorted_price = [...offers].sort((a, b) => b.price_per_quintal - a.price_per_quintal);
  ribbons[sorted_price[0]?.id] = [...(ribbons[sorted_price[0]?.id] || []), 'best_price'];
  // Fastest Payment
  const sorted_payment = [...offers].sort((a, b) =>
    (PAYMENT_SPEED[a.payment_terms] ?? 99) - (PAYMENT_SPEED[b.payment_terms] ?? 99)
  );
  const fastestId = sorted_payment[0]?.id;
  ribbons[fastestId] = [...(ribbons[fastestId] || []), 'fastest_payment'];
  // Most Reliable (highest rating + tier weight)
  const tierWeight = { trusted_partner: 2, verified: 1, basic: 0 };
  const sorted_reliable = [...offers].sort((a, b) => {
    const scoreA = (a.buyers?.avg_rating || 0) + (tierWeight[a.buyers?.verification_tier] || 0);
    const scoreB = (b.buyers?.avg_rating || 0) + (tierWeight[b.buyers?.verification_tier] || 0);
    return scoreB - scoreA;
  });
  const reliableId = sorted_reliable[0]?.id;
  ribbons[reliableId] = [...(ribbons[reliableId] || []), 'most_reliable'];
  return ribbons;
}

function RejectModal({ offerId, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(offerId, reason || 'Price does not meet farmer expectation');
    onConfirm = null;
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground mb-1">Decline this offer?</h3>
        <p className="text-sm text-muted-foreground mb-4">The buyer will be notified with a polite message. You can optionally share your reason.</p>
        <textarea
          className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary mb-4 resize-none"
          rows={3}
          placeholder="Optional: Share reason (e.g. Price too low, prefer local buyer...)"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium py-2 px-4 rounded-lg transition-colors border border-slate-200">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-60">
            {loading ? 'Declining...' : 'Confirm Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FarmerLotsView() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [offersMap, setOffersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedLot, setExpandedLot] = useState(lotId || null);
  const [rejectModal, setRejectModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsRes] = await Promise.all([
        api.getLots('00000000-0000-0000-0000-000000000001')
      ]);
      setLots(lotsRes);

      // Fetch offers for lots that have received offers
      const offerFetches = lotsRes
        .filter(l => ['offer_received', 'offer_accepted'].includes(l.status))
        .map(async l => {
          const offers = await api.getOffers({ lotId: l.id });
          return { lotId: l.id, offers };
        });
      const results = await Promise.all(offerFetches);
      const map = {};
      results.forEach(r => { map[r.lotId] = r.offers; });
      setOffersMap(map);

      // Auto-expand specified lot from URL, or first lot with offers
      if (lotId) {
        setExpandedLot(lotId);
      } else {
        const firstWithOffers = lotsRes.find(l => l.status === 'offer_received');
        if (firstWithOffers) setExpandedLot(firstWithOffers.id);
      }
    } catch (err) {
      console.error('Failed to load lots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (lotId && !loading) {
      setExpandedLot(lotId);
      const timer = setTimeout(() => {
        const el = document.getElementById(`lot-${lotId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [lotId, loading]);

  const handleAccept = async (offerId, lotId) => {
    setActionLoading(offerId);
    try {
      const res = await api.acceptOffer(offerId);
      showToast(`Offer accepted! ${res.rejected_competing_count} competing offer(s) declined automatically.`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to accept offer', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (offerId, reason) => {
    setActionLoading(offerId);
    try {
      await api.rejectOffer(offerId, reason);
      setRejectModal(null);
      showToast('Offer declined gracefully. Buyer has been notified.');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to reject offer', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {[1, 2].map(i => (
        <div key={i} className="h-32 bg-white rounded-2xl border border-border animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2 transition-all ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">My Lots</h1>
        <p className="text-muted-foreground">Manage your active crop listings and review incoming buyer offers.</p>
      </div>

      {lots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold mb-1">No lots yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a lot to start receiving offers from verified buyers.</p>
          <a href="/farmer/create-lot" className="text-sm font-medium text-primary hover:underline">Create your first lot →</a>
        </div>
      ) : (
        <div className="space-y-4">
          {lots.map(lot => {
            const offers = offersMap[lot.id] || [];
            const submittedOffers = offers.filter(o => o.status === 'submitted');
            const acceptedOffer = offers.find(o => o.status === 'accepted');
            const ribbons = computeRibbons(submittedOffers);
            const isExpanded = expandedLot === lot.id;

            return (
              <div
                key={lot.id}
                id={`lot-${lot.id}`}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  lotId === lot.id ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border shadow-sm'
                }`}
              >
                {/* Lot Summary Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  onClick={() => setExpandedLot(isExpanded ? null : lot.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center border border-border/50 shadow-xs">
                      {lot.crops?.icon || '📦'}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {lot.quantity} {lot.crops?.unit || 'quintals'} of {lot.crops?.name}
                        <span className="ml-2 text-xs text-muted-foreground font-normal">Grade {lot.quality_grade}</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[lot.status] || 'bg-slate-100 text-slate-600'}`}>
                          {lot.status?.replace('_', ' ')}
                        </span>
                        {submittedOffers.length > 0 && (
                          <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                            {submittedOffers.length} offer{submittedOffers.length > 1 ? 's' : ''} waiting
                          </span>
                        )}
                        {acceptedOffer && (
                          <span className="text-xs text-purple-700 font-semibold bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5">
                            ✓ Offer Accepted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-muted-foreground">Listed</div>
                      <div className="text-xs font-medium">{new Date(lot.created_at).toLocaleDateString()}</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded: Offer Comparison */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Accepted Offer Banner */}
                    {acceptedOffer && (
                      <div className="bg-purple-50 border-b border-purple-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-purple-700 shrink-0" />
                          <div>
                            <span className="font-semibold text-purple-900">Offer Accepted from {acceptedOffer.buyers?.business_name}!</span>
                            <p className="text-xs text-purple-700 mt-0.5">
                              ₹{acceptedOffer.price_per_quintal}/quintal • {acceptedOffer.payment_terms} • {acceptedOffer.pickup_terms}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/farmer/logistics?lotId=${lot.id}`)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                        >
                          🚚 Book / Track Transport
                        </button>
                      </div>
                    )}

                    {submittedOffers.length === 0 && !acceptedOffer ? (
                      <div className="p-5 space-y-5">
                        <div className="bg-slate-50 rounded-xl p-5 text-center text-muted-foreground border border-border">
                          <div className="text-3xl mb-2">⏳</div>
                          <p className="text-sm">No offers yet. Buyers will be able to see and bid on this lot.</p>
                        </div>
                        {/* AI Buyer Matches — shown while waiting for offers */}
                        <BuyerMatchCard lotId={lot.id} />
                      </div>
                    ) : submittedOffers.length > 0 ? (
                      <div className="p-5">
                        {/* Fair Value Story */}
                        {submittedOffers.length >= 2 && (
                          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-900 flex items-start gap-2">
                            <span className="text-xl shrink-0">💰</span>
                            <div>
                              <strong className="block">Your Fair Value Story:</strong>
                              By comparing {submittedOffers.length} offers, you could earn{' '}
                              <strong>₹{((Math.max(...submittedOffers.map(o => o.price_per_quintal)) - Math.min(...submittedOffers.map(o => o.price_per_quintal))) * lot.quantity).toLocaleString('en-IN')}</strong>{' '}
                              more by choosing the highest bid vs the lowest.
                            </div>
                          </div>
                        )}

                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                          Compare {submittedOffers.length} Offer{submittedOffers.length > 1 ? 's' : ''}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {submittedOffers.map(offer => {
                            const offerRibbons = ribbons[offer.id] || [];
                            return (
                              <div key={offer.id} className={`relative rounded-xl border-2 p-5 transition-all ${offerRibbons.length > 0 ? 'border-amber-300 shadow-md shadow-amber-100' : 'border-border shadow-sm'}`}>
                                {/* Ribbon Tags */}
                                {offerRibbons.length > 0 && (
                                  <div className="absolute -top-3 left-4 flex gap-1.5">
                                    {offerRibbons.map(r => {
                                      const cfg = OFFER_RIBBONS.find(x => x.key === r);
                                      const Icon = cfg?.icon;
                                      return (
                                        <span key={r} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shadow ${cfg?.color}`}>
                                          {Icon && <Icon className="w-3 h-3" />} {cfg?.label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Buyer Info */}
                                <div className="flex justify-between items-start mb-3 mt-1">
                                  <div>
                                    <h4 className="font-bold text-foreground text-base">{offer.buyers?.business_name}</h4>
                                    <p className="text-xs text-muted-foreground">{offer.buyers?.city}, {offer.buyers?.district}</p>
                                    {offer.buyers?.avg_rating > 0 && (
                                      <p className="text-xs font-medium text-amber-600 mt-0.5">★ {Number(offer.buyers.avg_rating).toFixed(1)} • {offer.buyers.completed_transactions} deals</p>
                                    )}
                                  </div>
                                  <BuyerBadge tier={offer.buyers?.verification_tier} size="sm" />
                                </div>

                                {/* Price - Main KPI */}
                                <div className="bg-slate-50 border border-border rounded-xl p-3 mb-3 text-center">
                                  <div className="text-3xl font-bold text-primary tabular-nums">₹{Number(offer.price_per_quintal).toLocaleString('en-IN')}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">per {lot.crops?.unit || 'quintal'}</div>
                                  <div className="text-sm font-semibold text-foreground mt-1">
                                    Total: ₹{(offer.price_per_quintal * offer.offered_quantity).toLocaleString('en-IN')}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">({offer.offered_quantity}q)</span>
                                  </div>
                                </div>

                                {/* Terms */}
                                <div className="space-y-1.5 text-xs text-slate-700 mb-4">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment:</span>
                                    <span className="font-semibold flex items-center gap-1">
                                      {offer.payment_terms === 'Immediate UPI' && <Zap className="w-3 h-3 text-blue-500" />}
                                      {offer.payment_terms}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pickup:</span>
                                    <span className="font-semibold">{offer.pickup_terms}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Offer valid until:</span>
                                    <span className="font-semibold">{offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'Open'}</span>
                                  </div>
                                </div>
                                {offer.notes && (
                                  <p className="text-xs text-slate-600 italic bg-slate-50 rounded-lg p-2 border border-slate-200 mb-4">"{offer.notes}"</p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAccept(offer.id, lot.id)}
                                    disabled={actionLoading === offer.id}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1 disabled:opacity-60"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {actionLoading === offer.id ? 'Accepting...' : 'Accept Offer'}
                                  </button>
                                  <button
                                    onClick={() => setRejectModal(offer.id)}
                                    disabled={actionLoading === offer.id}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors border border-red-200 flex items-center justify-center gap-1 disabled:opacity-60"
                                  >
                                    <X className="w-3.5 h-3.5" /> Decline
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* AI Buyer Matches — also shown beneath accepted offer for future reference */}
                    {acceptedOffer && (
                      <div className="border-t border-border p-5">
                        <BuyerMatchCard lotId={lot.id} />
                      </div>
                    )}

                    {/* Rejected Offers (collapsed summary) */}
                    {offers.filter(o => o.status === 'rejected').length > 0 && (
                      <div className="bg-slate-50 border-t border-border px-5 py-3 text-xs text-muted-foreground">
                        {offers.filter(o => o.status === 'rejected').length} offer(s) declined on this lot.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <RejectModal
          offerId={rejectModal}
          onClose={() => setRejectModal(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}
