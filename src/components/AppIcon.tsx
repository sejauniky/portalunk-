import * as React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  name: keyof typeof Icons;
  size?: number;
  fallback?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 24,
  fallback,
  className,
  wrapperClassName,
  ...props
}) => {
  const IconComponent = Icons[name] as React.FC<React.SVGProps<SVGSVGElement>> | undefined;

  if (!IconComponent) {
    return (
      <span className={cn("inline-flex items-center justify-center", wrapperClassName)}>
        {fallback ?? null}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center justify-center", wrapperClassName)}>
      <IconComponent
        width={size}
        height={size}
        className={className}
        aria-hidden
        focusable="false"
        {...props}
      />
    </span>
  );
};

export default AppIcon;
