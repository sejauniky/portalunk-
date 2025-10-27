'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const ShareHistory = ({ producerId, onRevoke }: { producerId: string; onRevoke?: () => void }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('shared_media_links')
        .select('id, share_token, expires_at, created_at, accessed_count, dj_id, djs ( artist_name )')
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error('Failed to load share links', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (producerId) load();
  }, [producerId]);

  const revoke = async (id: string) => {
    try {
      const { data, error } = await (supabase as any).functions.invoke('revoke-share-link', { body: { id } });
      if (error) throw error;
      if (onRevoke) onRevoke();
      await load();
    } catch (err) {
      console.error('Revoke error', err);
    }
  };

  if (loading) return <div>Carregando histórico...</div>;

  return (
    <div>
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum link gerado ainda.</p>
      ) : (
        <div className="space-y-3">
          {links.map((l) => {
            const artistName = (l?.djs?.artist_name || '').trim();
            const slug = artistName
              ? artistName
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9\s-]/g, '')
                  .trim()
                  .replace(/\s+/g, '-')
              : '';
            const url = slug ? `${window.location.origin}/share/${encodeURIComponent(slug)}` : `${window.location.origin}/share/${l.share_token}`;
            return (
              <div key={l.id} className="p-3 border border-border rounded-md flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{url}</div>
                  <div className="text-xs text-muted-foreground">Expira em: {new Date(l.expires_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Acessos: {l.accessed_count || 0}</div>
                  <Button size="sm" onClick={() => revoke(l.id)} variant="destructive">Revogar</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShareHistory;
