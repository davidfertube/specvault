/**
 * API client for SteelIntel backend
 * Handles communication with the FastAPI backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Source citation type
export interface Source {
  ref: string;           // e.g., "[1]"
  document: string;      // e.g., "ASTM_A106.pdf"
  page: string;          // e.g., "5"
  content_preview: string; // First 200 chars of the chunk
}

// Response types
export interface ChatResponse {
  response: string;
  sources: Source[];
}

export interface HealthResponse {
  status: string;
  version?: string;
}

export interface ApiError {
  detail: string;
}

// Custom error class for API errors
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Query the knowledge base with a user question
 * @param query - The user's question
 * @returns The AI-generated response with source citations
 */
export async function queryKnowledgeBase(query: string): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to query knowledge base';
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If we can't parse error JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiRequestError(errorMessage, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    // Network error or other issue
    throw new ApiRequestError(
      'Unable to connect to the server. Please check if the backend is running.',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Check if the backend is healthy and reachable
 * @returns true if healthy, false otherwise
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      // Short timeout for health checks
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the health status with details
 * @returns Health response or null if unhealthy
 */
export async function getHealthStatus(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}
