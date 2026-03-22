import { describe, it, expect } from 'vitest';
import { getUserFriendlyError } from '../errorMessages';

const DEFAULT_MSG = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

describe('getUserFriendlyError', () => {
  // Auth errors
  it('maps "Invalid login credentials"', () => {
    expect(getUserFriendlyError('Invalid login credentials')).toBe(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    );
  });

  it('maps "Email not confirmed"', () => {
    expect(getUserFriendlyError('Email not confirmed')).toBe(
      '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.',
    );
  });

  it('maps "User already registered"', () => {
    expect(getUserFriendlyError('User already registered')).toBe(
      '이미 등록된 이메일입니다. 로그인해주세요.',
    );
  });

  it('maps "already registered"', () => {
    expect(getUserFriendlyError('already registered')).toBe(
      '이미 등록된 이메일입니다. 로그인해주세요.',
    );
  });

  it('maps "Signup requires a valid password"', () => {
    expect(getUserFriendlyError('Signup requires a valid password')).toBe(
      '유효한 비밀번호를 입력해주세요.',
    );
  });

  it('maps "Password should be at least 6 characters"', () => {
    expect(getUserFriendlyError('Password should be at least 6 characters')).toBe(
      '비밀번호는 6자 이상이어야 합니다.',
    );
  });

  it('maps "Email rate limit exceeded"', () => {
    expect(getUserFriendlyError('Email rate limit exceeded')).toBe(
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    );
  });

  it('maps "Rate limit exceeded"', () => {
    expect(getUserFriendlyError('Rate limit exceeded')).toBe(
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    );
  });

  // DB errors
  it('maps "duplicate key value"', () => {
    expect(getUserFriendlyError('duplicate key value violates unique constraint')).toBe(
      '이미 존재하는 데이터입니다.',
    );
  });

  it('maps "violates foreign key constraint"', () => {
    expect(getUserFriendlyError('violates foreign key constraint "fk_something"')).toBe(
      '참조된 데이터가 존재하지 않습니다.',
    );
  });

  it('maps "violates check constraint"', () => {
    expect(getUserFriendlyError('violates check constraint "chk_something"')).toBe(
      '입력값이 허용 범위를 벗어났습니다.',
    );
  });

  it('maps "permission denied"', () => {
    expect(getUserFriendlyError('permission denied for table requests')).toBe('권한이 없습니다.');
  });

  it('maps "JWT expired"', () => {
    expect(getUserFriendlyError('JWT expired')).toBe('세션이 만료되었습니다. 다시 로그인해주세요.');
  });

  // Network errors
  it('maps "Failed to fetch"', () => {
    expect(getUserFriendlyError('Failed to fetch')).toBe(
      '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
    );
  });

  it('maps "NetworkError"', () => {
    expect(getUserFriendlyError('NetworkError when attempting to fetch resource.')).toBe(
      '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
    );
  });

  // Edge cases
  it('returns default message for unknown error', () => {
    expect(getUserFriendlyError('some totally unknown error xyz')).toBe(DEFAULT_MSG);
  });

  it('returns default message for null', () => {
    expect(getUserFriendlyError(null)).toBe(DEFAULT_MSG);
  });

  it('returns default message for undefined', () => {
    expect(getUserFriendlyError(undefined)).toBe(DEFAULT_MSG);
  });

  it('returns default message for empty string', () => {
    expect(getUserFriendlyError('')).toBe(DEFAULT_MSG);
  });
});
