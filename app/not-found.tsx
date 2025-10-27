'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold text-muted-foreground">Página não encontrada</h2>
        </div>

        <p className="text-muted-foreground max-w-md">
          Desculpe, a página que você está procurando não existe. Verifique a URL ou volte à página inicial.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/">
            <Button>Voltar para o início</Button>
          </Link>
          <Link href="/producer-dashboard">
            <Button variant="outline">Ir para Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
