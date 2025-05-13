import type { FC } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ className, size = 24 }) => {
  return (
    <Loader2
      className={cn('animate-spin text-primary', className)}
      style={{ width: size, height: size }}
    />
  );
};

export default LoadingSpinner;
