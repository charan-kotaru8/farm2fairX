import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  Layers,
  ThermometerSnowflake,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import StorageBookingModal from './StorageBookingModal';
import MyStorageBookings from './MyStorageBookings';

export default function StorageFacilitiesView() {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'bookings'
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [districtFilter, setDistrictFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [minCapFilter, setMinCapFilter] = useState('');

  // Modals
  const [bookingModalFacility, setBookingModalFacility] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const data = await api.getStorageFacilities({
        district: districtFilter !== 'All' ? districtFilter : undefined,
        facilityType: typeFilter !== 'All' ? typeFilter : undefined,
        minCapacity: minCapFilter ? parseFloat(minCapFilter) : undefined,
      });
      setFacilities(data);
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browse') {
      loadFacilities();
    }
  }, [districtFilter, typeFilter, minCapFilter, activeTab, refreshKey]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-heading font-bold text-foreground">Storage & Warehousing</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              WDRA Certified
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Certified buffer storage to prevent distress sales, preserve quality, and capture market price peaks.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-border shadow-xs">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'browse'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Find Warehouses
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'bookings'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Storage Bookings
          </button>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <MyStorageBookings onRefreshTrigger={refreshKey} />
      ) : (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <span className="text-xs font-bold text-slate-500 mr-1">Filter By:</span>
              
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="rounded-xl border border-border bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary shadow-2xs"
              >
                <option value="All">All Districts</option>
                <option value="Latur">Latur</option>
                <option value="Ausa">Ausa</option>
                <option value="Renapur">Renapur</option>
                <option value="Solapur">Solapur</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-border bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary shadow-2xs"
              >
                <option value="All">All Facility Types</option>
                <option value="WDRA">WDRA Certified Warehouse</option>
                <option value="Cold">Cold Storage Complex</option>
                <option value="APMC">APMC Mandi Godown</option>
                <option value="State">State Corporation Warehouse</option>
              </select>

              <input
                type="number"
                value={minCapFilter}
                onChange={(e) => setMinCapFilter(e.target.value)}
                placeholder="Min Available (q)"
                className="w-32 rounded-xl border border-border bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-primary shadow-2xs"
              />
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              {facilities.length} facilities found
            </div>
          </div>

          {/* Facility Cards Grid */}
          {facilities.length === 0 ? (
            /* Designed Empty State (§6.7) */
            <div className="bg-white rounded-2xl border border-border p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-3xl">
                🏬
              </div>
              <h3 className="text-base font-bold text-slate-800">No storage facilities match your filters</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Try widening your search radius or selecting "All Districts" to browse certified grain godowns across Maharashtra.
              </p>
              <button
                onClick={() => {
                  setDistrictFilter('All');
                  setTypeFilter('All');
                  setMinCapFilter('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 pt-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> View All Facilities
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {facilities.map((fac) => {
                const isCold = fac.facility_type?.toLowerCase().includes('cold');
                const isNearlyFull = fac.is_nearly_full;

                return (
                  <div
                    key={fac.id}
                    className="bg-white rounded-2xl border border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header icon & title */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                            isCold
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCold ? '❄️' : '🏬'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">{fac.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {fac.address || fac.district}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                            <span className="text-xs font-bold text-slate-800">{fac.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Distance & Pricing */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Computed Distance:</span>
                          <span className="font-bold text-slate-800">{fac.computed_distance_km} km away</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Monthly Rent:</span>
                          <span className="font-bold text-emerald-700 text-sm">
                            ₹{fac.price_per_quintal_month} <span className="text-[10px] font-normal text-slate-500">/ q / mo</span>
                          </span>
                        </div>
                      </div>

                      {/* Capacity & Occupancy Meter */}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available Space:</span>
                          <span className="font-bold text-slate-900">{fac.available_capacity_quintals}q / {fac.total_capacity_quintals}q</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isNearlyFull ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${fac.occupancy_percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{fac.occupancy_percentage}% Occupied</span>
                          {isNearlyFull && (
                            <span className="text-amber-700 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Near Capacity
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Feature tags */}
                      {fac.features && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {fac.features.slice(0, 3).map((feat, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Book Action */}
                    <div className="pt-2">
                      <button
                        onClick={() => setBookingModalFacility(fac)}
                        disabled={fac.available_capacity_quintals <= 0}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
                      >
                        Book Storage Space
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalFacility && (
        <StorageBookingModal
          facility={bookingModalFacility}
          onClose={() => setBookingModalFacility(null)}
          onSuccess={(res) => {
            showToast(res.message || 'Storage booked successfully!');
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
