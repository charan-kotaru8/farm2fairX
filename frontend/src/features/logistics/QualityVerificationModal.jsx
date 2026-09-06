import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, X, Award, Droplets, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export default function QualityVerificationModal({ lot, transportAssignmentId, onClose, onSuccess }) {
  const declaredGrade = lot?.quality_grade || 'A';
  const declaredMoisture = lot?.declared_moisture_pct || 10.0;
  const declaredForeignMatter = lot?.declared_foreign_matter_pct || 1.5;

  const [verifiedGrade, setVerifiedGrade] = useState(declaredGrade);
  const [verifiedMoisture, setVerifiedMoisture] = useState(9.8);
  const [verifiedForeignMatter, setVerifiedForeignMatter] = useState(1.2);
  const [grainDamage, setGrainDamage] = useState(0.8);
  const [verifierName, setVerifierName] = useState('Vikram Deshmukh (Procurement Desk)');
  const [verifierRole, setVerifierRole] = useState('Buyer Quality Inspector');
  const [notes, setNotes] = useState('Farmgate grain moisture test and double-sieve impurities analysis completed.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const gradeMatched = verifiedGrade === declaredGrade;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        lot_id: lot.id,
        transport_assignment_id: transportAssignmentId || lot.transport_assignment_id || null,
        verifier_name: verifierName,
        verifier_role: verifierRole,
        verified_grade: verifiedGrade,
        verified_moisture_pct: parseFloat(verifiedMoisture),
        verified_foreign_matter_pct: parseFloat(verifiedForeignMatter),
        grain_damage_pct: parseFloat(grainDamage),
        notes: notes,
      };

      const res = await api.verifyLotQuality(payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      console.error('Quality verification error:', err);
      setError(err.message || 'Failed to submit quality verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Buyer Quality Verification at Pickup</h2>
              <p className="text-xs text-muted-foreground">
                Official farmgate inspection before truck departure (§6.2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Side-by-Side Comparison: Declared vs Verified (§6.2 & §6.8) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Declared Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Declared by Farmer</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  Self-Declared
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-slate-400" /> Quality Grade
                  </span>
                  <span className="font-bold text-slate-900">Grade {declaredGrade}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-slate-400" /> Moisture Content
                  </span>
                  <span className="font-bold text-slate-900">{declaredMoisture}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-slate-400" /> Foreign Matter
                  </span>
                  <span className="font-bold text-slate-900">{declaredForeignMatter}%</span>
                </div>
              </div>
            </div>

            {/* Verified Form Card */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Buyer Verified
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  On-Site Inspection
                </span>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Confirmed Grade</label>
                  <select
                    value={verifiedGrade}
                    onChange={(e) => setVerifiedGrade(e.target.value)}
                    className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 shadow-2xs"
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Industrial)</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Moisture (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="25"
                    value={verifiedMoisture}
                    onChange={(e) => setVerifiedMoisture(e.target.value)}
                    className="w-24 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 text-right shadow-2xs"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Foreign Matter (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={verifiedForeignMatter}
                    onChange={(e) => setVerifiedForeignMatter(e.target.value)}
                    className="w-24 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 text-right shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grade Match Callout */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              gradeMatched
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {gradeMatched ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <span>
                {gradeMatched
                  ? `Grade match verified: Grade ${declaredGrade} confirmed by buyer inspection.`
                  : `Grade variance: Declared Grade ${declaredGrade}, but inspected as Grade ${verifiedGrade}.`}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white border border-current shadow-2xs">
              {gradeMatched ? 'Full Match' : 'Discrepancy'}
            </span>
          </div>

          {/* Verifier Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inspector / Buyer Name</label>
              <input
                type="text"
                value={verifierName}
                onChange={(e) => setVerifierName(e.target.value)}
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500 shadow-2xs"
                placeholder="e.g. Vikram Deshmukh (Apex Agro)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inspector Designation</label>
              <input
                type="text"
                value={verifierRole}
                onChange={(e) => setVerifierRole(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500 shadow-2xs"
                placeholder="e.g. Chief Quality Officer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-emerald-500 resize-none shadow-2xs"
              placeholder="Record any grain condition remarks or test equipment serial number..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors shadow-md shadow-emerald-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? 'Certifying...' : 'Certify & Record Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
