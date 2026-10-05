import React from 'react';

export const Card = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';