import React, { useState, useRef } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface HeaderProps {
  websiteTitle: string;
  onOpenAdmin: () => void;
  onResetFlow: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  websiteTitle,
  onOpenAdmin,
  onResetFlow,
  soundEnabled,
  onToggleSound,
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [isUnlockedFlash, setIsUnlockedFlash] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 5-click secret trigger on the logo to open the Admin Panel
  const handleLogoClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    setPulseKey((k) => k + 1);

    // Haptic feedback for mobile devices (Android Chrome)
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25 + nextCount * 10);
      }
    } catch {}

    if (nextCount >= 5) {
      // 5th click: Unlock victory fanfare and visual flash
      soundManager.playUnlock();
      setIsUnlockedFlash(true);
      setTimeout(() => {
        onOpenAdmin();
        setClickCount(0);
        setIsUnlockedFlash(false);
      }, 350);
    } else {
      // 1st to 4th click: Progressive ascending pitch cue
      soundManager.playSecretStep(nextCount);

      // Reset count if user stops clicking for 2.2 seconds
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2200);
    }
  };

  return (
    <header className="relative z-20 border-b border-emerald-500/20 bg-[#050811]/90 backdrop-blur-md select-none">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
        {/* Brand Logo & Name (Click 5 times to open Owner Admin Panel) */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-transform select-none relative"
          title="Click 5 times to open Owner Admin Panel"
        >
          {/* Logo Emblem with Shockwave Effect */}
          <div className="relative">
            {/* Dynamic shockwave ripple expanding on every click */}
            {clickCount > 0 && (
              <span
                key={pulseKey}
                className="absolute inset-0 rounded-lg border-2 border-cyan-400 animate-ping opacity-90 pointer-events-none"
              />
            )}

            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent border flex items-center justify-center transition-all duration-200 ${
                isUnlockedFlash
                  ? 'border-emerald-300 bg-emerald-500/40 shadow-[0_0_30px_#00ff66] scale-110'
                  : clickCount > 0
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_25px_rgba(6,182,212,0.8)] scale-105'
                  : 'border-emerald-400/40 shadow-[0_0_15px_rgba(0,255,102,0.25)] group-hover:border-emerald-300'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-6 h-6 drop-shadow-[0_0_8px_rgba(0,255,102,0.8)] fill-current transition-colors duration-200 ${
                  isUnlockedFlash
                    ? 'text-white'
                    : clickCount > 0
                    ? 'text-cyan-300 animate-pulse'
                    : 'text-emerald-400'
                }`}
              >
                <path d="M12 2L2 7L4 17L12 22L20 17L22 7L12 2ZM12 4.3L19.5 8.1L18 15.9L12 19.9L6 15.9L4.5 8.1L12 4.3ZM12 7L8 12H11V16H13V12H16L12 7Z" />
              </svg>
            </div>

            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#00ff66]" />

            {/* Glowing Secret Count badge on the logo icon */}
            {clickCount > 0 && (
              <div
                className={`absolute -bottom-1.5 -right-1.5 text-[10px] font-black font-orbitron w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_12px_#06b6d4] transition-all transform animate-bounce ${
                  isUnlockedFlash
                    ? 'bg-emerald-400 text-black shadow-[0_0_15px_#00ff66]'
                    : 'bg-cyan-400 text-slate-950'
                }`}
              >
                {clickCount}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase font-orbitron bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent neon-text-green">
                {websiteTitle || 'INFINIX GAMER'}
              </h1>
            </div>

            {/* Dynamic HUD indicator showing progress towards secret admin portal */}
            {clickCount > 0 ? (
              <div className="flex items-center gap-1.5 mt-0.5 animate-fadeIn">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((seg) => (
                    <div
                      key={seg}
                      className={`h-1.5 rounded-sm transition-all duration-150 ${
                        seg <= clickCount
                          ? isUnlockedFlash
                            ? 'w-3.5 bg-emerald-300 shadow-[0_0_8px_#00ff66]'
                            : 'w-3 bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                          : 'w-2 bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold font-rajdhani uppercase tracking-wider text-cyan-300 ml-1">
                  {isUnlockedFlash
                    ? 'PORTAL GRANTED'
                    : `GATEWAY: ${clickCount}/5 TAP`}
                </span>
              </div>
            ) : (
              <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase font-rajdhani text-emerald-400/80 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400 inline" />
                <span>Verified Link Hub</span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-400">Anti-Bot Gateway</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundManager.playClick();
            }}
            title={soundEnabled ? 'Mute sound FX' : 'Enable sound FX'}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span className="hidden md:inline font-rajdhani">{soundEnabled ? 'FX ON' : 'FX OFF'}</span>
          </button>

          {/* Reset Flow Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onResetFlow();
            }}
            title="Reset verification flow to Step 1"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            aria-label="Restart Verification"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline font-rajdhani">Restart Flow</span>
          </button>
        </div>
      </div>
    </header>
  );
};
