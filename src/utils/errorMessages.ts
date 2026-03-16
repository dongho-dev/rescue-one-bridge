// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meta = import.meta as any;

const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Email not confirmed': '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.',
  'User already registered': '이미 등록된 이메일입니다. 로그인해주세요.',
  'already registered': '이미 등록된 이메일입니다. 로그인해주세요.',
  'Password should be at least': '비밀번호는 6자 이상이어야 합니다.',
  'rate limit': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
};

const GENERIC_ERROR = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

export function getAuthErrorMessage(error: { message: string }): string {
  for (const [key, msg] of Object.entries(AUTH_ERROR_MAP)) {
    if (error.message.includes(key)) return msg;
  }
  if (meta.env?.DEV) {
    return `오류: ${error.message}`;
  }
  return GENERIC_ERROR;
}

export function getHookErrorMessage(error: string | null): string {
  if (!error) return '';
  if (meta.env?.DEV) return error;
  return '데이터를 불러오는 중 오류가 발생했습니다.';
}
