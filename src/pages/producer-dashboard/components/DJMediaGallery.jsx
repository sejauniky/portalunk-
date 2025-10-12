import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/button';
import PillActionButton from '../../../components/ui/PillActionButton';
import { mediaService } from '../../../services/mediaService';
import { djService, storageService } from '../../../services/supabaseService';
import { useAuth } from '../../../hooks/use-auth';

const DJMediaGallery = ({ djId }) => {
  const { userProfile } = useAuth();
  const [mediaFiles, setMediaFiles] = useState({
    logo: [],
    presskit: [],
    backdrop: [],
    performance: [],
    video: [],
    audio: [],
    other: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('logo');
  const [djName, setDjName] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareGenerating, setShareGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const categories = [
    { id: 'logo', name: 'Logo', icon: 'Image' },
    { id: 'presskit', name: 'Presskit', icon: 'Camera' },
    { id: 'backdrop', name: 'Backdrop', icon: 'Monitor' },
    { id: 'performance', name: 'Performance', icon: 'Play' },
    { id: 'video', name: 'Vídeos', icon: 'Video' },
    { id: 'audio', name: 'Áudio', icon: 'Music' },
    { id: 'other', name: 'Outros', icon: 'File' }
  ];

  useEffect(() => {
    if (djId) {
      loadMediaFiles();
    }
  }, [djId]);

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      // Buscar o nome do DJ
      const djData = await djService.getById(djId);
      if (djData) {
        setDjName(djData.name || djData.artist_name || djData.real_name || '');

        // Buscar todas as mídias do DJ
        const { data: allMedia, error } = await mediaService.getDJMedia(djId);

        if (error) {
          toast.error('Erro ao carregar mídias');
          return;
        }

        // Agrupar por categoria
        const newMediaFiles = {
          logo: [],
          presskit: [],
          backdrop: [],
          performance: [],
          video: [],
          audio: [],
          other: []
        };

        (allMedia || []).forEach(media => {
          const category = media.file_category || 'other';
          if (newMediaFiles[category]) {
            newMediaFiles[category].push({
              id: media.id,
              name: media.file_name,
              url: media.file_url,
              size: media.file_size,
              type: media.file_type || category,
              description: media.description,
              updated_at: media.created_at,
              driveLink: media.metadata?.drive_link || null
            });
          }
        });

        setMediaFiles(newMediaFiles);

        // If current selected category is empty, pick first non-empty
        const firstNonEmpty = Object.keys(newMediaFiles).find(k => (newMediaFiles[k] || []).length > 0);
        if (firstNonEmpty && (newMediaFiles[selectedCategory] || []).length === 0) {
          setSelectedCategory(firstNonEmpty);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mídias:', error);
      toast?.error('Erro ao carregar mídias do DJ');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = (file) => {
    try {
      // Se for backdrop com link do Drive, abre o Drive
      if (file.type === 'backdrop' && file.driveLink) {
        window.open(file.driveLink, '_blank');
        toast.success('Redirecionado para o Google Drive');
        return;
      }
      mediaService.downloadFile(file.url, file.name);
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleDownloadAll = async () => {
    const files = mediaFiles[selectedCategory];
    if (files.length === 0) {
      toast.error('Nenhum arquivo encontrado nesta categoria');
      return;
    }

    try {
      for (const file of files) {
        await mediaService.downloadFile(file.url, file.name);
        // Pequeno delay entre downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      toast.success(`${files.length} arquivos preparados para download`);
    } catch (error) {
      toast.error('Erro ao baixar arquivos');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentFiles = mediaFiles[selectedCategory] || [];
  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: mediaFiles[cat.id]?.length || 0
  })).filter(cat => cat.count > 0);

  const sha256 = async (text) => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleGenerateShare = async (e) => {
    e?.preventDefault?.();
    if (!djId || !djName) return;
    if (!sharePassword || sharePassword.length < 4) {
      toast.error('Defina uma senha com pelo menos 4 caracteres');
      return;
    }
    setShareGenerating(true);
    try {
      const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const password_hash = await sha256(sharePassword);
      const payload = {
        token,
        djId,
        djName,
        producerId: userProfile?.id || null,
        createdAt: new Date().toISOString(),
        password_hash
      };
      const path = `links/${token}.json`;
      const { error } = await storageService.uploadJson('shared-links', path, payload);
      if (error) {
        toast.error(error);
        return;
      }
      const link = `${window.location.origin}/share/${token}`;
      setShareUrl(link);
      toast.success('Link gerado!');
    } catch (err) {
      toast.error('Falha ao gerar link');
    } finally {
      setShareGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Galeria de Mídia</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Icon name="Loader" size={48} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando mídias...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Galeria de Mídia {djName && `- ${djName}`}
        </h3>
        <div className="flex items-center gap-2">
          {currentFiles.length > 0 && (
            <Button
              onClick={handleDownloadAll}
              iconName="Download"
              iconPosition="left"
              variant="outline"
            >
              Baixar Tudo
            </Button>
          )}
          <PillActionButton
            onClick={() => setShowShareModal(true)}
            iconName="Share2"
            color="purple"
          >
            Compartilhar mídias
          </PillActionButton>
        </div>
      </div>

      {/* Folder Navigation */}
      <div className="flex space-x-2 bg-muted p-1 rounded-lg w-fit">
        {categoriesWithCounts.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={category.icon} size={16} />
            <span>{category.name}</span>
            <span className="text-xs bg-muted-foreground/20 px-2 py-0.5 rounded-full">
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {currentFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentFiles.map((file, index) => (
            <div key={index} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Preview */}
              <div className="aspect-square bg-muted flex items-center justify-center relative group">
                {file.type === 'backdrop' && file.driveLink ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/40 to-blue-900/40">
                    <Icon name="Video" size={32} className="text-white/60" />
                    <p className="text-xs text-white/60 mt-2">Google Drive</p>
                  </div>
                ) : file.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="Play" size={32} className="text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-muted flex items-center justify-center hidden">
                  <Icon name="Image" size={32} className="text-muted-foreground" />
                </div>
                
                {/* Action Buttons Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <Button
                    onClick={() => window.open(file.driveLink || file.url, '_blank')}
                    size="sm"
                    iconName="ExternalLink"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Ver
                  </Button>
                  <Button
                    onClick={() => handleDownloadFile(file)}
                    size="sm"
                    iconName={file.driveLink ? "ExternalLink" : "Download"}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    {file.driveLink ? 'Drive' : 'Baixar'}
                  </Button>
                </div>
              </div>

              {/* File Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {file.driveLink ? 'Google Drive' : file.type === 'video' ? 'Vídeo' : 'Imagem'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icon name="Image" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">
            Nenhuma mídia encontrada
          </h4>
          <p className="text-muted-foreground">
            {djName ? `Não há arquivos na categoria ${categories.find(c => c.id === selectedCategory)?.name} do DJ ${djName}` : 'Carregando informações do DJ...'}
          </p>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h4 className="text-lg font-semibold text-foreground">Compartilhar mídias</h4>
              <Button variant="ghost" size="sm" iconName="X" onClick={() => { setShowShareModal(false); setShareUrl(''); }} />
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">Crie um link protegido por senha para compartilhar as mídias do DJ.</p>
              <form onSubmit={handleGenerateShare} className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Senha do produtor</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" loading={shareGenerating} iconName="Link" iconPosition="left">
                  Gerar link
                </Button>
              </form>
              {shareUrl && (
                <div className="bg-muted rounded-md p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Link gerado:</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-2 py-2 text-sm bg-background border border-border rounded-md"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Link copiado');
                      }}
                      iconName="Copy"
                      iconPosition="left"
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DJMediaGallery;
