import React, { useState } from 'react';
import { Lock, Unlock, ExternalLink, Copy, Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

interface UnlockCardProps {
  isFullyUnlocked: boolean;
  unlockButtonText: string;
  sessionId: string | null;
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
}

export const UnlockCard: React.FC<UnlockCardProps> = ({
  isFullyUnlocked,
  unlockButtonText,
  sessionId,
  step1Completed,
  step2Completed,
  step3Completed,
}) => {
  const [unlockedDestinationUrl, setUnlockedDestinationUrl] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleUnlockClick = async () => {
    if (!isFullyUnlocked || !sessionId) return;
    setIsUnlocking(true);
    setErrorMessage(null);
    soundManager.playClick();

    try {
      const response = await fetch('/api/session/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json();

      if (data.success && data.destinationUrl) {
        setUnlockedDestinationUrl(data.destinationUrl);
        soundManager.playUnlock();

        // Launch victory confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#00ff66', '#00f2fe', '#ffffff', '#3b82f6', '#10b981'],
        });

        // Open destination URL in new tab safely
        try {
          const win = window.open(data.destinationUrl, '_blank', 'noopener,noreferrer');
          if (!win) {
            // Popup blocked on mobile; the user will see the direct button below
          }
        } catch {
          window.open(data.destinationUrl, '_blank');
        }
      } else {
        setErrorMessage(data.error || 'Could not unlock link. Please verify all steps.');
      }
    } catch {
      setErrorMessage('Failed to connect to gateway. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCopyLink = () => {
    if (!unlockedDestinationUrl) return;
    navigator.clipboard.writeText(unlockedDestinationUrl);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`relative rounded-xl border transition-all duration-500 overflow-hidden backdrop-blur-md ${
        isFullyUnlocked
          ? 'border-emerald-400 bg-gradient-to-b from-[#071918] via-[#091522] to-[#050811] shadow-[0_0_35px_rgba(0,255,102,0.25)]'
          : 'border-slate-800 bg-[#070b14]/70 opacity-70'
      }`}
    >
      {/* Animated glowing border/scanner for unlocked state */}
      {isFullyUnlocked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div className="absolute -top-1/2 left-0 right-0 h-full bg-gradient-to-b from-emerald-500/10 to-transparent blur-xl animate-pulse" />
        </div>
      )}

      <div className="p-5 sm:p-6 relative z-10">
        {/* Header: Step 04 */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center font-orbitron font-extrabold text-base tracking-wider border transition-all ${
                isFullyUnlocked
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(0,255,102,0.5)] animate-bounce'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {isFullyUnlocked ? <Unlock className="w-5 h-5 text-emerald-400" /> : '04'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-extrabold text-slate-100 text-lg sm:text-xl tracking-wide flex items-center gap-2">
                  <span>Step Four — Get Your Link</span>
                  {isFullyUnlocked && <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />}
                </h3>
              </div>
              <p className="text-xs font-space text-slate-400 mt-0.5">
                {isFullyUnlocked
                  ? 'All 3 steps completed! Your destination link is ready to open.'
                  : 'Locked. Complete Steps 1, 2, and 3 above to unlock your reward.'}
              </p>
            </div>
          </div>

          <div>
            {isFullyUnlocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-rajdhani bg-emerald-950 text-emerald-400 border border-emerald-400 shadow-[0_0_10px_rgba(0,255,102,0.4)]">
                <Unlock className="w-3.5 h-3.5" />
                <span>READY</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-rajdhani bg-slate-900 text-slate-400 border border-slate-800">
                <Lock className="w-3.5 h-3.5" />
                <span>LOCKED</span>
              </span>
            )}
          </div>
        </div>

        {/* Error notice if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body content based on unlock state */}
        {!isFullyUnlocked ? (
          /* LOCKED STATE */
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-400 font-rajdhani">
              <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Remaining checklist to unlock:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-rajdhani">
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  step1Completed
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400'
                }`}
              >
                <span>1. TikTok Follow</span>
                {step1Completed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
              </div>
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  step2Completed
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400'
                }`}
              >
                <span>2. Instagram Follow</span>
                {step2Completed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
              </div>
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  step3Completed
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400'
                }`}
              >
                <span>3. YouTube Subscribe</span>
                {step3Completed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
              </div>
            </div>

            <button
              disabled
              className="w-full py-3.5 px-4 rounded-xl font-orbitron font-bold text-sm tracking-wider bg-slate-900 text-slate-400 border border-slate-800 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>{unlockButtonText || 'UNLOCK YOUR LINK'}</span>
            </button>
          </div>
        ) : (
          /* UNLOCKED STATE */
          <div className="space-y-4">
            {!unlockedDestinationUrl ? (
              <div className="space-y-3">
                <button
                  onClick={handleUnlockClick}
                  disabled={isUnlocking}
                  className="w-full py-4 px-6 rounded-xl font-orbitron font-black text-base sm:text-lg tracking-wider bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-[0_0_30px_rgba(0,255,102,0.6)] hover:shadow-[0_0_40px_rgba(0,255,102,0.9)] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer neon-glow-green"
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>GENERATING ACCESS TOKEN...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5" />
                      <span>{unlockButtonText || 'UNLOCK YOUR LINK'}</span>
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-emerald-400/80 text-center font-rajdhani font-semibold tracking-wide">
                  Pressing this button contacts the secure gate and opens your destination link.
                </p>
              </div>
            ) : (
              /* LINK REVEALED */
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-emerald-400/60 shadow-[0_0_25px_rgba(0,255,102,0.2)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-orbitron font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>ACCESS GRANTED // DESTINATION READY</span>
                  </div>
                  <span className="text-xs font-rajdhani text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                    VERIFIED
                  </span>
                </div>

                {/* Destination URL Display */}
                <div className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all flex items-center justify-between gap-2">
                  <span className="truncate">{unlockedDestinationUrl}</span>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={unlockedDestinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-xl font-orbitron font-bold text-xs tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,102,0.4)]"
                  >
                    <span>OPEN DESTINATION</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="py-3 px-4 rounded-xl font-orbitron font-bold text-xs tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">COPIED TO CLIPBOARD!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>COPY LINK</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
