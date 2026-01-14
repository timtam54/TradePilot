'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      console.log('[PWAInstall] Registering service worker...');
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWAInstall] Service worker registered:', registration.scope);

          // Check for updates every hour
          setInterval(() => {
            registration.update().catch((err) => console.error('[PWAInstall] Update check failed:', err));
          }, 60 * 60 * 1000);

          // Listen for service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[PWAInstall] New service worker found...');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWAInstall] New version available');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWAInstall] Service worker registration failed:', error);
        });
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode);

    if (isIOSDevice && !isInStandaloneMode) {
      setTimeout(() => setShowInstallBanner(true), 3000);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem('pwa-install-dismissed')) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-card border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install TradePilot</h3>
          {isIOS ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Install this app on your iPhone:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>
                  Tap the share button{' '}
                  <span className="inline-block align-middle">
                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </span>
                </li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot;</li>
              </ol>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Get quick access to TradePilot from your home screen
              </p>
              <Button onClick={handleInstallClick} size="sm">
                Install App
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
