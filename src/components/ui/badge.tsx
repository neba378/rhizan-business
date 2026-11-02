import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-primary/10 text-brand-primary',
        secondary: 'bg-gray-100 text-content-secondary',
        success: 'bg-state-success-bg text-state-success',
        warning: 'bg-state-warning-bg text-state-warning',
        danger: 'bg-state-danger-bg text-state-danger',
        info: 'bg-state-info-bg text-state-info',
        outline: 'border border-border text-content-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
