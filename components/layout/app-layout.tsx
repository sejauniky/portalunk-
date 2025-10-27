import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loading } from "@/components/ui/loading";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isLoading, isAuthenticated, supabaseReachable, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading message="Carregando aplicação..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const supabaseWarning = !supabaseReachable ? (
    <div className="mb-4 p-3 rounded bg-yellow-800 text-yellow-100 border border-yellow-700 text-sm">
      Conexão com o Supabase falhou. Verifique a configuração do Supabase ou conecte via MCP: clique em <strong>Open MCP popover</strong> e [Connect to Supabase](#open-mcp-popover).
    </div>
  ) : null;

  if (role === "producer") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto">
          {supabaseWarning}
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen pt-[106px] sm:pt-[106px] lg:pt-8 pb-8 transition-all">
        {supabaseWarning}
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
