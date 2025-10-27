import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as LucideIcons from "lucide-react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type IconName = keyof typeof LucideIcons;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  iconName?: IconName;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      iconName,
      icon,
      iconPosition = "left",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const hasChildren = React.Children.count(children) > 0;
    const resolvedSize = size ?? (hasChildren ? "default" : "icon");
    const IconComponent = iconName ? (LucideIcons[iconName] as React.FC<React.SVGProps<SVGSVGElement>>) : null;
    const renderedIcon = icon ?? (IconComponent ? <IconComponent aria-hidden="true" className="h-4 w-4" /> : null);
    const spinner = loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null;

    const leading = spinner ?? (iconPosition === "left" ? renderedIcon : null);
    const trailing = !spinner && iconPosition === "right" ? renderedIcon : null;

    const baseClassName = cn(
      buttonVariants({ variant, size: resolvedSize }),
      fullWidth && "w-full",
      loading && "pointer-events-none opacity-80",
      className,
    );

    if (asChild) {
      return (
        <Slot className={baseClassName} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    const { type = "button", ...restProps } = props;

    return (
      <button
        type={type as React.ButtonHTMLAttributes<HTMLButtonElement>["type"]}
        className={baseClassName}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...restProps}
      >
        {leading && <span className="inline-flex items-center justify-center">{leading}</span>}
        {children}
        {trailing && <span className="inline-flex items-center justify-center">{trailing}</span>}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
