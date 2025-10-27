import * as React from "react";
import * as Icons from "lucide-react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: keyof typeof Icons;
  size?: number;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, className, ...props }) => {
  const LucideIcon = Icons[name] as React.FC<React.SVGProps<SVGSVGElement>>;
  if (!LucideIcon) return null;
  return <LucideIcon width={size} height={size} className={className} {...props} />;
};
