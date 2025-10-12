import React from 'react';
import { Route, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import NotFound from '@/pages/NotFound';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
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

export function ProtectedRoute({ path, component: Component, requiredRole = 'admin' }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show a lightweight loading placeholder while the auth state initializes
  if (isLoading) {
    return <Route path={path} component={LoadingPlaceholder} />;
  }

  // If not authenticated, redirect to /login
  if (!isAuthenticated || !user) {
    // Use setLocation to navigate programmatically; return null while navigation happens
    setLocation('/login');
    return null;
  }

  // If authenticated but missing required role, render NotFound with message or an Unauthorized block
  if (!user.role || user.role !== requiredRole) {
    // prefer showing a clear Unauthorized message; fallback to NotFound for consistency when needed
    return <Route path={path} component={UnauthorizedMessage} />;
  }

  // Happy path: render the protected component
  return <Route path={path} component={Component} />;
}
