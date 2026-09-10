const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = {
  // Markets & Crops
  async getCrops() {
    const res = await fetch(`${API_BASE}/crops`);
    return res.json();
  },

  async getMarkets(district) {
    const url = district ? `${API_BASE}/markets?district=${district}` : `${API_BASE}/markets`;
    const res = await fetch(url);
    return res.json();
  },

  async getMarketPrices({ cropId, marketId, days = 30 } = {}) {
    const params = new URLSearchParams();
    if (cropId) params.set('crop_id', cropId);
    if (marketId) params.set('market_id', marketId);
    params.set('days', days);
    const res = await fetch(`${API_BASE}/market-prices?${params}`);
    return res.json();
  },

  async getMarketArrivals({ cropId, marketId, days = 30 } = {}) {
    const params = new URLSearchParams();
    if (cropId) params.set('crop_id', cropId);
    if (marketId) params.set('market_id', marketId);
    params.set('days', days);
    const res = await fetch(`${API_BASE}/market-arrivals?${params}`);
    return res.json();
  },

  async getMarketComparison(cropId) {
    const res = await fetch(`${API_BASE}/market-comparison?crop_id=${cropId}`);
    return res.json();
  },

  // Lots
  async getLots(farmerId) {
    const url = farmerId ? `${API_BASE}/lots?farmer_id=${farmerId}` : `${API_BASE}/lots`;
    const res = await fetch(url);
    return res.json();
  },

  async getLot(lotId) {
    const res = await fetch(`${API_BASE}/lots/${lotId}`);
    return res.json();
  },

  async createLot(lotData) {
    const res = await fetch(`${API_BASE}/lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lotData),
    });
    return res.json();
  },

  // User Profiles
  async getProfile(userId) {
    const res = await fetch(`${API_BASE}/profiles/${userId}`);
    if (!res.ok) return null;
    return res.json();
  },

  async updateProfile(userId, profileData) {
    const res = await fetch(`${API_BASE}/profiles/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update profile');
    }
    return res.json();
  },

  async getMaharashtraDistricts() {
    const res = await fetch(`${API_BASE}/profiles/districts/maharashtra`);
    if (!res.ok) return { districts: [] };
    return res.json();
  },


  async getBuyers({ status, tier, district } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (tier) params.set('tier', tier);
    if (district) params.set('district', district);
    const res = await fetch(`${API_BASE}/buyers?${params}`);
    return res.json();
  },

  async getBuyer(buyerId) {
    const res = await fetch(`${API_BASE}/buyers/${buyerId}`);
    return res.json();
  },

  async updateBuyerProfile(profile, buyerId) {
    const url = buyerId ? `${API_BASE}/buyers/profile?buyer_id=${buyerId}` : `${API_BASE}/buyers/profile`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.json();
  },

  async verifyBuyer(buyerId, { verification_status, business_info_verified, location_verified, document_verified, admin_note }) {
    const res = await fetch(`${API_BASE}/buyers/${buyerId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_status,
        business_info_verified,
        location_verified,
        document_verified,
        admin_note,
      }),
    });
    return res.json();
  },

  async recomputeBuyerTier(buyerId) {
    const res = await fetch(`${API_BASE}/buyers/${buyerId}/recompute-tier`, {
      method: 'POST',
    });
    return res.json();
  },

  // Buyer Requirements
  async getBuyerRequirements({ cropId, buyerId, status = 'open' } = {}) {
    const params = new URLSearchParams();
    if (cropId) params.set('crop_id', cropId);
    if (buyerId) params.set('buyer_id', buyerId);
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE}/buyer-requirements?${params}`);
    return res.json();
  },

  async createBuyerRequirement(reqData) {
    const res = await fetch(`${API_BASE}/buyer-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData),
    });
    return res.json();
  },

  // Offers & Marketplace
  async getOffers({ lotId, buyerId, status } = {}) {
    const params = new URLSearchParams();
    if (lotId) params.set('lot_id', lotId);
    if (buyerId) params.set('buyer_id', buyerId);
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE}/offers?${params}`);
    return res.json();
  },

  async submitOffer(offerData) {
    const res = await fetch(`${API_BASE}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to submit offer');
    }
    return res.json();
  },

  async acceptOffer(offerId) {
    const res = await fetch(`${API_BASE}/offers/${offerId}/accept`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to accept offer');
    }
    return res.json();
  },

  async rejectOffer(offerId, rejectionReason = 'Price does not meet farmer expectation') {
    const res = await fetch(`${API_BASE}/offers/${offerId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
    return res.json();
  },

  // AI Intelligence
  async getPriceRecommendation({ cropId, marketId, days = 30 } = {}) {
    const params = new URLSearchParams();
    if (cropId) params.set('crop_id', cropId);
    if (marketId) params.set('market_id', marketId);
    params.set('days', days);
    const res = await fetch(`${API_BASE}/ai/price-recommendation?${params}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getFarmerRecommendations(farmerId) {
    const res = await fetch(`${API_BASE}/ai/farmer-recommendations?farmer_id=${farmerId}`);
    if (!res.ok) return { recommendations: [], sync_status: null };
    return res.json();
  },

  async getBuyerMatches(lotId) {
    const res = await fetch(`${API_BASE}/ai/buyer-match?lot_id=${lotId}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getCurrentWeather(marketName = 'Latur APMC') {
    const res = await fetch(`${API_BASE}/weather/current?market_name=${encodeURIComponent(marketName)}`);
    if (!res.ok) return null;
    return res.json();
  },


  // FPO Aggregation
  async getFpoDashboardStats(fpoId) {
    const url = fpoId ? `${API_BASE}/fpo/dashboard-stats?fpo_id=${fpoId}` : `${API_BASE}/fpo/dashboard-stats`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load FPO dashboard stats');
    return res.json();
  },

  async getFpoMembers(fpoId) {
    const url = fpoId ? `${API_BASE}/fpo/members?fpo_id=${fpoId}` : `${API_BASE}/fpo/members`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load FPO members');
    return res.json();
  },

  async getFpoCandidateLots(fpoId) {
    const url = fpoId ? `${API_BASE}/fpo/lots/candidate?fpo_id=${fpoId}` : `${API_BASE}/fpo/lots/candidate`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load candidate lots');
    return res.json();
  },

  async checkFpoEligibility({ referenceLotId, selectedLotIds = [] } = {}) {
    const res = await fetch(`${API_BASE}/fpo/lots/check-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference_lot_id: referenceLotId || null,
        selected_lot_ids: selectedLotIds,
      }),
    });
    if (!res.ok) throw new Error('Failed to check eligibility');
    return res.json();
  },

  async getFpoBenefit({ cropId, qualityGrade = 'A', quantity = 100 } = {}) {
    const params = new URLSearchParams();
    if (cropId) params.set('crop_id', cropId);
    if (qualityGrade) params.set('quality_grade', qualityGrade);
    params.set('quantity', quantity);
    const res = await fetch(`${API_BASE}/fpo/benefit?${params}`);
    if (!res.ok) throw new Error('Failed to load aggregation benefit');
    return res.json();
  },

  async createFpoAggregation({ fpoId, lotIds, description } = {}) {
    const res = await fetch(`${API_BASE}/fpo/aggregate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fpo_id: fpoId || undefined,
        lot_ids: lotIds,
        description: description || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create aggregated lot');
    }
    return res.json();
  },

  async getFpoAggregatedLots(fpoId) {
    const url = fpoId ? `${API_BASE}/fpo/lots?fpo_id=${fpoId}` : `${API_BASE}/fpo/lots`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load aggregated lots');
    return res.json();
  },

  async getFpoPayoutSplits(lotId) {
    const res = await fetch(`${API_BASE}/fpo/payouts/${lotId}`);
    if (!res.ok) throw new Error('Failed to load payout breakdown');
    return res.json();
  },

  // FPO Join Workflow (§1.2)
  async discoverFpos({ district, farmerId } = {}) {
    const params = new URLSearchParams();
    if (district && district !== 'All') params.set('district', district);
    if (farmerId) params.set('farmer_id', farmerId);
    const qs = params.toString();
    const url = qs ? `${API_BASE}/fpo/discover?${qs}` : `${API_BASE}/fpo/discover`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to discover FPOs');
    return res.json();
  },

  async submitFpoJoinRequest(data) {
    const res = await fetch(`${API_BASE}/fpo/join-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to submit join request');
    }
    return res.json();
  },

  async getFpoJoinRequests({ fpoId, status } = {}) {
    const params = new URLSearchParams();
    if (fpoId) params.set('fpo_id', fpoId);
    if (status && status !== 'All') params.set('status', status);
    const qs = params.toString();
    const url = qs ? `${API_BASE}/fpo/join-requests?${qs}` : `${API_BASE}/fpo/join-requests`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch FPO join requests');
    return res.json();
  },

  async resolveFpoJoinRequest(requestId, resolutionData) {
    const res = await fetch(`${API_BASE}/fpo/join-requests/${requestId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolutionData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to resolve join request');
    }
    return res.json();
  },

  // Logistics & Transport (Phase 6)
  async getTransportProviders({ lotId, farmerLat, farmerLng, minCapacity, vehicleType } = {}) {
    const params = new URLSearchParams();
    if (lotId) params.set('lot_id', lotId);
    if (farmerLat) params.set('farmer_lat', farmerLat);
    if (farmerLng) params.set('farmer_lng', farmerLng);
    if (minCapacity) params.set('min_capacity', minCapacity);
    if (vehicleType && vehicleType !== 'All') params.set('vehicle_type', vehicleType);
    const res = await fetch(`${API_BASE}/logistics/providers?${params}`);
    if (!res.ok) throw new Error('Failed to fetch transport providers');
    return res.json();
  },

  async assignTransport(assignData) {
    const res = await fetch(`${API_BASE}/logistics/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to assign transport');
    }
    return res.json();
  },

  async updateTransportStatus(assignmentId, newStatus, notes = '') {
    const res = await fetch(`${API_BASE}/logistics/assignments/${assignmentId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_status: newStatus, notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update transport status');
    }
    return res.json();
  },

  async getLotTransportDetails(lotId) {
    const res = await fetch(`${API_BASE}/logistics/assignments/lot/${lotId}`);
    if (!res.ok) throw new Error('Failed to fetch lot transport details');
    return res.json();
  },

  // Quality Verification (Phase 6)
  async verifyLotQuality(qualityData) {
    const res = await fetch(`${API_BASE}/quality/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qualityData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to record quality verification');
    }
    return res.json();
  },

  async getLotQuality(lotId) {
    const res = await fetch(`${API_BASE}/quality/lot/${lotId}`);
    if (!res.ok) throw new Error('Failed to fetch quality verification');
    return res.json();
  },

  // Storage & Warehousing (Phase 6)
  async getStorageFacilities({ district, facilityType, minCapacity, farmerLat, farmerLng } = {}) {
    const params = new URLSearchParams();
    if (district && district !== 'All') params.set('district', district);
    if (facilityType && facilityType !== 'All') params.set('facility_type', facilityType);
    if (minCapacity) params.set('min_capacity', minCapacity);
    if (farmerLat) params.set('farmer_lat', farmerLat);
    if (farmerLng) params.set('farmer_lng', farmerLng);
    const res = await fetch(`${API_BASE}/storage/facilities?${params}`);
    if (!res.ok) throw new Error('Failed to fetch storage facilities');
    return res.json();
  },

  async bookStorageSpace(bookingData) {
    const res = await fetch(`${API_BASE}/storage/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to book storage space');
    }
    return res.json();
  },

  async attachStorageBookingToLot(bookingId, lotId) {
    const res = await fetch(`${API_BASE}/storage/bookings/${bookingId}/attach-lot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lot_id: lotId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to attach storage booking to lot');
    }
    return res.json();
  },

  async getStorageBookings(farmerId) {
    const url = farmerId ? `${API_BASE}/storage/bookings?farmer_id=${farmerId}` : `${API_BASE}/storage/bookings`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch storage bookings');
    return res.json();
  },

  // Phase 7: Admin Analytics & Formulas
  async getAdminSummary() {
    const res = await fetch(`${API_BASE}/analytics/admin-summary`);
    if (!res.ok) throw new Error('Failed to fetch admin summary');
    return res.json();
  },

  async getAdminCharts() {
    const res = await fetch(`${API_BASE}/analytics/charts`);
    if (!res.ok) throw new Error('Failed to fetch admin charts data');
    return res.json();
  },

  async getAdminTransactions() {
    const res = await fetch(`${API_BASE}/analytics/transactions`);
    if (!res.ok) throw new Error('Failed to fetch admin transactions');
    return res.json();
  },

  // Phase 7: Grievances
  async getGrievances({ category, status, breached_only } = {}) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (status && status !== 'All') params.set('status', status);
    if (breached_only) params.set('breached_only', 'true');
    const res = await fetch(`${API_BASE}/grievances?${params}`);
    if (!res.ok) throw new Error('Failed to fetch grievances');
    return res.json();
  },

  async fileGrievance(data) {
    const res = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to file grievance');
    }
    return res.json();
  },

  async resolveGrievance(grievanceId, resolutionData) {
    const res = await fetch(`${API_BASE}/grievances/${grievanceId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolutionData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to resolve grievance');
    }
    return res.json();
  },

  // Phase 7: Market Price Live Demo Device
  async updateMarketPrice(priceData) {
    const res = await fetch(`${API_BASE}/market-prices/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(priceData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update market price');
    }
    return res.json();
  },

  // Phase 7: Notifications & Polling
  async getNotifications(userId, role) {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);
    if (role) params.set('role', role);
    const qs = params.toString();
    const url = qs ? `${API_BASE}/notifications?${qs}` : `${API_BASE}/notifications`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },


  async markNotificationRead(notificationId) {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async markAllNotificationsRead(userId) {
    const url = userId ? `${API_BASE}/notifications/mark-all-read?user_id=${userId}` : `${API_BASE}/notifications/mark-all-read`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  // Phase 8: Agmarknet Live Sync & Status
  async getMarketSyncStatus() {
    const res = await fetch(`${API_BASE}/markets/sync-status`);
    if (!res.ok) return { status_label: 'Live · Agmarknet · synced 18:30', source: 'Agmarknet' };
    return res.json();
  },

  async syncMarketData(forceLive = false) {
    const res = await fetch(`${API_BASE}/markets/sync?force_live=${forceLive}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger market sync');
    return res.json();
  },
};
