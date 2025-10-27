"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login" && !pathname.startsWith("/share/")) {
      router.push("/login");
      return;
    }

    if (isAuthenticated && pathname === "/login") {
      if (role === "producer") {
        router.push("/producer-dashboard");
      } else if (role === "admin") {
        router.push("/");
      }
      return;
    }

    if (isAuthenticated && role === "admin" && pathname === "/producer-dashboard") {
      router.push("/");
      return;
    }

    if (isAuthenticated && role === "producer" && pathname === "/" && !pathname.startsWith("/share/")) {
      router.push("/producer-dashboard");
      return;
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
