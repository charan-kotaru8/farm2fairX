import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  Building2, Users, MapPin, CheckCircle2, Clock, AlertCircle, 
  Send, Sparkles, ArrowRight, ShieldCheck, ChevronRight, X
} from 'lucide-react';

export default function DiscoverFpos() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [fpos, setFpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for submitting join request
  const [selectedFpo, setSelectedFpo] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState({
    name: '',
    phone: '',
    village: '',
    district: '',
    primary_crop: 'Soybean',
    farm_size_acres: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Load farmer profile to prefill
  useEffect(() => {
    async function loadFarmerProfile() {
      if (user?.id) {
        try {
          const p = await api.getProfile(user.id);
          if (p) {
            setFarmerDetails({
              name: p.full_name || profile?.full_name || '',
              phone: p.phone || '',
              village: p.village || '',
              district: p.district || 'Latur',
              primary_crop: p.primary_crop || 'Soybean',
              farm_size_acres: p.land_acres || p.farm_size_acres || '',
              notes: '',
            });
          }
        } catch (e) {
          console.error('Error preloading profile:', e);
        }
      }
    }
    loadFarmerProfile();
  }, [user, profile]);

  // Fetch FPOs
  const fetchFpos = async () => {
    setLoading(true);
    try {
      const data = await api.discoverFpos({
        district: selectedDistrict,
        farmerId: user?.id,
      });
      setFpos(data);
    } catch (err) {
      console.error('Failed to load FPOs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFpos();
  }, [selectedDistrict, user]);

  const handleOpenJoinModal = (fpo) => {
    setSelectedFpo(fpo);
    setFeedback(null);
  };

  const handleCloseModal = () => {
    setSelectedFpo(null);
    setFeedback(null);
    setSubmitting(false);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedFpo || !user?.id) {
      setFeedback({ type: 'error', message: 'Please log in to submit a join request.' });
      return;
    }

    if (!farmerDetails.name) {
      setFeedback({ type: 'error', message: 'Farmer full name is required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await api.submitFpoJoinRequest({
        fpo_id: selectedFpo.id,
        farmer_id: user.id,
        farmer_name: farmerDetails.name,
        phone: farmerDetails.phone,
        village: farmerDetails.village,
        district: farmerDetails.district || selectedFpo.district || 'Latur',
        primary_crop: farmerDetails.primary_crop || 'Soybean',
        farm_size_acres: parseFloat(farmerDetails.farm_size_acres) || 0,
        notes: farmerDetails.notes,
      });

      setFeedback({
        type: 'success',
        message: `Your membership request to ${selectedFpo.name} has been submitted! The FPO committee will review your application.`,
      });

      // Refresh list to show pending state
      await fetchFpos();

      setTimeout(() => {
        handleCloseModal();
      }, 2200);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to submit join request. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFpos = fpos.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name?.toLowerCase().includes(q) ||
      f.district?.toLowerCase().includes(q) ||
      f.registration_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Collective Bargaining Power
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-white">
            Discover & Join Local Farmer Producer Collectives
          </h1>
          <p className="text-emerald-100/80 mt-2 text-sm md:text-base leading-relaxed">
            Join an accredited FPO to pool your produce with neighboring smallholders. Unlock institutional bulk contracts,
            command up to +₹200/quintal market premium, and cut transport costs through shared haulage.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            District:
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="All">All Maharashtra</option>
            <option value="Latur">Latur</option>
            <option value="Nashik">Nashik</option>
            <option value="Pune">Pune</option>
            <option value="Nagpur">Nagpur</option>
            <option value="Ahmednagar">Ahmednagar</option>
            <option value="Amravati">Amravati</option>
            <option value="Solapur">Solapur</option>
          </select>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search FPO by name or reg #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* FPOs List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200" />
          ))}
        </div>
      ) : filteredFpos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No FPOs Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are no registered FPOs matching your current filter in this district yet.
          </p>
          <button
            onClick={() => { setSelectedDistrict('All'); setSearchQuery(''); }}
            className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFpos.map((fpo) => {
            const isMember = fpo.is_member;
            const status = fpo.request_status;

            return (
              <div
                key={fpo.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Card Top */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold">
                      🏛️
                    </div>
                    {isMember ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Member
                      </span>
                    ) : status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Pending Approval
                      </span>
                    ) : status === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
                      </span>
                    ) : status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Declined
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        Open for Enrollment
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                      {fpo.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fpo.district || 'Latur'}, {fpo.state || 'Maharashtra'}</span>
                      {fpo.registration_number && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">Reg: {fpo.registration_number}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <div className="text-xs text-slate-500 font-medium">Active Members</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {fpo.total_members || 6} Farmers
                      </div>
                    </div>
                    <div className="bg-emerald-50/60 rounded-xl p-2.5 text-center">
                      <div className="text-xs text-emerald-700 font-medium">Bulk Premium</div>
                      <div className="text-base font-bold text-emerald-800 mt-0.5">
                        +₹150 - ₹200/q
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aggregates local harvests for direct sales to verified processing mills. Provides members with transparent escrow share distributions.
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  {isMember ? (
                    <button
                      onClick={() => navigate('/farmer/lots')}
                      className="w-full bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>View My Lots to Pool</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : status === 'pending' ? (
                    <button
                      disabled
                      className="w-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold py-2.5 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Application Under Review</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenJoinModal(fpo)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 hover:shadow-md"
                    >
                      <span>Request to Join</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Request Modal */}
      {selectedFpo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                FPO Membership Application
              </div>
              <h2 className="text-xl font-heading font-bold text-white">
                {selectedFpo.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {selectedFpo.district}, {selectedFpo.state} • {selectedFpo.total_members || 6} Active Members
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              {feedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Farmer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmerDetails.name}
                    onChange={(e) => setFarmerDetails({ ...farmerDetails, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={farmerDetails.phone}
                    onChange={(e) => setFarmerDetails({ ...farmerDetails, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Village
                  </label>
                  <input
                    type="text"
                    value={farmerDetails.village}
                    onChange={(e) => setFarmerDetails({ ...farmerDetails, village: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Ausa"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={farmerDetails.district}
                    onChange={(e) => setFarmerDetails({ ...farmerDetails, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Primary Crop
                  </label>
                  <select
                    value={farmerDetails.primary_crop}
                    onChange={(e) => setFarmerDetails({ ...farmerDetails, primary_crop: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Soybean">Soybean</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Gram (Chana)">Gram (Chana)</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Onion">Onion</option>
                    <option value="Tomato">Tomato</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Farm Land Size (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={farmerDetails.farm_size_acres}
                    onChange={(e) => setFarmerDetails({ ...farmerDetails, farm_size_acres: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 5.0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Application Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={farmerDetails.notes}
                  onChange={(e) => setFarmerDetails({ ...farmerDetails, notes: e.target.value })}
                  placeholder="Share details about your upcoming harvest or why you'd like to join..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Membership Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
