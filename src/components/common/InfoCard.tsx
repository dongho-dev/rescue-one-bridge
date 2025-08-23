import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

interface InfoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
}

export function InfoCard({ title, value, subtitle, variant = 'default', icon }: InfoCardProps) {
  const variantClasses = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800',
    warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800',
    destructive: 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
  };

  return (
    <Card className={`${variantClasses[variant]} transition-all hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

interface StatChipProps {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
}

export function StatChip({ label, value, variant = 'default', size = 'default' }: StatChipProps) {
  const variantClasses = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
  };

  return (
    <Badge variant="secondary" className={`${variantClasses[variant]} ${size === 'sm' ? 'text-xs' : ''}`}>
      {label}: {value}
    </Badge>
  );
}