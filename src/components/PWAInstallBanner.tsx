import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { useLocalization } from '@/hooks/useLocalization';
import { ICONS } from '@/constants';

const PWAInstallBanner: React.FC = () => {
  const { t } = useLocalization();
  const { installPrompt, canInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const bannerDismissed = localStorage.getItem('pwaInstallBannerDismissed');
    if (canInstall && !bannerDismissed) {
      setIsVisible(true);
    }
  }, [canInstall]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      handleDismiss();
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-primary-500 text-white rounded-lg shadow-lg p-4 mb-6 flex items-center justify-between animate-modalContentSlideIn">
      <div className="flex items-center">
        <div className="hidden sm:block mr-4">
          {React.cloneElement(ICONS.download, { className: 'w-8 h-8' })}
        </div>
        <div>
          <h3 className="font-bold">{t('install app')}</h3>
          <p className="text-sm opacity-90">{t('settings application desc')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-4 py-2 text-sm font-semibold bg-white text-primary-600 rounded-md hover:bg-primary-100 transition-colors"
        >
          {t('install app')}
        </button>
        <button
          onClick={handleDismiss}
          className="p-2 rounded-full hover:bg-white/20"
          aria-label={t('close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;