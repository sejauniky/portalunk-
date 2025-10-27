import React from 'react';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'producer';
}

function LoadingPlaceholder() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex items-center justify-center p-8">
      <div className="text-sm text-muted-foreground">Carregando...</div>
    </div>
  );
}

function UnauthorizedMessage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Acesso negado</h1>
      <p className="mt-2 text-sm text-muted-foreground">Você não tem permissão para acessar esta página.</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold text-muted-foreground">Não encontrado</h2>
        </div>
        <p className="text-muted-foreground max-w-md">
          A página que você está procurando não existe.
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPlaceholder />;
  }

  if (!isAuthenticated || !user) {
    return <NotFoundPage />;
  }

  if (!user.role || user.role !== requiredRole) {
    return <UnauthorizedMessage />;
  }

  return <>{children}</>;
}
