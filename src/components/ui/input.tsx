import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      description,
      error,
      wrapperClassName,
      id,
      disabled,
      value,
      defaultValue,
      ...inputProps
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const normalizedProps: typeof inputProps & { value?: typeof value; defaultValue?: typeof defaultValue } = {
      ...inputProps,
    };

    if (value !== undefined) {
      normalizedProps.value = value === null ? "" : value;
    }

    if (defaultValue !== undefined) {
      normalizedProps.defaultValue = defaultValue === null ? "" : defaultValue;
    }

    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          ref={ref}
          disabled={disabled}
          {...normalizedProps}
        />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
export default Input;
