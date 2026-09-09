import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Check, Truck, Clock, PackageCheck, Navigation, MapPin, Package, HandCoins, CheckCircle2, ShieldCheck } from 'lucide-react';

export const DEFAULT_TRANSPORT_STEPS = [
  { key: 'assigned', label: 'Assigned', icon: Truck, description: 'Provider assigned to lot' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled', icon: Clock, description: 'Slot confirmed with farmer' },
  { key: 'picked_up', label: 'Picked Up', icon: PackageCheck, description: 'Quality verified at farmgate' },
  { key: 'in_transit', label: 'In Transit', icon: Navigation, description: 'Vehicle on route to buyer' },
  { key: 'delivered', label: 'Delivered', icon: MapPin, description: 'Safely arrived at destination' },
];

export const TRANSACTION_LIFECYCLE_STEPS = [
  { key: 'created', label: 'Lot Listed', icon: Package, description: 'Crop lot listed by farmer' },
  { key: 'offered', label: 'Offer Received', icon: HandCoins, description: 'Buyer submitted commercial bid' },
  { key: 'accepted', label: 'Deal Locked', icon: CheckCircle2, description: 'Farmer accepted bid' },
  { key: 'assigned', label: 'Transport Booked', icon: Truck, description: 'Logistics provider assigned' },
  { key: 'pickup_scheduled', label: 'Pickup Slot', icon: Clock, description: 'Farmgate pickup scheduled' },
  { key: 'picked_up', label: 'Verified & Loaded', icon: ShieldCheck, description: 'Buyer agent verified quality' },
  { key: 'in_transit', label: 'In Transit', icon: Navigation, description: 'En route to buyer warehouse' },
  { key: 'delivered', label: 'Settled', icon: MapPin, description: 'Delivered & escrow released' },
];

export default function StatusStepper({
  currentStatus = 'assigned',
  steps = DEFAULT_TRANSPORT_STEPS,
  timestamps = {},
  className = '',
}) {
  const currentIndex = steps.findIndex(s => s.key === currentStatus);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className={`w-full py-4 px-2 ${className}`}>
      <div className="relative flex items-center justify-between">
        {/* Continuous background track */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0" />
        
        {/* Completed progress track */}
        <div 
          className="absolute top-5 left-8 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 -z-0"
          style={{
            width: activeIdx === 0 ? '0%' : `${(activeIdx / (steps.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 4rem)'
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isUpcoming = idx > activeIdx;
          const IconComponent = step.icon || Truck;
          const time = timestamps[step.key];

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 min-w-[70px] sm:min-w-[100px]">
              {/* Floating mini live truck animation for In Transit when active */}
              {step.key === 'in_transit' && isCurrent && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center animate-in fade-in zoom-in-90">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <DotLottieReact
                      src="https://lottie.host/41918dfd-f845-4b41-95ce-2b41363e8de4/R8Vo9MVouD.json"
                      loop
                      autoplay
                    />
                  </div>
                </div>
              )}

              {/* Node Icon Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-amber-200 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-xs sm:text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'text-amber-600 font-bold'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
                {time ? (
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    {time}
                  </span>
                ) : isCurrent ? (
                  <span className="text-[10px] font-medium text-amber-600/90 block leading-tight mt-0.5">
                    Current Stage
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
