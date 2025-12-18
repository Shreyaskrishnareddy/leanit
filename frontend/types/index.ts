// API Response Types

export type TranscriptSource = 'youtube_captions' | 'whisper_stt';

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ScoreBreakdown {
  density: number;
  clarity: number;
  originality: number;
  signal_to_noise: number;
}

export interface LeanScore {
  score: number;
  reason: string;
  breakdown: ScoreBreakdown | null;
}

export interface DeepDiveContent {
  extended_explanation: string;
  key_arguments: string[];
  local_context: {
    before: string;
    after: string;
  };
}

export interface Insight {
  id: string;
  rank: number;
  title: string;
  core_point: string;
  supporting_context: string | null;
  deep_dive_content: DeepDiveContent | null;
  is_top_five: boolean;
}

export interface VideoMetadata {
  video_id: string;
  title: string;
  channel_name: string;
  duration_seconds: number;
  duration_display: string;
  transcript_source: TranscriptSource;
}

export interface AnalysisResponse {
  status: AnalysisStatus;
  metadata: VideoMetadata;
  summary_bullets: string[];
  lean_score: LeanScore;
  top_insights: Insight[];
  additional_insights: Insight[];
  processing_time_ms: number;
}

export interface ErrorResponse {
  error: string;
  error_code: string;
  details: string | null;
}

// UI Types

export type ProgressStep =
  | 'idle'
  | 'fetching'
  | 'transcript'
  | 'analyzing'
  | 'generating'
  | 'complete';

export interface AnalysisProgress {
  step: ProgressStep;
  message: string;
  percent: number;
}

export interface AnalyzeRequest {
  url: string;
}
