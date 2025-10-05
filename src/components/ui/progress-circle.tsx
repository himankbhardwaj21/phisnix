'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressCircleProps extends React.SVGProps<SVGSVGElement> {
  value?: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressCircle = React.forwardRef<SVGSVGElement, ProgressCircleProps>(
  ({ className, value = 0, size = 48, strokeWidth = 4, ...props }, ref) => {
    const C = (size - strokeWidth) / 2; // Radius
    const R = C * 2 * Math.PI; // Circumference

    const scoreColor = value > 75 ? 'text-green-500' : value > 40 ? 'text-yellow-500' : 'text-red-500';

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn('transform -rotate-90', className)}
        {...props}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={C}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-muted/50"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={C}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className={cn('transition-[stroke-dashoffset]', scoreColor)}
          fill="transparent"
          strokeDasharray={R}
          strokeDashoffset={R - (R * value) / 100}
          strokeLinecap="round"
          style={{ transitionDuration: '1s' }}
        />
      </svg>
    );
  }
);
ProgressCircle.displayName = 'ProgressCircle';

export { ProgressCircle };
