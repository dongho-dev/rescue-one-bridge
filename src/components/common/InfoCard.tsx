import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

interface InfoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
}

export function InfoCard({ title, value, subtitle, variant = 'default', icon, trend }: InfoCardProps) {
  const variantClasses = {
    default: 'border-border',
    success: 'border-l-4 border-l-green-500 border-green-200 bg-green-50/50 dark:bg-green-950/30 dark:border-green-800',
    warning: 'border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800',
    destructive: 'border-l-4 border-l-red-500 border-red-200 bg-red-50/50 dark:bg-red-950/30 dark:border-red-800'
  };

  const iconBgClasses = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    destructive: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
  };

  return (
    <Card className={`${variantClasses[variant]} shadow-sm transition-all hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && (
          <div className={`rounded-full p-2 ${iconBgClasses[variant]}`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {trend && (
            <Badge
              variant="secondary"
              className={`text-xs ${
                trend.positive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
              }`}
            >
              {trend.positive ? '↑' : '↓'}{trend.value}
            </Badge>
          )}
        </div>
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
