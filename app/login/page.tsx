'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from '@/hooks/use-location';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Play, SkipBack, SkipForward } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import toast from 'react-hot-toast';

const WAVEFORM_BARS = [
  12, 18, 26, 38, 46, 52, 46, 38, 28, 22, 18, 16,
  18, 24, 34, 48, 58, 64, 58, 44, 32, 24, 18, 14
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackProgress, setTrackProgress] = useState(8);
  const [isAnimatingTrack, setIsAnimatingTrack] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [wavePhase, setWavePhase] = useState(0);
  const { signIn, role } = useAuth();
  const [, setLocation] = useLocation();
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const trackProgressRef = useRef<number>(trackProgress);
  const roleRef = useRef<typeof role>(role);

  const appLogo = process.env.NEXT_PUBLIC_APP_LOGO || '/logo.png';

  useEffect(() => {
    trackProgressRef.current = trackProgress;
  }, [trackProgress]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const animateTrackTo = useCallback((target: number, duration = 1200) => {
    return new Promise<void>((resolve) => {
      const startValue = trackProgressRef.current;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (Math.abs(target - startValue) < 0.5 || duration <= 0) {
        setTrackProgress(target);
        trackProgressRef.current = target;
        setIsAnimatingTrack(false);
        resolve();
        return;
      }

      setIsAnimatingTrack(true);
      const easing = (t: number) => 1 - Math.pow(1 - t, 3);
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easing(progress);
        const nextValue = startValue + (target - startValue) * eased;
        setTrackProgress(nextValue);
        trackProgressRef.current = nextValue;

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          setTrackProgress(target);
          trackProgressRef.current = target;
          setIsAnimatingTrack(false);
          animationFrameRef.current = null;
          resolve();
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    });
  }, []);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (loading || isAnimatingTrack) {
      return;
    }

    setError('');
    setLoading(true);

    const initialProgress = trackProgressRef.current;
    const trackAnimation = animateTrackTo(100, 1800);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        const raw = String(signInError?.message || '');
        let friendly = 'Falha na autenticação. Tente novamente.';
        if (!isSupabaseConfigured) {
          friendly = 'Configuração do Supabase ausente. Aguarde e tente novamente.';
        } else if (/email\s*n[aã]o\s*confirmado/i.test(raw) || /not\s*confirmed/i.test(raw) || /confirm\s*your\s*email/i.test(raw)) {
          friendly = 'Email não confirmado. Verifique sua caixa de entrada.';
        } else if (/invalid\s*login\s*credentials/i.test(raw)) {
          friendly = 'Email ou senha incorretos.';
        } else if (/too\s*many\s*requests|rate\s*limit/i.test(raw)) {
          friendly = 'Muitas tentativas. Aguarde alguns minutos.';
        } else if (/network|fetch|timeout/i.test(raw)) {
          friendly = 'Falha de rede. Verifique sua conexão.';
        } else if (raw) {
          friendly = raw;
        }

        setError(friendly);
        toast.error(friendly);
        await trackAnimation;
        await animateTrackTo(initialProgress, 600);
        return;
      }

      toast.success('Login realizado com sucesso!');
      await trackAnimation;
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Determine role directly from profile to avoid stale roleRef
      let resolvedRole: 'admin' | 'producer' = 'producer';
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();
          if ((profile as any)?.role === 'admin') {
            resolvedRole = 'admin';
          }
        }
      } catch (_) {
        // Fallback to last known role if direct check fails
        resolvedRole = roleRef.current === 'admin' ? 'admin' : 'producer';
      }

      const destination = resolvedRole === 'producer' ? '/producer-dashboard' : '/';
      setLocation(destination);
    } catch (loginError) {
      console.error(loginError);
      setError('Erro ao fazer login. Verifique suas credenciais.');
      toast.error('Falha na autenticação. Tente novamente.');
      await trackAnimation;
      await animateTrackTo(initialProgress, 600);
    } finally {
      setLoading(false);
    }
  };

  const stepProgress = (delta: number) => {
    if (isAnimatingTrack) {
      return;
    }
    setTrackProgress((prev) => clamp(prev + delta, 0, 100));
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWavePhase((prev) => prev + 0.08);
    }, 80);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (formVisible) {
      emailInputRef.current?.focus();
    }
  }, [formVisible]);

  const animatedBars = useMemo(() => {
    return WAVEFORM_BARS.map((height, index) => {
      const wave = Math.sin(wavePhase + index * 0.45) * 0.15;
      const scale = 0.9 + wave;
      return Math.max(4, height * scale);
    });
  }, [wavePhase]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03010b] text-white">
      <div className="absolute inset-0">
        <div className="absolute -top-32 -right-10 h-80 w-80 rounded-full bg-purple-500/30 blur-[140px]" />
        <div className="absolute -bottom-48 -left-16 h-[28rem] w-[28rem] rounded-full bg-sky-500/20 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1a103f_0%,transparent_62%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-black/70 px-4 py-16">
        <motion.h1
          className="text-center text-4xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_10px_30px_rgba(105,86,255,0.45)] md:text-5xl"
          style={{ textShadow: '1px 1px 3px rgba(45, 7, 83, 1)' }}
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          Bem-Vindo ao Portal UNK
        </motion.h1>

        <motion.div
          className="mt-11 flex flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_15px_40px_-25px_rgba(118,80,255,0.8)]">
            {logoError ? (
              <span className="text-base font-semibold tracking-[0.3em] text-white/70">UNK</span>
            ) : (
              <img
                src={appLogo}
                alt="Logotipo Portal UNK"
                className="h-10 w-10 rounded-2xl object-contain"
                draggable={false}
                onError={() => setLogoError(true)}
              />
            )}
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-md"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: 'easeOut' }}
        >
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_35px_90px_-45px_rgba(82,44,198,0.9)]">
            <div className="absolute -top-28 left-0 h-48 w-48 rounded-full bg-purple-400/40 blur-[150px]" />
            <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-cyan-400/30 blur-[140px]" />

            <div className="relative px-10 pt-9 pb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">Portal UNK</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Assessoria Musical</h2>
                <p className="text-[10px] uppercase tracking-[0.55em] text-white/40">Profissional</p>
              </div>

              <div className="mt-0.5 flex h-24 items-end justify-center gap-[6px] rounded-2xl px-4 pb-4 pt-6" style={{ backgroundColor: 'rgba(30, 22, 54, 0.8)' }}>
                {animatedBars.map((height, index) => (
                  <span
                    key={index}
                    className="w-[6px] rounded-t-full bg-gradient-to-t from-cyan-300 via-purple-400 to-fuchsia-500"
                    style={{ height: `${height.toFixed(2)}px`, opacity: Math.max(0.4, 0.95 - index * 0.013) }}
                  />
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-white/40">
                  <span>0:00</span>
                  <span>3:00</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={trackProgress}
                  onChange={(event) => setTrackProgress(Number(event.target.value))}
                  disabled={loading || isAnimatingTrack}
                  className="w-full appearance-none rounded-full border border-[rgba(105,100,100,1)] accent-white/90 [&::-webkit-slider-runnable-track]:h-1 [&::-moz-range-track]:h-1 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Andamento da faixa"
                />
              </div>
            </div>

            <div className="relative space-y-6 border-t border-white/10 bg-black/40 px-10 pb-10 pt-8">
              <AnimatePresence initial={false}>
                {formVisible && (
                  <motion.div
                    key="credentials"
                    className="space-y-4"
                    initial={{ opacity: 0, y: -24, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -24, height: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <div className="relative">
                      <label htmlFor="email" className="sr-only">
                        Email
                      </label>
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        ref={emailInputRef}
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-white/40 shadow-inner shadow-black/40 focus:border-white/50 focus:outline-none"
                        placeholder="seu@email.com"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="relative">
                      <label htmlFor="password" className="sr-only">
                        Senha
                      </label>
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-12 text-sm text-white placeholder-white/40 shadow-inner shadow-black/40 focus:border-white/50 focus:outline-none"
                        placeholder="••••••••"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
                        disabled={loading}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {error && (
                      <motion.div
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => stepProgress(-12)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-transform duration-200 hover:scale-105 hover:text-white"
                  aria-label="Retroceder"
                  disabled={loading || isAnimatingTrack}
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <motion.button
                  type={formVisible ? 'submit' : 'button'}
                  onClick={(event) => {
                    if (!formVisible) {
                      event.preventDefault();
                      setFormVisible(true);
                    }
                  }}
                  disabled={loading || isAnimatingTrack || (formVisible && (!email || !password))}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-white/20 via-white/10 to-white/5 text-white shadow-[0_12px_30px_-12px_rgba(143,121,255,0.9)] transition-transform duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Entrar"
                >
                  {loading ? (
                    <motion.div
                      className="h-5 w-5 rounded-full border-[3px] border-white border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <Play className="h-5 w-5" fill="currentColor" />
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => stepProgress(12)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-transform duration-200 hover:scale-105 hover:text-white"
                  aria-label="Avançar"
                  disabled={loading || isAnimatingTrack}
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              disabled={loading || !email}
              onClick={async () => {
                try {
                  const { error: rpErr } = await supabase?.auth?.resetPasswordForEmail(email, {
                    redirectTo: window?.location?.origin + '/login',
                  });
                  if (rpErr) {
                    toast.error(rpErr?.message || 'Falha ao enviar link de recuperaç��o.');
                  } else {
                    toast.success('Enviamos um link de recuperação para seu email.');
                  }
                } catch (resetError) {
                  console.error(resetError);
                  toast.error('Falha ao enviar link de recuperação.');
                }
              }}
              className="text-xs uppercase tracking-[0.3em] text-white/50 transition-colors hover:text-white/80 disabled:opacity-40"
            >
              Esqueci minha senha
            </button>
          </div>
        </motion.form>

        <motion.p
          className="mt-8 text-center text-xs text-white/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Clique em play para fazer login com suas credenciais
        </motion.p>

        <motion.div
          className="mt-4 text-center text-[10px] uppercase tracking-[0.35em] text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          © 2025 UNK Assessoria Musical. Todos os direitos reservados.
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
