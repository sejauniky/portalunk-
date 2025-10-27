import * as React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: keyof typeof Icons;
  fallbackText?: string;
  fallback?: string; // url de imagem fallback
  wrapperClassName?: string;
}

const AppImage = React.forwardRef<HTMLImageElement, AppImageProps>(
  (
    {
      src,
      alt = '',
      className = '',
      fallbackIcon = "Image",
      fallbackText,
      fallback,
      wrapperClassName,
      onError,
      ...rest
    },
    ref,
  ) => {
    const [hasError, setHasError] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [loadedSrc, setLoadedSrc] = React.useState<string | undefined>(() =>
      typeof src === "string" && src.trim() !== "" ? src : undefined,
    );

    React.useEffect(() => {
      setHasError(false);
      setLoading(true);
      setLoadedSrc(typeof src === "string" && src.trim() !== "" ? src : undefined);
    }, [src]);

    const IconComponent = Icons[fallbackIcon] as React.FC<React.SVGProps<SVGSVGElement>> | undefined;

    const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
      setHasError(true);
      setLoading(false);
      onError?.(event);
    };

    const handleLoad = () => {
      setLoading(false);
    };

    // Renderiza fallback: imagem, ícone ou texto
    const renderFallback = () => (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground font-semibold rounded-md w-full h-full",
          className,
        )}
      >
        {fallback ? (
          <img src={fallback} alt={alt} className={className} />
        ) : IconComponent ? (
          <IconComponent aria-hidden className="h-6 w-6" />
        ) : fallbackText ? (
          <span>{fallbackText}</span>
        ) : (
          <span>{alt ? alt.charAt(0).toUpperCase() : "?"}</span>
        )}
      </div>
    );

    if (!loadedSrc || hasError) {
      return (
        <div className={cn("relative overflow-hidden", wrapperClassName)}>
          {renderFallback()}
        </div>
      );
    }

    return (
      <div className={cn("relative overflow-hidden", wrapperClassName)}>
        {loading && (
          <div className={cn("absolute inset-0 flex items-center justify-center bg-muted", className)}>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          ref={ref}
          src={loadedSrc}
          alt={alt}
          className={cn(className, loading ? "invisible" : "")}
          onError={handleError}
          onLoad={handleLoad}
          {...rest}
        />
      </div>
    );
  },
);

AppImage.displayName = "AppImage";

export default AppImage;
