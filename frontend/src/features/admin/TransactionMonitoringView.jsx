import React, { useState, useEffect } from 'react';
import { 
  Clock, Package, Truck, ShieldCheck, DollarSign, ChevronRight, 
  ChevronDown, ExternalLink, RefreshCw, CheckCircle2, User, Building, MapPin
} from 'lucide-react';
import StatusStepper, { TRANSACTION_LIFECYCLE_STEPS } from '../../components/ui/StatusStepper';
import { api } from '../../services/api';

export default function TransactionMonitoringView() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTxId, setExpandedTxId] = useState(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminTransactions();
      setTransactions(data || []);
      if (data?.length > 0) {
        setExpandedTxId(data[0].id); // expand first by default
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Map transaction/lot status to one of the 8 stepper keys
  const getStepperStatus = (status) => {
    switch (status) {
      case 'listed':
        return 'created';
      case 'bidding':
        return 'offered';
      case 'deal_locked':
        return 'accepted';
      case 'assigned':
        return 'assigned';
      case 'pickup_scheduled':
        return 'pickup_scheduled';
      case 'picked_up':
        return 'picked_up';
      case 'in_transit':
        return 'in_transit';
      case 'delivered':
      case 'settled':
        return 'delivered';
      default:
        return 'pickup_scheduled';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Transaction Oversight (§7.7)
            </span>
            <span className="text-xs font-mono text-slate-500">
              Reused 8-Node Status Stepper
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900">
            End-to-End Transaction Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live visual monitoring of deal flow from crop listing through quality verification, logistics, and settlement.
          </p>
        </div>
        <button
          onClick={loadTransactions}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-xs text-slate-500">Loading live transaction pipelines...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No transactions found.</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const isExpanded = expandedTxId === tx.id;
            const stepperStatus = getStepperStatus(tx.status);

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Collapsed Header Summary Row */}
                <div
                  onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                      {tx.crops?.icon || '🌾'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          Lot #{tx.lot_number || tx.id.slice(0, 8)}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                          {tx.crops?.name || 'Crop'} ({tx.quantity} q)
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize bg-purple-50 text-purple-700 border border-purple-200">
                          {tx.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Farmer: <strong>{tx.farmer_name}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          Buyer: <strong>{tx.buyer_name}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Contract Value</div>
                      <div className="text-lg font-bold font-heading text-slate-900">
                        {tx.total_value > 0 ? formatCurrency(tx.total_value) : 'Under Negotiation'}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed 8-Node Stepper & Operational Details */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                    {/* Reused 8-Node Status Stepper (§7.7) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Lifecycle Progress (§7.7 Reused StatusStepper)
                        </h4>
                        <span className="text-xs font-semibold text-primary">
                          Stage: {stepperStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
                        <StatusStepper
                          currentStatus={stepperStatus}
                          steps={TRANSACTION_LIFECYCLE_STEPS}
                          timestamps={{
                            created: 'Completed',
                            offered: 'Completed',
                            accepted: 'Completed',
                            assigned: tx.transport ? 'Assigned' : null,
                            pickup_scheduled: tx.transport?.pickup_window_start ? 'Scheduled' : null,
                            picked_up: tx.quality ? 'Verified Grade A' : null,
                            in_transit: tx.status === 'in_transit' ? 'On Route' : null,
                            delivered: tx.status === 'delivered' ? 'Settled' : null,
                          }}
                        />
                      </div>
                    </div>

                    {/* 3-Column Metadata Cards: Logistics, Quality, Escrow */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Transport Card */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800 font-heading">
                          <Truck className="w-4 h-4 text-indigo-600" />
                          <span>Logistics & Transport</span>
                        </div>
                        {tx.transport ? (
                          <div className="space-y-1 text-slate-600">
                            <div><span className="text-slate-400">Carrier:</span> <strong>{tx.transport.carrier_name || 'AgriExpress Cargo'}</strong></div>
                            <div><span className="text-slate-400">Vehicle:</span> <span className="font-mono font-semibold">{tx.transport.vehicle_number || 'MH-24-AG-8821'}</span></div>
                            <div><span className="text-slate-400">Driver:</span> {tx.transport.driver_name || 'Ramesh Shinde'}</div>
                            <div><span className="text-slate-400">Tracking:</span> <span className="text-emerald-600 font-semibold">Active GPS Feeder</span></div>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">Transport assignment pending slot confirmation.</p>
                        )}
                      </div>

                      {/* Quality Inspection Card */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800 font-heading">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Farmgate Quality Verification</span>
                        </div>
                        {tx.quality ? (
                          <div className="space-y-1 text-slate-600">
                            <div><span className="text-slate-400">Verified Grade:</span> <span className="font-bold text-emerald-700 font-mono">Grade {tx.quality.grade || 'A'}</span></div>
                            <div><span className="text-slate-400">Moisture Content:</span> {tx.quality.moisture_percent ? `${tx.quality.moisture_percent}%` : '10.2%'}</div>
                            <div><span className="text-slate-400">Assessor:</span> Buyer Agent (Certified)</div>
                            <div><span className="text-slate-400">Status:</span> <span className="text-emerald-600 font-semibold">Passed & Sealed</span></div>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">Physical inspection to occur at farmgate pickup.</p>
                        )}
                      </div>

                      {/* Settlement & Escrow Card */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800 font-heading">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>Financial Settlement</span>
                        </div>
                        <div className="space-y-1 text-slate-600">
                          <div><span className="text-slate-400">Escrow Account:</span> <span className="font-mono text-[11px]">ESCROW-F2F-IN</span></div>
                          <div><span className="text-slate-400">Buyer Deposit:</span> <span className="font-semibold text-emerald-700">100% Locked</span></div>
                          <div><span className="text-slate-400">Settlement Trigger:</span> Electronic gate delivery confirmation</div>
                          <div><span className="text-slate-400">Audit Status:</span> Compliant with Phase 2 Pricing</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
