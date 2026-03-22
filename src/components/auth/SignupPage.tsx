import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Building2, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { signOAuthMeta } from '../../utils/oauthMetaSigning';

const signupSchema = z
  .object({
    displayName: z.string().min(2, '이름은 2자 이상').max(50, '이름은 50자 이하'),
    email: z.string().email('올바른 이메일을 입력해주세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .superRefine((val, ctx) => {
        let kinds = 0;
        if (/[A-Z]/.test(val)) kinds++;
        if (/[0-9]/.test(val)) kinds++;
        if (/[^A-Za-z0-9]/.test(val)) kinds++;
        if (kinds < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '대문자, 숫자, 특수문자 중 2종 이상을 포함해야 합니다.',
          });
        }
      }),
    confirmPassword: z.string(),
    role: z.enum(['hospital_staff', 'paramedic']),
    hospitalId: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })
  .superRefine((d, ctx) => {
    if (d.role === 'hospital_staff' && !d.hospitalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '소속 병원을 선택해주세요.',
        path: ['hospitalId'],
      });
    }
  });

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupPageProps {
  onSwitchToLogin: () => void;
}

interface Hospital {
  id: string;
  name: string;
}

export function SignupPage({ onSwitchToLogin }: SignupPageProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'hospital_staff',
      hospitalId: '',
    },
  });

  const role = watch('role');
  const password = watch('password');
  const hospitalId = watch('hospitalId');

  // 비밀번호 강도 계산
  const passwordStrength = (() => {
    if (!password) return 0;
    let kinds = 0;
    if (/[A-Z]/.test(password)) kinds++;
    if (/[0-9]/.test(password)) kinds++;
    if (/[^A-Za-z0-9]/.test(password)) kinds++;
    if (password.length < 8) return 1; // 약함
    if (kinds >= 2) return 3; // 강함
    if (kinds >= 1) return 2; // 보통
    return 1; // 약함
  })();

  const passwordStrengthLabel = ['', '약함', '보통', '강함'][passwordStrength] ?? '';
  const passwordStrengthColor =
    ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500'][passwordStrength] ?? '';

  // Fetch hospitals when role is hospital_staff
  useEffect(() => {
    if (role === 'hospital_staff') {
      fetchHospitals();
    }
  }, [role]);

  const fetchHospitals = async () => {
    setLoadingHospitals(true);
    try {
      const { data, error } = await supabase.from('hospitals').select('id, name').order('name');

      if (error) {
        console.warn('Failed to fetch hospitals:', error.message);
        setHospitals([]);
      } else {
        setHospitals(data ?? []);
      }
    } catch {
      console.warn('Error fetching hospitals');
      setHospitals([]);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleSignup = async (data: SignupFormValues) => {
    setLoading(true);
    try {
      // Role is sent via user_metadata but validated server-side in handle_new_user trigger.
      // hospital_id is NOT sent via metadata — linked via RPC after signup.
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
            role: data.role,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('이미 등록된 이메일입니다. 로그인해주세요.');
        } else {
          toast.error(getUserFriendlyError(error.message));
        }
      } else {
        // Link hospital via server-side RPC if hospital_staff
        if (data.role === 'hospital_staff' && data.hospitalId && signUpData?.user) {
          try {
            await supabase.rpc('link_hospital', { p_hospital_id: data.hospitalId });
          } catch (rpcErr) {
            console.warn('Hospital link failed (will retry on login):', rpcErr);
          }
        }
        toast.success('회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.');
        onSwitchToLogin();
      }
    } catch {
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    // Validate hospital selection before OAuth redirect
    if (role === 'hospital_staff' && !hospitalId && hospitals.length > 0) {
      toast.error('소속 병원을 선택해주세요.');
      return;
    }

    // Persist role/hospital to localStorage with HMAC signature for tamper detection
    const meta = { role, hospitalId: hospitalId || null };
    const signed = signOAuthMeta(meta);
    localStorage.setItem('oauth_signup_meta', signed);

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        localStorage.removeItem('oauth_signup_meta');
        toast.error(getUserFriendlyError(error.message));
        setLoading(false);
      }
    } catch {
      localStorage.removeItem('oauth_signup_meta');
      toast.error('Google 회원가입 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rescue One Bridge</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">응급실 관리 시스템</p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl border-0 dark:border dark:border-slate-700">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold">회원가입</CardTitle>
            <CardDescription>새 계정을 만들어 시작하세요</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">이름</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="홍길동"
                  {...register('displayName')}
                  disabled={loading}
                  autoComplete="name"
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="signup-email">이메일</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@hospital.com"
                  {...register('email')}
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="signup-password">비밀번호</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="8자 이상, 대문자/숫자/특수문자 중 2종 포함"
                  {...register('password')}
                  disabled={loading}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            passwordStrength >= level ? passwordStrengthColor : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs ${
                        passwordStrength === 1
                          ? 'text-red-500'
                          : passwordStrength === 2
                            ? 'text-amber-500'
                            : passwordStrength === 3
                              ? 'text-green-500'
                              : ''
                      }`}
                    >
                      비밀번호 강도: {passwordStrengthLabel}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">비밀번호 확인</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  {...register('confirmPassword')}
                  disabled={loading}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label>역할 선택</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-3"
                    >
                      <label
                        htmlFor="role-hospital"
                        className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                          field.value === 'hospital_staff'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        <RadioGroupItem value="hospital_staff" id="role-hospital" />
                        <div>
                          <p className="text-sm font-medium">병원 직원</p>
                          <p className="text-xs text-muted-foreground">병원 관리</p>
                        </div>
                      </label>
                      <label
                        htmlFor="role-paramedic"
                        className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                          field.value === 'paramedic'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        <RadioGroupItem value="paramedic" id="role-paramedic" />
                        <div>
                          <p className="text-sm font-medium">구급대원</p>
                          <p className="text-xs text-muted-foreground">현장 대응</p>
                        </div>
                      </label>
                    </RadioGroup>
                  )}
                />
                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
              </div>

              {/* Hospital Selection (only for hospital_staff) */}
              {role === 'hospital_staff' && (
                <div className="space-y-2">
                  <Label htmlFor="hospital">소속 병원</Label>
                  <Controller
                    name="hospitalId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={loading || loadingHospitals}
                      >
                        <SelectTrigger id="hospital">
                          <SelectValue
                            placeholder={
                              loadingHospitals ? '병원 목록 로딩 중...' : '병원을 선택하세요'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {hospitals.length > 0 ? (
                            hospitals.map((hospital) => (
                              <SelectItem key={hospital.id} value={hospital.id}>
                                {hospital.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {loadingHospitals ? '로딩 중...' : '등록된 병원이 없습니다'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.hospitalId && (
                    <p className="text-sm text-destructive">{errors.hospitalId.message}</p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    가입 처리 중...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="mr-2" />
                    회원가입
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                또는
              </span>
            </div>

            {/* Google Signup */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google로 회원가입
            </Button>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
              >
                로그인
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
