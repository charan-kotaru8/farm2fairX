import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Phone,
  Star,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Navigation,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import StatusStepper from '../../components/ui/StatusStepper';
import QualityVerificationModal from './QualityVerificationModal';

export default function TransportBookingView({ userRole = 'farmer' }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lotIdParam = searchParams.get('lotId');

  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(lotIdParam || '');
  const [selectedLot, setSelectedLot] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [qualityVerification, setQualityVerification] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  const [minCapacityFilter, setMinCapacityFilter] = useState('');

  // Modals & Actions
  const [assignModalProvider, setAssignModalProvider] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('Apex Agro Solvent Extraction Unit, Plot 14, MIDC Latur');
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Initial Load: Fetch lots eligible for transport
  useEffect(() => {
    async function loadLots() {
      try {
        const allLots = await api.getLots();
        // Lots that have accepted an offer or are in transit/scheduled
        const transportLots = allLots.filter((l) =>
          [
            'offer_accepted',
            'transport_assigned',
            'pickup_scheduled',
            'picked_up',
            'in_transit',
            'delivered',
            'completed',
          ].includes(l.status)
        );
        setLots(transportLots);

        // Auto-select lot if specified in param or pick first available
        if (lotIdParam && transportLots.some((l) => l.id === lotIdParam)) {
          setSelectedLotId(lotIdParam);
        } else if (transportLots.length > 0 && !selectedLotId) {
          setSelectedLotId(transportLots[0].id);
        }
      } catch (err) {
        console.error('Failed to load lots for transport:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLots();
  }, [lotIdParam]);

  // 2. When selected lot changes, fetch its transport assignment & quality verification
  useEffect(() => {
    if (!selectedLotId) {
      setSelectedLot(null);
      setAssignment(null);
      setQualityVerification(null);
      return;
    }

    async function loadLotDetails() {
      try {
        const details = await api.getLotTransportDetails(selectedLotId);
        setSelectedLot(details.lot);
        setAssignment(details.assignment);
        setQualityVerification(details.quality_verification);
      } catch (err) {
        console.error('Failed to load lot transport details:', err);
      }
    }
    loadLotDetails();
  }, [selectedLotId]);

  // 3. Load transport providers based on selected lot pickup location
  useEffect(() => {
    async function loadProviders() {
      try {
        const list = await api.getTransportProviders({
          lotId: selectedLotId || undefined,
          vehicleType: vehicleTypeFilter !== 'All' ? vehicleTypeFilter : undefined,
          minCapacity: minCapacityFilter ? parseFloat(minCapacityFilter) : undefined,
        });
        setProviders(list);
      } catch (err) {
        console.error('Failed to load transport providers:', err);
      }
    }
    loadProviders();
  }, [selectedLotId, vehicleTypeFilter, minCapacityFilter]);

  // Handle Assign Transport Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLotId || !assignModalProvider) return;
    setActionLoading(true);

    try {
      const res = await api.assignTransport({
        lot_id: selectedLotId,
        provider_id: assignModalProvider.id,
        delivery_address: deliveryAddress,
        delivery_lat: 18.5204,
        delivery_lng: 73.8567,
      });

      showToast(`Transport assigned! Status updated to 'transport_assigned'.`);
      setAssignModalProvider(null);

      // Refresh details and provider list
      const details = await api.getLotTransportDetails(selectedLotId);
      setSelectedLot(details.lot);
      setAssignment(details.assignment);

      const refreshedProviders = await api.getTransportProviders({ lotId: selectedLotId });
      setProviders(refreshedProviders);
    } catch (err) {
      console.error('Failed to assign transport:', err);
      alert(err.message || 'Failed to assign transport');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Status Transition Stepper Step (Demo Simulation)
  const handleStatusTransition = async (newStatus) => {
    if (!assignment) return;
    setActionLoading(true);

    try {
      await api.updateTransportStatus(assignment.id, newStatus);
      showToast(`Transport & Lot status updated to '${newStatus}'`);

      // Refresh
      const details = await api.getLotTransportDetails(selectedLotId);
      setSelectedLot(details.lot);
      setAssignment(details.assignment);

      const refreshedProviders = await api.getTransportProviders({ lotId: selectedLotId });
      setProviders(refreshedProviders);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update transport status');
    } finally {
      setActionLoading(false);
    }
  };

  const getBestValueRibbon = (index, provider) => {
    if (!provider.is_available) return null;
    if (index === 0) return { label: 'Best Price', bg: 'bg-emerald-600' };
    if (provider.rating >= 4.9) return { label: 'Top Rated', bg: 'bg-amber-600' };
    if (provider.capacity_quintals >= 60) return { label: 'High Capacity', bg: 'bg-blue-600' };
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-bold bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-heading font-bold text-foreground">Logistics & Transport</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Phase 6 Refined
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Haversine distance routing, single-source-of-truth status tracking, and verified farmgate inspection.
          </p>
        </div>

        {/* Lot Selector */}
        {lots.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-border shadow-xs">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Active Lot:</span>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.crops?.icon || '📦'} {l.crops?.name || 'Crop'} ({l.quantity}q) — [{l.status}]
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── ACTIVE TRANSPORT TRACKING SECTION (IF ASSIGNED) ─── */}
      {assignment ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Tracking & Status</span>
              <h2 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                <Truck className="w-5 h-5 text-primary" />
                {assignment.transport_providers?.name || 'Transport Provider'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Vehicle: {assignment.transport_providers?.vehicle_type} ({assignment.transport_providers?.vehicle_number || 'MH-24-AG-4412'})
              </p>
            </div>

            {/* Quality Verification Badge / Trigger */}
            <div className="flex items-center gap-2">
              {qualityVerification ? (
                <div className="bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-900">Quality Certified at Pickup</p>
                    <p className="text-[10px] text-emerald-700">
                      Grade {qualityVerification.verified_grade} confirmed by {qualityVerification.verifier_name}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowQualityModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Buyer Quality Inspection
                </button>
              )}
            </div>
          </div>

          {/* Unified 5-Node Status Stepper (§6.1 & §6.8) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <StatusStepper
              currentStatus={assignment.status}
              timestamps={{
                assigned: assignment.created_at ? new Date(assignment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                picked_up: assignment.picked_up_at ? new Date(assignment.picked_up_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                delivered: assignment.delivered_at ? new Date(assignment.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              }}
            />
          </div>

          {/* In Transit Live Animation Moment */}
          {assignment.status === 'in_transit' && (
            <div className="bg-gradient-to-r from-blue-50/90 via-white to-sky-50/90 rounded-2xl border border-blue-200 p-5 flex flex-col sm:flex-row items-center gap-5 shadow-xs animate-in fade-in zoom-in-95">
              <div className="shrink-0 flex items-center justify-center">
                <DotLottieReact
                  src="https://lottie.host/41918dfd-f845-4b41-95ce-2b41363e8de4/R8Vo9MVouD.json"
                  loop
                  autoplay
                  style={{ width: 150, height: 150 }}
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Vehicle In Transit
                </div>
                <h4 className="font-heading font-bold text-foreground text-base">Crop Lot is En Route to Destination</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
                  Real-time transport active with temperature and transit monitoring. Driver is en route directly to buyer facility.
                </p>
              </div>
            </div>
          )}

          {/* Trip Summary Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-border">
            <div>
              <span className="text-xs text-muted-foreground block">Pickup Location</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {assignment.pickup_address}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Delivery Destination</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> {assignment.delivery_address}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Computed Distance</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {assignment.estimated_distance_km} km (Haversine)
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Trip Freight Fee</span>
              <span className="font-bold text-emerald-700 text-base mt-0.5 block">
                ₹{assignment.estimated_cost}
              </span>
            </div>
          </div>

          {/* Demo Action Stepper Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs font-bold text-slate-500 mr-2">Demo Stage Controls:</span>
            <button
              onClick={() => handleStatusTransition('pickup_scheduled')}
              disabled={actionLoading || assignment.status === 'pickup_scheduled'}
              className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors disabled:opacity-50"
            >
              1. Confirm Schedule
            </button>
            <button
              onClick={() => handleStatusTransition('picked_up')}
              disabled={actionLoading || assignment.status === 'picked_up'}
              className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors disabled:opacity-50"
            >
              2. Driver Picked Up
            </button>
            <button
              onClick={() => handleStatusTransition('in_transit')}
              disabled={actionLoading || assignment.status === 'in_transit'}
              className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors disabled:opacity-50"
            >
              3. Mark In Transit
            </button>
            <button
              onClick={() => handleStatusTransition('delivered')}
              disabled={actionLoading || assignment.status === 'delivered'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              4. Confirm Delivered (Unlocks Hauler)
            </button>
          </div>
        </div>
      ) : null}

      {/* ─── AVAILABLE TRANSPORT PROVIDERS DIRECTORY ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">Available Transport Providers</h2>
            <p className="text-xs text-muted-foreground">
              Live vehicle availability with Haversine distance from farmgate pickup.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-primary shadow-2xs"
            >
              <option value="All">All Vehicle Types</option>
              <option value="Tata 407">Tata 407 (Mini-Truck)</option>
              <option value="Eicher Pro">Eicher Pro 6T</option>
              <option value="Mahindra Bolero">Mahindra Bolero</option>
              <option value="10-Wheel">10-Wheel Heavy Hauler</option>
            </select>

            <input
              type="number"
              value={minCapacityFilter}
              onChange={(e) => setMinCapacityFilter(e.target.value)}
              placeholder="Min Capacity (q)"
              className="w-32 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-primary shadow-2xs"
            />
          </div>
        </div>

        {/* Providers Grid */}
        {providers.length === 0 ? (
          /* Designed Empty State (§6.7) */
          <div className="bg-white rounded-2xl border border-border p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-3xl">
              🚚
            </div>
            <h3 className="text-base font-bold text-slate-800">No transport providers match your filters</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Try selecting "All Vehicle Types" or clearing the minimum capacity filter to view all logistics partners registered in Maharashtra.
            </p>
            <button
              onClick={() => {
                setVehicleTypeFilter('All');
                setMinCapacityFilter('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 pt-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {providers.map((p, idx) => {
              const ribbon = getBestValueRibbon(idx, p);
              const isUnavailable = !p.is_available;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isUnavailable
                      ? 'border-slate-200 opacity-60 bg-slate-50/50'
                      : 'border-border shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Ribbon */}
                  {ribbon && (
                    <div
                      className={`absolute top-0 right-0 ${ribbon.bg} text-white text-[10px] font-extrabold uppercase tracking-wider py-0.5 px-2.5 rounded-bl-lg shadow-2xs`}
                    >
                      {ribbon.label}
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          isUnavailable ? 'bg-slate-200 text-slate-500' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        🚚
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">{p.vehicle_type}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="flex items-center text-amber-500 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> {p.rating}
                          </span>
                          <span className="text-[10px] text-muted-foreground">({p.total_trips} trips)</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-1.5 pt-2 border-t border-border text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span className="font-bold text-slate-800">{p.capacity_quintals} quintals</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="font-semibold text-slate-800">
                          {p.computed_distance_km} km away
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Est. Trip Cost:</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          ₹{p.estimated_cost}
                        </span>
                      </div>
                    </div>

                    {/* Availability Guard Pill (§6.3) */}
                    <div className="pt-2">
                      {p.is_available ? (
                        <span className="w-full text-center block text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Available for Immediate Dispatch
                        </span>
                      ) : (
                        <span className="w-full text-center block text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-300">
                          Unavailable (Active Transit Job)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assign Button */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => setAssignModalProvider(p)}
                      disabled={isUnavailable || (selectedLot && selectedLot.status !== 'offer_accepted' && selectedLot.status !== 'active')}
                      className={`w-full text-xs font-bold py-2.5 rounded-xl transition-colors shadow-xs ${
                        isUnavailable
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      }`}
                    >
                      {isUnavailable ? 'Unavailable' : 'Assign to Lot'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ASSIGN CONFIRMATION MODAL ─── */}
      {assignModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" /> Assign Transport Provider
            </h3>
            <p className="text-xs text-muted-foreground">
              Assigning <span className="font-bold text-slate-800">{assignModalProvider.name}</span> will immediately lock this provider as unavailable until delivery (§6.3).
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Address</label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs font-medium outline-none focus:border-primary resize-none shadow-2xs"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span className="font-bold">{assignModalProvider.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Computed Distance:</span>
                  <span className="font-bold">{assignModalProvider.computed_distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Freight:</span>
                  <span className="font-bold text-emerald-700 text-sm">₹{assignModalProvider.estimated_cost}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAssignModalProvider(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── QUALITY VERIFICATION MODAL ─── */}
      {showQualityModal && selectedLot && (
        <QualityVerificationModal
          lot={selectedLot}
          transportAssignmentId={assignment?.id}
          onClose={() => setShowQualityModal(false)}
          onSuccess={(res) => {
            setQualityVerification(res.verification);
            showToast('Buyer quality verification recorded!');
          }}
        />
      )}
    </div>
  );
}
