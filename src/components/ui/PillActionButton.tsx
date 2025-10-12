import * as React from "react";
import { Icon } from "../Icon";
import { cn } from "@/lib/utils";

export interface PillActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  iconName?: keyof typeof import('lucide-react');
  children: React.ReactNode;
}

const colorClasses = {
  blue: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20',
  green: 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20',
  red: 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20',
  purple: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20',
  gray: 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-500/20',
};

const PillActionButton = React.forwardRef<HTMLButtonElement, PillActionButtonProps>(
  ({ color = 'blue', iconName, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
          colorClasses[color],
          disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {iconName && <Icon name={iconName} size={16} />}
        {children}
      </button>
    );
  }
);

PillActionButton.displayName = "PillActionButton";

export default PillActionButton;
