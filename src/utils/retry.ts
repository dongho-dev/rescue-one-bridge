export interface RetryOptions<T> {
  maxRetries?: number;
  baseDelay?: number;
  shouldRetry?: (result: T) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetriesOrOptions?: number | RetryOptions<T>,
  baseDelay = 1000,
): Promise<T> {
  let maxRetries = 3;
  let resolvedBaseDelay = baseDelay;
  let shouldRetry: ((result: T) => boolean) | undefined;

  if (typeof maxRetriesOrOptions === 'number') {
    maxRetries = maxRetriesOrOptions;
    resolvedBaseDelay = baseDelay;
  } else if (maxRetriesOrOptions !== undefined) {
    maxRetries = maxRetriesOrOptions.maxRetries ?? 3;
    resolvedBaseDelay = maxRetriesOrOptions.baseDelay ?? 1000;
    shouldRetry = maxRetriesOrOptions.shouldRetry;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (shouldRetry && shouldRetry(result)) {
        lastError = result;
        if (attempt < maxRetries) {
          const delay = resolvedBaseDelay * Math.pow(2, attempt) + Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        continue;
      }
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = resolvedBaseDelay * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
