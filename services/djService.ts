import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatError } from '@/lib/errorUtils';

type DJ = Tables<'djs'>;
type DJInsert = TablesInsert<'djs'>;
type DJUpdate = TablesUpdate<'djs'>;

type DjMediaRecord = {
  id: string;
  file_url?: string | null;
  file_name?: string | null;
  file_path?: string | null;
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function slugify(value: string): string {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'dj';
}

function resolveFileExtension(file: File): string {
  const nameExt = (file.name || '').split('.').pop();
  if (nameExt && nameExt.trim()) {
    return nameExt.trim().toLowerCase();
  }
  const typeExt = (file.type || '').split('/').pop();
  if (typeExt && typeExt.trim()) {
    return typeExt.trim().toLowerCase();
  }
  return 'jpg';
}

function parseStoragePath(url?: string | null): string | null {
  if (!url) return null;
  const normalized = url.toString();
  const directPath = normalized.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (directPath) {
    const [, bucket, path] = directPath;
    if (bucket === 'dj-media' && path) {
      return path;
    }
    return path || null;
  }
  const publicPath = normalized.match(/storage\/v1\/.+?\/dj-media\/(.+)$/);
  if (publicPath && publicPath[1]) {
    return publicPath[1];
  }
  return null;
}

function resolveDjName(dj?: Partial<DJ> & { name?: string | null; profile_name?: string | null }): string {
  const resolved =
    dj?.artist_name ||
    dj?.real_name ||
    dj?.name ||
    dj?.profile_name ||
    '';
  const normalized = normalizeText(resolved);
  return normalized || 'DJ';
}

export class DJService {
  static async getAll(): Promise<DJ[]> {
    console.log('🎧 Buscando todos os DJs...');

    try {
      // Simplificando a query para evitar joins complexos
      const { data, error } = await supabase
        .from('djs')
        .select(`
          *,
          events!events_dj_id_fkey (
            id,
            event_date,
            status
          )
        `)
        .order('artist_name', { ascending: true });

      if (error) throw error;

      console.log('✅ DJs carregados:', data?.length ?? 0);
      return data || [];
    } catch (error) {
      const message = formatError(error);
      console.error('❌ Erro ao buscar DJs:', message, error);
      toast.error(message || 'Erro ao carregar DJs');
      return [];
    }
  }

  static async getById(id: string): Promise<DJ | null> {
    console.log('🔍 Buscando DJ por ID:', id);

    const { data, error } = await supabase
      .from('djs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar DJ:', error);
      return null;
    }

    return data;
  }

  static async create(djData: Omit<DJInsert, 'id' | 'created_at' | 'updated_at'>): Promise<DJ> {
    const nameForLog = (djData as { artist_name?: string; name?: string }).artist_name || (djData as { name?: string }).name || 'DJ';
    console.log('✨ Criando novo DJ:', nameForLog);

    try {
      const { data, error } = await supabase
        .from('djs')
        .insert(djData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar DJ:', error);
        toast.error('Erro ao criar DJ');
        throw error;
      }

      console.log('✅ DJ criado com sucesso:', data.id);
      toast.success('DJ criado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao criar DJ:', error);
      toast.error('Erro ao criar DJ');
      throw error;
    }
  }

  static async update(id: string, updates: DJUpdate): Promise<DJ> {
    console.log('📝 Atualizando DJ:', id);

    try {
      const { data, error } = await supabase
        .from('djs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar DJ:', error);
        toast.error('Erro ao atualizar DJ');
        throw error;
      }

      console.log('✅ DJ atualizado com sucesso');
      toast.success('DJ atualizado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar DJ:', error);
      toast.error('Erro ao atualizar DJ');
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    console.log('🗑️ Deletando DJ:', id);

    try {
      await this.deleteAllMedia(id);

      const { error } = await supabase
        .from('djs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar DJ:', error);
        toast.error('Erro ao deletar DJ');
        return false;
      }

      console.log('✅ DJ deletado com sucesso');
      toast.success('DJ deletado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao deletar DJ:', error);
      toast.error('Erro ao deletar DJ');
      return false;
    }
  }

  static async uploadProfileImage(djId: string, file: File): Promise<string | null> {
    console.log('📸 Fazendo upload da imagem de perfil do DJ:', djId);

    try {
      const { data: djData } = await supabase
        .from('djs')
        .select('artist_name, real_name')
        .eq('id', djId)
        .single();

      if (!djData) {
        toast.error('DJ não encontrado');
        return null;
      }

      const folderName = slugify(resolveDjName(djData));
      const fileExt = resolveFileExtension(file);
      const fileName = `${folderName}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dj-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('dj-media')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      await this.update(djId, { profile_image_url: publicUrl } as DJUpdate);

      console.log('✅ Upload da imagem concluído');
      toast.success('Imagem de perfil atualizada!');
      return publicUrl;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    }
  }

  static async deleteAllMedia(djId: string): Promise<void> {
    console.log('🗑️ Deletando todas as mídias do DJ:', djId);

    try {
      const [{ data: djData }, { data: mediaFiles }] = await Promise.all([
        supabase
          .from('djs')
          .select('artist_name, real_name')
          .eq('id', djId)
          .single(),
        (supabase as any)
          .from('dj_media')
          .select('id, file_url, file_name, file_path')
          .eq('dj_id', djId),
      ]);

      if (!mediaFiles || mediaFiles.length === 0) {
        return;
      }

      const folderName = slugify(resolveDjName(djData ?? undefined));
      const filesToDelete = new Set<string>();

      (mediaFiles as DjMediaRecord[]).forEach((media) => {
        const parsedPath = parseStoragePath(media.file_url);
        if (parsedPath) {
          filesToDelete.add(parsedPath);
          return;
        }

        if (media.file_path) {
          filesToDelete.add(media.file_path);
          return;
        }

        if (media.file_name) {
          filesToDelete.add(`${folderName}/${media.file_name}`);
        }
      });

      if (filesToDelete.size > 0) {
        const { error: removeError } = await supabase.storage
          .from('dj-media')
          .remove(Array.from(filesToDelete));

        if (removeError) {
          console.warn('⚠️ Falha ao remover arquivos do storage:', removeError);
        }
      }

      const { error: deleteError } = await (supabase as any)
        .from('dj_media')
        .delete()
        .eq('dj_id', djId);

      if (deleteError) {
        console.warn('⚠️ Falha ao deletar registros de mídia:', deleteError);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar mídias:', error);
    }
  }

  static async getActiveByGenre(genres: string[]): Promise<DJ[]> {
    console.log('🎵 Buscando DJs ativos por gênero:', genres);

    const sanitizedGenres = (genres || []).map((genre) => genre.trim()).filter(Boolean);

    try {
      let query = supabase
        .from('djs')
        .select('*')
        .eq('is_active', true);

      if (sanitizedGenres.length > 0) {
        query = (query as any).overlaps('musical_genres', sanitizedGenres);
      }

      const { data, error } = await query.order('artist_name', { ascending: true });

      if (error) {
        console.warn('⚠️ Filtro por "musical_genres" falhou, aplicando fallback local:', error);
        const fallback = await supabase
          .from('djs')
          .select('*')
          .eq('is_active', true)
          .order('artist_name', { ascending: true });

        if (fallback.error) {
          const message = formatError(fallback.error);
          console.error('❌ Erro ao buscar DJs por gênero:', message, fallback.error);
          throw new Error(message);
        }

        if (sanitizedGenres.length === 0) {
          return fallback.data || [];
        }

        return (fallback.data || []).filter((dj) => {
          const genreField = (dj as Record<string, unknown>).musical_genres ?? dj.genre;
          if (!genreField) return false;
          if (Array.isArray(genreField)) {
            const normalized = genreField.map((item) => String(item).trim().toLowerCase());
            return sanitizedGenres.some((genre) => normalized.includes(genre.toLowerCase()));
          }
          if (typeof genreField === 'string') {
            const parts = genreField.split(/[,;/|]/).map((part) => part.trim().toLowerCase()).filter(Boolean);
            return sanitizedGenres.some((genre) => parts.includes(genre.toLowerCase()));
          }
          return false;
        }) as DJ[];
      }

      return data || [];
    } catch (error) {
      const message = formatError(error);
      console.error('❌ Erro ao buscar DJs por gênero:', message, error);
      throw new Error(message);
    }
  }

  static async toggleActive(id: string): Promise<boolean> {
    console.log('🔄 Alternando status ativo do DJ:', id);

    try {
      const { data: currentDJ, error } = await supabase
        .from('djs')
        .select('id, is_active')
        .eq('id', id)
        .maybeSingle();

      if (error || !currentDJ) {
        console.error('❌ DJ não encontrado ou erro ao buscar status:', error);
        toast.error('DJ não encontrado');
        return false;
      }

      const newStatus = !currentDJ.is_active;
      await this.update(id, { is_active: newStatus } as DJUpdate);

      toast.success(`DJ ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao alternar status:', error);
      toast.error('Erro ao alterar status do DJ');
      return false;
    }
  }
}

// Export a service object compatible with GenericService interface
export const djServiceWrapper = {
  __serviceName: 'DJService',
  getAll: DJService.getAll.bind(DJService),
  getById: DJService.getById.bind(DJService),
  create: DJService.create.bind(DJService),
  update: DJService.update.bind(DJService),
  delete: DJService.delete.bind(DJService),
  uploadProfileImage: DJService.uploadProfileImage.bind(DJService),
  deleteAllMedia: DJService.deleteAllMedia.bind(DJService),
  getActiveByGenre: DJService.getActiveByGenre.bind(DJService),
  toggleActive: DJService.toggleActive.bind(DJService),
};
