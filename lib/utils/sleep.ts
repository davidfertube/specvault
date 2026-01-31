/**
 * Shared utility for async sleep/delay operations.
 * Extracted to avoid duplication across multiple files.
 */

/**
 * Pauses execution for the specified duration.
 * @param ms - Duration to sleep in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
