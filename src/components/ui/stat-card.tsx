import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  iconColor?: string;
  iconBg?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, trend, className, iconColor, iconBg, onClick }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface-card p-4 shadow-card transition-shadow',
        onClick && 'cursor-pointer hover:shadow-card-hover',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-content-secondary mb-1 truncate">{title}</p>
          <p className="text-sm sm:text-lg lg:text-xl font-bold text-content-primary truncate tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend.value >= 0 ? (
                <TrendingUp className="h-3 w-3 text-state-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-state-danger" />
              )}
              <span className={cn('text-xs font-medium', trend.value >= 0 ? 'text-state-success' : 'text-state-danger')}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-content-tertiary">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBg || 'bg-brand-primary/10')}>
          <Icon className={cn('h-5 w-5', iconColor || 'text-brand-primary')} />
        </div>
      </div>
    </div>
  );
}
