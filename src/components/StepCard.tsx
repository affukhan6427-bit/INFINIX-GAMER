import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Check,
  Lock,
  ArrowRight,
  Loader2,
  Clock,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { soundManager } from '../utils/sound';

export interface StepCardProps {
  stepNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  targetUrl: string;
  buttonText: string;
  isUnlocked: boolean; // Is this step accessible right now?
  isCompleted: boolean;
  waitingDurationSeconds: number; // 15 to 20 seconds
  platform: 'tiktok' | 'instagram' | 'youtube';
  sessionId: string | null;
  onStepComplete: (step: 1 | 2 | 3) => void;
  onStepStart: (step: 1 | 2 | 3) => Promise<boolean>;
}

export const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  subtitle,
  targetUrl,
  buttonText,
  isUnlocked,
  isCompleted,
  waitingDurationSeconds,
  platform,
  sessionId,
  onStepComplete,
  onStepStart,
}) => {
  // Step micro-state:
  const [hasVisitedLink, setHasVisitedLink] = useState(false);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(waitingDurationSeconds);
  const [isVerifyingWithServer, setIsVerifyingWithServer] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userReturnedFocus, setUserReturnedFocus] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync remaining seconds if settings change
  useEffect(() => {
    if (!isTimerRunning && !isCompleted) {
      setSecondsRemaining(waitingDurationSeconds);
    }
  }, [waitingDurationSeconds, isTimerRunning, isCompleted]);

  // Detect when user switches back to this tab from external app on mobile/desktop
  useEffect(() => {
    if (!hasVisitedLink || isTimerRunning || isCompleted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setUserReturnedFocus(true);
      }
    };

    const handleWindowFocus = () => {
      setUserReturnedFocus(true);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [hasVisitedLink, isTimerRunning, isCompleted]);

  // Timer countdown handler
  useEffect(() => {
    if (!isTimerRunning) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleFinishTimer();
          return 0;
        }
        soundManager.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // When timer reaches zero, call backend with screenshot to finalize step
  const handleFinishTimer = async () => {
    setIsTimerRunning(false);
    setIsVerifyingWithServer(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/session/step-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          step: stepNumber,
          screenshot: screenshotData,
        }),
      });
      const data = await response.json();

      if (data.success) {
        soundManager.playSuccess();
        onStepComplete(stepNumber);
      } else {
        setErrorMessage(data.error || 'Verification check failed. Please try again.');
        setSecondsRemaining(waitingDurationSeconds);
      }
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setSecondsRemaining(waitingDurationSeconds);
    } finally {
      setIsVerifyingWithServer(false);
    }
  };

  // User clicks "Follow/Subscribe on [Platform]"
  const handleOpenPlatform = async () => {
    setErrorMessage(null);
    soundManager.playClick();

    // Notify backend step has started
    const started = await onStepStart(stepNumber);
    if (!started) return;

    setHasVisitedLink(true);

    // Open target URL safely
    try {
      const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        window.location.href = targetUrl;
      }
    } catch {
      window.open(targetUrl, '_blank');
    }
  };

  // Handle image upload from user device / camera
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage('Image size is too large (Maximum 12MB). Please upload a smaller screenshot.');
      return;
    }

    setErrorMessage(null);
    soundManager.playClick();

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setScreenshotData(result);
      setScreenshotName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // User clicks "Submit Screenshot & Verify"
  const handleStartCountdown = () => {
    if (!screenshotData) {
      setErrorMessage('Screenshot proof is required! Please upload a screenshot showing you followed.');
      return;
    }
    soundManager.playClick();
    setErrorMessage(null);
    setSecondsRemaining(waitingDurationSeconds);
    setIsTimerRunning(true);
  };

  // Custom icon & styling per platform
  const getPlatformVisuals = () => {
    switch (platform) {
      case 'tiktok':
        return {
          badgeBg: 'bg-[#ff0050]/10 border-[#ff0050]/30 text-[#00f2fe]',
          glowClass: 'hover:shadow-[0_0_25px_rgba(255,0,80,0.2)]',
          icon: (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98v8.63c-.02 2.07-.74 4.1-2.11 5.64-1.37 1.54-3.32 2.44-5.38 2.54-2.06.1-4.14-.6-5.68-1.99-1.54-1.39-2.39-3.41-2.35-5.48.04-2.07.96-4.06 2.55-5.41 1.59-1.35 3.69-2.01 5.76-1.84.45.03.9.11 1.34.23v4.13c-.34-.14-.71-.23-1.08-.26-1.02-.09-2.06.27-2.77.99-.71.72-1.02 1.75-.86 2.76.16 1.01.88 1.87 1.86 2.21.98.34 2.1.13 2.87-.52.62-.53.96-1.31.96-2.13V.02Z" />
            </svg>
          ),
          accentColor: '#00f2fe',
        };
      case 'instagram':
        return {
          badgeBg: 'bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 border-pink-500/30 text-pink-400',
          glowClass: 'hover:shadow-[0_0_25px_rgba(236,72,153,0.2)]',
          icon: (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          ),
          accentColor: '#ec4899',
        };
      case 'youtube':
        return {
          badgeBg: 'bg-red-500/10 border-red-500/30 text-red-400',
          glowClass: 'hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]',
          icon: (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          ),
          accentColor: '#ef4444',
        };
    }
  };

  const visuals = getPlatformVisuals();
  const stepNumberFormatted = `0${stepNumber}`;

  return (
    <div
      className={`relative rounded-xl border transition-all duration-300 backdrop-blur-md overflow-hidden ${
        isCompleted
          ? 'border-emerald-500/40 bg-[#061412]/80 shadow-[0_0_20px_rgba(0,255,102,0.15)]'
          : isUnlocked
          ? 'border-emerald-400/40 bg-[#091124]/90 shadow-[0_4px_25px_rgba(0,255,102,0.1)] hover:border-emerald-400'
          : 'border-slate-800/80 bg-[#080d18]/50 opacity-60'
      } ${visuals.glowClass}`}
    >
      {/* Top cyber accents */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="p-4 sm:p-5">
        {/* Header row: Number, Title, Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Number badge */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-orbitron font-bold text-sm tracking-wider border transition-all ${
                isCompleted
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                  : isUnlocked
                  ? 'bg-slate-900 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}
            >
              {isCompleted ? <Check className="w-5 h-5 text-emerald-400" /> : stepNumberFormatted}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`p-1 rounded-md border ${visuals.badgeBg}`}>{visuals.icon}</span>
                <h3 className="font-orbitron font-bold text-slate-100 text-base sm:text-lg tracking-wide">
                  {title}
                </h3>
              </div>
              <p className="text-xs font-space text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>

          {/* Status Label */}
          <div>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-rajdhani bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>Screenshot Verified</span>
              </span>
            ) : isUnlocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-rajdhani bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 animate-pulse">
                <span>Active Step</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-rajdhani bg-slate-900/80 text-slate-400 border border-slate-800">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </span>
            )}
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Card Body & Actions */}
        <div className="mt-3">
          {/* STATE: COMPLETED */}
          {isCompleted && (
            <div className="space-y-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-emerald-300/90 font-rajdhani text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Follow Screenshot Verified & Approved!</span>
                </div>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-emerald-300 underline font-rajdhani flex items-center gap-1 self-start sm:self-auto text-xs"
                >
                  <span>Revisit channel</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Show small thumbnail of verified screenshot if available */}
              {screenshotData && (
                <div className="flex items-center gap-3 pt-2 border-t border-emerald-500/20">
                  <img
                    src={screenshotData}
                    alt="Proof Screenshot"
                    className="w-12 h-12 object-cover rounded-lg border border-emerald-500/40"
                  />
                  <div className="text-[11px] font-space text-slate-300">
                    <span className="text-emerald-400 font-bold block">Proof Screenshot Attached</span>
                    <span className="text-slate-400 truncate max-w-xs block font-mono text-[10px]">
                      {screenshotName || 'screenshot.png'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE: UNLOCKED & NOT COMPLETED */}
          {!isCompleted && isUnlocked && (
            <div className="space-y-3">
              {/* STAGE 1: User hasn't opened platform yet */}
              {!hasVisitedLink && !isTimerRunning && (
                <div>
                  <button
                    onClick={handleOpenPlatform}
                    className="w-full py-3.5 px-4 rounded-xl font-orbitron font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-black hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{buttonText}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2 font-space">
                    1. Tap above to follow/subscribe on {platform.toUpperCase()} → 2. Take a screenshot → 3. Upload proof here.
                  </p>
                </div>
              )}

              {/* STAGE 2: User visited platform, now MUST upload screenshot to continue */}
              {hasVisitedLink && !isTimerRunning && !isVerifyingWithServer && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-300 font-semibold font-rajdhani flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      {userReturnedFocus ? 'Welcome back! Please attach proof' : 'Follow action opened in background'}
                    </span>
                    <button
                      onClick={handleOpenPlatform}
                      className="text-slate-400 hover:text-cyan-400 underline text-[11px] font-rajdhani flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open channel again</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Hidden file input for screenshot */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Screenshot Upload Dropzone Area */}
                  {!screenshotData ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 sm:p-5 rounded-xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/30 transition-all cursor-pointer text-center space-y-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div>
                        <div className="font-orbitron font-bold text-xs text-cyan-200">
                          UPLOAD FOLLOW SCREENSHOT (REQUIRED)
                        </div>
                        <p className="text-[11px] text-slate-400 font-space mt-0.5">
                          Follow hone ke baad screenshot lein aur yahan upload karein.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-900/40 text-cyan-300 text-xs font-rajdhani font-semibold border border-cyan-500/30">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Screenshot from Gallery / Camera</span>
                      </div>
                    </div>
                  ) : (
                    /* Screenshot Preview Card */
                    <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(0,255,102,0.15)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative group shrink-0">
                          <img
                            src={screenshotData}
                            alt="Screenshot Preview"
                            className="w-14 h-14 object-cover rounded-lg border border-emerald-400 shadow-md"
                          />
                          <div className="absolute inset-0 bg-emerald-500/10 rounded-lg" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-xs font-bold font-rajdhani text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>SCREENSHOT ATTACHED</span>
                          </div>
                          <div className="text-slate-300 text-xs font-mono truncate max-w-[180px] sm:max-w-xs">
                            {screenshotName || 'proof-screenshot.png'}
                          </div>
                          <span className="text-[10px] text-slate-500 font-space">Ready to submit and unlock</span>
                        </div>
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 text-xs font-rajdhani shrink-0 cursor-pointer"
                        title="Change Screenshot"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Change</span>
                      </button>
                    </div>
                  )}

                  {/* Submit Proof & Verify Button */}
                  <button
                    onClick={handleStartCountdown}
                    disabled={!screenshotData}
                    className={`w-full py-3.5 px-4 rounded-xl font-orbitron font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      screenshotData
                        ? 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-black hover:from-cyan-300 hover:to-emerald-300 shadow-[0_0_25px_rgba(0,255,102,0.4)] active:scale-[0.99] animate-pulse'
                        : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{screenshotData ? 'SUBMIT SCREENSHOT & UNLOCK' : 'ATTACH SCREENSHOT FIRST'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-slate-400 text-center font-space leading-tight">
                    Follow karke screenshot submit karein. System {waitingDurationSeconds}s verification ke baad next step unlock karega.
                  </p>
                </div>
              )}

              {/* STAGE 3: If timer is actively scanning screenshot */}
              {isTimerRunning && (
                <div className="p-4 rounded-xl bg-slate-900/95 border border-emerald-500/40 text-center space-y-3.5 shadow-[0_0_25px_rgba(0,255,102,0.2)]">
                  {/* Holographic scanner preview */}
                  {screenshotData && (
                    <div className="relative w-28 h-28 mx-auto rounded-xl overflow-hidden border-2 border-emerald-400 shadow-[0_0_15px_rgba(0,255,102,0.3)]">
                      <img
                        src={screenshotData}
                        alt="Scanning proof"
                        className="w-full h-full object-cover filter brightness-90"
                      />
                      {/* Laser scanning beam */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_10px_#00ff66] animate-energy-scan" />
                      <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-orbitron text-xs tracking-wider">
                    <Clock className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>VERIFYING SCREENSHOT PROOF...</span>
                  </div>

                  {/* Big Countdown Number */}
                  <div className="py-1">
                    <span className="font-orbitron font-black text-4xl sm:text-5xl text-emerald-300 tracking-wider drop-shadow-[0_0_12px_rgba(0,255,102,0.6)]">
                      {secondsRemaining}s
                    </span>
                    <div className="text-xs font-rajdhani text-slate-400 mt-1 uppercase tracking-widest">
                      Remaining Verification Time
                    </div>
                  </div>

                  {/* Progress bar for timer */}
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_#00ff66]"
                      style={{
                        width: `${Math.max(
                          ((waitingDurationSeconds - secondsRemaining) / waitingDurationSeconds) * 100,
                          4
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 font-space leading-tight">
                    Checking screenshot proof and observing engagement dwell window.
                  </p>
                </div>
              )}

              {/* STAGE 4: Verifying with server */}
              {isVerifyingWithServer && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                  <div className="text-xs font-orbitron text-cyan-300 font-bold tracking-wider">
                    SUBMITTING SCREENSHOT & UNLOCKING NEXT STEP...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE: LOCKED */}
          {!isUnlocked && !isCompleted && (
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between font-rajdhani">
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>Locked until Step {stepNumber - 1} screenshot is verified.</span>
              </span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Pending</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
