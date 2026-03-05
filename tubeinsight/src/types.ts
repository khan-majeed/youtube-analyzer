export interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

export interface AnalysisResult {
  summary: {
    tldr: string[];
    executive: string;
  };
  keyTakeaways: {
    title: string;
    description: string;
    icon: string;
  }[];
  sentiment: {
    score: number; // -1 to 1
    label: string;
    breakdown: { name: string; value: number }[];
  };
  insights: {
    themes: string[];
    viewerPerception: string;
    tone: string;
    argumentStrength: string;
    bias: string;
  };
  notableMoments: {
    timestamp: string;
    description: string;
    importance: number; // 1-10
  }[];
  topics: { name: string; relevance: number }[];
}

export type SummaryLength = 'short' | 'medium' | 'long';
export type ModelChoice = 'basic' | 'pro';
