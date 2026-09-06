import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import BuyerBadge from '../../components/ui/BuyerBadge';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function FpoAggregatedLotsView() {
  const location = useLocation();
  const navigate = useNavigate();

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLotId, setExpandedLotId] = useState(null);
  const [lotPayouts, setLotPayouts] = useState({});
  const [acceptingOfferId, setAcceptingOfferId] = useState(null);
  const [toast, setToast] = useState(location.state?.justCreated ? 'Aggregated lot published successfully to the marketplace!' : null);

  const loadAggregatedLots = async () => {
    try {
      const data = await api.getFpoAggregatedLots();
      setLots(data);
      if (data.length > 0 && !expandedLotId) {
        // Automatically expand the first lot to showcase payout splits
        setExpandedLotId(data[0].id);
        loadPayoutDetails(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load aggregated lots:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayoutDetails = async (lotId) => {
    try {
      const res = await api.getFpoPayoutSplits(lotId);
      setLotPayouts(prev => ({ ...prev, [lotId]: res }));
    } catch (err) {
      console.error('Failed to load payout splits for lot', lotId, err);
    }
  };

  useEffect(() => {
    loadAggregatedLots();
  }, []);

  const handleToggleExpand = (lotId) => {
    if (expandedLotId === lotId) {
      setExpandedLotId(null);
    } else {
      setExpandedLotId(lotId);
      if (!lotPayouts[lotId]) {
        loadPayoutDetails(lotId);
      }
    }
  };

  const handleAcceptOffer = async (offerId, lotId) => {
    setAcceptingOfferId(offerId);
    try {
      await api.acceptOffer(offerId);
      setToast('Offer accepted! Member payout shares computed and placed into Escrow.');
      await loadAggregatedLots();
      await loadPayoutDetails(lotId);
    } catch (err) {
      alert(err.message || 'Failed to accept offer');
    } finally {
      setAcceptingOfferId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-16 bg-white rounded-2xl" />
        <div className="h-64 bg-white rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {toast && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-sm text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:text-emerald-950 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Aggregated Batches & Payouts
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage collective commercial lots, incoming buyer bids, and per-member escrow disbursements.
          </p>
        </div>

        <button
          onClick={() => navigate('/fpo/aggregate')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Aggregated Lot</span>
        </button>
      </div>

      {lots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No aggregated lots created yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Combine individual member harvests into bulk lots to attract institutional processors and secure higher prices.
          </p>
          <button
            onClick={() => navigate('/fpo/aggregate')}
            className="bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-xl shadow"
          >
            Start Aggregation Flow
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {lots.map(lot => {
            const isExpanded = expandedLotId === lot.id;
            const payoutInfo = lotPayouts[lot.id];
            const offers = lot.offers || [];
            const isAccepted = lot.status === 'offer_accepted';

            return (
              <div
                key={lot.id}
                className="bg-white rounded-2xl border border-border shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Lot Header Summary */}
                <div className="p-6 border-b border-border/80">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl flex items-center justify-center shrink-0">
                        {lot.crops?.icon || '🌾'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-heading font-bold text-xl text-foreground">
                            {lot.crops?.name || 'Crop'} Bulk Lot
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-900 border-amber-300">
                            🌾 FPO Pool ({lot.member_count} farmers)
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              lot.quality_grade === 'A'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            Grade {lot.quality_grade}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              isAccepted
                                ? 'bg-emerald-500 text-white font-bold'
                                : lot.status === 'offer_received'
                                ? 'bg-blue-500 text-white font-bold'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {isAccepted ? 'Contract Accepted' : lot.status === 'offer_received' ? 'Bids Received' : 'Open for Bids'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{lot.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 self-end lg:self-center">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground uppercase font-medium">Batch Volume</span>
                        <div className="text-xl font-heading font-black text-foreground">
                          {lot.quantity} {lot.crops?.unit || 'Q'}
                        </div>
                      </div>

                      {lot.highest_offer && (
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground uppercase font-medium">Best Offer</span>
                          <div className="text-xl font-heading font-black text-emerald-700">
                            ₹{lot.highest_offer.toLocaleString('en-IN')}/q
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleToggleExpand(lot.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <span>{isExpanded ? 'Hide Payouts' : 'View Member Payouts'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Offers + Member Payout Breakdown */}
                {isExpanded && (
                  <div className="bg-slate-50/70 p-6 space-y-6 border-t border-border/60">
                    {/* Buyer Offers Section */}
                    {offers.length > 0 && (
                      <div className="bg-white rounded-xl p-5 border border-border">
                        <h4 className="font-heading font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                          <span>Institutional Buyer Offers ({offers.length})</span>
                          <span className="text-xs text-muted-foreground font-normal">All-or-Nothing Bids</span>
                        </h4>

                        <div className="space-y-3">
                          {offers.map(offer => (
                            <div
                              key={offer.id}
                              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                offer.status === 'accepted'
                                  ? 'bg-emerald-50/70 border-emerald-300'
                                  : 'bg-white border-border hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <span className="font-bold text-foreground text-base">
                                    {offer.buyers?.business_name || 'Verified Buyer'}
                                  </span>
                                  {offer.buyers?.verification_tier && (
                                    <BuyerBadge tier={offer.buyers.verification_tier} />
                                  )}
                                  {offer.status === 'accepted' && (
                                    <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                                      Accepted
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                  <span>Payment: <strong>{offer.payment_terms}</strong></span>
                                  <span>Logistics: <strong>{offer.pickup_terms}</strong></span>
                                  {offer.notes && <span className="italic">"{offer.notes}"</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground">Price per quintal</div>
                                  <div className="text-xl font-heading font-black text-emerald-700">
                                    ₹{offer.price_per_quintal.toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-medium">
                                    Total: ₹{(offer.price_per_quintal * lot.quantity).toLocaleString('en-IN')}
                                  </div>
                                </div>

                                {offer.status !== 'accepted' && !isAccepted && (
                                  <button
                                    onClick={() => handleAcceptOffer(offer.id, lot.id)}
                                    disabled={acceptingOfferId === offer.id}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors"
                                  >
                                    {acceptingOfferId === offer.id ? 'Accepting...' : 'Accept & Escrow'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Member Payout Breakdown Table */}
                    <div className="bg-white rounded-xl p-5 border border-border">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Proportional Member Payout Split Ledger</span>
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Stored in <code className="font-mono text-slate-800">fpo_transaction_members</code> table with immutable audit trail.
                          </p>
                        </div>
                        {isAccepted && (
                          <span className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            Funds Held in Secure Escrow
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground uppercase bg-slate-50">
                              <th className="py-2.5 px-3 rounded-l-lg">Farmer Member</th>
                              <th className="py-2.5 px-3">Village</th>
                              <th className="py-2.5 px-3 text-right">Contributed</th>
                              <th className="py-2.5 px-3 text-right">Share %</th>
                              <th className="py-2.5 px-3 text-right">Agreed Rate/Q</th>
                              <th className="py-2.5 px-3 text-right font-bold text-slate-900">Member Net Payout</th>
                              <th className="py-2.5 px-3 text-right rounded-r-lg">Disbursement Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {(payoutInfo?.members || lot.transaction_members || []).map((m, idx) => (
                              <tr key={m.id || idx} className="hover:bg-slate-50/80">
                                <td className="py-3 px-3 font-bold text-foreground">
                                  {m.farmer_name}
                                </td>
                                <td className="py-3 px-3 text-muted-foreground">
                                  {m.fpo_members?.village || 'Latur'}
                                </td>
                                <td className="py-3 px-3 text-right font-semibold">
                                  {parseFloat(m.contributed_quantity).toFixed(1)} Q
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                                  {parseFloat(m.share_percentage).toFixed(2)}%
                                </td>
                                <td className="py-3 px-3 text-right text-slate-600">
                                  {m.price_per_quintal > 0 ? `₹${parseFloat(m.price_per_quintal).toLocaleString('en-IN')}` : 'Pending Bid'}
                                </td>
                                <td className="py-3 px-3 text-right font-black text-sm text-emerald-800">
                                  {m.share_amount > 0 ? `₹${Math.round(parseFloat(m.share_amount)).toLocaleString('en-IN')}` : 'Calculating...'}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                      m.payout_status === 'escrow'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : m.payout_status === 'paid'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}
                                  >
                                    {m.payout_status === 'escrow' ? '● Escrow Active' : m.payout_status === 'paid' ? '● Paid' : '○ Pending Acceptance'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {payoutInfo?.summary && (
                            <tfoot>
                              <tr className="border-t-2 border-slate-900 font-bold bg-slate-50 text-xs">
                                <td className="py-3 px-3">Total Verified Pool</td>
                                <td className="py-3 px-3">{payoutInfo.summary.member_count} Members</td>
                                <td className="py-3 px-3 text-right">{payoutInfo.summary.total_quantity.toFixed(1)} Q</td>
                                <td className="py-3 px-3 text-right font-mono">100.00%</td>
                                <td className="py-3 px-3 text-right">₹{payoutInfo.summary.price_per_quintal}</td>
                                <td className="py-3 px-3 text-right font-black text-sm text-slate-950">
                                  ₹{payoutInfo.summary.total_payout_amount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-3 px-3 text-right text-emerald-700">100% Proportional</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
