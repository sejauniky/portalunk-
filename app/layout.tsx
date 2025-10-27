import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { RootLayoutClient } from "./layout.client";
import { GlobalProviders } from "./providers";
import "@/index.css";
import { getQueryClient } from "@/lib/get-query-client";

export const metadata: Metadata = {
  title: "Portal UNK - Assessoria Musical Profissional",
  description:
    "Plataforma completa de assessoria musical para gerenciar DJs, eventos e produtores. Sistema profissional com design moderno e funcionalidades avançadas.",
  authors: [{ name: "UNK Assessoria Musical" }],
  keywords: [
    "assessoria musical",
    "DJs",
    "eventos",
    "produtores",
    "música eletrônica",
    "tech house",
    "techno",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Portal UNK",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#0A0B0E",
  openGraph: {
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "dark",
};

const queryClient = getQueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GlobalProviders>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAInstallPrompt />
                <RootLayoutClient>{children}</RootLayoutClient>
              </TooltipProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </GlobalProviders>
      </body>
    </html>
  );
}
