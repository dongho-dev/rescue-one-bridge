import { describe, it, expect, beforeEach } from 'vitest';
import { enqueue, getQueue, dequeue, clearQueue } from '../offlineQueue';
import type { CreateRequestData } from '@/hooks/useRequests';

const makeRequest = (
  overrides: Partial<CreateRequestData> = {},
): CreateRequestData => ({
  priority: 'emergency',
  severity: 5,
  symptom: '심정지',
  ...overrides,
});

describe('offlineQueue', () => {
  beforeEach(() => {
    clearQueue();
  });

  it('should enqueue and retrieve items', () => {
    const item = enqueue(makeRequest(), 'user-1');
    const queue = getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].data.symptom).toBe('심정지');
    expect(queue[0].userId).toBe('user-1');
    expect(queue[0].id).toBe(item.id);
    expect(queue[0].queuedAt).toBeTruthy();
  });

  it('should dequeue specific items', () => {
    const item1 = enqueue(makeRequest({ symptom: '심정지' }), 'user-1');
    const item2 = enqueue(
      makeRequest({ priority: 'urgent', severity: 3, symptom: '골절' }),
      'user-1',
    );
    dequeue(item1.id);
    const queue = getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(item2.id);
  });

  it('should clear all items', () => {
    enqueue(makeRequest(), 'user-1');
    enqueue(
      makeRequest({ priority: 'urgent', severity: 3, symptom: '골절' }),
      'user-2',
    );
    clearQueue();
    expect(getQueue()).toHaveLength(0);
  });

  it('should handle empty queue gracefully', () => {
    expect(getQueue()).toEqual([]);
    dequeue('non-existent');
    expect(getQueue()).toEqual([]);
  });

  it('should persist across calls', () => {
    enqueue(makeRequest({ priority: 'normal', severity: 1, symptom: '발열' }), 'user-1');
    // Simulate fresh read
    const queue = getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].data.symptom).toBe('발열');
  });

  it('should assign unique ids to each item', () => {
    const item1 = enqueue(makeRequest(), 'user-1');
    const item2 = enqueue(makeRequest(), 'user-1');
    expect(item1.id).not.toBe(item2.id);
  });
});
