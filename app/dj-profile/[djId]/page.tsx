'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Music } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function DJProfilePage() {
  const params = useParams();
  const djId = params?.djId as string;

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <Link href="/dj-management">
          <Button variant="outline">← Voltar</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Perfil do DJ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Carregando perfil do DJ: {djId}
          </p>
          <div className="rounded-lg border border-dashed border-border/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Os detalhes do perfil serão exibidos aqui
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
