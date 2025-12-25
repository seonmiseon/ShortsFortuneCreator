
export interface ViralAnalysis {
  suggestedTitle: string;
  hook: string;
  visualStyle: string;
  pacing: string;
  textOverlayStrategy: string;
  engagementFactor: string;
  suggestedFortuneScript: string;
}

export enum AppStep {
  SETUP = 'SETUP',
  ANALYSIS = 'ANALYSIS',
  GENERATION = 'GENERATION'
}

export interface AppState {
  step: AppStep;
  screenshotBase64: string | null;
  analysis: ViralAnalysis | null;
  videoUrl: string | null;
  isGenerating: boolean;
  statusMessage: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Removed 'readonly' modifier to resolve the "identical modifiers" error with existing global definitions.
    aistudio: AIStudio;
    confetti: any;
  }
}