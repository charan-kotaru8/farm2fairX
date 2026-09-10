import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Users, Phone, MapPin, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

export default function MemberDirectory() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCrop, setFilterCrop] = useState('');

  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await api.getFpoMembers({
          userId: user?.id,
          fpoId: profile?.fpo_id,
        });
        setMembers(data);
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [user, profile]);

  const filteredMembers = members.filter(m => {
    if (filterCrop && m.primary_crop !== filterCrop) return false;
    return true;
  });

  const totalLand = members.reduce((acc, m) => acc + (parseFloat(m.farm_size_acres) || 0), 0);
  const totalLots = members.reduce((acc, m) => acc + (m.active_lots_count || 0), 0);
  const totalActiveQty = members.reduce((acc, m) => acc + (parseFloat(m.total_active_quantity) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-border" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  const fpoDisplayName = profile?.full_name 
    ? (profile.full_name.toLowerCase().includes('fpo') || profile.full_name.toLowerCase().includes('producer') ? profile.full_name : `${profile.full_name} Farmer Producer Co.`)
    : 'Farmer Producer Co.';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">FPO Member Directory</h1>
          <p className="text-muted-foreground text-sm">
            {fpoDisplayName} • {members.length} smallholder farmer members in {profile?.district || 'Maharashtra'}
          </p>
        </div>

        <button
          onClick={() => navigate('/fpo/aggregate')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Pool Member Lots</span>
        </button>
      </div>

      {/* Stats summary pill bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-border">
          <span className="text-xs text-muted-foreground font-medium uppercase">Total Members</span>
          <div className="text-2xl font-bold font-heading text-foreground mt-0.5">{members.length} Farmers</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border">
          <span className="text-xs text-muted-foreground font-medium uppercase">Pooled Landholding</span>
          <div className="text-2xl font-bold font-heading text-foreground mt-0.5">{totalLand.toFixed(1)} Acres</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border">
          <span className="text-xs text-muted-foreground font-medium uppercase">Active Member Lots</span>
          <div className="text-2xl font-bold font-heading text-foreground mt-0.5">{totalLots} Listings</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border">
          <span className="text-xs text-muted-foreground font-medium uppercase">Available for Pooling</span>
          <div className="text-2xl font-bold font-heading text-emerald-700 mt-0.5">{totalActiveQty} Quintals</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium">Filter Crop:</span>
          <button
            onClick={() => setFilterCrop('')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${!filterCrop ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-slate-200 text-foreground'}`}
          >
            All ({members.length})
          </button>
          <button
            onClick={() => setFilterCrop('Soybean')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filterCrop === 'Soybean' ? 'bg-amber-600 text-white' : 'bg-muted hover:bg-slate-200 text-foreground'}`}
          >
            🌾 Soybean (5)
          </button>
          <button
            onClick={() => setFilterCrop('Cotton')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filterCrop === 'Cotton' ? 'bg-blue-600 text-white' : 'bg-muted hover:bg-slate-200 text-foreground'}`}
          >
            ☁️ Cotton (1)
          </button>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">Showing {filteredMembers.length} members</span>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map(member => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-border shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
          >
            <div>
              {/* Header with Avatar and Name */}
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-heading font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                  {member.avatar_initials || 'FM'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-heading font-bold text-base text-foreground truncate">
                      {member.farmer_name}
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{member.village}, {member.district}</span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="space-y-2 py-3 border-y border-border/70 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Primary Crop:</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {member.primary_crop === 'Cotton' ? '☁️ Cotton' : '🌾 Soybean'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Farm Landholding:</span>
                  <span className="font-semibold text-foreground">{member.farm_size_acres} Acres</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Unpooled Lots:</span>
                  <span className="font-bold text-emerald-700">
                    {member.active_lots_count || 0} lots ({member.total_active_quantity || 0} Q)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="font-mono text-slate-600">{member.phone || '+91 98221 11000'}</span>
                </div>
              </div>

              {/* Active Lots Preview */}
              {member.active_lots && member.active_lots.length > 0 && (
                <div className="mt-3 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Listed Harvest Lots
                  </span>
                  {member.active_lots.map(l => (
                    <div key={l.id} className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                      <span className="font-medium text-slate-700">
                        {l.crops?.icon || '🌾'} Grade {l.quality_grade}
                      </span>
                      <span className="font-bold text-slate-900">{l.quantity} Q</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex gap-2">
              <button
                onClick={() => navigate('/fpo/aggregate')}
                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs py-2 rounded-xl transition-colors border border-amber-200 flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Select for Pool</span>
              </button>
              <a
                href={`tel:${member.phone}`}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Call Member"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
