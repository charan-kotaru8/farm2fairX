import React, { useState, useEffect } from 'react';
import { 
  Scale, AlertTriangle, CheckCircle2, Clock, Filter, Plus, 
  Search, ShieldAlert, FileText, ArrowRight, X, MessageSquare, Check, User
} from 'lucide-react';
import { api } from '../../services/api';

const CATEGORIES = [
  'All',
  'Delayed Payment',
  'Quality Dispute',
  'Pickup Delay',
  'Price Mismatch',
  'Platform Issue',
];

const STATUS_FILTERS = [
  { key: 'All', label: 'All Tickets' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Review' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function GrievanceTriageView() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Resolution Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // New Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGrievance, setNewGrievance] = useState({
    user_name: 'Pandurang Deshmukh',
    user_role: 'farmer',
    user_phone: '+91 98220 11223',
    category: 'Delayed Payment',
    subject: '',
    description: '',
    lot_id: '',
  });
  const [creatingTicket, setCreatingTicket] = useState(false);

  const loadGrievances = async () => {
    setLoading(true);
    try {
      const data = await api.getGrievances({
        category: categoryFilter,
        status: statusFilter,
      });
      setGrievances(data);
    } catch (err) {
      console.error('Failed to load grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
  }, [categoryFilter, statusFilter]);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !resolutionNotes.trim()) return;

    setSubmittingResolution(true);
    try {
      await api.resolveGrievance(selectedTicket.id, {
        resolution_status: resolutionStatus,
        resolution_notes: resolutionNotes,
        resolved_by: 'Admin Triage Desk',
        satisfaction_rating: 5,
      });
      setSelectedTicket(null);
      setResolutionNotes('');
      await loadGrievances();
    } catch (err) {
      alert('Failed to record resolution: ' + err.message);
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newGrievance.subject || !newGrievance.description) {
      alert('Please fill in both subject and description.');
      return;
    }

    setCreatingTicket(true);
    try {
      await api.fileGrievance({
        ...newGrievance,
        lot_id: newGrievance.lot_id ? newGrievance.lot_id : null,
      });
      setShowCreateModal(false);
      setNewGrievance({
        user_name: 'Pandurang Deshmukh',
        user_role: 'farmer',
        user_phone: '+91 98220 11223',
        category: 'Delayed Payment',
        subject: '',
        description: '',
        lot_id: '',
      });
      await loadGrievances();
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    } finally {
      setCreatingTicket(false);
    }
  };

  const filteredGrievances = grievances.filter(g => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.ticket_number?.toLowerCase().includes(q) ||
      g.user_name?.toLowerCase().includes(q) ||
      g.subject?.toLowerCase().includes(q) ||
      g.category?.toLowerCase().includes(q)
    );
  });

  const slaBreachedCount = grievances.filter(g => g.is_sla_breached).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Grievance & Dispute Triage (§7.2)
            </span>
            {slaBreachedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                {slaBreachedCount} SLA Breached
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900">
            Grievance Resolution Desk
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Dedicated dispute management with 48-hour SLA breach monitoring and audit-only resolutions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
            id="file-grievance-btn"
          >
            <Plus className="w-4 h-4" />
            Raise Dispute Ticket
          </button>
        </div>
      </div>

      {/* SLA Alert Banner if any breached */}
      {slaBreachedCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Attention Required:</span> {slaBreachedCount} ticket(s) have exceeded the 48-hour platform SLA threshold without resolution. These tickets have been automatically elevated to the top of the queue for immediate administrative triage.
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === f.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tickets, names, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Category:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-xs text-slate-500">Loading grievance records...</p>
          </div>
        ) : filteredGrievances.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Scale className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No grievance tickets match your filters.</p>
          </div>
        ) : (
          filteredGrievances.map(g => (
            <div
              key={g.id}
              className={`bg-white p-5 rounded-2xl border transition-all shadow-xs ${
                g.is_sla_breached
                  ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                {/* Left ticket badges & title */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {g.ticket_number}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {g.category}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                      g.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                      g.status === 'rejected' ? 'bg-slate-200 text-slate-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {g.status}
                    </span>

                    {/* SLA Status Indicator (§7.3) */}
                    {g.is_sla_breached ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        SLA BREACHED ({g.hours_overdue || 0}h overdue)
                      </span>
                    ) : g.status === 'open' || g.status === 'in_progress' ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {g.hours_remaining !== undefined ? `${g.hours_remaining}h left` : '48h SLA'}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {g.subject}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {g.description}
                  </p>
                </div>

                {/* Right metadata & action button */}
                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right text-xs text-slate-500">
                    <div className="font-semibold text-slate-700 flex items-center gap-1 md:justify-end">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {g.user_name} ({g.user_role})
                    </div>
                    {g.user_phone && <div className="text-[11px] text-slate-400">{g.user_phone}</div>}
                    {g.lots && (
                      <div className="text-[11px] text-primary font-medium mt-0.5">
                        Lot #{g.lots.id?.slice(0, 8)} ({g.lots.crops?.name})
                      </div>
                    )}
                  </div>

                  {g.status === 'resolved' || g.status === 'rejected' ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Audit Settled
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTicket(g);
                        setResolutionStatus('resolved');
                        setResolutionNotes('');
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Resolved Audit Remarks Box (§7.6) */}
              {(g.status === 'resolved' || g.status === 'rejected') && g.resolution_notes && (
                <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/60 p-3 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                    <span>Audit Resolution Remark:</span>
                    <span>Officer: {g.resolved_by || 'Admin Support'}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-mono bg-white p-2 rounded border border-slate-200">
                    {g.resolution_notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* RESOLUTION DRAWER / MODAL (§7.6) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500">{selectedTicket.ticket_number}</span>
                <h3 className="text-lg font-heading font-bold text-slate-900">Resolve Dispute Ticket</h3>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Banner: Audit-only action (§7.6) */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
              <span className="font-bold block mb-0.5">⚠️ Audit & Status Action Only (§7.6)</span>
              Resolving this grievance records the dispute conclusion and resolution notes for compliance. It does not automatically modify or reverse underlying crop lot offers or transactions.
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div><span className="font-semibold text-slate-800">Subject:</span> {selectedTicket.subject}</div>
              <div><span className="font-semibold text-slate-800">Complainant:</span> {selectedTicket.user_name} ({selectedTicket.user_role})</div>
              <div><span className="font-semibold text-slate-800">Category:</span> {selectedTicket.category}</div>
              {selectedTicket.is_sla_breached && (
                <div className="text-rose-600 font-bold">⚠️ SLA Overdue by {selectedTicket.hours_overdue} hours</div>
              )}
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resolution Verdict
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolutionStatus('resolved')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      resolutionStatus === 'resolved'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-100'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                    Mark Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionStatus('rejected')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      resolutionStatus === 'rejected'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-100'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <X className="w-4 h-4 text-rose-600" />
                    Reject / Dismiss
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resolution Audit Notes (Required)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the verification findings, settlement reference, or mediation notes for permanent audit records..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution || !resolutionNotes.trim()}
                  className="px-5 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  id="submit-resolution-btn"
                >
                  {submittingResolution ? 'Saving Audit...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-heading font-bold text-slate-900">Raise Dispute Ticket</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Complainant Name
                </label>
                <input
                  type="text"
                  required
                  value={newGrievance.user_name}
                  onChange={(e) => setNewGrievance({ ...newGrievance, user_name: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={newGrievance.user_role}
                    onChange={(e) => setNewGrievance({ ...newGrievance, user_role: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="buyer">Buyer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newGrievance.user_phone}
                    onChange={(e) => setNewGrievance({ ...newGrievance, user_phone: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newGrievance.category}
                  onChange={(e) => setNewGrievance({ ...newGrievance, category: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weighbridge variance at delivery terminal"
                  value={newGrievance.subject}
                  onChange={(e) => setNewGrievance({ ...newGrievance, subject: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details about the issue, transaction, or logistics discrepancy..."
                  value={newGrievance.description}
                  onChange={(e) => setNewGrievance({ ...newGrievance, description: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-500">
                ⏳ Automatically assigned a strict <strong>48-hour SLA deadline</strong> upon creation.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg shadow-xs disabled:opacity-50"
                  id="submit-create-ticket-btn"
                >
                  {creatingTicket ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
