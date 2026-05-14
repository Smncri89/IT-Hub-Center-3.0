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
      handleDismiss();
    } else {
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
    <div className="bg-primary-500 text-white rounded-lg shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="hidden sm:block flex-shrink-0">
          {React.cloneElement(ICONS.download, { className: 'w-7 h-7' })}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm sm:text-base">{t('install app')}</h3>
          <p className="text-xs sm:text-sm opacity-90 line-clamp-2">{t('settings application desc')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
        <button
          onClick={handleInstallClick}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-white text-primary-600 rounded-md hover:bg-primary-100 transition-colors"
        >
          {t('install app')}
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-full hover:bg-white/20"
          aria-label={t('close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;