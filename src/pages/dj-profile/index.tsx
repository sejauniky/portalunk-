import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Loading } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Save,
  Mail,
  MapPin,
  Music,
  Instagram,
  Youtube,
  Phone,
  Headphones,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  Video,
  Camera,
  FileText,
  Trash2,
  Eye,
  TrendingUp,
  ExternalLink,
  Upload,
} from "lucide-react";

import React, { useState, useMemo, useCallback, useRef, useEffect, type ChangeEvent, type ReactNode } from "react";
import { MediaUpload } from "./MediaUpload";
import ImageCropDialog from "@/components/ui/ImageCropDialog";

interface DJ {
  id: string;
  artist_name: string | null;
  real_name: string | null;
  email: string | null;
  whatsapp: string | null;
  base_price: number | null;
  status: string | null;
  soundcloud_url: string | null;
  portifolio_url: string | null;
  birth_date: string | null;
  cpf: string | null;
  location: string | null;
  pix_key: string | null;
  rider_requirements: string | null;
  genre: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  spotify_url: string | null;
  avatar_url: string | null;
  background_image_url: string | null;
 
}

interface MediaFile {
  id: string;
  dj_id: string;
  file_name: string;
  file_url: string;
  file_type: "image" | "video" | "document" | string;
  file_size: number | null;
  file_category?: string | null;
  created_at?: string | null;
  metadata?: {
    drive_link?: string;
  } | null;
}

interface EventRecord {
  id: string;
  event_name?: string | null;
  event_date?: string | null;
  status?: string | null;
  fee?: number | null;
  payment_status?: string | null;
  event_dj_fee?: number | null;
}

interface EventDjRelation {
  event_id: string;
  fee: number | null;
  payment_status?: string | null;
}

type DJUpdatePayload = {
  artist_name: string;
  real_name?: string | null;
  email?: string | null;
  genre?: string | null;
  base_price?: number | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  soundcloud_url?: string | null;
  whatsapp?: string | null;
  location?: string | null;
  pix_key?: string | null;
  birth_date?: string | null;
  portifolio_url?: string | null;
  avatar_url?: string | null;
  background_image_url?: string | null;
};

interface MetricCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  icon: typeof Calendar;
  className?: string;
  accent?: string;
  valueClassName?: string;
}

const DJ_PROFILE_BUCKET = "dj-media";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const formatDateForInput = (value?: string | null) => {
  if (!value) return "";

  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    return parsed.toISOString().split("T")[0] ?? "";
  } catch (error) {
    console.error("Failed to format date for input", error);
    return "";
  }
};

const getFileExtension = (file: File) => {
  const fromName = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "");
  if (fromName && fromName.length > 0) {
    return fromName.toLowerCase();
  }

  const fromType = file.type.split("/").pop()?.replace(/[^a-zA-Z0-9]/g, "");
  if (fromType && fromType.length > 0) {
    return fromType.toLowerCase();
  }

  return "jpg";
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "R$ 0,00";
  }

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  } catch (error) {
    console.error("Currency formatting failed", error);
    return "R$ 0,00";
  }
};

const formatFileSize = (value?: number | null) => {
  if (!value || value <= 0) return "-";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatted = unitIndex === 0 ? Math.round(size).toString() : size.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch (error) {
    console.error("Date formatting failed", error);
    return "-";
  }
};

const getInitials = (name?: string | null) => {
  if (!name) return "DJ";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .trim() || "DJ";
};

const MetricCard = ({ title, value, description, icon: Icon, className, accent = "#7f5cf7", valueClassName }: MetricCardProps) => (
  <Card
    className={cn(
      "relative overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_30px_90px_-55px_rgba(0,0,0,0.65)]",
      className,
    )}
  >
    <div
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{ background: `radial-gradient(circle at top right, ${accent}33, transparent 65%)` }}
    />
    <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-white/70">{title}</CardTitle>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white"
        style={{ color: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className={cn("text-2xl font-bold text-white", valueClassName)}>{value}</div>
      {description && <p className="text-xs text-white/60">{description}</p>}
    </CardContent>
  </Card>
);

const commissionRate = 15;

const DJsProfile = () => {
  const [, params] = useRoute("/dj-profile/:djId");
  const djId = (params as { djId?: string })?.djId ?? null;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "agenda" | "financial" | "media">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [mediaBeingDeleted, setMediaBeingDeleted] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const backdropInputRef = useRef<HTMLInputElement | null>(null);

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<"avatar" | "backdrop" | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const clearAvatarSelection = useCallback(() => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
  }, [avatarPreview]);

  const clearBackdropSelection = useCallback(() => {
    if (backdropPreview) {
      URL.revokeObjectURL(backdropPreview);
    }
    setBackdropPreview(null);
    setBackdropFile(null);
  }, [backdropPreview]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem para a foto de perfil.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast({ title: "Imagem muito grande", description: "A foto de perfil deve ter até 5MB.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    setCropTarget("avatar");
    setCropFile(file);
    setIsCropOpen(true);
    event.target.value = "";
  };

  const handleBackdropChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem para o fundo.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast({ title: "Imagem muito grande", description: "A imagem de fundo deve ter até 5MB.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    setCropTarget("backdrop");
    setCropFile(file);
    setIsCropOpen(true);
    event.target.value = "";
  };

  const {
    data: dj,
    isPending: isDjLoading,
    isError: hasDjError,
    error: djError,
  } = useQuery<DJ | null, Error>({
    queryKey: ["dj", djId],
    enabled: Boolean(djId),
    queryFn: async () => {
      const { data, error } = await supabase.from("djs").select("*").eq("id", djId).single<DJ>();
      if (error) throw error;
      return data;
    },
  });

  const {
    data: media = [],
    isPending: isMediaLoading,
  } = useQuery<MediaFile[], Error>({
    queryKey: ["dj-media", djId],
    enabled: Boolean(djId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("dj_id", djId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as MediaFile[]) ?? [];
    },
  });

  const {
    data: events = [],
    isPending: isEventsLoading,
  } = useQuery<EventRecord[], Error>({
    queryKey: ["dj-events", djId],
    enabled: Boolean(djId),
    queryFn: async () => {
      const { data: directEvents, error: directError } = await supabase
        .from("events")
        .select("*")
        .eq("dj_id", djId)
        .order("event_date", { ascending: false });
      if (directError) throw directError;

      const { data: eventDjs, error: eventDjsError } = await supabase
        .from("event_djs")
        .select("event_id, fee")
        .eq("dj_id", djId);
      if (eventDjsError) throw eventDjsError;

      const typedEventDjs = (eventDjs as EventDjRelation[]) ?? [];

      if (typedEventDjs.length === 0) {
        return (directEvents as EventRecord[]) ?? [];
      }

      const eventIds = typedEventDjs.map((item) => item.event_id);
      const { data: relatedEvents, error: relatedEventsError } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .order("event_date", { ascending: false });
      if (relatedEventsError) throw relatedEventsError;

      const eventsWithFee = (relatedEvents as EventRecord[]).map((event) => {
        const feeInfo = typedEventDjs.find((item) => item.event_id === event.id);
        return {
          ...event,
          event_dj_fee: feeInfo?.fee ?? null,
        };
      });

      const mergedEvents = [...((directEvents as EventRecord[]) ?? []), ...eventsWithFee].map((event) => ({
        ...event,
        payment_status: event.payment_status ?? null,
      }));
      const uniqueEvents = mergedEvents.filter(
        (event, index, self) => index === self.findIndex((candidate) => candidate.id === event.id),
      );
      return uniqueEvents;
    },
  });

  const updateDJMutation = useMutation<DJ, Error, DJUpdatePayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from("djs")
        .update(payload)
        .eq("id", djId)
        .select()
        .single<DJ>();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dj", djId] });
      setIsEditing(false);
      toast({ title: "Perfil atualizado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar DJ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const deleteMediaMutation = useMutation<void, Error, string>({
    mutationFn: async (mediaId) => {
      const { error } = await supabase.from("media_files").delete().eq("id", mediaId);
      if (error) throw error;
    },
    onMutate: (mediaId) => {
      setMediaBeingDeleted(mediaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dj-media", djId] });
      toast({ title: "Mídia excluída" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir mídia",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setMediaBeingDeleted(null);
    },
  });

  const handleGoBack = () => {
    setLocation("/dj-management");
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!djId) return;

    const formData = new FormData(event.currentTarget);

    const toNullableString = (value: FormDataEntryValue | null) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const basePriceRaw = formData.get("base_price");
    const basePriceValue = typeof basePriceRaw === "string" ? Number(basePriceRaw) : Number.NaN;

    const payload: DJUpdatePayload = {
      artist_name: (formData.get("artist_name")?.toString() ?? "").trim(),
      real_name: toNullableString(formData.get("real_name")),
      email: toNullableString(formData.get("email")),
      genre: toNullableString(formData.get("genre")),
      base_price: Number.isFinite(basePriceValue) ? basePriceValue : null,
      instagram_url: toNullableString(formData.get("instagram_url")),
      youtube_url: toNullableString(formData.get("youtube_url")),
      tiktok_url: toNullableString(formData.get("tiktok_url")),
      soundcloud_url: toNullableString(formData.get("soundcloud_url")),
      birth_date: toNullableString(formData.get("birth_date")),
    };

    updateDJMutation.mutate(payload);
  };

  const totalEvents = events.length;
  const completedEvents = events.filter((event) =>
    /concluido|confirmado/i.test(event.status ?? ""),
  ).length;
  const totalRevenue = events.reduce((sum, event) => {
    const feeValue = Number(event.event_dj_fee ?? event.fee ?? 0);
    return Number.isFinite(feeValue) ? sum + feeValue : sum;
  }, 0);
  const netEarnings = totalRevenue * (1 - commissionRate / 100);
  const pendingPayments = events.filter((event) =>
    /pendente|pending/i.test(event.payment_status ?? ""),
  );

  const paidPayments = events.filter((event) => /pago|paid/i.test(event.payment_status ?? ""));

  const categorizedMedia = useMemo(() => {
    const groups = {
      logo: [] as MediaFile[],
      presskit: [] as MediaFile[],
      backdrop: [] as MediaFile[],
      audios: [] as MediaFile[],
      outros: [] as MediaFile[],
    };

    media.forEach((item) => {
      const category = item.file_category?.toLowerCase();
      const fileType = item.file_type?.toLowerCase();

      if (category === "logo") {
        groups.logo.push(item);
        return;
      }

      if (category === "presskit" || category === "documentos") {
        groups.presskit.push(item);
        return;
      }

      if (category === "backdrop") {
        groups.backdrop.push(item);
        return;
      }

      if (category === "audios" || category === "audio") {
        groups.audios.push(item);
        return;
      }

      if (category === "fotos") {
        if (fileType === "audio") {
          groups.audios.push(item);
        } else {
          groups.outros.push(item);
        }
        return;
      }

      if (category === "video") {
        groups.outros.push(item);
        return;
      }

      if (fileType === "audio") {
        groups.audios.push(item);
        return;
      }

      if (fileType === "image") {
        groups.outros.push(item);
        return;
      }

      groups.outros.push(item);
    });

    return groups;
  }, [media]);

  const { logo, presskit, backdrop, audios, outros } = categorizedMedia;

  const renderImageGrid = (items: MediaFile[], gridClass = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4") => (
    <div className={gridClass}>
      {items.map((item) => {
        const driveLink = item.metadata?.drive_link;
        const isBackdrop = item.file_category === "backdrop";
        
        return (
          <div key={item.id} className="group relative overflow-hidden rounded-xl border border-border/60">
            {isBackdrop && driveLink ? (
              <div className="relative h-40 w-full bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center">
                <Video className="h-12 w-12 text-white/60" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-white/80 truncate">{item.file_name}</p>
                  <p className="text-xs text-purple-300">Via Google Drive</p>
                </div>
              </div>
            ) : (
              <img src={item.file_url} alt={item.file_name} className="h-40 w-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full bg-white/15 text-white transition hover:bg-white/25"
                asChild
              >
                <a href={driveLink || item.file_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" />
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full bg-white/15 text-white transition hover:bg-white/25"
                loading={mediaBeingDeleted === item.id && deleteMediaMutation.isPending}
                onClick={() => deleteMediaMutation.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDocumentList = (items: MediaFile[]) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.id} className="group relative overflow-hidden rounded-xl border border-border/60">
          <img 
            src={item.file_url} 
            alt={item.file_name} 
            className="h-32 w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = parent.querySelector('.fallback-icon');
                if (fallback instanceof HTMLElement) {
                  fallback.style.display = 'flex';
                }
              }
            }}
          />
          <div className="fallback-icon hidden h-32 w-full items-center justify-center bg-white/10">
            <FileText className="h-8 w-8 text-white/60" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full bg-white/15 text-white transition hover:bg-white/25"
              asChild
            >
              <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4" />
              </a>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full bg-white/15 text-white transition hover:bg-white/25"
              loading={mediaBeingDeleted === item.id && deleteMediaMutation.isPending}
              onClick={() => deleteMediaMutation.mutate(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAudioList = (items: MediaFile[]) => (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="space-y-3 rounded-lg border border-border/60 bg-background/80 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{item.file_name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                asChild
              >
                <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" />
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                loading={mediaBeingDeleted === item.id && deleteMediaMutation.isPending}
                onClick={() => deleteMediaMutation.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <audio controls src={item.file_url} className="w-full rounded-lg bg-black/40" />
        </div>
      ))}
    </div>
  );

  const renderOutrosList = (items: MediaFile[]) => (
    <div className="space-y-3">
      {items.map((item) => {
        const isImage = item.file_type === "image";
        const isVideo = item.file_type === "video";

        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/80 p-4"
          >
            <div className="flex items-center gap-3">
              {isImage ? (
                <img src={item.file_url} alt={item.file_name} className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-white/80">
                  {isVideo ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">{item.file_name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                asChild
              >
                <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" />
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                loading={mediaBeingDeleted === item.id && deleteMediaMutation.isPending}
                onClick={() => deleteMediaMutation.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const uploadCropped = async (target: "avatar" | "backdrop", blob: Blob) => {
    if (!djId) return;
    try {
      setIsSaving(true);
      const filePath = `${djId}/${target}/${target}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from(DJ_PROFILE_BUCKET).upload(filePath, blob, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(DJ_PROFILE_BUCKET).getPublicUrl(filePath);
      const publicUrl = pub?.publicUrl;
      const updatePayload: Partial<DJUpdatePayload> = target === "avatar" ? { avatar_url: publicUrl } : { background_image_url: publicUrl };
      const { error: updErr } = await supabase.from("djs").update(updatePayload).eq("id", djId);
      if (updErr) throw updErr;
      queryClient.invalidateQueries({ queryKey: ["dj", djId] });
      toast({ title: target === "avatar" ? "Foto de perfil atualizada" : "Imagem de fundo atualizada" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar imagem", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!djId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="py-10 text-center">
            <p className="mb-4 text-muted-foreground">DJ não encontrado.</p>
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDjLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loading message="Carregando perfil do DJ..." />
      </div>
    );
  }

  if (hasDjError || !dj) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="py-10 text-center">
            <p className="mb-4 text-muted-foreground">
              {hasDjError ? djError?.message ?? "Não foi possível carregar o perfil." : "DJ não encontrado."}
            </p>
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
      <Button
        variant="ghost"
        className="mb-6 w-fit rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10"
        onClick={handleGoBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f1f]/95 shadow-[0_35px_120px_-45px_rgba(107,63,247,0.65)]">
          <div
            className="absolute inset-0 opacity-65"
            style={{
              backgroundImage: dj.background_image_url ? `url(${dj.background_image_url})` : dj.avatar_url ? `url(${dj.avatar_url})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: dj.background_image_url || dj.avatar_url ? "blur(4px)" : undefined,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/65 to-background" />

          <div className="relative flex flex-col gap-6 p-8 lg:flex-row lg:items-center">
            <Avatar className="h-32 w-32 border-4 border-white/20 shadow-[0_12px_35px_rgba(8,15,35,0.55)]">
              <AvatarImage
                className="object-cover object-center"
                src={dj.avatar_url ?? undefined}
                alt={dj.artist_name ?? undefined}
              />
              <AvatarFallback className="bg-[#20183a] text-3xl font-semibold text-[#a685ff]">
                {getInitials(dj.artist_name ?? dj.real_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-5">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-[rgba(197,156,255,1)] drop-shadow-[0_12px_40px_rgba(127,92,247,0.55)]">
                  {dj.artist_name ?? "DJ"}
                </h1>
                <p className="text-lg text-white/80">{dj.real_name ?? "-"}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {dj.genre && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-purple-500/15 text-purple-200">
                    <Music className="h-3 w-3" />
                    {dj.genre}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-white/70">
                {dj.email && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                    <Mail className="h-4 w-4 text-[#7f5cf7]" />
                    {dj.email}
                  </span>
                
                )}
                {dj.whatsapp && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    {dj.whatsapp}
                  </span>
                )}
                {dj.location && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                    <MapPin className="h-4 w-4 text-sky-400" />
                    {dj.location}
                </span>
                   )}
                {dj.pix_key && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-white/80">
                    PIX: {dj.pix_key}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {dj.instagram_url && (
                  <a
                    href={dj.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-4 py-2 text-sm text-pink-400 transition hover:bg-pink-500/20"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                )}
                {dj.youtube_url && (
                  <a
                    href={dj.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
                  >
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </a>
                )}
                {dj.tiktok_url && (
                  <a
                    href={dj.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition border bg-[rgba(0,42,54,0.91)] border-[rgba(132,94,234,0.4)] text-[rgba(134,95,248,0.81)] hover:bg-[rgba(0,42,54,0.91)]"
                  >
                    <Music className="h-4 w-4 text-[rgba(134,95,248,1)]" />
                    TikTok
                  </a>
              )}
                 {dj.spotify_url && (
                  <a
                    href={dj.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition border bg-[rgba(0,42,54,0.91)] border-[rgba(132,94,234,0.4)] text-[rgba(134,95,248,0.81)] hover:bg-[rgba(0,42,54,0.91)]"
                  >
                    <Music className="h-4 w-4 text-[rgba(134,95,248,1)]" />
                    Spotify
                </a>
                  )}
                {(dj.soundcloud_url ?? dj.soundcloud) && (
                  <a
                    href={dj.soundcloud_url ?? dj.soundcloud ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm text-orange-300 transition hover:bg-orange-500/20"
                  >
                    <Headphones className="h-4 w-4" />
                    SoundCloud
                  </a>
                )}
                {dj.portifolio_url && (
                  <a
                    href={dj.portifolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm text-sky-300 transition hover:bg-sky-500/20"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Portfolio
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <input ref={backdropInputRef} type="file" accept="image/*" className="hidden" onChange={handleBackdropChange} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    className="bg-black/60 px-6 py-2 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition hover:bg-black/80"
                  >
                    <p>Editar</p>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); avatarInputRef.current?.click(); }}>
                    Alterar foto de perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); backdropInputRef.current?.click(); }}>
                    Alterar imagem de fundo
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsEditDialogOpen(true); }}>
                    Editar dados do perfil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total de Eventos"
            value={totalEvents}
            description={`${completedEvents} realizados`}
            icon={Calendar}
       
          />
          <MetricCard
            title="Ganhos Líquidos"
            value={formatCurrency(netEarnings)}
            description={`Após comissão UNK (${commissionRate}% )`}
            icon={TrendingUp}
            accent="#60a5fa"
            valueClassName="text-sky-300"
          />
          <MetricCard
            title="Mídias"
            value={media.length}
            description="Arquivos cadastrados"
            icon={ImageIcon}
            accent="#fbbf24"
            valueClassName="text-amber-300"
          />
        </div>

        <Card className="border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_40px_120px_-60px_rgba(0,0,0,0.7)]">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-4 rounded-2xl border border-white/10 bg-black/30 p-1">
                <TabsTrigger
                  value="overview"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white/60 transition data-[state=active]:bg-black/80 data-[state=active]:text-white data-[state=active]:shadow-[0_12px_30px_-18px_rgba(127,92,247,0.55)]"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="agenda"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white/60 transition data-[state=active]:bg-black/80 data-[state=active]:text-white data-[state=active]:shadow-[0_12px_30px_-18px_rgba(63,188,255,0.5)]"
                >
                  Eventos
                </TabsTrigger>
                <TabsTrigger
                  value="financial"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white/60 transition data-[state=active]:bg-black/80 data-[state=active]:text-white data-[state=active]:shadow-[0_12px_30px_-18px_rgba(72,187,120,0.5)]"
                >
                  Financeiro
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white/60 transition data-[state=active]:bg-black/80 data-[state=active]:text-white data-[state=active]:shadow-[0_12px_30px_-18px_rgba(251,191,36,0.45)]"
                >
                  Mídias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 p-6">
                <div className="grid gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Informações Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">Nome Real</Label>
                        <p className="text-lg font-medium text-foreground">{dj.real_name ?? "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="text-lg font-medium text-foreground">{dj.email ?? "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Data de Nascimento</Label>
                        <p className="text-lg font-medium text-foreground">{formatDate(dj.birth_date)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">WhatsApp</Label>
                        <p className="text-lg font-medium text-foreground">{dj.whatsapp ?? "-"}</p>
                      </div>
                    <div>
                      <Label className="text-muted-foreground">CPF</Label>
                        <p className="text-lg font-medium text-foreground">{dj.cpf ?? "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Localização</Label>
                        <p className="text-lg font-medium text-foreground">{dj.location ?? "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Cachê Base</Label>
                        <p className="text-lg font-medium text-foreground">{formatCurrency(dj.base_price)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Chave PIX</Label>
                        <p className="text-lg font-medium text-foreground">{dj.pix_key ?? "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="agenda" className="p-6">
                {isEditing ? (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Editar Informações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="artist_name">Nome Artístico</Label>
                            <Input id="artist_name" name="artist_name" defaultValue={dj.artist_name ?? ""} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="real_name">Nome Real</Label>
                            <Input id="real_name" name="real_name" defaultValue={dj.real_name ?? ""} />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={dj.email ?? ""} />
                          </div>
                             </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="birth_date">Data de Nascimento</Label>
                            <Input id="birth_date" name="birth_date" type="date" defaultValue={formatDateForInput(dj.birth_date)} />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="genre">Gênero Musical</Label>
                            <Input id="genre" name="genre" defaultValue={dj.genre ?? ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="base_price">Cachê Base (R$)</Label>
                            <Input
                              id="base_price"
                              name="base_price"
                              type="number"
                              step="0.01"
                              defaultValue={dj.base_price ?? undefined}
                            />
                          </div>
                        </div>
                    
                        <div className="space-y-2">
                          <Label htmlFor="instagram_url">Instagram URL</Label>
                          <Input id="instagram_url" name="instagram_url" defaultValue={dj.instagram_url ?? ""} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="youtube_url">YouTube URL</Label>
                          <Input id="youtube_url" name="youtube_url" defaultValue={dj.youtube_url ?? ""} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tiktok_url">TikTok URL</Label>
                          <Input id="tiktok_url" name="tiktok_url" defaultValue={dj.tiktok_url ?? ""} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="soundcloud_url">SoundCloud URL</Label>
                          <Input
                            id="soundcloud_url"
                            name="soundcloud_url"
                            defaultValue={dj.soundcloud_url ?? dj.soundcloud ?? ""}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            loading={updateDJMutation.isPending}
                            disabled={updateDJMutation.isPending}
                            className="rounded-full bg-[#7f5cf7] px-6 py-2 text-sm font-semibold text-white shadow-[0_18px_45px_-20px_rgba(127,92,247,0.75)] transition hover:bg-[#6d4ee3]"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Próximos Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEventsLoading ? (
                        <Loading message="Carregando eventos..." size="sm" className="py-8" />
                      ) : events.length > 0 ? (
                        <div className="space-y-3">
                          {events.slice(0, 10).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 p-4"
                            >
                              <div>
                                <p className="font-medium text-foreground">{event.event_name ?? "Evento"}</p>
                                <p className="text-sm text-muted-foreground">{formatDate(event.event_date)}</p>
                              </div>
                              <Badge variant="outline">{event.status ?? "Pendente"}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-muted-foreground">Nenhum evento agendado</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="financial" className="space-y-6 p-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Pagamentos Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingPayments.length > 0 ? (
                      <div className="space-y-4">
                        {pendingPayments.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-foreground">{event.event_name ?? "Evento"}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(event.event_date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-bold text-amber-300">
                                {formatCurrency(event.event_dj_fee ?? event.fee ?? 0)}
                              </p>
                              <span className="mt-1 inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-0.5 text-xs font-semibold text-amber-200">
                                Pendente
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">Nenhum pagamento pendente</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Histórico de Pagamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paidPayments.length > 0 ? (
                      <div className="space-y-4">
                        {paidPayments.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-foreground">{event.event_name ?? "Evento"}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(event.event_date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-bold text-emerald-300">
                                {formatCurrency(event.event_dj_fee ?? event.fee ?? 0)}
                              </p>
                              <span className="mt-1 inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-200">
                                Pago
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">Nenhum pagamento realizado</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-6 p-6">
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="rounded-full bg-[#7f5cf7] px-5 py-2 text-sm font-semibold text-white shadow-[0_18px_45px_-20px_rgba(127,92,247,0.65)] transition hover:bg-[#6d4ee3]"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload de Mídia
                  </Button>
                </div>

                {isMediaLoading ? (
                  <Loading message="Carregando mídias..." size="sm" className="py-8" />
                ) : (
                  <div className="space-y-6">
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5" />
                          Logos ({logo.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {logo.length > 0 ? (
                          renderImageGrid(logo, "grid gap-4 sm:grid-cols-2 lg:grid-cols-3")
                        ) : (
                          <p className="py-8 text-center text-muted-foreground">Nenhum logo enviado</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          Press Kits ({presskit.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {presskit.length > 0 ? (
                          renderDocumentList(presskit)
                        ) : (
                          <p className="py-8 text-center text-muted-foreground">Nenhum press kit enviado</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="h-5 w-5" />
                          Backdrops ({backdrop.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {backdrop.length > 0 ? (
                          renderImageGrid(backdrop, "grid gap-4 sm:grid-cols-2 lg:grid-cols-3")
                        ) : (
                          <p className="py-8 text-center text-muted-foreground">Nenhum backdrop enviado</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Headphones className="h-5 w-5" />
                          Áudios ({audios.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {audios.length > 0 ? (
                          renderAudioList(audios)
                        ) : (
                          <p className="py-8 text-center text-muted-foreground">Nenhum áudio enviado</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="h-5 w-5" />
                          Outros ({outros.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {outros.length > 0 ? (
                          renderOutrosList(outros)
                        ) : (
                          <p className="py-8 text-center text-muted-foreground">Nenhuma mídia adicional</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-3xl sm:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Upload de Mídia</DialogTitle>
          </DialogHeader>
          <MediaUpload
            djId={dj.id}
            djName={dj.artist_name ?? dj.real_name ?? undefined}
            onUploadComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["dj-media", djId] });
              setIsUploadDialogOpen(false);
            }}
            onCancel={() => setIsUploadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!djId) return;
              const formData = new FormData(e.currentTarget as HTMLFormElement);
              const toNullable = (v: FormDataEntryValue | null) => {
                if (typeof v !== "string") return null;
                const t = v.trim();
                return t ? t : null;
              };
              const basePriceRaw = formData.get("base_price");
              const basePriceVal = typeof basePriceRaw === "string" ? Number(basePriceRaw) : Number.NaN;
              const payload: DJUpdatePayload = {
                artist_name: (formData.get("artist_name")?.toString() ?? "").trim(),
                real_name: toNullable(formData.get("real_name")),
                email: toNullable(formData.get("email")),
                whatsapp: toNullable(formData.get("whatsapp")),
                location: toNullable(formData.get("location")),
                pix_key: toNullable(formData.get("pix_key")),
                genre: toNullable(formData.get("genre")),
                base_price: Number.isFinite(basePriceVal) ? basePriceVal : null,
                instagram_url: toNullable(formData.get("instagram_url")),
                youtube_url: toNullable(formData.get("youtube_url")),
                tiktok_url: toNullable(formData.get("tiktok_url")),
                soundcloud_url: toNullable(formData.get("soundcloud_url")),
                portifolio_url: toNullable(formData.get("portifolio_url")),
                birth_date: toNullable(formData.get("birth_date")),
              };
              updateDJMutation.mutate(payload, { onSuccess: () => setIsEditDialogOpen(false) });
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="artist_name">Nome Artístico</Label>
                <Input id="artist_name" name="artist_name" defaultValue={dj.artist_name ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="real_name">Nome Real</Label>
                <Input id="real_name" name="real_name" defaultValue={dj.real_name ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={dj.email ?? ""} />
              </div>
                 </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" name="birth_date" type="date" defaultValue={formatDateForInput(dj.birth_date)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" defaultValue={dj.whatsapp ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input id="location" name="location" defaultValue={dj.location ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="genre">Gênero Musical</Label>
                <Input id="genre" name="genre" defaultValue={dj.genre ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_price">Cachê Base (R$)</Label>
                <Input id="base_price" name="base_price" type="number" step="0.01" defaultValue={dj.base_price ?? undefined} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX</Label>
                <Input id="pix_key" name="pix_key" defaultValue={dj.pix_key ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portifolio_url">Portfolio URL</Label>
                <Input id="portifolio_url" name="portifolio_url" defaultValue={dj.portifolio_url ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input id="instagram_url" name="instagram_url" defaultValue={dj.instagram_url ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube_url">YouTube URL</Label>
                <Input id="youtube_url" name="youtube_url" defaultValue={dj.youtube_url ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tiktok_url">TikTok URL</Label>
                <Input id="tiktok_url" name="tiktok_url" defaultValue={dj.tiktok_url ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soundcloud_url">SoundCloud URL</Label>
                <Input id="soundcloud_url" name="soundcloud_url" defaultValue={dj.soundcloud_url ?? dj.soundcloud ?? ""} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" loading={updateDJMutation.isPending} disabled={updateDJMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        open={isCropOpen}
        onOpenChange={setIsCropOpen}
        title={cropTarget === "avatar" ? "Ajustar foto de perfil" : "Ajustar imagem de fundo"}
        file={cropFile}
        outputWidth={cropTarget === "avatar" ? 512 : 1600}
        outputHeight={cropTarget === "avatar" ? 512 : 600}
        circleMask={cropTarget === "avatar"}
        onCancel={() => {
          setIsCropOpen(false);
          setCropFile(null);
          setCropTarget(null);
        }}
        onSave={async (blob) => {
          if (!cropTarget) return;
          await uploadCropped(cropTarget, blob);
          setIsCropOpen(false);
          setCropFile(null);
          setCropTarget(null);
        }}
      />
    </div>
  );
};

export default DJsProfile;
