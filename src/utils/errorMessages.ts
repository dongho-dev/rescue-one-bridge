/**
 * Maps known Supabase/auth error codes to user-friendly Korean messages.
 * Falls back to a generic message for unknown errors.
 */

const ERROR_MAP: Record<string, string> = {
  // Auth errors
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Email not confirmed': '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.',
  'User already registered': '이미 등록된 이메일입니다. 로그인해주세요.',
  'already registered': '이미 등록된 이메일입니다. 로그인해주세요.',
  'Signup requires a valid password': '유효한 비밀번호를 입력해주세요.',
  'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다.',
  'Email rate limit exceeded': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'Rate limit exceeded': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  // DB errors
  'duplicate key value': '이미 존재하는 데이터입니다.',
  'violates foreign key constraint': '참조된 데이터가 존재하지 않습니다.',
  'violates check constraint': '입력값이 허용 범위를 벗어났습니다.',
  'permission denied': '권한이 없습니다.',
  'JWT expired': '세션이 만료되었습니다. 다시 로그인해주세요.',
  // Network
  'Failed to fetch': '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
  'NetworkError': '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
};

const DEFAULT_MESSAGE = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

/**
 * Converts a raw error message (typically from Supabase) into a
 * user-friendly Korean string. Never exposes raw technical details.
 */
export function getUserFriendlyError(rawMessage?: string | null): string {
  if (!rawMessage) return DEFAULT_MESSAGE;

  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (rawMessage.includes(key)) {
      return friendly;
    }
  }

  return DEFAULT_MESSAGE;
}
