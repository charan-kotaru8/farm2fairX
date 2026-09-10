import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, CheckCircle2, XCircle, Clock, AlertCircle, 
  MapPin, Phone, Check, X, Search, Filter, ShieldCheck, ArrowRight
} from 'lucide-react';

export default function JoinRequestQueue() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Resolution action modal state
  const [actionModal, setActionModal] = useState(null); // { request: req, targetStatus: 'approved' | 'rejected' }
  const [reviewNotes, setReviewNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getFpoJoinRequests({
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      setRequests(data);
    } catch (err) {
      console.error('Failed to load FPO join requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const handleOpenActionModal = (req, targetStatus) => {
    setActionModal({ request: req, targetStatus });
    setReviewNotes(targetStatus === 'approved' ? 'Welcome to the FPO! Approved by cooperative committee.' : '');
  };

  const handleCloseActionModal = () => {
    setActionModal(null);
    setReviewNotes('');
    setResolving(false);
  };

  const handleConfirmResolution = async () => {
    if (!actionModal) return;
    setResolving(true);

    const { request, targetStatus } = actionModal;

    try {
      await api.resolveFpoJoinRequest(request.id, {
        status: targetStatus,
        reviewed_by: 'FPO Administrator',
        review_notes: reviewNotes,
      });

      setToastMessage({
        type: 'success',
        text: `Request by ${request.farmer_name} has been ${targetStatus === 'approved' ? 'approved & enrolled as member' : 'declined'}.`,
      });

      handleCloseActionModal();
      await fetchRequests();

      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to resolve request.',
      });
      setResolving(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.farmer_name?.toLowerCase().includes(q) ||
      r.village?.toLowerCase().includes(q) ||
      r.district?.toLowerCase().includes(q) ||
      r.primary_crop?.toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-rose-900 text-rose-100 border border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> FPO Governance & Enrolment
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-white">
            Farmer Membership Join Requests
          </h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base leading-relaxed">
            Review and approve enrollment applications from local smallholder farmers wishing to participate in collective crop pooling, bulk market sales, and escrow payouts.
          </p>
        </div>
      </div>

      {/* Filter and Status Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review</span>
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'approved'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved</span>
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'rejected'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Declined</span>
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by farmer name, village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Requests Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Applications Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {filterStatus === 'pending'
              ? 'There are no pending join requests awaiting review right now.'
              : `No requests found matching '${filterStatus}' status.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Farmer</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">Crops & Land</th>
                  <th className="py-4 px-4">Applied Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Farmer */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{req.farmer_name}</div>
                      {req.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{req.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.village ? `${req.village}, ` : ''}{req.district || 'Latur'}</span>
                      </div>
                    </td>

                    {/* Crop & Land */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800">{req.primary_crop || 'Soybean'}</div>
                      <div className="text-xs text-slate-500">
                        {req.farm_size_acres ? `${req.farm_size_acres} acres` : 'N/A'}
                      </div>
                    </td>

                    {/* Applied Date */}
                    <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {req.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : req.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" /> Declined
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenActionModal(req, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(req, 'rejected')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Resolved {req.reviewed_by ? `by ${req.reviewed_by}` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation & Review Notes Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className={`p-6 text-white ${
              actionModal.targetStatus === 'approved' ? 'bg-emerald-800' : 'bg-rose-800'
            }`}>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
                {actionModal.targetStatus === 'approved' ? 'Confirm Approval' : 'Decline Application'}
              </div>
              <h3 className="text-lg font-heading font-bold">
                {actionModal.request.farmer_name}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {actionModal.request.village || 'Village'}, {actionModal.request.district || 'Latur'} • {actionModal.request.primary_crop}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {actionModal.targetStatus === 'approved'
                  ? 'Approving will immediately enroll this farmer as a full member, update their profile, increment total member count, and send them an instant notification.'
                  : 'Declining will record the application decision and notify the farmer.'}
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Committee Review Notes / Message
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional review note or onboarding instructions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  disabled={resolving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolution}
                  disabled={resolving}
                  className={`text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                    actionModal.targetStatus === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {resolving ? 'Processing...' : (
                    actionModal.targetStatus === 'approved' ? 'Confirm & Enroll Member' : 'Confirm Decline'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
