/**
 * Shared error detection utilities.
 * Consolidated from embeddings.ts and model-fallback.ts to avoid duplication.
 */

/**
 * Checks if an error indicates a rate limit has been exceeded.
 * @param error - The error to check
 * @returns True if the error indicates a rate limit issue
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate') ||
      message.includes('429') ||
      message.includes('quota') ||
      message.includes('too many requests') ||
      message.includes('limit exceeded')
    );
  }
  return false;
}

/**
 * Checks if an error indicates a timeout.
 * @param error - The error to check
 * @returns True if the error indicates a timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('deadline exceeded') ||
      message.includes('etimedout')
    );
  }
  return false;
}

/**
 * Checks if an error is transient and should be retried.
 * @param error - The error to check
 * @returns True if the error is likely transient
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      isRateLimitError(error) ||
      isTimeoutError(error) ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('unavailable')
    );
  }
  return false;
}
