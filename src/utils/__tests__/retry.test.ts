import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../retry';

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
});
