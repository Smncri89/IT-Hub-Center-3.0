
import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import { ICONS } from '@/constants';
import { Role } from '@/types';

const ApplicationSettings: React.FC = () => {
  const { t } = useLocalization();
  const { installPrompt, canInstall, isInstalled } = usePWAInstall();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.Admin;

  // Banner State
  const [bannerConfig, setBannerConfig] = useState({
    enabled: false,
    message: '',
    type: 'info',
    updatedAt: 0
  });
  const [isBannerSaved, setIsBannerSaved] = useState(false);

  // Load initial banner settings
  useEffect(() => {
    const savedConfig = localStorage.getItem('global_banner_config');
    if (savedConfig) {
        setBannerConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
  };

  const handleBannerSave = () => {
      const configToSave = {
          ...bannerConfig,
          updatedAt: Date.now() // Update timestamp to force re-appearance for users who dismissed old ones
      };
      localStorage.setItem('global_banner_config', JSON.stringify(configToSave));
      setBannerConfig(configToSave);
      setIsBannerSaved(true);
      setTimeout(() => setIsBannerSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* PWA Section */}
      <div>
        <h2 className="text-xl font-semibold mb-1">{t('settings application')}</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t('settings application desc')}</p>
        
        <div className="p-4 border rounded-lg dark:border-neutral-700">
            {isInstalled ? (
            <p className="text-green-600 dark:text-green-400 font-medium text-center">{t('app is installed')}</p>
            ) : canInstall ? (
            <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
                {React.cloneElement(ICONS.download, { className: 'w-5 h-5 mr-2' })}
                {t('install app')}
            </button>
            ) : (
            <p className="text-neutral-500 dark:text-neutral-400 text-center">{t('install not supported')}</p>
            )}
        </div>
      </div>

      {/* Admin Only: Global Announcement Banner Settings */}
      {isAdmin && (
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold mb-1">Global Announcement</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6">Broadcast a message to the dashboard of all users.</p>
              
              <div className="p-6 border rounded-lg dark:border-neutral-700 space-y-4 bg-neutral-50 dark:bg-neutral-900/30">
                  <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Enable Banner</label>
                      <div className="relative inline-block w-12 h-6 align-middle select-none">
                          <input 
                              type="checkbox" 
                              checked={bannerConfig.enabled}
                              onChange={e => setBannerConfig(prev => ({...prev, enabled: e.target.checked}))}
                              className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-300 ease-in-out checked:translate-x-6 checked:bg-primary-600 checked:border-primary-600 border-neutral-300"
                          />
                          <label className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${bannerConfig.enabled ? 'bg-primary-200' : 'bg-neutral-300'}`}></label>
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
                      <textarea 
                          rows={2}
                          value={bannerConfig.message}
                          onChange={e => setBannerConfig(prev => ({...prev, message: e.target.value}))}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., System maintenance scheduled for Saturday..."
                      />
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
                      <select 
                          value={bannerConfig.type}
                          onChange={e => setBannerConfig(prev => ({...prev, type: e.target.value}))}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
                      >
                          <option value="info">Info (Blue)</option>
                          <option value="warning">Warning (Orange)</option>
                          <option value="error">Critical (Red)</option>
                      </select>
                  </div>

                  <div className="flex justify-end items-center gap-3 pt-2">
                      {isBannerSaved && <span className="text-sm text-green-600 font-medium animate-fade-in">Saved & Published!</span>}
                      <button 
                          onClick={handleBannerSave}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                          Save Configuration
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ApplicationSettings;
