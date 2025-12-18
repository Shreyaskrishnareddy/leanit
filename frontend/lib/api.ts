import type { AnalysisResponse, ErrorResponse, AnalyzeRequest } from '@/types';

// Use relative URL when served from same origin (production), or env var for local dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public errorCode: string;
  public details: string | null;

  constructor(message: string, errorCode: string, details: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Analyze a YouTube video
 */
export async function analyzeVideo(url: string): Promise<AnalysisResponse> {
  const request: AnalyzeRequest = { url };

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'Unknown error',
      error_code: 'UNKNOWN_ERROR',
      details: null,
    })) as ErrorResponse;

    throw new ApiError(
      errorData.error || 'Failed to analyze video',
      errorData.error_code || 'UNKNOWN_ERROR',
      errorData.details
    );
  }

  return response.json();
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{
  status: string;
  version: string;
  groq_available: boolean;
  whisper_available: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json();
}
