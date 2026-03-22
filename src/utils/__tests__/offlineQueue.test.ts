import { describe, it, expect, beforeEach } from 'vitest';
import { enqueue, getQueue, dequeue, clearQueue, sanitizePHI } from '../offlineQueue';
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

  describe('sanitizePHI', () => {
    it('strips vitals from queued data', () => {
      enqueue(makeRequest({ vitals: { bp: '120/80', pulse: 72 } }), 'user-1');
      const queue = getQueue();
      expect(queue[0].data.vitals).toBeUndefined();
    });

    it('strips allergies from queued data', () => {
      enqueue(makeRequest({ allergies: ['페니실린', '아스피린'] }), 'user-1');
      const queue = getQueue();
      expect(queue[0].data.allergies).toBeUndefined();
    });

    it('strips notes from queued data', () => {
      enqueue(makeRequest({ notes: '환자 특이사항 메모' }), 'user-1');
      const queue = getQueue();
      expect(queue[0].data.notes).toBeUndefined();
    });

    it('strips location_text from queued data', () => {
      enqueue(makeRequest({ location_text: '서울시 강남구 역삼동 123' }), 'user-1');
      const queue = getQueue();
      expect(queue[0].data.location_text).toBeUndefined();
    });

    it('preserves symptom and coordinates', () => {
      enqueue(makeRequest({ symptom: '호흡곤란', latitude: 37.5, longitude: 127.0 }), 'user-1');
      const queue = getQueue();
      expect(queue[0].data.symptom).toBe('호흡곤란');
      expect(queue[0].data.latitude).toBe(37.5);
      expect(queue[0].data.longitude).toBe(127.0);
    });

    it('handles missing patient_name', () => {
      const result = sanitizePHI(makeRequest({ patient_name: undefined }));
      expect(result.patient_name).toBeUndefined();
    });

    it('handles empty string patient_name', () => {
      const result = sanitizePHI(makeRequest({ patient_name: '' }));
      expect(result.patient_name).toBe('');
    });

    it('masks patient_name to first char + **', () => {
      const result = sanitizePHI(makeRequest({ patient_name: '김철수' }));
      expect(result.patient_name).toBe('김**');
    });
  });
});
