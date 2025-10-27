import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import NotFound from '@/pages/NotFound';

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

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPlaceholder />;
  }

  if (!isAuthenticated || !user) {
    return <NotFound />;
  }

  if (!user.role || user.role !== requiredRole) {
    return <UnauthorizedMessage />;
  }

  return <>{children}</>;
}
