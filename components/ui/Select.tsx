import * as React from "react";
import * as LucideIcons from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select as SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "./select-primitive";

type IconName = keyof typeof LucideIcons;

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  iconName?: IconName;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  id?: string;
}

const resolveIcon = (iconName?: IconName) => {
  if (!iconName) return null;
  const IconComponent = LucideIcons[iconName] as React.FC<React.SVGProps<SVGSVGElement>> | undefined;
  if (!IconComponent) return null;
  return <IconComponent className="h-4 w-4" aria-hidden="true" />;
};

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = "Selecione...",
      label,
      description,
      error,
      className,
      triggerClassName,
      contentClassName,
      disabled = false,
      id,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        {/*
          Radix Select does not allow Select.Item to have an empty string value
          (empty string is used to clear the selection / show the placeholder).
          Map any option with value === '' to an internal sentinel value and
          convert it back when calling onChange or when receiving value/defaultValue.
        */}
        {(() => {
          const INTERNAL_EMPTY = "__EMPTY_SELECTION__";

          const toInternal = (v?: string) => (v === "" ? INTERNAL_EMPTY : v);
          const fromInternal = (v?: string) => (v === INTERNAL_EMPTY ? "" : v);

          const internalValue = value === undefined ? undefined : toInternal(value);
          const internalDefault = defaultValue === undefined ? undefined : toInternal(defaultValue);

          const handleValueChange = (v: string) => onChange?.(fromInternal(v));

          const renderedOptions = options.map((opt) => ({
            ...opt,
            _internalValue: opt.value === "" ? INTERNAL_EMPTY : opt.value,
          }));

          return (
            <SelectRoot value={internalValue} defaultValue={internalDefault} onValueChange={handleValueChange} disabled={disabled}>
              <SelectTrigger
                id={fieldId}
                ref={ref}
                className={cn(error && "border-destructive focus-visible:ring-destructive", triggerClassName)}
                aria-invalid={Boolean(error)}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent className={contentClassName}>
                {renderedOptions.map((option) => (
                  <SelectItem key={String(option._internalValue)} value={option._internalValue} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          );
        })()}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
export default Select;
