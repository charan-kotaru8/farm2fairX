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

  // Buyers & Tier Verification
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

  async getBuyerMatches(lotId) {
    const res = await fetch(`${API_BASE}/ai/buyer-match?lot_id=${lotId}`);
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
};

