/**
 * useMarketsMeta — provides comprehensive all-India states + districts lookup
 * combined with real-time active APMC markets from /markets/meta.
 * Zero hardcoding. Used across all profile forms and Market Intelligence.
 */
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  INDIAN_STATES,
  INDIAN_STATES_DISTRICTS,
  districtsFor as geoDistrictsFor,
} from '../data/indianStatesDistricts';

let _cached = null; // module-level cache

export function useMarketsMeta() {
  const [meta, setMeta] = useState(
    _cached || {
      states: INDIAN_STATES,
      districts_by_state: INDIAN_STATES_DISTRICTS,
      db_states: ['Maharashtra'],
    }
  );
  const [metaLoading, setMetaLoading] = useState(!_cached);

  useEffect(() => {
    if (_cached) return;
    async function load() {
      try {
        const res = await api.getMarketsMeta();
        // Merge backend states with canonical full Indian states & districts
        const mergedDistricts = { ...INDIAN_STATES_DISTRICTS };
        if (res?.districts_by_state) {
          for (const [st, dists] of Object.entries(res.districts_by_state)) {
            if (!mergedDistricts[st]) {
              mergedDistricts[st] = dists;
            } else {
              // Add any unique backend districts
              const union = Array.from(new Set([...mergedDistricts[st], ...dists])).sort();
              mergedDistricts[st] = union;
            }
          }
        }

        const mergedStates = Array.from(
          new Set([...INDIAN_STATES, ...(res?.states || [])])
        ).sort();

        const combined = {
          states: mergedStates,
          districts_by_state: mergedDistricts,
          db_states: res?.states || ['Maharashtra'],
        };

        _cached = combined;
        setMeta(combined);
      } catch (err) {
        console.warn('Could not fetch /markets/meta, using canonical Indian geo data:', err);
      } finally {
        setMetaLoading(false);
      }
    }
    load();
  }, []);

  /**
   * districtsFor(state) — returns authentic districts for any Indian state.
   */
  function districtsFor(state) {
    if (!state) return [];
    const fromMeta = meta.districts_by_state[state];
    if (fromMeta && fromMeta.length > 0) return fromMeta;
    return geoDistrictsFor(state);
  }

  return {
    meta,
    states: meta.states || INDIAN_STATES,
    metaLoading,
    districtsFor,
    INDIAN_STATES,
  };
}

export { INDIAN_STATES, districtsFor } from '../data/indianStatesDistricts';
