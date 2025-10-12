import { useCallback, useEffect, useState, type FC } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ContractCard } from "./components/ContractCard";

type ContractedDJ = {
  id: string;
  artist_name: string;
  avatar_url: string | null;
  genres: string[] | null;
  eventCount: number;
};

type ProducerRecord = {
  id: string;
  avatar_url: string | null;
};

type ContractInstance = {
  id: string;
  contract_content: string;
  contract_value: number;
  signature_status: string;
  created_at: string;
  event: {
    event_name: string;
    event_date: string;
    location: string;
  };
  dj: {
    artist_name: string;
  };
};

const ProducerDashboard: FC = () => {
  const [contractedDJs, setContractedDJs] = useState<ContractedDJ[]>([]);
  const [contracts, setContracts] = useState<ContractInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [producerRecord, setProducerRecord] = useState<ProducerRecord | null>(null);
  const { userProfile, logout } = useAuth();
  const [, setLocation] = useLocation();

  const profile = userProfile;

  const resolveProducerRecord = useCallback(async () => {
    if (!profile?.id) {
      setProducerRecord(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("producers")
        .select("id, avatar_url")
        .eq("id", profile.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Error loading producer profile:",
          error?.message ?? JSON.stringify(error, Object.getOwnPropertyNames(error)) ?? error,
        );
        setProducerRecord(null);
        return;
      }

      if (data) {
        setProducerRecord({
          id: String((data as { id: string }).id),
          avatar_url: (data as { avatar_url?: string | null }).avatar_url ?? null,
        });
      } else {
        setProducerRecord(null);
      }
    } catch (err) {
      console.error(
        "Unexpected error loading producer profile:",
        err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err)) ?? err,
      );
      setProducerRecord(null);
    }
  }, [profile?.id]);

  const fetchContracts = useCallback(async (producerId: string) => {
    setLoadingContracts(true);
    try {
      const { data, error } = await supabase
        .from('contract_instances')
        .select(`
          id,
          contract_content,
          contract_value,
          signature_status,
          created_at,
          event:events(event_name, event_date, location),
          dj:djs(artist_name)
        `)
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContracts(data as unknown as ContractInstance[] || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  }, []);

  const fetchContractedDJs = useCallback(
    async (producerId: string) => {
      setLoading(true);

      try {
        // Fetch base events for producer (no nested relations to avoid FK assumptions)
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("id, dj_id")
          .eq("producer_id", producerId);

        if (eventsError) {
          throw eventsError;
        }

        const eventsList = (eventsData ?? []) as Array<{ id: string; dj_id?: string | null }>;
        const eventIds = eventsList.map((e) => e.id).filter(Boolean);

        // Fetch explicit event_djs relations by event ids
        const { data: eventDjsData, error: eventDjsError } = eventIds.length
          ? await supabase.from("event_djs").select("event_id, dj_id").in("event_id", eventIds)
          : ({ data: [] } as any);

        if (eventDjsError) {
          // If relation table missing or other error, log and continue with events only
          console.warn("Failed to fetch event_djs relations:", eventDjsError);
        }

        const eventDjsList = (eventDjsData ?? []) as Array<{ event_id: string; dj_id?: string | null }>;

        // Collect all dj ids from event primary dj and extra relations
        const djIdsSet = new Set<string>();
        eventsList.forEach((ev) => {
          if (ev.dj_id) djIdsSet.add(ev.dj_id);
        });
        eventDjsList.forEach((rel) => {
          if (rel.dj_id) djIdsSet.add(rel.dj_id);
        });

        const djIds = Array.from(djIdsSet);

        // Fetch DJ details for all involved DJs
        const { data: djsData, error: djsError } = djIds.length
          ? await supabase
            .from("djs")
            .select("id, artist_name, avatar_url, real_name, genre")
            .in("id", djIds)
          : ({ data: [] } as any);

        if (djsError) {
          throw djsError;
        }

        const djsById = new Map((djsData ?? []).map((d: any) => [d.id, d]));

        // Aggregate counts per DJ across events and event_djs relations
        const counts = new Map<string, Set<string>>(); // djId -> set of eventIds

        eventsList.forEach((ev) => {
          const djId = ev.dj_id;
          if (!djId) return;
          const set = counts.get(djId) ?? new Set<string>();
          set.add(ev.id);
          counts.set(djId, set);
        });

        eventDjsList.forEach((rel) => {
          const djId = rel.dj_id;
          if (!djId) return;
          const set = counts.get(djId) ?? new Set<string>();
          set.add(rel.event_id);
          counts.set(djId, set);
        });

        const mappedDJs: ContractedDJ[] = Array.from(counts.entries()).map(([djId, evSet]) => {
          const dj = djsById.get(djId) as any || null;
          const artistName = dj?.artist_name ?? dj?.real_name ?? "DJ";
          const avatar = dj?.avatar_url ?? null;
          const genreStr = dj?.genre ?? "";
          const genres = genreStr ? [genreStr] : null;
          return {
            id: djId,
            artist_name: artistName,
            avatar_url: avatar,
            genres: genres,
            eventCount: evSet.size,
          };
        });

        // If no relations found, show message or keep empty
        setContractedDJs(mappedDJs.sort((a, b) => a.artist_name.localeCompare(b.artist_name || "", "pt-BR", { sensitivity: "base" })));
      } catch (error) {
        console.error(
          "Error fetching contracted DJs:",
          error instanceof Error ? error.message : JSON.stringify(error, Object.getOwnPropertyNames(error)) ?? error,
        );
        setContractedDJs([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    resolveProducerRecord();
  }, [resolveProducerRecord]);

  useEffect(() => {
    if (!producerRecord?.id) {
      setContractedDJs([]);
      setLoading(false);
      return;
    }

    fetchContractedDJs(producerRecord.id);
  }, [producerRecord?.id, fetchContractedDJs]);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Error during logout:",
        error instanceof Error ? error.message : JSON.stringify(error, Object.getOwnPropertyNames(error)) ?? error,
      );
    } finally {
      setLocation("/login");
    }
  }, [logout, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src="/vinil.svg" alt="vinil" className="h-12 w-12 mx-auto mb-4 slow-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ backgroundColor: "rgb(19, 20, 22)", fontWeight: 400, minHeight: "642px" }}>
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-10" style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(19, 20, 22, 0.8)", borderBottomWidth: "1px", borderColor: "rgb(47, 50, 55)", fontWeight: 400, position: "sticky", top: "0px", zIndex: "10" }}>
        <div className="container mx-auto px-6 py-4" style={{ width: "100%", backgroundColor: "rgba(4, 1, 56, 0.17)", margin: "0 auto", padding: "16px 24px" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 flex items-center justify-center">
                {/* Use vinyl SVG from public and rotate slowly - larger and no bg */}
                <img src="/vinil.svg" alt="vinil" className="w-14 h-14 object-contain slow-spin" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text" style={{ backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "cover" }}>Bem-vindo(a) ao Portal UNK</h1>
                <p className="text-sm text-muted-foreground">
                  Logado como Produtor(a) {profile?.fullName || profile?.email?.split('@')[0] || "Produtor"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={producerRecord?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(profile?.fullName?.[0] || profile?.email?.[0] || "P").toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12" style={{ width: "100%", backgroundColor: "rgba(3, 20, 36, 0.23)", margin: "0 auto", padding: "48px 24px" }}>
        {contractedDJs.length === 0 ? (
          <div className="text-center py-20">
            <img src="/vinil.svg" alt="vinil" className="h-16 w-16 mx-auto mb-4 slow-spin" />
            <h2 className="text-2xl font-bold mb-2">Nenhum DJ contratado</h2>
            <p className="text-muted-foreground">
              Você ainda não possui DJs contratados. Entre em contato com a administração.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractedDJs.map((dj) => (
              <Link
                key={dj.id}
                href={`/dj-profile/${dj.id}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] bg-card hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {/* Imagem de fundo preenchendo todo o card */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: dj.avatar_url
                      ? `url(${dj.avatar_url})`
                      : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)'
                  }}
                />

                {/* Overlay gradient para legibilidade do texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Conteúdo do card */}
                <div className="relative h-full flex flex-col justify-end p-6">

                  <div className="flex items-center justify-between w-full mb-2">
                    <h3 className="text-2xl font-bold truncate" style={{ color: "rgb(123, 135, 153)", fontSize: "24px", fontWeight: "700", lineHeight: "32px", overflowX: "hidden", overflowY: "hidden", textOverflow: "ellipsis", textShadow: "rgb(3, 20, 46) 1px 1px 3px", textWrap: "nowrap", whiteSpace: "nowrap" }}>{dj.artist_name}</h3>

                    <div className="relative ml-4 flex-shrink-0">
                      {/* colored blurred background behind the small button */}
                      <div className="absolute inset-0 -translate-x-1 translate-y-1 rounded-full blur-xl opacity-60" style={{ background: 'linear-gradient(90deg, rgba(96,165,250,0.18), rgba(139,92,246,0.16))' }} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative z-10 inline-flex items-center gap-2 rounded-full text-sm"
                        style={{ backgroundColor: "rgba(1, 8, 43, 0.39)", borderColor: "rgba(255, 255, 255, 0.2)", borderWidth: "1px", color: "rgba(163, 184, 199, 1)", fontSize: "14px", fontWeight: 500, gap: "8px", height: "36px", justifyContent: "center", lineHeight: "20px", position: "relative", whiteSpace: "nowrap", zIndex: 10, marginBottom: "-90px", boxShadow: "1px 1px 19px 0 rgba(6, 22, 59, 1)", padding: "6px 12px 9px" }}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </div>

                  <p className="text-white/80 text-sm mb-4" style={{ paddingRight: "10px", margin: "0 161px 16px 0" }}>
                    {dj.genres && dj.genres.length > 0 ? dj.genres[0] : "Gênero não especificado"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProducerDashboard;
