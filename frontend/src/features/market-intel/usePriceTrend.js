import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

/**
 * Hook for fetching real 7-day price trend from local DB (Plan v3.1 §3).
 * Never triggers per-request Agmarknet syncs.
 * Reports daysCount so UI can honestly convey data density.
 */
export function usePriceTrend({ state, district, commodity, cropId, marketId, days = 7 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrend = useCallback(async () => {
    // If no crop or commodity specified, nothing to trend
    if (!commodity && !cropId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.getPriceTrend({
        state: state || undefined,
        district: district || undefined,
        commodity: commodity || undefined,
        cropId: cropId || undefined,
        marketId: marketId || undefined,
        days,
      });
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Error fetching price trend:', err);
      setError(err.message || 'Failed to load price trend');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [state, district, commodity, cropId, marketId, days]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return {
    data,
    loading,
    error,
    daysCount: data.length,
    refetch: fetchTrend,
  };
}
