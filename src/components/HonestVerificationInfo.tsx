import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export const HonestVerificationInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-rajdhani text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-slate-300">
            Honest Verification Transparency Notice
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 text-xs font-space text-slate-400 space-y-2.5 border-t border-slate-800/80 bg-slate-950/40">
          <p className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-200">How our verification works:</strong> Because official TikTok, Instagram, and YouTube APIs require visitors to grant full personal account OAuth permissions to inspect follow/subscribe actions, this gateway does not request access to your private profile.
            </span>
          </p>
          <p className="pl-6 text-[11px] leading-relaxed">
            Instead, verification is based on opening each profile link, returning to this page, and observing the mandatory 15–20 second dwell time. Please genuinely support the creator by hitting follow and subscribe on each channel!
          </p>
        </div>
      )}
    </div>
  );
};
