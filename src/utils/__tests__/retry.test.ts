import { describe, it, expect, vi } from 'vitest';
import { withRetry, type RetryOptions } from '../retry';

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, 3, 10);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, 3, 10);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(withRetry(fn, 2, 10)).rejects.toThrow('always fails');
    // initial + 2 retries = 3 calls
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should work with zero retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(withRetry(fn, 0, 10)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should preserve the original error type', async () => {
    class CustomError extends Error {
      code = 'CUSTOM';
    }
    const fn = vi.fn().mockRejectedValue(new CustomError('custom fail'));
    try {
      await withRetry(fn, 1, 10);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
      expect((err as CustomError).code).toBe('CUSTOM');
    }
  });

  describe('shouldRetry option (Supabase { data, error } pattern)', () => {
    type SupabaseResult = { data: string | null; error: { message: string } | null };

    const shouldRetry = (result: SupabaseResult) => result.error !== null;

    it('should retry when shouldRetry returns true for { error } result', async () => {
      const errorResult: SupabaseResult = { data: null, error: { message: 'timeout' } };
      const successResult: SupabaseResult = { data: 'ok', error: null };
      const fn = vi
        .fn()
        .mockResolvedValueOnce(errorResult)
        .mockResolvedValueOnce(errorResult)
        .mockResolvedValue(successResult);

      const options: RetryOptions<SupabaseResult> = { maxRetries: 3, baseDelay: 10, shouldRetry };
      const result = await withRetry(fn, options);

      expect(result).toEqual(successResult);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry when shouldRetry returns false for { data } result', async () => {
      const successResult: SupabaseResult = { data: 'ok', error: null };
      const fn = vi.fn().mockResolvedValue(successResult);

      const options: RetryOptions<SupabaseResult> = { maxRetries: 3, baseDelay: 10, shouldRetry };
      const result = await withRetry(fn, options);

      expect(result).toEqual(successResult);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw the last error result after exhausting retries via shouldRetry', async () => {
      const errorResult: SupabaseResult = { data: null, error: { message: 'always fails' } };
      const fn = vi.fn().mockResolvedValue(errorResult);

      const options: RetryOptions<SupabaseResult> = { maxRetries: 2, baseDelay: 10, shouldRetry };
      await expect(withRetry(fn, options)).rejects.toEqual(errorResult);
      // initial + 2 retries = 3 calls
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use options object with defaults when only shouldRetry is provided', async () => {
      const successResult: SupabaseResult = { data: 'fast', error: null };
      const fn = vi.fn().mockResolvedValue(successResult);

      const result = await withRetry(fn, { shouldRetry, baseDelay: 10 });
      expect(result).toEqual(successResult);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
