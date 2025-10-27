"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigateWithRetry = (path: string, maxRetries = 3) => {
    let attempt = 0;

    const tryNavigate = () => {
      try {
        router.push(path);
        attempt = 0;
      } catch (error) {
        if (attempt < maxRetries) {
          attempt++;
          console.warn(`Navigation failed, retrying (${attempt}/${maxRetries}):`, error);
          setTimeout(tryNavigate, 500);
        } else {
          console.error('Navigation failed after retries:', error);
        }
      }
    };

    tryNavigate();
  };

  useEffect(() => {
    try {
      if (!isAuthenticated && pathname !== "/login" && !pathname.startsWith("/share/")) {
        navigateWithRetry("/login");
        return;
      }

      if (isAuthenticated && pathname === "/login") {
        if (role === "producer") {
          navigateWithRetry("/producer-dashboard");
        } else if (role === "admin") {
          navigateWithRetry("/");
        }
        return;
      }

      if (isAuthenticated && role === "admin" && pathname === "/producer-dashboard") {
        navigateWithRetry("/");
        return;
      }

      if (isAuthenticated && role === "producer" && pathname === "/" && !pathname.startsWith("/share/")) {
        navigateWithRetry("/producer-dashboard");
        return;
      }
    } catch (error) {
      console.error('Navigation setup error:', error);
    }
  }, [isAuthenticated, role, pathname, router]);

  if (pathname === "/login") {
    return children;
  }

  if (pathname.startsWith("/share/")) {
    return children;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
