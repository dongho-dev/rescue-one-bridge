import { describe, it, expect } from 'vitest';
import { mockStaff } from '../../mocks/staffData';

/**
 * Staff status values are now aligned directly to DB ENUMs (snake_case).
 * No conversion needed — DB and frontend use identical values.
 */

describe('useStaff data contracts', () => {
  it('staff status values match DB ENUMs directly', () => {
    const validStatuses = ['on_duty', 'off_duty', 'break', 'emergency'];
    for (const member of mockStaff) {
      expect(validStatuses).toContain(member.status);
    }
  });

  it('staff roles match DB ENUMs directly', () => {
    const validRoles = ['doctor', 'nurse', 'technician', 'admin'];
    for (const member of mockStaff) {
      expect(validRoles).toContain(member.role);
    }
  });
});
