'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function SharePage() {
  return (
    <div className="flex-1 p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Página de Compartilhamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Esta é uma página de compartilhamento de mídia. O conteúdo será carregado conforme o link específico.
          </p>
          <Link href="/">
            <Button>Voltar ao Início</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
