import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queryKnowledgeBase, checkHealth, getHealthStatus, ApiRequestError } from './api';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('queryKnowledgeBase', () => {
    it('should send query and return response on success', async () => {
      const mockResponse = { response: 'Test response about steel specifications' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await queryKnowledgeBase('What is A106 Grade B?');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'What is A106 Grade B?' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiRequestError on server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ detail: 'Server error occurred' }),
      });

      await expect(queryKnowledgeBase('test query')).rejects.toThrow(ApiRequestError);
      await expect(queryKnowledgeBase('test query')).rejects.toThrow('Server error occurred');
    });

    it('should throw ApiRequestError with status text when no detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(queryKnowledgeBase('test')).rejects.toThrow(ApiRequestError);
    });

    it('should throw ApiRequestError on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(queryKnowledgeBase('test')).rejects.toThrow(ApiRequestError);
      await expect(queryKnowledgeBase('test')).rejects.toThrow('Unable to connect to the server');
    });
  });

  describe('checkHealth', () => {
    it('should return true when server is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await checkHealth();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return false when server is unhealthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await checkHealth();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkHealth();

      expect(result).toBe(false);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status on success', async () => {
      const mockStatus = { status: 'ok' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      const result = await getHealthStatus();

      expect(result).toEqual(mockStatus);
    });

    it('should return null on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await getHealthStatus();

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getHealthStatus();

      expect(result).toBeNull();
    });
  });
});
