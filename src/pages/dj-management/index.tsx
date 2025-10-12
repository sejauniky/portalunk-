import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Sidebar } from "@/components/layout/sidebar";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Headphones, Instagram, Music, Plus, Search, Youtube, Eye, Edit } from "lucide-react";

interface DJ {
  id: string;
  artist_name: string;
  real_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  genre?: string | null;
  base_price?: number | null;
  status?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  soundcloud_url?: string | null;
  birth_date?: string | null;
  is_active?: boolean | null;
}

type DJFormValues = Omit<Pick<
  DJ,
  | "artist_name"
  | "real_name"
  | "email"
  | "genre"
  | "base_price"
  | "instagram_url"
  | "youtube_url"
  | "tiktok_url"
  | "soundcloud_url"
  | "birth_date"
  | "status"
  | "is_active"
>, never>;

const getInitials = (name?: string | null) => {
  if (!name) return "DJ";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch (error) {
    console.error("Failed to format currency:", error);
    return null;
  }
};

const formatDateForInput = (value?: string | null) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const DJsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDJ, setSelectedDJ] = useState<DJ | null>(null);

  const {
    data: djs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DJ[], Error>({
    queryKey: ["djs"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("djs")
        .select("*")
        .order("artist_name", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data ?? [];
    },
  });

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedDJ(null);
    }
  };

  const createDJMutation = useMutation({
    mutationFn: async (payload: DJFormValues) => {
      // Convert status to match database enum if present
      const dbPayload: any = { ...payload };
      if (dbPayload.status && typeof dbPayload.status === 'string') {
        const statusMap: Record<string, string> = {
          'ativo': 'ativo',
          'inativo': 'inativo',
          'ocupado': 'ocupado',
          'active': 'ativo',
          'inactive': 'inativo',
          'busy': 'ocupado'
        };
        const normalizedStatus = dbPayload.status.toLowerCase();
        dbPayload.status = statusMap[normalizedStatus] || 'ativo';
      }
      
      const { data, error: insertError } = await supabase
        .from("djs")
        .insert([dbPayload])
        .select()
        .single<DJ>();

      if (insertError) {
        throw insertError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["djs"] });
      handleDialogChange(false);
      toast({ title: "DJ cadastrado com sucesso!" });
    },
    onError: (mutationError: unknown) => {
      const description = mutationError instanceof Error ? mutationError.message : "Não foi possível concluir o cadastro.";
      toast({
        title: "Erro ao cadastrar DJ",
        description,
        variant: "destructive",
      });
    },
  });

  const updateDJMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & DJFormValues) => {
      // Convert status to match database enum if present
      const dbPayload: any = { ...payload };
      if (dbPayload.status && typeof dbPayload.status === 'string') {
        const statusMap: Record<string, string> = {
          'ativo': 'ativo',
          'inativo': 'inativo',
          'ocupado': 'ocupado',
          'active': 'ativo',
          'inactive': 'inativo',
          'busy': 'ocupado'
        };
        const normalizedStatus = dbPayload.status.toLowerCase();
        dbPayload.status = statusMap[normalizedStatus] || 'ativo';
      }
      
      const { data, error: updateError } = await supabase
        .from("djs")
        .update(dbPayload)
        .eq("id", id)
        .select()
        .single<DJ>();

      if (updateError) {
        throw updateError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["djs"] });
      handleDialogChange(false);
      toast({ title: "DJ atualizado com sucesso!" });
    },
    onError: (mutationError: unknown) => {
      const description = mutationError instanceof Error ? mutationError.message : "Tente novamente mais tarde.";
      toast({
        title: "Erro ao atualizar DJ",
        description,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const parseBasePrice = () => {
      const basePrice = formData.get("base_price");
      if (!basePrice) {
        return null;
      }

      const numeric = Number(basePrice);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const birthRaw = formData.get("birth_date")?.toString().trim() || "";

    const payload: DJFormValues = {
      artist_name: (formData.get("artist_name")?.toString() ?? "").trim(),
      real_name: formData.get("real_name")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      genre: formData.get("genre")?.toString().trim() || null,
      base_price: parseBasePrice(),
      instagram_url: formData.get("instagram_url")?.toString().trim() || null,
      youtube_url: formData.get(
        "youtube_url",
      )?.toString().trim() || null,
      tiktok_url: formData.get("tiktok_url")?.toString().trim() || null,
      soundcloud_url: formData.get("soundcloud_url")?.toString().trim() || null,
      birth_date: birthRaw ? birthRaw : null,
      status: selectedDJ?.status ?? "Ativo",
      is_active: selectedDJ?.is_active ?? true,
    };

    if (selectedDJ) {
      updateDJMutation.mutate({ id: selectedDJ.id, ...payload });
    } else {
      createDJMutation.mutate({ ...payload, status: "Ativo", is_active: true });
    }
  };

  const filteredDJs = useMemo(() => {
    if (!searchTerm) {
      return djs;
    }

    const normalizedTerm = searchTerm.toLowerCase();

    return djs.filter((dj) => {
      const candidates = [dj.artist_name, dj.real_name, dj.genre, dj.email, dj.status];
      return candidates.some((value) => value?.toLowerCase?.().includes(normalizedTerm));
    });
  }, [djs, searchTerm]);

  const isSaving = createDJMutation.isPending || updateDJMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <Loading message="Carregando DJs..." className="min-h-[60vh]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 p-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
          <p className="text-lg font-semibold text-destructive">Não foi possível carregar os DJs.</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">

      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar DJs</h1>
            <p className="mt-1 text-muted-foreground">Cadastre e gerencie os DJs da assessoria</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setSelectedDJ(null)}
                className="bg-gradient-to-r from-neon-purple to-neon-blue text-white shadow-glow hover:opacity-95 border-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo DJ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedDJ ? "Editar DJ" : "Cadastrar Novo DJ"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="artist_name">Nome Artístico *</Label>
                    <Input
                      id="artist_name"
                      name="artist_name"
                      defaultValue={selectedDJ?.artist_name ?? ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="real_name">Nome Real</Label>
                    <Input id="real_name" name="real_name" defaultValue={selectedDJ?.real_name ?? ""} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={selectedDJ?.email ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" name="cpf" defaultValue={selectedDJ?.cpf ?? ""} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input id="birth_date" name="birth_date" type="date" defaultValue={formatDateForInput(selectedDJ?.birth_date ?? null)} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Gênero Musical</Label>
                    <Input id="genre" name="genre" defaultValue={selectedDJ?.genre ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Cachê Base (R$)</Label>
                    <Input
                      id="base_price"
                      name="base_price"
                      type="number"
                      step="0.01"
                      defaultValue={selectedDJ?.base_price?.toString() ?? ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input id="instagram_url" name="instagram_url" defaultValue={selectedDJ?.instagram_url ?? ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube URL</Label>
                  <Input id="youtube_url" name="youtube_url" defaultValue={selectedDJ?.youtube_url ?? ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok_url">TikTok URL</Label>
                  <Input id="tiktok_url" name="tiktok_url" defaultValue={selectedDJ?.tiktok_url ?? ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soundcloud_url">SoundCloud URL</Label>
                  <Input id="soundcloud_url" name="soundcloud_url" defaultValue={selectedDJ?.soundcloud_url ?? ""} />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={isSaving} disabled={isSaving}>
                    {selectedDJ ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, gênero..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDJs.map((dj) => {
            const statusLabel = dj.status ?? (dj.is_active ? "Ativo" : "Inativo");
            const formattedPrice = formatCurrency(dj.base_price);

            return (
              <Card key={dj.id} className="glass-card hover-lift">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={dj.avatar_url ?? undefined} alt={dj.artist_name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(dj.artist_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-lg">{dj.artist_name}</CardTitle>
                      {dj.real_name && <p className="truncate text-sm text-muted-foreground">{dj.real_name}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {dj.genre && (
                          <Badge variant="secondary" className="inline-flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {dj.genre}
                          </Badge>
                        )}
                        {statusLabel && (
                          <Badge variant={dj.is_active ? "default" : "outline"}>{statusLabel}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center space-x-2">
                    {dj.instagram_url && <Instagram className="h-4 w-4 text-pink-500" />}
                    {dj.youtube_url && <Youtube className="h-4 w-4 text-red-500" />}
                    {dj.tiktok_url && <Music className="h-4 w-4 text-cyan-400" />}
                    {dj.soundcloud_url && <Headphones className="h-4 w-4 text-orange-500" />}
                  </div>

                  {formattedPrice && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Cachê Base</p>
                      <p className="text-lg font-semibold text-foreground">{formattedPrice}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Link href={`/dj-profile/${dj.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="mr-1 h-4 w-4" />
                        Ver detalhes
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedDJ(dj);
                        handleDialogChange(true);
                      }}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDJs.length === 0 && (
          <div className="py-12 text-center">
            <Music className="mx-auto mb-4 h-16 w-16 opacity-50" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum DJ encontrado" : "Nenhum DJ cadastrado ainda"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DJsPage;
