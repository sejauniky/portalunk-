import React, { useEffect, useMemo, useState } from 'react';
import { useRoute } from 'wouter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/button';
import { storageService } from '../../services/supabaseService';
import { supabase } from '@/lib/supabase';
import { mediaService } from '../../services/mediaService';

const sha256 = async (text) => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const SharedMedia = () => {
  const [, params] = useRoute('/share/:token');
  const token = params?.token;
  const [meta, setMeta] = useState(null);
  const [pass, setPass] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [media, setMedia] = useState([]);
  const [error, setError] = useState('');

  const categories = useMemo(() => ([
    { id: 'logo', name: 'Logo', icon: 'Image' },
    { id: 'presskit', name: 'Presskit', icon: 'Camera' },
    { id: 'backdrop', name: 'Backdrop', icon: 'Monitor' },
    { id: 'performance', name: 'Performance', icon: 'Play' }
  ]), []);
  const [selectedCategory, setSelectedCategory] = useState('logo');

  useEffect(() => {
    const loadMeta = async () => {
      setChecking(true);
      setError('');
      try {
        // Buscar meta diretamente no banco
        const { data, error } = await supabase
          .from('shared_media_links')
          .select('id, dj_id, producer_id, share_token, password_hash, expires_at, accessed_count')
          .eq('share_token', token)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError('Link inválido ou não encontrado');
          setChecking(false);
          return;
        }

        const expires = data.expires_at || null;
        if (expires) {
          const ex = new Date(expires);
          if (Number.isNaN(ex.getTime()) || ex.getTime() < Date.now()) {
            setError('Link expirado');
            setChecking(false);
            return;
          }
        }

        // atualizar contador de acesso de forma não-bloqueante
        try {
          await supabase
            .from('shared_media_links')
            .update({ accessed_count: (data.accessed_count || 0) + 1, last_accessed_at: new Date().toISOString() })
            .eq('id', data.id);
        } catch (e) {
          // não impedimos o acesso se a atualização falhar
          console.warn('Não foi possível incrementar accessed_count', e);
        }

        setMeta({
          djId: data.dj_id,
          djName: null,
          password_hash: data.password_hash,
          share_id: data.id,
        });
      } catch (e) {
        console.error(e);
        setError('Falha ao carregar link compartilhado');
      } finally {
        setChecking(false);
      }
    };
    if (token) loadMeta();
  }, [token]);

  const verifyPassword = async (e) => {
    e?.preventDefault?.();
    if (!meta) return;
    const enteredHash = await sha256(pass || '');
    if (enteredHash === meta.password_hash) {
      setAuthorized(true);
      await fetchMedia();
    } else {
      setAuthorized(false);
      setError('Senha incorreta');
    }
  };

  const fetchMedia = async () => {
    if (!meta?.djId) return;
    setLoadingMedia(true);
    try {
      // Buscar DJ info
      const { data: djData, error: djError } = await supabase
        .from('djs')
        .select('artist_name, avatar_url, background_image_url, genre, instagram_url, soundcloud_url, youtube_url, tiktok_url')
        .eq('id', meta.djId)
        .single();
      
      if (djError) throw djError;
      
      // Buscar media files
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('dj_id', meta.djId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setMeta(prev => ({ ...prev, djName: djData.artist_name, djData }));
      setMedia(data || []);
      
      // Pick first non-empty category
      const grouped = {};
      (data || []).forEach(m => {
        const cat = m.file_category || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(m);
      });
      const firstNonEmpty = Object.keys(grouped).find(k => grouped[k]?.length > 0);
      if (firstNonEmpty) setSelectedCategory(firstNonEmpty);
    } catch (e) {
      setError('Não foi possível carregar as mídias');
    } finally {
      setLoadingMedia(false);
    }
  };

  const groupedMedia = useMemo(() => {
    const g = {};
    (media || []).forEach(m => {
      const cat = m.file_category || 'other';
      if (!g[cat]) g[cat] = [];
      g[cat].push(m);
    });
    return g;
  }, [media]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando link...</p>
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md text-center">
          <Icon name="AlertTriangle" size={32} className="text-red-500 mx-auto mb-2" />
          <p className="text-foreground">{error || 'Link inválido'}</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
          <div className="text-center mb-4">
            <Icon name="Lock" size={24} className="text-muted-foreground mx-auto mb-2" />
            <h1 className="text-xl font-semibold text-foreground">Acesso às mídias de {meta.djName || 'DJ'}</h1>
            <p className="text-sm text-muted-foreground">Digite a senha do produtor para visualizar e baixar</p>
          </div>
          <form onSubmit={verifyPassword} className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Senha</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" iconName="LogIn" iconPosition="left">
              Entrar
            </Button>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  const currentFiles = groupedMedia[selectedCategory] || [];
  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: groupedMedia[cat.id]?.length || 0
  })).filter(cat => cat.count > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header com perfil do DJ */}
      {meta?.djData && (
        <div className="relative h-48 mb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
          {meta.djData.background_image_url && (
            <img 
              src={meta.djData.background_image_url} 
              alt="" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 shadow-lg max-w-2xl w-full mx-4">
              {meta.djData.avatar_url && (
                <img 
                  src={meta.djData.avatar_url} 
                  alt={meta.djName} 
                  className="w-20 h-20 rounded-full object-cover border-4 border-background"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">{meta.djName}</h1>
                {meta.djData.genre && (
                  <p className="text-sm text-muted-foreground">{meta.djData.genre}</p>
                )}
              </div>
              <div className="flex gap-2">
                {meta.djData.instagram_url && (
                  <a href={meta.djData.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-md transition-colors">
                    <Icon name="Instagram" size={20} className="text-foreground" />
                  </a>
                )}
                {meta.djData.soundcloud_url && (
                  <a href={meta.djData.soundcloud_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-md transition-colors">
                    <Icon name="Music" size={20} className="text-foreground" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Mídias</h2>

        <div className="flex flex-wrap gap-2 mb-6">
          <p className="text-sm text-muted-foreground w-full mb-2">Galeria de Mídias</p>
          {categoriesWithCounts.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon name={category.icon} size={16} />
              <span>{category.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-background/20">
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {loadingMedia ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader" size={40} className="animate-spin text-primary" />
          </div>
        ) : currentFiles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentFiles.map((m) => (
              <div key={m.id} className="group relative">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {m.file_type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Play" size={32} className="text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={m.file_url}
                      alt={m.file_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        (e.currentTarget.nextSibling)?.classList?.remove('hidden');
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-muted flex items-center justify-center hidden">
                    <Icon name="Image" size={32} className="text-muted-foreground" />
                  </div>

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => window.open(m.file_url, '_blank')}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
                    >
                      <Icon name="ExternalLink" size={20} />
                    </button>
                    <button
                      onClick={() => mediaService.downloadFile(m.file_url, m.file_name)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
                    >
                      <Icon name="Download" size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon name="Image" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">Nenhuma mídia encontrada</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedMedia;
