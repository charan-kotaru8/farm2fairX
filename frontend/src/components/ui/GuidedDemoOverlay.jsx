import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, ChevronLeft, ChevronRight, X, Sparkles, 
  ExternalLink, CheckCircle2, ArrowRight, ShieldCheck, Play 
} from 'lucide-react';

const DEMO_ACTS = [
  {
    act: 1,
    role: 'Farmer (Ramesh)',
    title: 'Farmer Discovery & AI Price Intelligence',
    route: '/farmer/dashboard',
    routeLabel: 'Farmer Dashboard',
    problem: 'Farmers are price-takers forced into distress sales because they lack forward mandi intelligence.',
    solution: 'Ramesh sees today\'s ₹4,850/q price and the AI recommendation to WAIT 2–3 days (expected ₹4,980/q, 82% confidence) based on 14-day arrival volume trends.',
    pitchBeat: 'Point to the "Why" explanation chips and the confidence rating — proving genuine predictive ML, not static outputs.',
  },
  {
    act: 2,
    role: 'Buyer (Certified)',
    title: 'Transparent Marketplace & 94% Matching',
    route: '/buyer/marketplace',
    routeLabel: 'Crop Marketplace',
    problem: 'Buyers waste days sourcing fragmented lots and face counterparty default risks.',
    solution: 'Buyer views Ramesh\'s 5-tonne Soybean lot. The multi-factor matching engine scores 94% match based on distance, quantity, and grade requirement.',
    pitchBeat: 'Highlight the matching breakdown (Distance 35%, Quantity 30%, Quality 20%, Reliability 15%) — judges evaluating ML will probe this.',
  },
  {
    act: 3,
    role: 'Farmer (Deal Lock)',
    title: 'Fair Value Story Card & Benefit Creation',
    route: '/farmer/lots',
    routeLabel: 'My Lots & Offers',
    problem: 'Traditional APMC trade conceals how much margin middlemen extract.',
    solution: 'Ramesh accepts the best offer. The Fair Value Story card immediately proves ₹280/q premium over mandi baseline (₹14,000 net value unlocked).',
    pitchBeat: 'Emphasize the unified formula: (accepted_offer - first_available_offer) x quantity. This exact formula traces 1:1 into the Admin dashboard.',
  },
  {
    act: 4,
    role: 'Logistics & Buyer Agent',
    title: 'Connected Transport & Farmgate Inspection',
    route: '/farmer/logistics',
    routeLabel: 'Logistics & Transport',
    problem: 'Transport double-booking and quality disputes at buyer delivery cause payment hold-ups.',
    solution: 'Carrier is assigned and locked as Unavailable. Buyer agent verifies Grade A at farmgate. Status stepper advances in sync with lot state.',
    pitchBeat: 'Show the 8-node Status Stepper and the side-by-side Before/After quality verification certificate.',
  },
  {
    act: 5,
    role: 'Admin Governance',
    title: 'Governance Desk, SLA Breaches & Live Demo Device',
    route: '/admin/dashboard',
    routeLabel: 'Admin Overview',
    problem: 'Platform managers need complete audit integrity and immediate market responsiveness.',
    solution: 'Bento grid aggregates ₹2,24,000 farmer benefit with locked formula. Grievance queue flags SLA breach with red pulsing alert. Mandi price editor dynamically alters AI recommendations live.',
    pitchBeat: 'Do the live price edit trick! Bump Latur Soybean price in Market Price Control and watch AI recommendations update platform-wide instantly.',
  },
];

export default function GuidedDemoOverlay({ isOpen, onClose }) {
  const [currentActIdx, setCurrentActIdx] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const currentAct = DEMO_ACTS[currentActIdx];

  const handleNavigate = () => {
    navigate(currentAct.route);
  };

  const handleNext = () => {
    if (currentActIdx < DEMO_ACTS.length - 1) {
      const nextIdx = currentActIdx + 1;
      setCurrentActIdx(nextIdx);
      navigate(DEMO_ACTS[nextIdx].route);
    }
  };

  const handlePrev = () => {
    if (currentActIdx > 0) {
      const prevIdx = currentActIdx - 1;
      setCurrentActIdx(prevIdx);
      navigate(DEMO_ACTS[prevIdx].route);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in fade-in">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 hover:bg-slate-800 text-xs font-bold transition-all"
        >
          <Compass className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Resume Guided Demo (Act {currentAct.act}/5)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 max-w-md w-full z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-5 shadow-2xl border border-slate-700/80 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Compass className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Judge Walkthrough Playbook (§8.6)
              </div>
              <h4 className="text-sm font-bold font-heading text-white">
                Act {currentAct.act} of 5: {currentAct.title}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Minimize overlay"
            >
              Minimize
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5">
          {DEMO_ACTS.map((act, i) => (
            <button
              key={act.act}
              onClick={() => {
                setCurrentActIdx(i);
                navigate(act.route);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === currentActIdx
                  ? 'w-8 bg-emerald-400'
                  : i < currentActIdx
                  ? 'w-3 bg-emerald-700'
                  : 'w-3 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Content Box */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
              Persona: {currentAct.role}
            </span>
            <button
              onClick={handleNavigate}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Jump to {currentAct.routeLabel}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <p className="text-slate-300 leading-relaxed">
            {currentAct.solution}
          </p>

          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
            <span className="font-bold text-emerald-300 block mb-0.5 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Verbal Pitch Script:
            </span>
            <span className="italic text-[11px] leading-relaxed">
              "{currentAct.pitchBeat}"
            </span>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handlePrev}
            disabled={currentActIdx === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleNavigate}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
          >
            <span>Go to Screen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentActIdx === DEMO_ACTS.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-semibold transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
