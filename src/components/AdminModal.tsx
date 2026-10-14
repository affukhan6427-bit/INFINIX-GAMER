import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  BarChart3,
  Sliders,
  KeyRound,
  ExternalLink,
  Loader2,
  LogOut,
  RefreshCw,
  Globe,
  Youtube,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WebsiteSettings, AnalyticsStats } from '../types';
import { soundManager } from '../utils/sound';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (newSettings: WebsiteSettings) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Tab state: 'settings' | 'analytics' | 'security'
  const [activeTab, setActiveTab] = useState<'settings' | 'analytics' | 'security'>('settings');

  // Form state
  const [formData, setFormData] = useState<WebsiteSettings>({
    websiteTitle: 'INFINIX GAMER',
    websiteSubtitle: '',
    tiktokUrl: '',
    tiktokButtonText: 'Follow on TikTok',
    instagramUrl: '',
    instagramButtonText: 'Follow on Instagram',
    youtubeUrl: '',
    youtubeButtonText: 'Subscribe on YouTube',
    destinationUrl: '',
    unlockButtonText: 'UNLOCK YOUR LINK',
    waitingSeconds: 15,
  });

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsStats>({
    visits: 0,
    step1Clicks: 0,
    step2Clicks: 0,
    step3Clicks: 0,
    unlocks: 0,
    lastUpdated: '',
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Status banners
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // On open or token change, load admin settings
  useEffect(() => {
    if (isOpen && authToken) {
      loadAdminData(authToken);
    }
  }, [isOpen, authToken]);

  const loadAdminData = async (token: string) => {
    setIsLoadingSettings(true);
    setSaveBanner({ type: null, message: '' });
    try {
      const response = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFormData(data.settings);
        setAnalytics(data.analytics);
      } else {
        // Token might have expired
        setAuthToken(null);
        setAuthError('Session expired. Please log in again.');
      }
    } catch {
      setSaveBanner({ type: 'error', message: 'Failed to connect to backend server.' });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setIsAuthenticating(true);
    setAuthError(null);
    soundManager.playClick();

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await response.json();

      if (data.success && data.token) {
        setAuthToken(data.token);
        setPasswordInput('');
        soundManager.playSuccess();
        loadAdminData(data.token);
      } else {
        setAuthError(data.error || 'Incorrect password.');
      }
    } catch {
      setAuthError('Failed to connect to authentication server.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    soundManager.playClick();
    if (authToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {}
    }
    setAuthToken(null);
    setPasswordInput('');
    setAuthError(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setIsSaving(true);
    setSaveBanner({ type: null, message: '' });
    soundManager.playClick();

    // Validate URLs client-side first
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(formData.tiktokUrl)) {
      setSaveBanner({ type: 'error', message: 'Invalid TikTok URL. Must start with http:// or https://' });
      setIsSaving(false);
      return;
    }
    if (!urlPattern.test(formData.instagramUrl)) {
      setSaveBanner({ type: 'error', message: 'Invalid Instagram URL. Must start with http:// or https://' });
      setIsSaving(false);
      return;
    }
    if (!urlPattern.test(formData.youtubeUrl)) {
      setSaveBanner({ type: 'error', message: 'Invalid YouTube URL. Must start with http:// or https://' });
      setIsSaving(false);
      return;
    }
    if (!urlPattern.test(formData.destinationUrl)) {
      setSaveBanner({ type: 'error', message: 'Invalid Destination URL. Must start with http:// or https://' });
      setIsSaving(false);
      return;
    }

    // Validate waitingSeconds (15 to 20)
    const secs = Number(formData.waitingSeconds);
    if (isNaN(secs) || secs < 15 || secs > 20) {
      setSaveBanner({ type: 'error', message: 'Waiting time must be between 15 and 20 seconds.' });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        soundManager.playSuccess();
        setSaveBanner({ type: 'success', message: 'Website settings saved permanently to disk!' });
        onSettingsSaved(data.settings);
      } else {
        setSaveBanner({ type: 'error', message: data.error || 'Failed to update settings.' });
      }
    } catch {
      setSaveBanner({ type: 'error', message: 'Network error saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    if (newPassword !== confirmPassword) {
      setPasswordChangeStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();

      if (data.success) {
        soundManager.playSuccess();
        setPasswordChangeStatus({ type: 'success', message: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordChangeStatus({ type: 'error', message: data.error || 'Password update failed.' });
      }
    } catch {
      setPasswordChangeStatus({ type: 'error', message: 'Network error updating password.' });
    }
  };

  const handleResetStats = async () => {
    if (!authToken || !window.confirm('Reset all analytics statistics to zero?')) return;
    soundManager.playClick();
    try {
      const response = await fetch('/api/admin/reset-stats', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
        soundManager.playSuccess();
      }
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090f1d] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden my-6">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#050811] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-orbitron font-bold text-slate-100 flex items-center gap-2">
                <span>Owner Admin Panel</span>
                <span className="text-[10px] font-rajdhani px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  SECURE CONTROL
                </span>
              </h2>
              <p className="text-xs font-rajdhani text-slate-400">Configure URLs, waiting timers, titles, and stats</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Admin Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!authToken ? (
          /* AUTH LOGIN VIEW */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-orbitron font-bold text-lg text-slate-100">Owner Authentication</h3>
              <p className="text-xs text-slate-400 font-space max-w-sm mx-auto">
                Enter your owner master password to access settings, edit social URLs, and manage the destination link.
              </p>
            </div>

            <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-4">
              {authError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-rajdhani font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none pr-10 font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating || !passwordInput}
                className="w-full py-3 px-4 rounded-xl font-orbitron font-bold text-sm tracking-wider bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>ENTER ADMIN PORTAL</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div>
            {/* Tabs & Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    soundManager.playClick();
                  }}
                  className={`py-3 px-3 text-xs font-rajdhani font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'settings'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configuration</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    soundManager.playClick();
                  }}
                  className={`py-3 px-3 text-xs font-rajdhani font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'analytics'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Analytics</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('security');
                    soundManager.playClick();
                  }}
                  className={`py-3 px-3 text-xs font-rajdhani font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'security'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Security</span>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs font-rajdhani text-slate-400 hover:text-red-400 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-900 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            {/* Banner Messages */}
            {saveBanner.type && (
              <div
                className={`m-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  saveBanner.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/60 border border-red-500/40 text-red-300'
                }`}
              >
                {saveBanner.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{saveBanner.message}</span>
              </div>
            )}

            {/* TAB 1: CONFIGURATION */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="p-4 sm:p-6 space-y-5 max-h-[68vh] overflow-y-auto">
                {isLoadingSettings ? (
                  <div className="py-12 text-center text-cyan-400 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <span className="text-xs font-orbitron">Loading settings from database...</span>
                  </div>
                ) : (
                  <>
                    {/* Website Branding */}
                    <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-slate-200">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>WEBSITE BRANDING</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">Website Title</label>
                          <input
                            type="text"
                            value={formData.websiteTitle}
                            onChange={(e) => setFormData({ ...formData, websiteTitle: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none"
                            placeholder="INFINIX GAMER"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">Unlock Button Text</label>
                          <input
                            type="text"
                            value={formData.unlockButtonText}
                            onChange={(e) => setFormData({ ...formData, unlockButtonText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none"
                            placeholder="UNLOCK YOUR LINK"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 1: TikTok Configuration */}
                    <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-slate-200">
                          <span className="text-cyan-400 font-mono">STEP 01</span>
                          <span>TIKTOK PROFILE</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">TikTok Profile URL</label>
                          <input
                            type="url"
                            value={formData.tiktokUrl}
                            onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none font-mono"
                            placeholder="https://www.tiktok.com/@username"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">Button Label</label>
                          <input
                            type="text"
                            value={formData.tiktokButtonText}
                            onChange={(e) => setFormData({ ...formData, tiktokButtonText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none"
                            placeholder="Follow on TikTok"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Instagram Configuration */}
                    <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-slate-200">
                          <span className="text-pink-400 font-mono">STEP 02</span>
                          <span>INSTAGRAM PROFILE</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">Instagram Profile URL</label>
                          <input
                            type="url"
                            value={formData.instagramUrl}
                            onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none font-mono"
                            placeholder="https://www.instagram.com/username"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">Button Label</label>
                          <input
                            type="text"
                            value={formData.instagramButtonText}
                            onChange={(e) => setFormData({ ...formData, instagramButtonText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none"
                            placeholder="Follow on Instagram"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 3: YouTube Configuration */}
                    <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-slate-200">
                          <span className="text-red-400 font-mono">STEP 03</span>
                          <span>YOUTUBE CHANNEL</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">YouTube Channel URL</label>
                          <input
                            type="url"
                            value={formData.youtubeUrl}
                            onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none font-mono"
                            placeholder="https://www.youtube.com/@channel"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">Button Label</label>
                          <input
                            type="text"
                            value={formData.youtubeButtonText}
                            onChange={(e) => setFormData({ ...formData, youtubeButtonText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none"
                            placeholder="Subscribe on YouTube"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Final Destination URL */}
                    <div className="space-y-3 bg-gradient-to-r from-emerald-950/30 to-slate-950/60 p-4 rounded-xl border border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>STEP 04 — FINAL DESTINATION REWARD URL</span>
                        </div>
                        <span className="text-[10px] font-rajdhani text-slate-400">Never exposed to unauthorized visitors</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-rajdhani text-slate-400 mb-1">Destination URL</label>
                        <input
                          type="url"
                          value={formData.destinationUrl}
                          onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-emerald-300 focus:border-emerald-400 outline-none font-mono"
                          placeholder="https://discord.gg/yourlink or https://drive.google.com/..."
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-space">
                        This URL remains locked until Steps 1, 2, and 3 are completed and validated by the backend.
                      </p>
                    </div>

                    {/* Waiting Timer Slider (15 to 20 seconds) */}
                    <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>WAITING PERIOD CONFIGURATION</span>
                        </div>
                        <span className="font-orbitron font-black text-emerald-400 text-sm">
                          {formData.waitingSeconds} Seconds
                        </span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="20"
                        step="1"
                        value={formData.waitingSeconds}
                        onChange={(e) => setFormData({ ...formData, waitingSeconds: Number(e.target.value) })}
                        className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] font-rajdhani text-slate-400">
                        <span>15 seconds (Minimum)</span>
                        <span>20 seconds (Maximum)</span>
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-2 sticky bottom-0 bg-[#090f1d] pb-2 border-t border-slate-800 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => loadAdminData(authToken)}
                        className="py-2.5 px-3 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs font-rajdhani flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Discard Changes</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="py-2.5 px-6 rounded-lg font-orbitron font-bold text-xs tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,102,0.4)] disabled:opacity-50 cursor-pointer"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>SAVING SETTINGS...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>SAVE SETTINGS PERMANENTLY</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* TAB 2: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="p-4 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-orbitron font-bold text-sm text-slate-200">Visitor Funnel Performance</h4>
                    <p className="text-xs font-rajdhani text-slate-400">Track page visits, social clicks, and successful link unlocks</p>
                  </div>
                  <button
                    onClick={handleResetStats}
                    className="text-xs font-rajdhani text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded bg-amber-950/30 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Analytics</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] font-rajdhani text-slate-400 uppercase">Total Visitors</div>
                    <div className="text-2xl font-black font-orbitron text-slate-100 mt-1">{analytics.visits}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] font-rajdhani text-slate-400 uppercase">TikTok Clicks</div>
                    <div className="text-2xl font-black font-orbitron text-cyan-400 mt-1">{analytics.step1Clicks}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] font-rajdhani text-slate-400 uppercase">Instagram Clicks</div>
                    <div className="text-2xl font-black font-orbitron text-pink-400 mt-1">{analytics.step2Clicks}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] font-rajdhani text-slate-400 uppercase">YouTube Clicks</div>
                    <div className="text-2xl font-black font-orbitron text-red-400 mt-1">{analytics.step3Clicks}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-center">
                    <div className="text-[11px] font-rajdhani text-emerald-400 uppercase">Unlocked Links</div>
                    <div className="text-2xl font-black font-orbitron text-emerald-300 mt-1">{analytics.unlocks}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] font-rajdhani text-slate-400 uppercase">Conversion Rate</div>
                    <div className="text-2xl font-black font-orbitron text-cyan-300 mt-1">
                      {analytics.visits > 0 ? `${Math.round((analytics.unlocks / analytics.visits) * 100)}%` : '0%'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-rajdhani text-slate-400 flex items-center justify-between">
                  <span>Last server update:</span>
                  <span className="font-mono text-slate-300">
                    {analytics.lastUpdated ? new Date(analytics.lastUpdated).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: SECURITY */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="p-4 sm:p-6 space-y-4">
                <div>
                  <h4 className="font-orbitron font-bold text-sm text-slate-200">Change Admin Password</h4>
                  <p className="text-xs font-rajdhani text-slate-400">Update your master admin password to keep the portal safe.</p>
                </div>

                {passwordChangeStatus.type && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      passwordChangeStatus.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950/60 border border-red-500/40 text-red-300'
                    }`}
                  >
                    {passwordChangeStatus.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{passwordChangeStatus.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-rajdhani text-slate-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none font-mono"
                    placeholder="Enter current password..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani text-slate-400 mb-1">New Password (Min 6 chars)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none font-mono"
                    placeholder="Enter new password..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani text-slate-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 outline-none font-mono"
                    placeholder="Confirm new password..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-lg font-orbitron font-bold text-xs tracking-wider bg-cyan-500 hover:bg-cyan-400 text-black transition-all flex items-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>UPDATE PASSWORD</span>
                </button>
              </form>
            )}

            {/* Modal Bottom Developer Credit */}
            <div className="py-2.5 px-4 bg-[#050811] border-t border-slate-800/80 text-center text-[11px] font-space text-slate-400">
              Website Developed by{' '}
              <span className="font-orbitron font-bold text-emerald-400">AFFU KHAN</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
