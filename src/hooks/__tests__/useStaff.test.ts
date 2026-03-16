import { describe, it, expect } from 'vitest';
import { dbStatusToFrontend, frontendStatusToDb } from '../useStaff';

describe('useStaff status conversion', () => {
  describe('dbStatusToFrontend', () => {
    it('converts on_duty to on-duty', () => {
      expect(dbStatusToFrontend('on_duty')).toBe('on-duty');
    });

    it('converts off_duty to off-duty', () => {
      expect(dbStatusToFrontend('off_duty')).toBe('off-duty');
    });

    it('passes through break unchanged', () => {
      expect(dbStatusToFrontend('break')).toBe('break');
    });

    it('passes through emergency unchanged', () => {
      expect(dbStatusToFrontend('emergency')).toBe('emergency');
    });
  });

  describe('frontendStatusToDb', () => {
    it('converts on-duty to on_duty', () => {
      expect(frontendStatusToDb('on-duty')).toBe('on_duty');
    });

    it('converts off-duty to off_duty', () => {
      expect(frontendStatusToDb('off-duty')).toBe('off_duty');
    });

    it('passes through break unchanged', () => {
      expect(frontendStatusToDb('break')).toBe('break');
    });

    it('passes through emergency unchanged', () => {
      expect(frontendStatusToDb('emergency')).toBe('emergency');
    });
  });

  describe('roundtrip conversion', () => {
    it('should roundtrip on_duty correctly', () => {
      const dbVal = 'on_duty';
      const frontend = dbStatusToFrontend(dbVal);
      const backToDb = frontendStatusToDb(frontend);
      expect(backToDb).toBe(dbVal);
    });

    it('should roundtrip off_duty correctly', () => {
      const dbVal = 'off_duty';
      const frontend = dbStatusToFrontend(dbVal);
      const backToDb = frontendStatusToDb(frontend);
      expect(backToDb).toBe(dbVal);
    });
  });
});
