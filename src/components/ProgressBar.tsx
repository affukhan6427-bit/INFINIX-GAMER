import React from 'react';
import { CheckCircle2, Lock, Unlock, ShieldAlert } from 'lucide-react';

interface ProgressBarProps {
  completedStepsCount: number; // 0, 1, 2, 3
  totalSteps: number; // 3 verification steps
  isFullyUnlocked: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completedStepsCount,
  totalSteps = 3,
  isFullyUnlocked,
}) => {
  const percentage = Math.round((completedStepsCount / totalSteps) * 100);

  return (
    <div className="w-full bg-[#0a0f1d]/90 border border-emerald-500/20 rounded-xl p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-md">
      {/* Top row info */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {isFullyUnlocked ? (
              <Unlock className="w-4 h-4 animate-bounce text-emerald-300" />
            ) : (
              <Lock className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold font-orbitron text-slate-100 tracking-wide flex items-center gap-2">
              <span>Gate Progress</span>
              <span className="text-xs font-rajdhani font-semibold text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-950/40">
                {isFullyUnlocked ? 'ACCESS UNLOCKED' : `STEP ${Math.min(completedStepsCount + 1, 3)} OF 3`}
              </span>
            </h2>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg sm:text-xl font-black font-rajdhani text-emerald-400 tracking-wider">
            {completedStepsCount}/{totalSteps} <span className="text-xs text-slate-400 font-normal">STEPS</span>
          </div>
          <div className="text-[11px] font-medium font-rajdhani text-slate-400">
            {percentage}% Completed
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="relative w-full h-3 sm:h-3.5 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(0,255,102,0.8)] relative"
          style={{ width: `${Math.max(percentage, 3)}%` }}
        >
          {/* Glowing tip */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/80 rounded-full blur-[1px]" />
        </div>
      </div>

      {/* Step Markers */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-rajdhani">
        <div className={`flex items-center gap-1.5 ${completedStepsCount >= 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
          <CheckCircle2 className={`w-3.5 h-3.5 ${completedStepsCount >= 1 ? 'text-emerald-400' : 'text-slate-600'}`} />
          <span className="font-semibold truncate">01. TikTok</span>
        </div>
        <div className={`flex items-center gap-1.5 justify-center ${completedStepsCount >= 2 ? 'text-emerald-400' : completedStepsCount === 1 ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}>
          <CheckCircle2 className={`w-3.5 h-3.5 ${completedStepsCount >= 2 ? 'text-emerald-400' : 'text-slate-600'}`} />
          <span className="truncate">02. Instagram</span>
        </div>
        <div className={`flex items-center gap-1.5 justify-end ${completedStepsCount >= 3 ? 'text-emerald-400' : completedStepsCount === 2 ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}>
          <CheckCircle2 className={`w-3.5 h-3.5 ${completedStepsCount >= 3 ? 'text-emerald-400' : 'text-slate-600'}`} />
          <span className="truncate">03. YouTube</span>
        </div>
      </div>

      {/* Session Rule Advisory */}
      <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="leading-tight">
          Session security active: Steps must be completed in order in this active session. Reloading the page resets progress.
        </span>
      </div>
    </div>
  );
};
