/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { StepCard } from './components/StepCard';
import { UnlockCard } from './components/UnlockCard';
import { HonestVerificationInfo } from './components/HonestVerificationInfo';
import { AdminModal } from './components/AdminModal';
import { PublicSettings, WebsiteSettings } from './types';
import { soundManager } from './utils/sound';
import { ParticleNetwork } from './components/ParticleNetwork';
import { ShieldCheck, Flame, RefreshCw, Zap, Sparkles } from 'lucide-react';

const DEFAULT_SETTINGS: PublicSettings = {
  websiteTitle: 'INFINIX GAMER',
  websiteSubtitle: 'Complete the 3 quick steps below to unlock your VIP gaming files, mods, and rewards.',
  tiktokUrl: 'https://www.tiktok.com/@infinixgamer',
  tiktokButtonText: 'Follow on TikTok',
  instagramUrl: 'https://www.instagram.com/infinixgamer',
  instagramButtonText: 'Follow on Instagram',
  youtubeUrl: 'https://www.youtube.com/@infinixgamer',
  youtubeButtonText: 'Subscribe on YouTube',
  unlockButtonText: 'UNLOCK YOUR LINK',
  waitingSeconds: 15,
};

export default function App() {
  // Website dynamic settings loaded from backend
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Visitor Session state (Resets on every page refresh!)
  // Per requirements: "Start a fresh flow whenever the visitor refreshes the page.
  // After refresh, lock Step Four again and require the visitor to restart from Step One."
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<number>(() => Date.now());

  // Step completion in THIS session only
  const [step1Completed, setStep1Completed] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);
  const [step3Completed, setStep3Completed] = useState(false);

  // UI Modals & Settings
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize fresh session with server on load or when flow resets
  const initFreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/session/start', { method: 'POST' });
      const data = await response.json();
      if (data.success && data.sessionId) {
        setSessionId(data.sessionId);
      }
    } catch (err) {
      console.error('Failed to init session:', err);
    }
  }, []);

  // Fetch settings from server on mount
  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.warn('Using default settings fallback:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchPublicSettings();
    initFreshSession();
  }, [initFreshSession]);

  // Restart flow manually
  const handleResetFlow = () => {
    setStep1Completed(false);
    setStep2Completed(false);
    setStep3Completed(false);
    setSessionKey(Date.now()); // forces remount of step cards to reset timers
    initFreshSession();
  };

  // Called when user clicks "Follow on [Platform]"
  const handleStepStart = async (step: 1 | 2 | 3): Promise<boolean> => {
    if (!sessionId) {
      await initFreshSession();
    }
    try {
      const response = await fetch('/api/session/step-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, step }),
      });
      const data = await response.json();
      if (data.success) {
        return true;
      } else {
        alert(data.error || 'Failed to start step. Please refresh.');
        return false;
      }
    } catch {
      return true; // allow proceeding if temporary network blip
    }
  };

  // Step completions
  const handleStepComplete = (step: 1 | 2 | 3) => {
    if (step === 1) {
      setStep1Completed(true);
    } else if (step === 2) {
      setStep2Completed(true);
    } else if (step === 3) {
      setStep3Completed(true);
    }
  };

  // Count completed steps
  const completedStepsCount = (step1Completed ? 1 : 0) + (step2Completed ? 1 : 0) + (step3Completed ? 1 : 0);
  const isFullyUnlocked = step1Completed && step2Completed && step3Completed;

  // Callback when admin saves new settings
  const handleSettingsSaved = (newSettings: WebsiteSettings) => {
    const { destinationUrl: _omitted, ...pub } = newSettings;
    setSettings(pub);
  };

  return (
    <div className="min-h-screen bg-[#030610] text-slate-100 flex flex-col relative cyber-grid selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background ambient neon lighting & interactive particle network */}
      <ParticleNetwork />
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -left-48 w-[450px] h-[450px] bg-cyan-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 -right-48 w-[450px] h-[450px] bg-emerald-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Header */}
      <Header
        websiteTitle={settings.websiteTitle}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onResetFlow={handleResetFlow}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(soundManager.toggle())}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Hero Banner */}
        <section className="text-center space-y-2.5 sm:space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-rajdhani font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
            <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>OFFICIAL VIP GATEWAY</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400">SESSION VERIFIED</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-orbitron tracking-tight text-white uppercase neon-text-green">
            {settings.websiteTitle || 'INFINIX GAMER'}
          </h2>

          <p className="text-xs sm:text-sm font-space text-slate-300 max-w-xl mx-auto leading-relaxed">
            {settings.websiteSubtitle ||
              'Complete the 3 quick steps below to unlock your exclusive VIP gaming files, discord links, and rewards.'}
          </p>
        </section>

        {/* Progress Tracker */}
        <section>
          <ProgressBar
            completedStepsCount={completedStepsCount}
            totalSteps={3}
            isFullyUnlocked={isFullyUnlocked}
          />
        </section>

        {/* The 4 Numbered Gaming Cards */}
        <section key={sessionKey} className="space-y-4">
          {/* STEP 1: TIKTOK */}
          <StepCard
            stepNumber={1}
            platform="tiktok"
            title="Step One — TikTok"
            subtitle="Follow our official TikTok account to support the community."
            targetUrl={settings.tiktokUrl}
            buttonText={settings.tiktokButtonText || 'Follow on TikTok'}
            isUnlocked={true} // Step 1 is always unlocked first
            isCompleted={step1Completed}
            waitingDurationSeconds={settings.waitingSeconds}
            sessionId={sessionId}
            onStepStart={handleStepStart}
            onStepComplete={handleStepComplete}
          />

          {/* STEP 2: INSTAGRAM */}
          <StepCard
            stepNumber={2}
            platform="instagram"
            title="Step Two — Instagram"
            subtitle="Follow our Instagram page for live clips and announcements."
            targetUrl={settings.instagramUrl}
            buttonText={settings.instagramButtonText || 'Follow on Instagram'}
            isUnlocked={step1Completed} // Unlocked only when Step 1 is done
            isCompleted={step2Completed}
            waitingDurationSeconds={settings.waitingSeconds}
            sessionId={sessionId}
            onStepStart={handleStepStart}
            onStepComplete={handleStepComplete}
          />

          {/* STEP 3: YOUTUBE */}
          <StepCard
            stepNumber={3}
            platform="youtube"
            title="Step Three — YouTube"
            subtitle="Subscribe to our YouTube channel for gaming tutorials and updates."
            targetUrl={settings.youtubeUrl}
            buttonText={settings.youtubeButtonText || 'Subscribe on YouTube'}
            isUnlocked={step1Completed && step2Completed} // Unlocked only when Steps 1 & 2 done
            isCompleted={step3Completed}
            waitingDurationSeconds={settings.waitingSeconds}
            sessionId={sessionId}
            onStepStart={handleStepStart}
            onStepComplete={handleStepComplete}
          />

          {/* STEP 4: GET YOUR LINK (FINAL DESTINATION) */}
          <UnlockCard
            isFullyUnlocked={isFullyUnlocked}
            unlockButtonText={settings.unlockButtonText}
            sessionId={sessionId}
            step1Completed={step1Completed}
            step2Completed={step2Completed}
            step3Completed={step3Completed}
          />
        </section>

        {/* Honest Verification & Information Notice */}
        <section>
          <HonestVerificationInfo />
        </section>

        {/* Session Reset Instructions */}
        <div className="flex items-center justify-between text-[11px] font-rajdhani text-slate-400 px-2 py-2">
          <span>Active Session ID: <code className="font-mono text-cyan-400/80">{sessionId ? `${sessionId.substring(0, 8)}...` : 'Initializing'}</code></span>
          <button
            onClick={() => {
              soundManager.playClick();
              handleResetFlow();
            }}
            className="text-slate-400 hover:text-amber-400 underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Session Progress</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-[#04060e]/95 mt-10 py-6 text-center text-xs text-slate-400 font-rajdhani">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-orbitron font-bold text-slate-300">{settings.websiteTitle}</span>
            <span className="text-slate-700">·</span>
            <span>All rights reserved</span>
          </div>

          {/* Developer Credit */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-slate-300 shadow-[0_0_12px_rgba(0,255,102,0.15)]">
            <span className="text-[11px] font-space tracking-wide text-slate-400">Website Developed by</span>
            <span className="font-orbitron font-black text-emerald-400 neon-text-green text-xs tracking-wider">
              AFFU KHAN
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure Gateway</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onSettingsSaved={handleSettingsSaved}
      />
    </div>
  );
}
