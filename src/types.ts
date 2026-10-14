export interface WebsiteSettings {
  websiteTitle: string;
  websiteSubtitle: string;
  tiktokUrl: string;
  tiktokButtonText: string;
  instagramUrl: string;
  instagramButtonText: string;
  youtubeUrl: string;
  youtubeButtonText: string;
  destinationUrl: string;
  unlockButtonText: string;
  waitingSeconds: number; // 15 to 20
}

export type PublicSettings = Omit<WebsiteSettings, 'destinationUrl'>;

export interface SessionStepState {
  currentStep: 1 | 2 | 3 | 4;
  step1: {
    visited: boolean;
    waiting: boolean;
    remainingSeconds: number;
    completed: boolean;
  };
  step2: {
    visited: boolean;
    waiting: boolean;
    remainingSeconds: number;
    completed: boolean;
  };
  step3: {
    visited: boolean;
    waiting: boolean;
    remainingSeconds: number;
    completed: boolean;
  };
  step4: {
    unlocked: boolean;
    destinationUrl: string | null;
  };
}

export interface AnalyticsStats {
  visits: number;
  step1Clicks: number;
  step2Clicks: number;
  step3Clicks: number;
  unlocks: number;
  lastUpdated: string;
}
