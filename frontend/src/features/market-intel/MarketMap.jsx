import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { STATE_CENTERS, getDistrictsForStateWithCoords } from '../../data/districtCoordinates';

// Helper component to smoothly reposition and zoom Leaflet map
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom, { animate: true, duration: 0.6 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MarketMap({
  state = 'Maharashtra',
  district = '',
  onSelectDistrict,
  comparison = [],
  selectedCrop = null,
}) {
  const activeState = state || 'Maharashtra';

  // 1. Get all districts with coordinates for this state
  const districtMarkers = useMemo(() => {
    return getDistrictsForStateWithCoords(activeState);
  }, [activeState]);

  // 2. Map comparison data by district name for quick lookup (if available)
  const priceByDistrict = useMemo(() => {
    const map = {};
    if (Array.isArray(comparison)) {
      comparison.forEach(item => {
        const d = (item.markets?.district || '').trim().toLowerCase();
        if (d && !map[d]) {
          map[d] = item;
        }
      });
    }
    return map;
  }, [comparison]);

  // 3. Find active/selected district object
  const selectedDistrictObj = useMemo(() => {
    if (!district) return null;
    const target = district.trim().toLowerCase();
    return districtMarkers.find(d => d.name.toLowerCase() === target) || null;
  }, [district, districtMarkers]);

  // 4. Center & Zoom logic
  const { center, zoom } = useMemo(() => {
    if (selectedDistrictObj) {
      return {
        center: [selectedDistrictObj.lat, selectedDistrictObj.lng],
        zoom: 9,
      };
    }
    const stateCenter = STATE_CENTERS[activeState] || [19.75, 75.71];
    return {
      center: stateCenter,
      zoom: 6,
    };
  }, [selectedDistrictObj, activeState]);

  return (
    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Districts Map — {activeState}
            {district && (
              <span className="text-sm font-normal text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Focus: {district}
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Marking all {districtMarkers.length} districts in {activeState}. Click any district pin to focus.
          </p>
        </div>

        {/* Clean simple legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-300 inline-block" />
            <span className="text-slate-700 font-medium">Selected District</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B5E3C] inline-block" />
            <span className="text-slate-700 font-medium">State Districts</span>
          </div>
        </div>
      </div>

      {/* Map canvas */}
      <div className="relative h-[440px] w-full rounded-xl overflow-hidden border border-border shadow-inner">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <ChangeMapView center={center} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {districtMarkers.map(d => {
            const isSelected = selectedDistrictObj && selectedDistrictObj.name.toLowerCase() === d.name.toLowerCase();
            const priceInfo = priceByDistrict[d.name.toLowerCase()];

            return (
              <CircleMarker
                key={d.name}
                center={[d.lat, d.lng]}
                radius={isSelected ? 13 : 8}
                pathOptions={{
                  fillColor: isSelected ? '#10b981' : '#1B5E3C',
                  fillOpacity: isSelected ? 1 : 0.8,
                  color: isSelected ? '#047857' : '#ffffff',
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectDistrict) {
                      onSelectDistrict(d.name);
                    }
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                  <div className="text-xs font-semibold">
                    {d.name}
                    {priceInfo && (
                      <span className="text-emerald-700 ml-1">
                        (₹{Number(priceInfo.modal_price).toLocaleString('en-IN')})
                      </span>
                    )}
                  </div>
                </Tooltip>

                <Popup>
                  <div className="p-1 min-w-[170px] text-xs font-sans">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 leading-tight">{d.name}</span>
                      {isSelected && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mb-2">
                      District · {activeState}
                    </div>

                    {priceInfo ? (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-600 font-medium">Modal Price:</span>
                          <span className="font-bold text-emerald-800 text-sm">
                            ₹{Number(priceInfo.modal_price).toLocaleString('en-IN')}
                            <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                              /{selectedCrop?.unit || 'quintal'}
                            </span>
                          </span>
                        </div>
                        {priceInfo.markets?.name && (
                          <div className="text-[10px] text-slate-500 truncate">
                            APMC: {priceInfo.markets.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-slate-400" />
                        Agricultural Mandi District
                      </div>
                    )}

                    {!isSelected && onSelectDistrict && (
                      <button
                        type="button"
                        onClick={() => onSelectDistrict(d.name)}
                        className="mt-2.5 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] py-1 px-2 rounded transition-colors"
                      >
                        Filter to {d.name}
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
