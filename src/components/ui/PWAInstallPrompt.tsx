import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './button';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ PWA instalado');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showPrompt || localStorage.getItem('pwa-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="glass-card p-4 rounded-2xl border border-primary/30 shadow-glow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Instalar Portal UNK
              </h3>
              <p className="text-xs text-muted-foreground">
                Acesso rápido ao app
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Instale o Portal UNK na tela inicial para acesso offline e notificações.
        </p>
        <div className="flex space-x-2">
          <Button
            onClick={handleInstall}
            className="flex-1 bg-gradient-primary text-white hover:shadow-glow"
            size="sm"
          >
            Instalar
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
            className="glass-button"
          >
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}
