import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import BeforeAfterBenefitCard from './BeforeAfterBenefitCard';
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Calendar,
  Scale,
  Building,
  HelpCircle,
} from 'lucide-react';

export default function AggregationFlow() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Step management: 1 = Lot Selection, 2 = Review & Payout Split
  const [step, setStep] = useState(1);

  const [candidateLots, setCandidateLots] = useState([]);
  const [selectedLotIds, setSelectedLotIds] = useState([]);
  const [referenceLotId, setReferenceLotId] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [benefitData, setBenefitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // 1. Initial Load of candidate lots
  useEffect(() => {
    async function loadCandidates() {
      try {
        const lots = await api.getFpoCandidateLots({
          userId: user?.id,
          fpoId: profile?.fpo_id,
        });
        setCandidateLots(lots);

        // Pre-select the first eligible Soybean Grade A lot as reference if available
        const firstEligible = lots.find(l => l.crops?.name === 'Soybean' && l.quality_grade === 'A');
        if (firstEligible) {
          setReferenceLotId(firstEligible.id);
          const eligibleSoybeans = lots
            .filter(l => l.crops?.name === 'Soybean' && l.quality_grade === 'A' && l.id !== '44444444-0000-0000-0000-000000000106')
            .map(l => l.id);
          setSelectedLotIds(eligibleSoybeans);
        }
      } catch (err) {
        console.error('Failed to load candidate lots:', err);
        setError('Failed to load candidate lots from server.');
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, [user, profile]);

  // 2. Re-check eligibility whenever reference or selection changes
  useEffect(() => {
    async function runEligibilityCheck() {
      if (candidateLots.length === 0) return;
      try {
        const res = await api.checkFpoEligibility({
          userId: user?.id,
          fpoId: profile?.fpo_id,
          referenceLotId: referenceLotId || (selectedLotIds.length > 0 ? selectedLotIds[0] : null),
          selectedLotIds,
        });
        setEvaluations(res.lot_evaluations || {});
      } catch (err) {
        console.error('Eligibility check failed:', err);
      }
    }
    runEligibilityCheck();
  }, [referenceLotId, selectedLotIds, candidateLots, user, profile]);

  // 3. Fetch data-driven benefit analysis when selection changes
  useEffect(() => {
    async function fetchBenefit() {
      const selectedLots = candidateLots.filter(l => selectedLotIds.includes(l.id));
      const totalQty = selectedLots.reduce((acc, l) => acc + (parseFloat(l.quantity) || 0), 0);
      const cropId = selectedLots[0]?.crop_id;
      const grade = selectedLots[0]?.quality_grade || 'A';

      if (totalQty > 0 && cropId) {
        try {
          const data = await api.getFpoBenefit({
            cropId,
            qualityGrade: grade,
            quantity: totalQty,
          });
          setBenefitData(data);
        } catch (err) {
          console.error('Failed to fetch benefit:', err);
        }
      }
    }
    fetchBenefit();
  }, [selectedLotIds, candidateLots]);

  // Handler: Toggle lot selection
  const handleToggleLot = (lot) => {
    const isCurrentlySelected = selectedLotIds.includes(lot.id);

    if (isCurrentlySelected) {
      // Unselect
      const nextSelected = selectedLotIds.filter(id => id !== lot.id);
      setSelectedLotIds(nextSelected);
      if (referenceLotId === lot.id) {
        setReferenceLotId(nextSelected.length > 0 ? nextSelected[0] : null);
      }
    } else {
      // Check if lot is eligible before adding
      const evaluation = evaluations[lot.id];
      if (evaluation && !evaluation.eligible && selectedLotIds.length > 0) {
        // Can't select ineligible lot
        return;
      }
      if (!referenceLotId) {
        setReferenceLotId(lot.id);
      }
      setSelectedLotIds([...selectedLotIds, lot.id]);
    }
  };

  // Helper calculations for running total meter
  const selectedLots = candidateLots.filter(l => selectedLotIds.includes(l.id));
  const totalSelectedQuantity = selectedLots.reduce((acc, l) => acc + (parseFloat(l.quantity) || 0), 0);
  const uniqueMemberCount = new Set(selectedLots.map(l => l.fpo_member_id)).size;

  // Target commercial bulk thresholds
  const TARGET_BULK_QUINTALS = 100.0;
  const meterPercentage = Math.min(Math.round((totalSelectedQuantity / TARGET_BULK_QUINTALS) * 100), 100);

  // Submit Aggregation
  const handleConfirmAggregation = async () => {
    if (selectedLotIds.length < 2) {
      setError('Please select at least 2 member lots to aggregate.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.createFpoAggregation({
        userId: user?.id,
        fpoId: profile?.fpo_id,
        lotIds: selectedLotIds,
        description: customDescription || undefined,
      });
      // Navigate to Aggregated Lots with state
      navigate('/fpo/lots', { state: { justCreated: true } });
    } catch (err) {
      setError(err.message || 'Failed to create aggregated lot.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-12 bg-white rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-white rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Step Header */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase">
              Aggregation Wizard
            </span>
            <span className="text-xs text-muted-foreground">
              Step {step} of 2: {step === 1 ? 'Lot Selection & Eligibility' : 'Review & Proportional Payout Split'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            {step === 1 ? 'Pool Member Lots into Commercial Batch' : 'Review Aggregated Pool & Payout Schedule'}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {step === 1
              ? 'Select compatible member lots. Quality grade, crop type, and 7-day harvest windows are enforced algorithmically.'
              : 'Verify the bulk price gain and preview each member farmer’s exact proportional revenue share before publishing.'}
          </p>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setStep(1)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              step === 1
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            1. Select Lots ({selectedLotIds.length})
          </button>
          <button
            onClick={() => selectedLotIds.length >= 2 && setStep(2)}
            disabled={selectedLotIds.length < 2}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
              step === 2
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            2. Review & Split →
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-800 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Validation Alert</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: Interactive Lot Selection with Live Eligibility Enforcement       */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Strict Eligibility Rules Banner */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="font-heading font-bold text-sm text-amber-300">
                  Strict Aggregation Rules Enforced
                </span>
              </div>
              <span className="text-xs text-slate-400">Standard Mandi Contract Spec §5.2</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="font-bold text-slate-100 block mb-0.5">🌾 1. Identical Crop</span>
                Must match baseline crop type (e.g. JS-335 Soybean).
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="font-bold text-slate-100 block mb-0.5">⭐ 2. Same Quality Grade</span>
                Zero mixing across Grade A and Grade B.
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="font-bold text-slate-100 block mb-0.5">📅 3. 7-Day Harvest Window</span>
                Batch freshness: all lots harvested within 7 days.
              </div>
            </div>
          </div>

          {/* Candidate Lots Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-lg text-foreground">
                Available Member Lots ({candidateLots.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                Click a card to toggle inclusion in this aggregation pool
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidateLots.map(lot => {
                const isSelected = selectedLotIds.includes(lot.id);
                const evaluation = evaluations[lot.id] || { eligible: true };
                const isEligible = evaluation.eligible;

                return (
                  <div
                    key={lot.id}
                    onClick={() => handleToggleLot(lot)}
                    className={`rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                        : isEligible
                        ? 'bg-white border-border hover:border-amber-400 hover:shadow-xs'
                        : 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Farmer + Status Checkbox */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-xs ${
                              isSelected
                                ? 'bg-amber-600 text-white'
                                : isEligible
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-slate-300 text-slate-500'
                            }`}
                          >
                            {lot.fpo_members?.avatar_initials || 'FM'}
                          </div>
                          <div>
                            <h4 className="font-heading font-bold text-base text-foreground leading-snug">
                              {lot.fpo_members?.farmer_name || 'Member Farmer'}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {lot.fpo_members?.village || 'Latur'}, {lot.fpo_members?.district || 'Latur'}
                            </span>
                          </div>
                        </div>

                        {/* Selection Checkbox Pill */}
                        <div>
                          {isSelected ? (
                            <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pooled
                            </span>
                          ) : isEligible ? (
                            <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-300 flex items-center gap-1">
                              + Select
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-slate-400" /> Ineligible
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Lot Specifications */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/80 text-xs my-2">
                        <div>
                          <span className="text-muted-foreground block">Commodity</span>
                          <span className="font-bold text-slate-900 mt-0.5 block truncate">
                            {lot.crops?.icon} {lot.crops?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Quality Grade</span>
                          <span
                            className={`font-bold mt-0.5 inline-block px-2 py-0.5 rounded text-[11px] ${
                              lot.quality_grade === 'A'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            Grade {lot.quality_grade}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Harvest Date</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {lot.harvest_date ? new Date(lot.harvest_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recent'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm py-1">
                        <span className="text-muted-foreground">Contributed Quantity:</span>
                        <span className="font-heading font-black text-lg text-foreground">
                          {lot.quantity} {lot.crops?.unit || 'Quintals'}
                        </span>
                      </div>

                      {lot.description && (
                        <p className="text-xs text-muted-foreground italic line-clamp-1 mt-1">
                          "{lot.description}"
                        </p>
                      )}
                    </div>

                    {/* Ineligibility Reason Banner */}
                    {!isEligible && evaluation.reason && (
                      <div className="mt-3 bg-red-50 text-red-800 border border-red-200 rounded-xl p-2.5 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Ineligible for this Pool:</span> {evaluation.reason}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Review & Proportional Payout Split Preview                       */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Data-driven Before/After Benefit Card */}
          <BeforeAfterBenefitCard
            benefitData={benefitData}
            quantity={totalSelectedQuantity}
          />

          {/* Proportional Share Payout Table */}
          <div className="bg-white rounded-2xl p-6 border border-border shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-heading font-bold text-foreground">
                  Per-Member Proportional Payout Schedule
                </h3>
                <p className="text-xs text-muted-foreground">
                  Mathematical formula: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono font-semibold">Share % = (Member Quantity / {totalSelectedQuantity} Q) × 100</code>
                </p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                Est. Price: ₹{benefitData?.with_fpo?.best_price_per_quintal || 4950} / quintal
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4 rounded-l-xl">Farmer Member</th>
                    <th className="py-3 px-4">Village</th>
                    <th className="py-3 px-4 text-right">Contributed Qty</th>
                    <th className="py-3 px-4 text-right">Share %</th>
                    <th className="py-3 px-4 text-right">Individual Mandi Est. (₹4,780/q)</th>
                    <th className="py-3 px-4 text-right">FPO Pooled Est. (₹4,950/q)</th>
                    <th className="py-3 px-4 text-right rounded-r-xl text-emerald-800">Extra Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {selectedLots.map(lot => {
                    const qty = parseFloat(lot.quantity) || 0;
                    const sharePct = totalSelectedQuantity > 0 ? (qty / totalSelectedQuantity) * 100 : 0;
                    const mandiPrice = 4780;
                    const bulkPrice = benefitData?.with_fpo?.best_price_per_quintal || 4950;
                    const mandiEst = qty * mandiPrice;
                    const bulkEst = qty * bulkPrice;
                    const memberGain = bulkEst - mandiEst;

                    return (
                      <tr key={lot.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                              {lot.fpo_members?.avatar_initials || 'FM'}
                            </div>
                            <span className="font-bold text-foreground">
                              {lot.fpo_members?.farmer_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {lot.fpo_members?.village || 'Latur'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-foreground">
                          {qty.toFixed(1)} Q
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                          {sharePct.toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500">
                          ₹{Math.round(mandiEst).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          ₹{Math.round(bulkEst).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700 bg-emerald-50/50">
                          +₹{Math.round(memberGain).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold text-sm bg-slate-50">
                    <td className="py-4 px-4">Total Pooled Batch</td>
                    <td className="py-4 px-4 text-muted-foreground">{uniqueMemberCount} Farmers</td>
                    <td className="py-4 px-4 text-right text-base text-primary">
                      {totalSelectedQuantity.toFixed(1)} Q
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-base">
                      100.00%
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600">
                      ₹{Math.round(totalSelectedQuantity * 4780).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-right text-base text-slate-950 font-black">
                      ₹{Math.round(totalSelectedQuantity * (benefitData?.with_fpo?.best_price_per_quintal || 4950)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-right text-base font-black text-emerald-700 bg-emerald-100/60">
                      +₹{Math.round(totalSelectedQuantity * 170).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Custom Description Input */}
            <div className="mt-6 pt-5 border-t border-border">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Public Pool Listing Note (Optional)
              </label>
              <input
                type="text"
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                placeholder={`e.g. ${profile?.full_name || 'FPO'} Certified JS-335 Grade A Bulk Soybean Pool (Solvent extraction grade, 10.2% moisture)`}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* All-or-Nothing Scoping Disclaimer */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">All-or-Nothing Bidding Governance:</span> Per prototype specification §5.3, 
                institutional buyers must bid on and accept the entire aggregated lot quantity ({totalSelectedQuantity} quintals). 
                Partial buyer acceptance is excluded to protect individual member fulfillment equity.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PINNED STICKY RUNNING TOTAL METER (Always Visible at Bottom)              */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border shadow-2xl py-3.5 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Progress bar + metrics */}
          <div className="flex-1 w-full max-w-xl">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <div className="flex items-center gap-1.5 text-foreground">
                <Scale className="w-4 h-4 text-amber-600" />
                <span>Selected: {totalSelectedQuantity.toFixed(1)} / {TARGET_BULK_QUINTALS} Quintals</span>
                <span className="text-muted-foreground font-normal">({uniqueMemberCount} members)</span>
              </div>
              <span className={`font-mono ${totalSelectedQuantity >= TARGET_BULK_QUINTALS ? 'text-emerald-700 font-bold' : 'text-amber-700'}`}>
                {meterPercentage}% Target Reached
              </span>
            </div>

            {/* Meter Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className={`transition-all duration-500 rounded-full ${
                  totalSelectedQuantity >= TARGET_BULK_QUINTALS
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}
                style={{ width: `${meterPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0 Q</span>
              <span>50 Q (Wholesale)</span>
              <span>80 Q (Processor)</span>
              <span className="font-bold text-slate-800">100 Q (Industrial Bulk)</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Lots
              </button>
            )}

            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={selectedLotIds.length < 2}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>Proceed to Review ({selectedLotIds.length} Lots)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleConfirmAggregation}
                disabled={submitting || selectedLotIds.length < 2}
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-heading font-bold text-sm px-7 py-3 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{submitting ? 'Creating Aggregated Lot...' : 'Confirm & Publish Aggregated Lot'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
