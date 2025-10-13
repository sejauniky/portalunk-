import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import ShareHistory from "./ShareHistory";
import {
  ArrowLeft,
  MapPin,
  Music,
  Instagram,
  Youtube,
  Calendar,
  DollarSign,
  Download,
  Share2,
  Eye,
  Headphones,
  FileText,
  X,
} from "lucide-react";
import { normalizeSocialUrl } from "@/utils/social";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContractViewModal } from "@/pages/event-calendar/components/ContractViewModal";
import EventModal from "./components/EventModal";
import { eventService } from "@/services/supabaseService";

interface DJ {
  id: string;
  artist_name: string | null;
  genre: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  soundcloud_url: string | null;
  avatar_url: string | null;
  background_image_url: string | null;
}

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
  file_category?: string | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
}

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  location: string | null;
  city: string | null;
  fee: number;
  payment_status: string | null;
  contract_attached?: boolean | null;
  contract_content?: string | null;
  cache_value?: number | string | null;
  budget?: number | string | null;
}

const DJProfileProducer = () => {
  const [, params] = useRoute<{ djId: string }>("/dj-profile/:djId");
  const djId = params?.djId ?? null;
  const [, setLocation] = useLocation();
  const { userProfile } = useAuth();
  const producerId = userProfile?.id;

  const [activeTab, setActiveTab] = useState<"eventos" | "financeiro" | "midias">("eventos");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareDays, setShareDays] = useState("5");
  const [sharePassword, setSharePassword] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  // hashing now handled server-side via Supabase function

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedEventForContract, setSelectedEventForContract] = useState<Event | null>(null);
  const [contractInstance, setContractInstance] = useState<{ id: string; content: string; signature_status: string } | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [signatureRefresh, setSignatureRefresh] = useState(0);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEventForPayment, setSelectedEventForPayment] = useState<Event | null>(null);
  const [selectedPaymentFile, setSelectedPaymentFile] = useState<File | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);

  const { data: dj, isLoading: isDjLoading } = useQuery<DJ | null>({
    queryKey: ["dj", djId],
    enabled: Boolean(djId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("djs")
        .select(
          "id, artist_name, genre, instagram_url, youtube_url, tiktok_url, soundcloud_url, avatar_url, background_image_url",
        )
        .eq("id", djId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [], isLoading: isEventsLoading } = useQuery<Event[]>({
    queryKey: ["producer-dj-events", djId, producerId],
    enabled: Boolean(djId && producerId),
    queryFn: async () => {
      if (!djId || !producerId) return [] as Event[];
      // Fetch events linked to this DJ either as primary (events.dj_id) or via event_djs relation,
      // then filter by the current producer so all DJs see the same events.
      const allForDj = await eventService.getByDj(djId);
      const filtered = (allForDj || []).filter((ev: any) => String(ev.producer_id || "") === String(producerId));
      // Sort by date desc and map to expected shape
      filtered.sort((a: any, b: any) => {
        const toTs = (v: any) => {
          const val = v?.event_date ?? v?.date ?? null;
          if (!val) return 0;
          const t = new Date(val as any).getTime();
          return Number.isNaN(t) ? 0 : t;
        };
        return toTs(b) - toTs(a);
      });
      return filtered as unknown as Event[];
    },
  });

  const { data: media = [], isLoading: isMediaLoading } = useQuery<MediaFile[]>({
    queryKey: ["dj-media", djId],
    enabled: Boolean(djId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, file_type, file_size, created_at, file_category, description, metadata")
        .eq("dj_id", djId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaFile[];
    },
  });

  const queryClient = useQueryClient();

  const categorizedMedia = useMemo(() => {
    const buckets = {
      logos: [] as MediaFile[],
      presskits: [] as MediaFile[],
      backdrops: [] as MediaFile[],
      others: [] as MediaFile[],
    };

    const isLikelyVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(String(url || ""));

    (media ?? []).forEach((file) => {
      const name = (file.file_name ?? "").toLowerCase();
      const url = (file.file_url ?? "").toLowerCase();
      const category = (file.file_category ?? "").toLowerCase();

      if (category === "logo") {
        buckets.logos.push(file);
        return;
      }
      if (category === "presskit") {
        buckets.presskits.push(file);
        return;
      }
      if (category === "backdrop" || category === "background") {
        buckets.backdrops.push(file);
        return;
      }

      // Fallback heuristics only when category is not set
      const isLogo = name.includes("logo") || url.includes("/logo/");
      const isPresskit = name.includes("presskit") || (name.includes("press") && name.includes("kit")) || url.includes("/presskit/");
      const isBackdrop = name.includes("backdrop") || name.includes("fundo") || name.includes("background") || name.includes("bg") || url.includes("/backdrop/") || url.includes("/background/");

      if (isLogo) {
        buckets.logos.push(file);
        return;
      }
      if (isPresskit) {
        buckets.presskits.push(file);
        return;
      }
      if (isBackdrop) {
        buckets.backdrops.push(file);
        return;
      }

      // Ignore tiny placeholder files
      if (file.file_size && file.file_size <= 0) return;

      buckets.others.push(file);
    });

    // Remove duplicates by id if any
    const dedup = (arr: MediaFile[]) => Array.from(new Map(arr.map((f) => [f.id, f])).values());

    return {
      logos: dedup(buckets.logos),
      presskits: dedup(buckets.presskits),
      backdrops: dedup(buckets.backdrops),
      others: dedup(buckets.others),
    };
  }, [media]);

  const { logos, presskits, backdrops, others } = categorizedMedia;
  const normalizeMediaUrl = (value?: string | null) => (typeof value === "string" ? value.trim() : "");
  const profileBackdropImage = normalizeMediaUrl(dj?.background_image_url) || normalizeMediaUrl(dj?.avatar_url);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 991px)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsNarrowViewport(event.matches);
    };

    update(mediaQuery);

    const listener = (event: MediaQueryListEvent) => update(event);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (shareDialogOpen) {
      return;
    }

    setSharePassword("");
    setGeneratedLink("");
    setShareDays("5");
  }, [shareDialogOpen]);

  const renderMediaGrid = (items: MediaFile[], variant: "square" | "thumbnail") => (
    <div
      className={
        variant === "thumbnail"
          ? "grid gap-3 sm:grid-cols-3 lg:grid-cols-4"
          : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      }
    >
      {items.map((file) => {
        const isImage = file.file_type?.startsWith?.("image");
        const isAudio = file.file_type?.startsWith?.("audio");
        const isVideo = file.file_type?.startsWith?.("video") || /\.(mp4|webm|ogg|mov|m4v)$/i.test(String(file.file_url || ""));
        const containerClasses =
          variant === "thumbnail"
            ? "group relative h-20 sm:h-24 lg:h-28 rounded-lg overflow-hidden border border-border"
            : "group relative aspect-square rounded-lg overflow-hidden border border-border";

        return (
          <div key={file.id} className={containerClasses}>
            {isImage ? (
              <img
                src={file.file_url}
                alt={file.file_name}
                className={variant === "thumbnail" ? "h-full w-full object-cover" : "w-full h-full object-cover"}
              />
            ) : isVideo ? (
              <video
                src={file.file_url}
                className={variant === "thumbnail" ? "h-full w-full object-cover" : "w-full h-full object-cover"}
                controls
                playsInline
              />
            ) : isAudio ? (
              <audio controls className="w-full h-full bg-black">
                <source src={file.file_url} />
                Seu navegador não suporta reprodução de áudio.
              </audio>
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Music className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" asChild>
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" />
                </a>
              </Button>
              <Button size="icon" variant="secondary" asChild>
                <a href={file.file_url} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMediaSection = (
    title: string,
    items: MediaFile[],
    emptyMessage: string,
    variant: "square" | "thumbnail" = "square",
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{items.length} arquivo(s)</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        renderMediaGrid(items, variant)
      )}
    </div>
  );

  const visibleEvents = (events || []).filter((event) => event.payment_status !== "pendente");

  const EventContractButton = ({ event, onOpen, refreshToken }: { event: Event; onOpen: (value: Event) => void; refreshToken: number }) => {
    const [isSigned, setIsSigned] = useState(false);

    useEffect(() => {
      let mounted = true;
      const checkSignature = async () => {
        if (!event?.id || !djId) return;
        try {
          const { data } = await supabase
            .from("contract_instances")
            .select("id, signature_status")
            .eq("event_id", event.id)
            .eq("dj_id", djId)
            .maybeSingle();

          if (mounted) {
            setIsSigned(Boolean(data && data.signature_status === "signed"));
          }
        } catch (error) {
          if (mounted) {
            setIsSigned(false);
          }
        }
      };

      void checkSignature();
      return () => {
        mounted = false;
      };
    }, [event?.id, djId, refreshToken]);

    if (!event.contract_attached) return null;

    return (
      <button
        onClick={() => onOpen(event)}
        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
          isSigned
            ? "bg-blue-600/20 border border-blue-600/40 text-blue-200 hover:bg-blue-600/30"
            : "bg-yellow-600/20 border border-yellow-600/40 text-yellow-200 hover:bg-yellow-600/30"
        }`}
      >
        <FileText className="w-4 h-4" />
        {isSigned ? "Visualizar Contrato" : "Assinar Contrato"}
      </button>
    );
  };

  const handleGoBack = useCallback(() => {
    setLocation("/producer-dashboard");
  }, [setLocation]);

  const slugify = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const handleGenerateShareLink = async () => {
    if (!/^[0-9]{4}$/.test(sharePassword)) {
      toast({ title: "Senha inválida", description: "A senha deve conter exatamente 4 dígitos numéricos (ex: 1234)", variant: "destructive" });
      return;
    }

    const days = Number.parseInt(shareDays, 10);
    if (!Number.isFinite(days) || days < 1 || days > 7) {
      toast({ title: "Prazo inválido", description: "O prazo deve ser entre 1 e 7 dias", variant: "destructive" });
      return;
    }
    if (!djId || !producerId) {
      toast({ title: "Dados incompletos", description: "Não foi possível identificar o DJ ou produtor." });
      return;
    }

    try {
      setGeneratedLink("");
      const { data, error } = await supabase.functions.invoke('create-share-link', { body: { djId, days: days, pin: sharePassword || undefined } });
      if (error) throw error;

      const returnedPin = data?.pin;
      const artist = (dj?.artist_name || '').trim();
      const slug = artist ? slugify(artist) : djId;
      const link = `${window.location.origin}/share/${encodeURIComponent(slug)}`;
      setGeneratedLink(link);

      toast({ title: 'Link criado', description: `PIN: ${returnedPin} — válido por ${days} dias.` });
    } catch (error) {
      console.error("Erro ao gerar link:", error);
      toast({ title: "Erro", description: "Não foi possível gerar o link", variant: "destructive" });
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).catch(() => {
      toast({ title: "Erro", description: "Não foi possível copiar o link", variant: "destructive" });
    });
    toast({ title: "Link copiado!", description: "O link foi copiado para a área de transferência" });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (value: string) => {
    if (!value) return "Data não informada";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map((part) => Number.parseInt(part, 10));
      const localDate = new Date(y, m - 1, d);
      return localDate.toLocaleDateString("pt-BR");
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Data não informada";
    return parsed.toLocaleDateString("pt-BR");
  };

  const getWeekday = (value: string) => {
    if (!value) return "";
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(value + "T00:00:00")
      : new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString(undefined, { weekday: "long" });
  };

  const normalizePaymentStatus = (status: string | null | undefined) => (status ?? "").toString().trim().toLowerCase();
  const isPaidStatus = (status: string | null | undefined) => normalizePaymentStatus(status) === "pago";
  const isPendingStatus = (status: string | null | undefined) => !isPaidStatus(status);

  const getPaymentStatusBadge = (status: string | null) => {
    if (isPaidStatus(status)) {
      return <Badge className="bg-green-500/20 text-green-300">Pago</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-200">Pendente</Badge>;
  };

  const handleOpenPaymentModal = (event: Event) => {
    setSelectedEventForPayment(event);
    setPaymentModalOpen(true);
  };

  const handlePaymentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Arquivo inválido", description: "Apenas arquivos JPG, PNG ou PDF são permitidos", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "O arquivo deve ter no máximo 10MB", variant: "destructive" });
        return;
      }
      setSelectedPaymentFile(file);
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!selectedPaymentFile || !selectedEventForPayment) {
      toast({ title: "Erro", description: "Selecione um arquivo", variant: "destructive" });
      return;
    }

    setUploadingPayment(true);
    try {
      // Upload to storage
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).slice(2);
      const extension = selectedPaymentFile.name.split('.').pop() ?? 'dat';
      const path = `${selectedEventForPayment.id}/${timestamp}-${randomString}.${extension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, selectedPaymentFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(path);

      // Call edge function to update payment status
      const { error: functionError } = await supabase.functions.invoke('mark-event-paid', {
        body: { eventId: selectedEventForPayment.id, receipt_url: publicUrl }
      });

      if (functionError) throw functionError;

      toast({ title: "Comprovante enviado", description: "O pagamento foi enviado para análise do administrador." });
      queryClient.invalidateQueries({ queryKey: ["producer-dj-events", djId, producerId] });
      setPaymentModalOpen(false);
      setSelectedPaymentFile(null);
      setSelectedEventForPayment(null);
    } catch (error) {
      console.error("Erro ao enviar comprovante:", error);
      toast({ title: "Erro", description: "Não foi possível enviar o comprovante.", variant: "destructive" });
    } finally {
      setUploadingPayment(false);
    }
  };

  if (isDjLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Music className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (!dj) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
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

  const getEventAmount = (event: Event) => {
    const raw = event.fee ?? event.cache_value ?? event.budget ?? 0;
    if (typeof raw === "number") {
      return Number.isFinite(raw) ? raw : 0;
    }
    const sanitized = String(raw).replace(/[^0-9.,-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalPaid = (events || [])
    .filter((event) => isPaidStatus(event.payment_status))
    .reduce((sum, event) => sum + getEventAmount(event), 0);
  const totalPending = (events || [])
    .filter((event) => isPendingStatus(event.payment_status))
    .reduce((sum, event) => sum + getEventAmount(event), 0);

  const hasHeroBackdropLink = Boolean(profileBackdropImage);
  const isHeroVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(String(profileBackdropImage || ""));
  const heroCardClasses = `relative flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-black/60 px-6 py-8 shadow-[0_24px_70px_-32px_rgba(33,151,189,0.55)] transition-colors duration-300 pointer-events-auto sm:px-10 sm:py-12${hasHeroBackdropLink ? " cursor-pointer" : ""}`;
  const heroCardContent = (
    <>
      {profileBackdropImage && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {isHeroVideo ? (
            <video
              src={profileBackdropImage}
              className="h-full w-full scale-105 object-cover blur-sm"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={profileBackdropImage}
              alt="Imagem de fundo do DJ"
              className="h-full w-full scale-105 object-cover blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-black/70" />
        </div>
      )}

      <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-center">
        <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-[0_14px_30px_-18px_rgba(33,151,189,0.8)]">
          <AvatarImage src={dj.avatar_url ?? undefined} />
          <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
            {dj.artist_name?.[0]?.toUpperCase() || "D"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center md:text-left">
          <h1
            className="mb-2 text-4xl font-bold"
            style={
              isNarrowViewport
                ? {
                    color: "rgba(109, 190, 184, 1)",
                    textShadow: "1px 1px 33px rgba(79, 22, 134, 0.57)",
                  }
                : undefined
            }
          >
            {dj.artist_name}
          </h1>

          {(dj.instagram_url || dj.youtube_url || dj.soundcloud_url) && (
            <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
              {dj.instagram_url && (
                <a
                  href={normalizeSocialUrl("instagram", dj.instagram_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/20 px-4 py-1.5 text-sm font-medium text-pink-300 transition hover:bg-pink-500/30"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}

              {dj.youtube_url && (
                <a
                  href={normalizeSocialUrl("youtube", dj.youtube_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              )}

              {dj.soundcloud_url && (
                <a
                  href={normalizeSocialUrl("soundcloud", dj.soundcloud_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-300 transition hover:bg-orange-500/20"
                >
                  <Headphones className="h-4 w-4" />
                  SoundCloud
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-10">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={handleGoBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        {/* Blurred banner background */}
        {dj.background_image_url ? (
          /\.(mp4|webm|ogg|mov|m4v)$/i.test(String(dj.background_image_url)) ? (
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-60 blur-[8px]"
              src={dj.background_image_url}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage: `url(${dj.background_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(8px)",
              }}
            />
          )
        ) : dj.avatar_url ? (
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `url(${dj.avatar_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(8px)",
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />

        <div className="container relative mx-auto px-6 py-12">
          {profileBackdropImage && (
            <div className="absolute inset-0 rounded-[32px] mx-6 overflow-hidden opacity-50">
              {isHeroVideo ? (
                <video
                  src={profileBackdropImage}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={profileBackdropImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}
          {hasHeroBackdropLink ? (
            <div
              role="link"
              tabIndex={0}
              onClick={() => window.open(profileBackdropImage, '_blank', 'noopener')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.open(profileBackdropImage, '_blank', 'noopener'); } }}
              title="Abrir mídia de fundo em nova aba"
              className={heroCardClasses}
            >
              {heroCardContent}
            </div>
          ) : (
            <div className={heroCardClasses}>{heroCardContent}</div>
          )}
        </div>
      </section>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "eventos" | "financeiro" | "midias")}> 
          <TabsList className="grid w-full grid-cols-3 gap-3 mb-8">
          <TabsTrigger
            value="eventos"
            className="rounded-lg border border-[rgba(33,151,189,0.36)] bg-[rgba(13,8,42,0.64)] px-3 py-2 text-sm font-semibold tracking-[0.1em] text-[rgba(73,184,189,1)] transition-all duration-300 hover:brightness-110 data-[state=inactive]:opacity-80 data-[state=active]:border-[rgba(73,184,189,0.45)] data-[state=active]:bg-[rgba(13,8,42,0.9)] data-[state=active]:text-[rgba(141,251,255,1)] data-[state=active]:shadow-[0_16px_40px_-24px_rgba(33,151,189,0.7)] lg:border-transparent lg:bg-transparent lg:text-muted-foreground lg:data-[state=inactive]:opacity-100 lg:data-[state=active]:border-white/10 lg:data-[state=active]:bg-[#131416] lg:data-[state=active]:text-white"
          >
            Eventos
          </TabsTrigger>
          <TabsTrigger
            value="financeiro"
            className="rounded-lg border border-[rgba(33,151,189,0.36)] bg-[rgba(13,8,42,0.64)] px-3 py-2 text-sm font-semibold tracking-[0.1em] text-[rgba(73,184,189,1)] transition-all duration-300 hover:brightness-110 data-[state=inactive]:opacity-80 data-[state=active]:border-[rgba(73,184,189,0.45)] data-[state=active]:bg-[rgba(13,8,42,0.9)] data-[state=active]:text-[rgba(141,251,255,1)] data-[state=active]:shadow-[0_16px_40px_-24px_rgba(33,151,189,0.7)] lg:border-transparent lg:bg-transparent lg:text-muted-foreground lg:data-[state=inactive]:opacity-100 lg:data-[state=active]:border-white/10 lg:data-[state=active]:bg-[#131416] lg:data-[state=active]:text-white"
          >
            Financeiro
          </TabsTrigger>
          <TabsTrigger
            value="midias"
            className="rounded-lg border border-[rgba(33,151,189,0.36)] bg-[rgba(13,8,42,0.64)] px-3 py-2 text-sm font-semibold tracking-[0.1em] text-[rgba(73,184,189,1)] transition-all duration-300 hover:brightness-110 data-[state=inactive]:opacity-80 data-[state=active]:border-[rgba(73,184,189,0.45)] data-[state=active]:bg-[rgba(13,8,42,0.9)] data-[state=active]:text-[rgba(141,251,255,1)] data-[state=active]:shadow-[0_16px_40px_-24px_rgba(33,151,189,0.7)] lg:border-transparent lg:bg-transparent lg:text-muted-foreground lg:data-[state=inactive]:opacity-100 lg:data-[state=active]:border-white/10 lg:data-[state=active]:bg-[#131416] lg:data-[state=active]:text-white"
          >
            Mídias
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === "eventos" && (
            <TabsContent value="eventos" forceMount asChild>
              <motion.div
                key="tab-eventos"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Eventos Contratados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEventsLoading ? (
                      <p className="text-muted-foreground">Carregando...</p>
                    ) : visibleEvents.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum evento encontrado com este DJ.</p>
                    ) : (
                      <div className="space-y-3">
                        {visibleEvents.map((event) => (
                          <div key={event.id} className="relative pt-6 p-4 border border-border rounded-lg bg-surface transition-transform duration-300 hover:-translate-y-1">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              <div className="md:col-span-3 flex items-start md:items-center gap-3">
                                <div className="text-sm text-muted-foreground">
                                  <div className="font-semibold">{formatDate(event.event_date)}</div>
                                  <div className="text-xs">{getWeekday(event.event_date)}</div>
                                </div>
                              </div>

                              <div className="md:col-span-6">
                                <div className="font-semibold">{event.event_name}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <div className="flex items-center gap-3">
                                    {event.location && (
                                      <span className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {event.location}
                                      </span>
                                    )}
                                    {event.city && <span className="text-xs">{event.city}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="md:col-span-3 flex flex-col items-start md:items-end gap-2">
                                <EventContractButton
                                  event={event}
                                  refreshToken={signatureRefresh}
                                  onOpen={async (currentEvent) => {
                                    setSelectedEventForContract(currentEvent);
                                    try {
                                      // Try to fetch existing contract instance for this event + DJ
                                      let { data, error } = await supabase
                                        .from("contract_instances")
                                        .select("id, contract_content, signature_status")
                                        .eq("event_id", currentEvent.id)
                                        .eq("dj_id", djId)
                                        .maybeSingle();

                                      if ((error || !data) && djId) {
                                        // If not found, attempt to create a per-DJ contract instance on demand
                                        try {
                                          const { data: evInfo } = await supabase
                                            .from("events")
                                            .select("contract_type, producer_id")
                                            .eq("id", currentEvent.id)
                                            .maybeSingle();

                                          const contractType = (evInfo as any)?.contract_type || "basic";
                                          const ownerProducerId = (evInfo as any)?.producer_id || producerId || "";

                                          if (ownerProducerId) {
                                            await supabase.functions.invoke('create-event-contracts', {
                                              body: {
                                                eventId: currentEvent.id,
                                                djIds: [djId],
                                                contractType,
                                                producerId: ownerProducerId,
                                              },
                                            });

                                            // Fetch again after creation
                                            const retry = await supabase
                                              .from("contract_instances")
                                              .select("id, contract_content, signature_status")
                                              .eq("event_id", currentEvent.id)
                                              .eq("dj_id", djId)
                                              .maybeSingle();
                                            data = retry.data as any;
                                            error = retry.error as any;
                                          }
                                        } catch (creationErr) {
                                          // proceed to show error below
                                        }
                                      }

                                      if (error || !data) {
                                        toast({ title: "Contrato não disponível", description: "Nenhuma instância de contrato encontrada para este evento.", variant: "destructive" });
                                        return;
                                      }

                                      const resolvedContent = (currentEvent as any)?.contract_content || data.contract_content || "";
                                      setContractInstance({ id: String(data.id), content: resolvedContent, signature_status: data.signature_status || "pending" });
                                      setContractModalOpen(true);
                                    } catch (e) {
                                      toast({ title: "Erro", description: "Falha ao abrir contrato.", variant: "destructive" });
                                    }
                                  }}
                                />
                                <div className="mt-2">
                                  <Button size="sm" onClick={() => setEventModalOpen(true)}>Ver detalhes</Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "financeiro" && (
            <TabsContent value="financeiro" forceMount asChild>
              <motion.div
                key="tab-financeiro"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{events.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">{formatCurrency(totalPaid)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-500">{formatCurrency(totalPending)}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalhamento Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum evento encontrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {events.map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-3 border border-border rounded transition-colors duration-300 hover:border-primary/40">
                            <div>
                              <p className="font-medium">{event.event_name}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(event.event_date)}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(getEventAmount(event))}</p>
                                {getPaymentStatusBadge(event.payment_status)}
                              </div>
                              {event.payment_status === "pago" ? (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">Pago</span>
                              ) : event.payment_status === "pagamento_enviado" ? (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">Enviado</span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenPaymentModal(event)}
                                  className="bg-green-600 text-white hover:bg-green-700"
                                >
                                  Dar baixa
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "midias" && (
            <TabsContent value="midias" forceMount asChild>
              <motion.div
                key="tab-midias"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Galeria de Mídias</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => setHistoryDialogOpen(true)} variant="outline" className="gap-2">
                          Histórico
                        </Button>
                        <Button onClick={() => setShareDialogOpen(true)} className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Compartilhar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isMediaLoading ? (
                      <p className="text-muted-foreground">Carregando...</p>
                    ) : media.length === 0 ? (
                      <p className="text-muted-foreground">Nenhuma mídia encontrada.</p>
                    ) : (
                      <div className="space-y-6">
                        {logos.length > 0 && renderMediaSection("Logos", logos, "Nenhum logo enviado ainda.")}
                        {presskits.length > 0 && renderMediaSection("Presskit", presskits, "Nenhuma foto de presskit enviada.", "thumbnail")}
                        {backdrops.length > 0 && renderMediaSection("Backdrops", backdrops, "Nenhum backdrop enviado até o momento.")}
                        {others.length > 0 && renderMediaSection("Outros Arquivos", others, "Nenhum outro arquivo disponível.")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
        </Tabs>
      </main>

      <ContractViewModal
        open={contractModalOpen}
        onOpenChange={(open) => {
          setContractModalOpen(open);
          if (!open) {
            setSelectedEventForContract(null);
            setContractInstance(null);
          }
        }}
        contractId={contractInstance?.id || ""}
        contractContent={contractInstance?.content || ""}
        eventName={selectedEventForContract?.event_name || (selectedEventForContract as any)?.title || "Evento"}
        signatureStatus={contractInstance?.signature_status || "pending"}
        onSign={async () => {
          queryClient.invalidateQueries({ queryKey: ["producer-dj-events", djId, producerId] });
          setSignatureRefresh((v) => v + 1);
          setContractInstance((prev) => (prev ? { ...prev, signature_status: "signed" } : prev));
        }}
      />

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Mídias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="days">Validade do Link (máx. 5 dias)</Label>
              <Input id="days" type="number" min="1" max="5" value={shareDays} onChange={(event) => setShareDays(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Senha de Acesso</Label>
              <Input
                id="password"
                type="text"
                placeholder="4 dígitos (deixe vazio para gerar automaticamente)"
                value={sharePassword}
                onChange={(event) => setSharePassword(event.target.value)}
              />
            </div>
            {generatedLink && (
              <div className="p-3 bg-muted rounded border border-border">
                <p className="text-sm font-medium mb-2">Link Gerado:</p>
                <p className="text-xs break-all text-muted-foreground mb-2">{generatedLink}</p>
                <Button size="sm" onClick={copyToClipboard} className="w-full">
                  Copiar Link
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleGenerateShareLink}>Gerar Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico de Links</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {producerId ? <ShareHistory producerId={producerId} onRevoke={() => { /* refresh if needed */ }} /> : <p>Faça login para ver histórico.</p>}
          </div>
        </DialogContent>
      </Dialog>
      <EventModal
        djId={djId ?? ''}
        producerId={producerId ?? ''}
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
      />

      {/* Payment Upload Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Enviar Comprovante de Pagamento
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedPaymentFile(null);
                  setSelectedEventForPayment(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-sm">
                <p className="font-semibold text-amber-300 mb-1">Instruções para Pagamento</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Realize o pagamento do valor total pendente deste evento.</li>
                  <li>Faça o upload do comprovante.</li>
                  <li>Para baixa automática é necessário que o comprovante esteja no CNPJ 59.839.507/0001-86 e o valor correto.</li>
                  <li>Aguarde a análise e confirmação do pagamento.</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Arquivo do Comprovante
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handlePaymentFileSelect}
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: JPG, PNG, PDF (máximo 10MB)
                </p>
              </div>

              {selectedPaymentFile && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedPaymentFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedPaymentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedPaymentFile(null);
                  setSelectedEventForPayment(null);
                }}
                disabled={uploadingPayment}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadPaymentProof}
                disabled={!selectedPaymentFile || uploadingPayment}
              >
                {uploadingPayment ? "Enviando..." : "Enviar Comprovante"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DJProfileProducer;
