import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Producer = Tables<'producers'>;
type ProducerUpdate = TablesUpdate<'producers'>;

export class ProducerService {
  static async getAll(): Promise<Producer[]> {
    console.log('🏢 Buscando todos os produtores...');

    const { data, error } = await supabase
      .from('producers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Erro ao buscar produtores:', error);
      throw error;
    }

    console.log('✅ Produtores carregados:', data?.length);
    return data || [];
  }

  static async getById(id: string): Promise<Producer | null> {
    console.log('🔍 Buscando produtor por ID:', id);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'producer')
      .single();

    if (error) {
      console.error('❌ Erro ao buscar produtor:', error);
      return null;
    }

    return data as unknown as Producer | null;
  }

  static async create(
    producerData: {
      name: string;
      email: string;
      phone?: string;
      company_name?: string;
      company_document?: string;
      address?: string;
      city?: string;
      state?: string;
      contact_person?: string;
    },
    password: string
  ): Promise<{ producer: Producer; credentials: { email: string; password: string } }> {
    const fullEmail = producerData.email.endsWith('.com') ? producerData.email : `${producerData.email}.com`;

    console.log('✨ Criando novo produtor:', fullEmail);

    try {
      const { data: authData, error: authError } = await supabase.functions.invoke('create-producer-user', {
        body: {
          email: fullEmail,
          password,
          user_metadata: {
            name: producerData.name,
            role: 'producer'
          }
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar usuário:', authError);
        throw new Error('Erro ao criar credenciais do usuário');
      }

      const userId = (authData as { user: { id: string } }).user.id;

      const { data: producer, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: producerData.name,
          email: fullEmail,
          phone: producerData.phone,
          role: 'producer'
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Erro ao criar perfil do produtor:', profileError);
        try {
          await supabase.functions.invoke('delete-user', {
            body: { userId }
          });
        } catch (cleanupError) {
          console.error('❌ Erro ao limpar usuário após falha:', cleanupError);
        }
        throw new Error('Erro ao criar perfil do produtor');
      }

      console.log('✅ Produtor criado com sucesso:', (producer as unknown as Producer).id);
      toast.success('Produtor criado com sucesso!');

      return {
        producer: producer as unknown as Producer,
        credentials: {
          email: producerData.email,
          password
        }
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar produtor:', error);
      toast.error(error.message || 'Erro ao criar produtor');
      throw error;
    }
  }

  static async update(id: string, updates: ProducerUpdate): Promise<Producer> {
    console.log('📝 Atualizando produtor (edge function):', id);

    const { data, error } = await supabase.functions.invoke('update-producer', {
      body: {
        producerId: id,
        updates,
      },
    });

    if (error) {
      console.error('❌ Erro ao atualizar produtor:', error);
      toast.error('Erro ao atualizar produtor');
      throw error;
    }

    const updated = (data as any)?.producer ?? (data as any);

    console.log('✅ Produtor atualizado com sucesso');
    toast.success('Produtor atualizado com sucesso!');
    return updated as Producer;
  }

  static async updatePassword(producerId: string, newPassword: string): Promise<boolean> {
    console.log('🔁 Atualizando senha do produtor:', producerId);

    try {
      const { data: producer, error: producerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', producerId)
        .eq('role', 'producer')
        .single();

      if (producerError || !producer) {
        console.error('❌ Produtor não encontrado:', producerError);
        toast.error('Produtor não encontrado');
        return false;
      }

      const { error: updateError } = await supabase.functions.invoke('update-user-password', {
        body: {
          userId: (producer as { id: string }).id,
          newPassword,
        }
      });

      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError);
        toast.error('Erro ao atualizar senha');
        return false;
      }

      console.log('✅ Senha atualizada com sucesso para:', (producer as { full_name?: string }).full_name);
      toast.success('Senha atualizada com sucesso!');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha');
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    console.log('🗑️ Deletando produtor:', id);

    try {
      const { data: producer, error: producerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', id)
        .eq('role', 'producer')
        .single();

      if (producerError || !producer) {
        console.error('❌ Produtor não encontrado:', producerError);
        toast.error('Produtor não encontrado');
        return false;
      }

      const { error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: (producer as { id: string }).id
        }
      });

      if (deleteError) {
        console.error('❌ Erro ao deletar usuário:', deleteError);
        toast.error('Erro ao deletar produtor');
        return false;
      }

      console.log('✅ Produtor deletado com sucesso:', (producer as { full_name?: string }).full_name);
      toast.success('Produtor deletado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao deletar produtor:', error);
      toast.error('Erro ao deletar produtor');
      return false;
    }
  }

  static async generateRandomPassword(): Promise<string> {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  static async uploadAvatar(producerId: string, file: File): Promise<string> {
    console.log('📷 Fazendo upload do avatar do produtor:', producerId);

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${producerId}.${fileExtension}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('producer-avatar')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw new Error('Erro ao fazer upload da imagem');
      }

      const { data: urlData } = supabase.storage
        .from('producer-avatar')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', producerId);

      if (updateError) {
        console.error('❌ Erro ao atualizar URL do avatar:', updateError);
        console.warn('Avatar enviado mas não foi possível atualizar o perfil');
      }

      console.log('✅ Avatar enviado com sucesso:', avatarUrl);
      toast.success('Foto de perfil atualizada!');

      return avatarUrl;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload do avatar:', error);
      toast.error('Erro ao fazer upload da imagem');
      throw error;
    }
  }
}
