import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import BuyerBadge from '../../components/ui/BuyerBadge';
import { 
  ShoppingBag, 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  FileText, 
  Sparkles,
  DollarSign,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { user, profile, roleData } = useAuth();
  const [lots, setLots] = useState([]);
  const [offers, setOffers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBuyerData() {
      try {
        const [lotsRes, offersRes, buyersRes, cropsRes] = await Promise.all([
          api.getLots().catch(() => []),
          api.getOffers().catch(() => []),
          api.getBuyers().catch(() => []),
          api.getCrops().catch(() => []),
        ]);
        
        const activeLots = (lotsRes || []).filter(
          l => ['active', 'offer_received'].includes(l.status) && !l.parent_aggregated_lot_id
        );
        setLots(activeLots);
        setOffers(offersRes || []);
        setBuyers(buyersRes || []);
        setCrops(cropsRes || []);
      } catch (err) {
        console.error('Failed to load buyer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBuyerData();
  }, [user?.id]);

  // Determine buyer entity
  const currentBuyer = roleData || 
    buyers.find(b => b.profile_id === user?.id) || 
    buyers.find(b => b.business_name?.toLowerCase().includes(profile?.full_name?.toLowerCase())) ||
    buyers[0];

  const businessName = currentBuyer?.business_name || profile?.full_name || 'Agri Buyer';
  const verificationStatus = currentBuyer?.verification_status || 'pending';
  const verificationTier = currentBuyer?.verification_tier || 'basic';
  const district = currentBuyer?.district || profile?.district || 'Maharashtra';

  // Filter offers for this buyer (or show all recent marketplace bids if in demo/audit view)
  const myOffers = currentBuyer?.id 
    ? offers.filter(o => o.buyer_id === currentBuyer.id)
    : offers;
  const recentOffers = myOffers.length > 0 ? myOffers.slice(0, 5) : offers.slice(0, 5);

  const acceptedOffersCount = myOffers.filter(o => o.status === 'accepted').length;
  const pendingOffersCount = myOffers.filter(o => ['submitted', 'pending'].includes(o.status)).length;

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-32 bg-white rounded-3xl border border-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-border" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-400/20 text-blue-300 border border-blue-400/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Buyer Trading Terminal
              </span>
              {currentBuyer && (
                <span className="text-xs bg-white/10 text-white/80 px-2.5 py-0.5 rounded-full">
                  {district}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight">
              Welcome, {businessName}
            </h1>
            <p className="text-blue-200/80 text-sm mt-1 max-w-xl">
              Procure farm-fresh harvest lots directly from verified farmers & FPOs across India with transparent APMC benchmarks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/buyer/marketplace"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <ShoppingBag className="w-4 h-4" /> Explore Marketplace
            </Link>
            <Link
              to="/buyer/logistics"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-3 rounded-xl transition-all border border-white/20 flex items-center gap-2 text-sm backdrop-blur-sm"
            >
              <Truck className="w-4 h-4" /> Book Logistics
            </Link>
          </div>
        </div>
      </div>

      {/* Verification Status Card */}
      {verificationStatus === 'approved' ? (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-emerald-900 text-base">Verified Buyer Account</h3>
                <BuyerBadge tier={verificationTier} />
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your business KYC & mandi license are approved. You have full priority bidding and direct contract settlement privileges.
              </p>
            </div>
          </div>
          <Link
            to="/buyer/verification"
            className="text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap self-start sm:self-center flex items-center gap-1.5 shadow-2xs"
          >
            View Badges & License <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-900 text-base">Verification Status: Pending Review</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {verificationTier.toUpperCase()} TIER
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                Submit GSTIN, PAN, and Mandi License to unlock trusted partner badges and unlimited trade bidding.
              </p>
            </div>
          </div>
          <Link
            to="/buyer/verification"
            className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap self-start sm:self-center flex items-center gap-1.5 shadow-sm"
          >
            Submit Documents <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:border-primary/40 transition-all flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Lots</div>
            <div className="text-3xl font-extrabold text-foreground mt-1">{lots.length}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-emerald-600">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live in marketplace
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:border-primary/40 transition-all flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Bids</div>
            <div className="text-3xl font-extrabold text-foreground mt-1">{pendingOffersCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Awaiting farmer confirmation
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:border-primary/40 transition-all flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deals Accepted</div>
            <div className="text-3xl font-extrabold text-foreground mt-1">{acceptedOffersCount}</div>
            <div className="text-xs text-muted-foreground mt-1 text-emerald-600">
              Ready for pickup/escrow
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:border-primary/40 transition-all flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Listed Crops</div>
            <div className="text-3xl font-extrabold text-foreground mt-1">{crops.length || 10}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Soybean, Cotton, Pulses & more
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Marketplace Spotlight: Real Lots */}
      <div className="bg-white rounded-3xl border border-border p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" /> Live Crop Marketplace
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Verified farmer crop lots available for bidding right now.
            </p>
          </div>
          <Link
            to="/buyer/marketplace"
            className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            View All {lots.length} Lots <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {lots.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-foreground">No active lots available currently</p>
            <p className="text-xs mt-1">Farmer crop listings will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
            {lots.slice(0, 6).map(lot => (
              <div
                key={lot.id}
                className="bg-slate-50/50 hover:bg-white rounded-2xl border border-border/80 hover:border-primary/40 hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-border shadow-2xs flex items-center justify-center text-2xl">
                        {lot.crops?.icon || '📦'}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                          {lot.crops?.name || 'Produce Lot'}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            lot.quality_grade === 'A'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : lot.quality_grade === 'B'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            Grade {lot.quality_grade}
                          </span>
                          {lot.is_aggregated && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              🌾 FPO Pool
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 py-3 border-y border-border/60 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lot Quantity:</span>
                      <span className="font-bold text-foreground">{lot.quantity} {lot.crops?.unit || 'Quintals'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Harvest Date:</span>
                      <span className="font-medium text-foreground">
                        {lot.harvest_date ? new Date(lot.harvest_date).toLocaleDateString() : 'Ready now'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage Status:</span>
                      <span className="font-medium text-foreground">
                        {lot.storage_required ? 'Warehouse Required' : 'Farmgate direct'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    to="/buyer/marketplace"
                    className="w-full bg-white hover:bg-primary hover:text-white text-foreground border border-border hover:border-primary text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    Place Bid in Marketplace <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Offers & Bidding Activity */}
      <div className="bg-white rounded-3xl border border-border p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-5 border-b border-border">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> My Bids & Offer History
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live status of digital purchase bids submitted to farmers.
            </p>
          </div>
          <Link
            to="/buyer/marketplace"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Submit New Offer →
          </Link>
        </div>

        {recentOffers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="font-semibold text-foreground">No bids submitted yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Explore available farmer crop lots above and submit digital offers with transparent price benchmarks.
            </p>
            <Link
              to="/buyer/marketplace"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-2xs"
            >
              Browse Active Lots <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border/80">
                  <th className="pb-3 font-semibold">Crop & Lot</th>
                  <th className="pb-3 font-semibold">Offered Price</th>
                  <th className="pb-3 font-semibold">Quantity</th>
                  <th className="pb-3 font-semibold hidden md:table-cell">Payment & Pickup</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentOffers.map(offer => {
                  const crop = offer.lots?.crops;
                  const status = offer.status || 'submitted';
                  const isAccepted = status === 'accepted';
                  const isRejected = status === 'rejected';

                  return (
                    <tr key={offer.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{crop?.icon || '📦'}</span>
                          <div>
                            <div className="font-bold text-foreground">{crop?.name || 'Crop Lot'}</div>
                            <div className="text-[11px] text-muted-foreground">
                              Grade {offer.lots?.quality_grade || 'A'} • {offer.lots?.quantity || '-'} {crop?.unit || 'Qtl'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-bold text-foreground">
                        ₹{offer.price_per_quintal?.toLocaleString('en-IN')} / {crop?.unit || 'qtl'}
                      </td>
                      <td className="py-3.5 font-medium text-foreground">
                        {offer.offered_quantity} {crop?.unit || 'quintals'}
                      </td>
                      <td className="py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                        <div>{offer.payment_terms || 'Immediate UPI'}</div>
                        <div className="text-[11px] text-muted-foreground/80">{offer.pickup_terms || 'Farmgate Pickup'}</div>
                      </td>
                      <td className="py-3.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          isAccepted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isRejected
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isAccepted ? '✅ Accepted' : isRejected ? '❌ Rejected' : '⏳ Under Review'}
                        </span>
                      </td>
                      <td className="py-3.5 text-muted-foreground text-xs hidden sm:table-cell">
                        {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ecosystem Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/buyer/marketplace"
          className="bg-white p-6 rounded-2xl border border-border shadow-xs hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-foreground text-base">Crop Marketplace</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Filter by crop type, quality grade, and lot size. Submit binding offers directly to farmers or aggregated FPO pools.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary">
            Open Marketplace <ChevronRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/buyer/logistics"
          className="bg-white p-6 rounded-2xl border border-border shadow-xs hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-foreground text-base">Logistics & Fleet Booking</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Organize farmgate pickup or mandi transit with integrated transporter fleets and live dispatch tracking.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary">
            Book Transit <ChevronRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/buyer/verification"
          className="bg-white p-6 rounded-2xl border border-border shadow-xs hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-foreground text-base">Verification & Badges</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Upgrade your trade tier to Verified or Trusted Partner. Unlock zero-delay contracts and higher bidding limits.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary">
            Manage KYC Status <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}

