import React from 'react';
import { Globe, MapPin, ChevronDown } from 'lucide-react';
import { INDIAN_STATES, districtsFor } from '../../data/indianStatesDistricts';

/**
 * StateDistrictSelector (§3.1 Whole-India Coverage)
 *
 * Provides national state and cascading district selection powered by
 * authentic Indian geography data.
 *
 * Props:
 * - state: string
 * - district: string
 * - onChangeState: (state: string) => void
 * - onChangeDistrict: (district: string) => void
 * - statePlaceholder?: string (default: "Select State")
 * - districtPlaceholder?: string (default: "Select District")
 * - allowAllStates?: boolean (adds "All States" option)
 * - allowAllDistricts?: boolean (adds "All Districts" option)
 * - disabled?: boolean
 * - layout?: 'inline' | 'stacked' | 'grid'
 * - required?: boolean
 * - labelClass?: string
 * - selectClass?: string
 */
export default function StateDistrictSelector({
  state = '',
  district = '',
  onChangeState,
  onChangeDistrict,
  statePlaceholder = 'Select State',
  districtPlaceholder = 'Select District',
  allowAllStates = false,
  allowAllDistricts = false,
  disabled = false,
  layout = 'inline',
  required = false,
  stateLabel = 'State',
  districtLabel = 'District',
  showLabels = true,
}) {
  const currentDistricts = districtsFor(state);

  const handleStateChange = (newState) => {
    if (onChangeState) onChangeState(newState);
    // When state changes, reset district if it's not in the new state's districts
    const newDistricts = districtsFor(newState);
    if (district && !newDistricts.includes(district)) {
      if (onChangeDistrict) onChangeDistrict('');
    }
  };

  const containerClasses = {
    inline: 'flex flex-wrap gap-4 items-end',
    stacked: 'flex flex-col gap-4',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  }[layout] || 'flex flex-wrap gap-4 items-end';

  return (
    <div className={containerClasses}>
      {/* State Selector */}
      <div className="flex-1 min-w-[170px]">
        {showLabels && (
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
            {stateLabel} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={disabled}
            required={required}
          >
            {allowAllStates ? (
              <option value="">{statePlaceholder || 'All States'}</option>
            ) : (
              <option value="" disabled>{statePlaceholder}</option>
            )}
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* District Selector */}
      <div className="flex-1 min-w-[170px]">
        {showLabels && (
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {districtLabel} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            value={district}
            onChange={(e) => onChangeDistrict && onChangeDistrict(e.target.value)}
            disabled={disabled || !state || currentDistricts.length === 0}
            required={required}
          >
            {allowAllDistricts ? (
              <option value="">
                {!state
                  ? 'Select state first'
                  : currentDistricts.length === 0
                  ? 'No districts available'
                  : districtPlaceholder || 'All Districts'}
              </option>
            ) : (
              <option value="" disabled>
                {!state
                  ? 'Select state first'
                  : currentDistricts.length === 0
                  ? 'No districts available'
                  : districtPlaceholder}
              </option>
            )}
            {currentDistricts.map((dst) => (
              <option key={dst} value={dst}>
                {dst}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
