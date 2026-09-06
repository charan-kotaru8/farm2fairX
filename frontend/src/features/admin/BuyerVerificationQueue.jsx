import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import BuyerBadge from '../../components/ui/BuyerBadge';
import { Check, X, HelpCircle, FileText, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

export default function BuyerVerificationQueue() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedNote, setSelectedNote] = useState('');
  const [noteBuyerId, setNoteBuyerId] = useState(null);

  const loadBuyers = async () => {
    setLoading(true);
    try {
      const data = await api.getBuyers();
      setBuyers(data);
    } catch (err) {
      console.error('Failed to load buyers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyers();
  }, []);

  const handleVerify = async (buyerId, status, note = null) => {
    setActionLoading(buyerId);
    try {
      await api.verifyBuyer(buyerId, {
        verification_status: status,
        business_info_verified: true,
        location_verified: true,
        document_verified: status === 'approved',
        admin_note: note || (status === 'approved' ? 'Verified by Admin review' : null),
      });
      await loadBuyers();
      setNoteBuyerId(null);
      setSelectedNote('');
    } catch (err) {
      alert('Verification action failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingBuyers = buyers.filter(b => b.verification_status === 'pending' || b.verification_status === 'more_info_requested');
  const processedBuyers = buyers.filter(b => b.verification_status === 'approved' || b.verification_status === 'rejected');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Buyer Verification Queue</h1>
          <p className="text-muted-foreground">Review buyer KYC documents, verify credentials, and govern marketplace trust tiers.</p>
        </div>
        <button 
          onClick={loadBuyers} 
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Buyers</div>
          <div className="text-3xl font-bold font-heading">{buyers.length}</div>
        </div>
        <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Pending Review</div>
          <div className="text-3xl font-bold font-heading text-amber-900">{pendingBuyers.length}</div>
        </div>
        <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Verified Buyers</div>
          <div className="text-3xl font-bold font-heading text-emerald-900">
            {buyers.filter(b => b.verification_tier === 'verified').length}
          </div>
        </div>
        <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200 shadow-xs">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Trusted Partners</div>
          <div className="text-3xl font-bold font-heading text-blue-900">
            {buyers.filter(b => b.verification_tier === 'trusted_partner').length}
          </div>
        </div>
      </div>

      {/* Pending Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2">
            Pending Applications <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">{pendingBuyers.length}</span>
          </h2>
        </div>

        {pendingBuyers.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-border text-center text-muted-foreground">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-medium text-foreground">All buyer verifications are up to date!</p>
            <p className="text-sm text-muted-foreground mt-1">No pending verification requests at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingBuyers.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{b.business_name}</h3>
                      <p className="text-xs text-muted-foreground">{b.business_type} • {b.city}, {b.district}</p>
                    </div>
                    <BuyerBadge tier={b.verification_tier} />
                  </div>

                  <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl mb-4 border border-slate-200/60">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{b.contact_person || 'N/A'} ({b.phone || 'N/A'})</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">GSTIN / PAN:</span>
                      <span className="font-mono font-medium">{b.gst_number || b.pan_number || 'Declared'}</span>
                    </div>
                    {b.admin_note && (
                      <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-2 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <span><strong>Admin Note:</strong> {b.admin_note}</span>
                      </div>
                    )}
                  </div>

                  {/* Verification Checklist */}
                  <div className="space-y-1.5 mb-5">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">KYC Checklist</div>
                    <div className="flex items-center gap-2 text-xs">
                      <Check className={`w-4 h-4 ${b.business_info_verified ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span className={b.business_info_verified ? 'text-slate-800 font-medium' : 'text-slate-400'}>Business registration & GST verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Check className={`w-4 h-4 ${b.location_verified ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span className={b.location_verified ? 'text-slate-800 font-medium' : 'text-slate-400'}>Warehouse/Mandi location confirmed ({b.district})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Check className={`w-4 h-4 ${b.document_verified ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span className={b.document_verified ? 'text-slate-800 font-medium' : 'text-slate-400'}>Mandi Trade License / FSSAI certificate attached</span>
                    </div>
                  </div>
                </div>

                {/* Request More Info Input Drawer */}
                {noteBuyerId === b.id ? (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2 mt-2">
                    <label className="block text-xs font-semibold text-amber-900">Explain what information is missing:</label>
                    <input 
                      type="text" 
                      value={selectedNote}
                      onChange={e => setSelectedNote(e.target.value)}
                      placeholder="e.g. Please re-upload legible APMC license copy"
                      className="w-full text-xs px-3 py-1.5 border border-amber-300 rounded-lg outline-none bg-white"
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => setNoteBuyerId(null)}
                        className="text-xs px-3 py-1 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleVerify(b.id, 'more_info_requested', selectedNote)}
                        disabled={!selectedNote.trim() || actionLoading === b.id}
                        className="text-xs px-3 py-1 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
                      >
                        Send Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <button 
                      onClick={() => handleVerify(b.id, 'approved')}
                      disabled={actionLoading === b.id}
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Verify
                    </button>
                    <button 
                      onClick={() => { setNoteBuyerId(b.id); setSelectedNote(b.admin_note || ''); }}
                      disabled={actionLoading === b.id}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-1 border border-slate-200"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Request Info
                    </button>
                    <button 
                      onClick={() => handleVerify(b.id, 'rejected', 'Verification criteria not met')}
                      disabled={actionLoading === b.id}
                      className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-1 border border-red-200"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Directory of Active & Verified Buyers */}
      <div className="space-y-4 pt-6">
        <h2 className="text-xl font-heading font-semibold text-foreground">
          Verified & Active Buyer Roster
        </h2>
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Verification Tier</th>
                <th className="py-3 px-4">Completed Deals</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 text-right">Recompute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processedBuyers.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {b.business_name}
                    <div className="text-xs font-normal text-muted-foreground">{b.contact_person} • {b.phone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{b.district}, {b.state}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      b.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {b.verification_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <BuyerBadge tier={b.verification_tier} />
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium">
                    {b.completed_transactions}
                  </td>
                  <td className="py-3.5 px-4 text-amber-600 font-semibold">
                    {b.avg_rating > 0 ? `★ ${b.avg_rating.toFixed(1)}` : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button 
                      onClick={async () => {
                        await api.recomputeBuyerTier(b.id);
                        await loadBuyers();
                      }}
                      title="Run backend recompute_verification_tier logic"
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-medium inline-flex items-center gap-1 border border-slate-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-eval
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
