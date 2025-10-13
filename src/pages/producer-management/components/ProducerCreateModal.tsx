import React, { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface ProducerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProducerCreateModal = ({ isOpen, onClose, onSuccess }: ProducerCreateModalProps) => {
  const [formData, setFormData] = useState({
    contact_person: '',
    email_prefix: '',
    contact_phone: '',
    company_name: '',
    cnpj: '',
    address: '',
    zip_code: '',
    password: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contact_person.trim()) {
      toast.error('Pessoa para contato é obrigatório');
      return;
    }

    if (!formData.email_prefix.trim()) {
      toast.error('Prefixo do email é obrigatório');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    const rawEmailPrefix = formData.email_prefix.toLowerCase().trim();
    const sanitizedPrefix = rawEmailPrefix.replace(/[^a-z0-9.-]/g, '').replace(/(\.com)+$/g, '');

    if (!sanitizedPrefix) {
      toast.error('Prefixo do email inválido');
      return;
    }

    const loginAlias = `${sanitizedPrefix}@unk`;
    const supabaseEmail = `${loginAlias}.com`;

    // Validate CEP if provided
    if (formData.zip_code && !/^\d{5}-\d{3}$/.test(formatCep(formData.zip_code))) {
      toast.error('CEP inválido. Use o formato 00000-000');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.functions.invoke<{ user: { id: string } }>('create-producer-user', {
        body: {
          email: supabaseEmail,
          password: formData.password,
          user_metadata: {
            name: formData.contact_person,
            role: 'producer'
          }
        }
      });

      if (authError) {
        throw new Error(authError.message || 'Erro ao criar credenciais do produtor');
      }

      const userId = authData?.user?.id;

      if (!userId) {
        throw new Error('Falha ao criar usuário produtor');
      }

      // Upload avatar if selected
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}.${fileExt}`;
        const filePath = `producers/${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('company-avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          toast.error('Erro ao fazer upload da foto');
        } else {
          const { data: urlData } = supabase.storage
            .from('company-avatars')
            .getPublicUrl(filePath);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: formData.contact_person,
          email: supabaseEmail,
          phone: formData.contact_phone || null,
          avatar_url: avatarUrl,
          role: 'producer'
        });

      if (profileError) {
        try {
          await supabase.functions.invoke('delete-user', {
            body: { userId }
          });
        } catch (cleanupError) {
          console.error('Erro ao limpar usuário após falha no perfil:', cleanupError);
        }
        throw profileError;
      }

      // Create producer record
      const { error: producerError } = await supabase
        .from('producers')
        .insert({
          id: userId,
          contact_person: formData.contact_person,
          contact_phone: formData.contact_phone || null,
          company_name: formData.company_name || null,
          cnpj: formData.cnpj || null,
          address: formData.address || null,
          zip_code: formData.zip_code || null,
          avatar_url: avatarUrl,
          is_active: true
        });

      if (producerError) {
        try {
          await supabase.functions.invoke('delete-user', {
            body: { userId }
          });
        } catch (cleanupError) {
          console.error('Erro ao limpar usuário ap��s falha no produtor:', cleanupError);
        }
        throw producerError;
      }

      toast.success(`Produtor criado com sucesso! Login: ${loginAlias}`);
      setFormData({
        contact_person: '',
        email_prefix: '',
        contact_phone: '',
        company_name: '',
        cnpj: '',
        address: '',
        zip_code: '',
        password: '',
        confirmPassword: '',
      });
      setAvatarFile(null);
      setAvatarPreview('');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating producer:', error);
      toast.error(error.message || 'Erro ao criar produtor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-start sm:items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="glass-card rounded-3xl w-full max-w-2xl my-4 sm:my-8 shadow-glass animate-scale-in max-h-full sm:max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Icon name="UserPlus" size={24} className="text-primary" />
            Criar Novo Produtor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-lg transition-all hover:scale-105"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center p-4 border border-border/60 rounded-lg bg-muted/20">
            <div className="relative w-24 h-24 mb-3">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-full h-full rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <Icon name="User" size={32} className="text-muted-foreground" />
                </div>
              )}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                >
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
            <label className="cursor-pointer">
              <div className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm text-primary font-medium transition-colors flex items-center gap-2">
                <Icon name="Upload" size={16} />
                {avatarPreview ? 'Trocar Foto' : 'Adicionar Foto'}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={loading}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">Máximo 5MB - JPG, PNG ou GIF</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Pessoa para Contato"
              required
              value={formData.contact_person}
              onChange={(e) => handleChange('contact_person', e.target.value)}
              placeholder="João Silva"
              wrapperClassName="w-full"
            />

            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-foreground">Email de Login *</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  required
                  value={formData.email_prefix}
                  onChange={(e) => {
                    const sanitized = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9.-]/g, '')
                      .replace(/(\.com)+$/g, '');
                    handleChange('email_prefix', sanitized);
                  }}
                  placeholder="amuse"
                  wrapperClassName="flex-1 min-w-[160px]"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">@unk</span>
              </div>
              <p className="text-xs text-muted-foreground">Ex: amuse@unk</p>
            </div>

            <Input
              label="Telefone"
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="(11) 99999-9999"
              wrapperClassName="w-full"
            />

            <Input
              label="Empresa"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Nome da Empresa"
              wrapperClassName="w-full"
            />

            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              wrapperClassName="w-full"
            />

            <Input
              label="Endereço"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua, Número, Cidade - Estado"
              wrapperClassName="md:col-span-2"
            />

            <Input
              label="CEP"
              value={formData.zip_code}
              onChange={(e) => handleChange('zip_code', formatCep(e.target.value))}
              placeholder="00000-000"
              wrapperClassName="w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                wrapperClassName="w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
              </button>
            </div>

            <Input
              label="Confirmar Senha"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Digite a senha novamente"
              wrapperClassName="w-full"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {loading ? 'Criando...' : 'Criar Produtor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
