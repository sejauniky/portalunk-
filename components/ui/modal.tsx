import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  size = 'lg',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div
        className={cn(
          'glass-card rounded-2xl w-full my-8 shadow-glass animate-scale-in flex flex-col',
          'max-h-[95vh]',
          sizeClasses[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 flex-shrink-0">
            <div className="text-lg sm:text-xl font-bold text-foreground">
              {title}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted/50 rounded-lg transition-all hover:scale-105"
              type="button"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-border/50 bg-gradient-to-r from-muted/30 to-muted/10 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
