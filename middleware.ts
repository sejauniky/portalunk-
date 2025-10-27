import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow login and share routes to be accessed without authentication
  if (pathname === "/login" || pathname.startsWith("/share/")) {
    return NextResponse.next();
  }

  // For other routes, Next.js will handle authentication through client-side layout.client.tsx
  // The server-side middleware doesn't have direct access to Supabase session
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|public/).*)",
  ],
};
