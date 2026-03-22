import { useAuth } from '../../contexts/AuthContext';

export function DemoRoleSwitcher() {
  const { profile, switchDemoRole } = useAuth();
  if (!switchDemoRole) return null;
  const label = profile?.role === 'paramedic' ? '구급대원' : '병원 직원';
  return (
    <button
      onClick={switchDemoRole}
      className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
    >
      현재: {label} (전환)
    </button>
  );
}
