import type { FC } from 'react';
import { cn } from '@/lib/utils';

interface SiteLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const SiteLogo: FC<SiteLogoProps> = ({ className, size = 'medium' }) => {
  const sizeClasses = {
    small: 'text-2xl md:text-3xl',
    medium: 'text-4xl md:text-5xl',
    large: 'text-5xl md:text-7xl',
  };

  return (
    <h1
      className={cn(
        'font-title font-bold uppercase text-foreground tracking-wider',
        sizeClasses[size],
        className
      )}
    >
      VOS
    </h1>
  );
};

export default SiteLogo;
