
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import Spinner from '@/components/Spinner';
import { Language, User } from '@/types';
import { FLAGS, ICONS } from '@/constants';
import { useData } from '@/hooks/useData';
import * as api from '@/services/api';

// ... (UpdateAvatarModal, ThemeOption, ToggleSwitch components remain mostly the same but I'll refresh the whole file to be safe and clean)

const UpdateAvatarModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => Promise<void>;
  currentUserId: string;
}> = ({ isOpen, onClose, onSave, currentUserId }) => {
  const { t } = useLocalization();
  const { isRendered, isAnimating } = useAnimatedModal(isOpen);
  const [activeTab, setActiveTab] = useState<'preset' | 'upload' | 'url'>('preset');

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const avatars = Array.from({ length: 12 }, (_, i) => `https://picsum.photos/seed/Avatar${i + 1}/100/100`);
  
  useEffect(() => {
    if (!isOpen) {
        // Reset state when modal closes
        setTimeout(() => {
            setFile(null);
            setFilePreview(null);
            setUrl('');
            setError('');
            setActiveTab('preset');
        }, 200); // After animation
    }
  }, [isOpen]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    }
  };

  const handleSave = async () => {
    setError('');
    setIsUploading(true);
    try {
        if (activeTab === 'upload' && file) {
            const newUrl = await api.uploadAvatar(currentUserId, file);
            await onSave(newUrl);
        } else if (activeTab === 'url' && url) {
            await onSave(url);
        } else if (activeTab === 'preset') {
            // Handled by clicking on the image
        }
    } catch (err) {
        console.error("Avatar save failed:", err);
        setError(t('upload failed'));
    } finally {
        setIsUploading(false);
    }
  };
  
  if (!isRendered) return null;

  const TabButton: React.FC<{ tabId: 'preset' | 'upload' | 'url'; children: React.ReactNode }> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`py-2 px-4 text-sm font-medium border-b-2 ${activeTab === tabId ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:border-neutral-300'}`}
    >
      {children}
    </button>
  );

  return (
    <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
      <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold p-6">{t('update avatar')}</h2>
        <div className="border-b border-neutral-200 dark:border-neutral-700 px-6">
            <nav className="flex -mb-px space-x-4">
                <TabButton tabId="preset">{t('tab select preset')}</TabButton>
                <TabButton tabId="upload">{t('tab upload file')}</TabButton>
                <TabButton tabId="url">{t('tab from url')}</TabButton>
            </nav>
        </div>
        
        <div className="p-6 overflow-y-auto min-h-[200px]">
            {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md mb-4">{error}</p>}
            
            {activeTab === 'preset' && (
                <div className="grid grid-cols-4 gap-4">
                    {avatars.map((avatarUrl, index) => (
                        <img key={index} src={avatarUrl} alt={`Avatar ${index + 1}`} className="w-24 h-24 rounded-full cursor-pointer hover:ring-4 hover:ring-primary-500 transition-all" onClick={() => onSave(avatarUrl)} />
                    ))}
                </div>
            )}
            {activeTab === 'upload' && (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center overflow-hidden">
                        {filePreview ? (
                            <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : <span className="text-xs text-neutral-500">{t('preview')}</span>}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">{t('browse files')}</button>
                </div>
            )}
            {activeTab === 'url' && (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center overflow-hidden">
                         {url ? (
                            <img src={url} alt="URL Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
                        ) : <span className="text-xs text-neutral-500">{t('preview')}</span>}
                    </div>
                    <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('image url placeholder')} className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md" />
                </div>
            )}
        </div>

        {(activeTab === 'upload' || activeTab === 'url') && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-600 dark:hover:bg-neutral-500">{t('cancel')}</button>
                <button onClick={handleSave} disabled={isUploading || (activeTab === 'upload' && !file) || (activeTab === 'url' && !url)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">
                    {isUploading ? <Spinner size="sm" /> : t('save avatar')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};


const ThemeOption: React.FC<{value: string, label: string, currentTheme: string, setTheme: (theme: string) => void}> = ({ value, label, currentTheme, setTheme }) => (
    <label className={`block p-4 border rounded-lg cursor-pointer ${currentTheme === value ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300 dark:border-neutral-600'}`}>
        <input type="radio" name="theme" value={value} checked={currentTheme === value} onChange={() => setTheme(value)} className="sr-only" />
        <span className="font-semibold">{label}</span>
    </label>
);

const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ id, label, enabled, onChange }) => {
  return (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer">
       <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
        </span>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
      </div>
    </label>
  );
};


const ProfileSettings: React.FC = () => {
  const { t, language, setLanguage } = useLocalization();
  const { user, updateUser } = useAuth();
  const { refetchData } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const characterLimit = 80;
  
  const [signatureText, setSignatureText] = useState(user?.signatureText || '');
  const [signatureLogo, setSignatureLogo] = useState(user?.signatureLogo || '');
  const [isSignatureSaved, setIsSignatureSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  const [timeDateSettings, setTimeDateSettings] = useState({
    weekStart: user?.weekStart || 'Sunday',
    timeFormat: user?.timeFormat || '12h',
    dateFormat: user?.dateFormat || 'mm/dd/yyyy'
  });
  const [isTimeDateSaved, setIsTimeDateSaved] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
      muteWeekends: user?.muteWeekends || false,
      muteOutsideHours: user?.muteOutsideHours || false,
      quietHoursStart: user?.quietHoursStart || '18:00',
      quietHoursEnd: user?.quietHoursEnd || '09:00',
  });
  const [initialNotificationSettings, setInitialNotificationSettings] = useState(notificationSettings);
  const [isNotificationSettingsSaved, setIsNotificationSettingsSaved] = useState(false);
  
  const [tempMuteSelection, setTempMuteSelection] = useState('');
  const [customMuteDateTime, setCustomMuteDateTime] = useState('');

  useEffect(() => {
    if (user) {
        const settings = {
            muteWeekends: user.muteWeekends || false,
            muteOutsideHours: user.muteOutsideHours || false,
            quietHoursStart: user.quietHoursStart || '18:00',
            quietHoursEnd: user.quietHoursEnd || '09:00',
        };
        setNotificationSettings(settings);
        setInitialNotificationSettings(settings);
    }
  }, [user]);

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.removeItem('theme');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
  }, [theme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
        setTimeout(() => {
             if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }, 0);
    }
  };
  
  const formatTimeAgo = (isoDate: string | undefined, lang: Language) => {
    if (!isoDate) return '';
    try {
        const date = new Date(isoDate);
        const now = new Date();
        const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-seconds, 'second');
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-minutes, 'minute');
        const hours = Math.round(minutes / 60);
        if (hours < 24) return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-hours, 'hour');
        const days = Math.round(hours / 24);
        return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-days, 'day');
    } catch (e) {
        return '';
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus.length > characterLimit) return;
    await updateUser({
        statusMessage: newStatus,
        statusMessageTimestamp: new Date().toISOString()
    });
    refetchData('users');
    setNewStatus('');
  };

  const handleStatusClear = async () => {
      await updateUser({
          statusMessage: '',
          statusMessageTimestamp: undefined,
      });
      refetchData('users');
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSignatureLogo(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setSignatureLogo('');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSaveSignature = async () => {
    await updateUser({ signatureText, signatureLogo });
    refetchData('users');
    setIsSignatureSaved(true);
    setTimeout(() => {
        setIsSignatureSaved(false);
    }, 3000);
  };

  const handleTimeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTimeDateSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTimeDateSettings = async () => {
    await updateUser({
        weekStart: timeDateSettings.weekStart as 'Sunday' | 'Monday',
        timeFormat: timeDateSettings.timeFormat as '12h' | '24h',
        dateFormat: timeDateSettings.dateFormat as 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd'
    });
    refetchData('users');
    setIsTimeDateSaved(true);
    setTimeout(() => {
        setIsTimeDateSaved(false);
    }, 3000);
  };

  const handleNotificationSettingsChange = (field: string, value: any) => {
      setNotificationSettings(prev => ({...prev, [field]: value}));
  };

  const handleSaveNotificationSettings = async () => {
      await updateUser(notificationSettings);
      refetchData('users');
      setInitialNotificationSettings(notificationSettings);
      setIsNotificationSettingsSaved(true);
      setTimeout(() => setIsNotificationSettingsSaved(false), 3000);
  };

  const handleMuteChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const duration = e.target.value;
    setTempMuteSelection(duration);
    
    if (duration === 'custom' || duration === '') return;

    let newMuteUntil: Date | null = new Date();
    if (duration === 'unmute') newMuteUntil = null;
    else if (duration === '30m') newMuteUntil.setMinutes(newMuteUntil.getMinutes() + 30);
    else if (duration === '1h') newMuteUntil.setHours(newMuteUntil.getHours() + 1);
    else if (duration === '4h') newMuteUntil.setHours(newMuteUntil.getHours() + 4);
    else if (duration === 'tomorrow') {
        newMuteUntil.setDate(newMuteUntil.getDate() + 1);
        newMuteUntil.setHours(9, 0, 0, 0);
    }
    
    await updateUser({ muteUntil: newMuteUntil ? newMuteUntil.toISOString() : undefined });
    refetchData('users');
  };

  const handleCustomMuteSave = async () => {
    if (!customMuteDateTime) return;
    await updateUser({ muteUntil: new Date(customMuteDateTime).toISOString() });
    refetchData('users');
    setTempMuteSelection('');
    setCustomMuteDateTime('');
  };

  const hasNotificationChanges = useMemo(() => {
    return JSON.stringify(notificationSettings) !== JSON.stringify(initialNotificationSettings);
  }, [notificationSettings, initialNotificationSettings]);

  if (!user) {
    return <Spinner />;
  }

  const handleAvatarUpdate = async (url: string) => {
    await updateUser({ avatarUrl: url });
    refetchData('users');
    setIsModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <h2 className="text-xl font-semibold">{t('settings profile')}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{t('settings profile desc')}</p>
        
        <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
                <div className="relative group flex-shrink-0">
                    <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full" />
                    <button 
                    onClick={() => setIsModalOpen(true)}
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-all text-white opacity-0 group-hover:opacity-100"
                    aria-label={t('change avatar')}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
                <div>
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-sm text-neutral-500">{user.email}</p>
                    <p className="text-xs mt-1 px-2 py-0.5 inline-block bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full">{t(`role ${user.role.toLowerCase().replace(' ', '-')}`)}</p>
                </div>
            </div>

            <div className="pt-4 border-t dark:border-neutral-700">
                {user.statusMessage ? (
                    <div className="mb-2">
                        <p className="text-sm italic text-neutral-700 dark:text-neutral-300">"{user.statusMessage}"</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{formatTimeAgo(user.statusMessageTimestamp, language)}</p>
                    </div>
                ) : (
                    <p className="text-sm italic text-neutral-500 mb-2">{t('no status set')}</p>
                )}
                <div className="space-y-2">
                    <div className="relative">
                        <input 
                            type="text"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            placeholder={t('whats on your mind')}
                            maxLength={characterLimit}
                            className="w-full px-3 py-2 pr-10 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                         <span className="absolute right-3 top-2.5 text-xs text-neutral-400">{newStatus.length}/{characterLimit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                         <button onClick={handleStatusClear} className="text-xs text-neutral-500 hover:underline">{t('clear')}</button>
                         <button onClick={handleStatusUpdate} disabled={!newStatus} className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-300">
                            {t('set status')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      <div className="md:col-span-2 space-y-8">
        <div className="space-y-4 p-6 border rounded-lg dark:border-neutral-700">
            <h3 className="text-lg font-medium">{t('mute notifications')}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 -mt-3">{t('mute notifications description')}</p>
            {user.muteUntil && new Date(user.muteUntil) > new Date() ? (
                 <div className="flex items-center justify-between">
                     <p className="text-sm text-yellow-600 dark:text-yellow-400">{t('notifications muted until', {time: new Date(user.muteUntil).toLocaleString()})}</p>
                     <button onClick={() => updateUser({ muteUntil: undefined })} className="text-sm font-semibold text-primary-600 hover:underline">{t('unmute')}</button>
                 </div>
            ) : (
                <div className="space-y-2">
                    <select value={tempMuteSelection} onChange={handleMuteChange} className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md">
                        <option value="">{t('select mute duration')}</option>
                        <option value="30m">{t('mute for 30 mins')}</option>
                        <option value="1h">{t('mute for 1 hour')}</option>
                        <option value="4h">{t('mute for 4 hours')}</option>
                        <option value="tomorrow">{t('mute until tomorrow')}</option>
                        <option value="custom">{t('mute custom')}</option>
                    </select>
                    {tempMuteSelection === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input type="datetime-local" value={customMuteDateTime} onChange={e => setCustomMuteDateTime(e.target.value)} className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md"/>
                            <button onClick={handleCustomMuteSave} className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">{t('save')}</button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="space-y-4 p-6 border rounded-lg dark:border-neutral-700">
            <h3 className="text-lg font-medium">{t('settings recurring mute title')}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 -mt-3">{t('settings recurring mute desc')}</p>
            
            <div className="space-y-4">
                <ToggleSwitch id="muteWeekends" label={t('settings mute weekends')} enabled={notificationSettings.muteWeekends} onChange={val => handleNotificationSettingsChange('muteWeekends', val)} />
                <ToggleSwitch id="muteOutsideHours" label={t('settings mute outside hours')} enabled={notificationSettings.muteOutsideHours} onChange={val => handleNotificationSettingsChange('muteOutsideHours', val)} />
            </div>

            {notificationSettings.muteOutsideHours && (
                <div className="grid grid-cols-2 gap-4 items-center pl-4 border-l-2 dark:border-neutral-600">
                    <div>
                        <label htmlFor="quietHoursStart" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('settings quiet hours from')}</label>
                        <input type="time" id="quietHoursStart" value={notificationSettings.quietHoursStart} onChange={e => handleNotificationSettingsChange('quietHoursStart', e.target.value)} className="mt-1 w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="quietHoursEnd" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('settings quiet hours to')}</label>
                        <input type="time" id="quietHoursEnd" value={notificationSettings.quietHoursEnd} onChange={e => handleNotificationSettingsChange('quietHoursEnd', e.target.value)} className="mt-1 w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md text-sm"/>
                    </div>
                </div>
            )}
            
            <p className="text-xs text-neutral-500 italic pt-2">{t('settings sla exception')}</p>

             <div className="flex justify-end items-center mt-4 pt-4 border-t dark:border-neutral-700 gap-4">
                {isNotificationSettingsSaved && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 transition-opacity duration-300">
                        ✓ {t('settings saved successfully')}
                    </span>
                )}
                <button onClick={handleSaveNotificationSettings} disabled={!hasNotificationChanges} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {t('save changes')}
                </button>
            </div>
        </div>
        
        <div className="space-y-4 p-6 border rounded-lg dark:border-neutral-700">
            <h3 className="text-lg font-medium">{t('appearance')}</h3>
            <div className="grid sm:grid-cols-3 gap-4">
                <ThemeOption value="light" label={t('light mode')} currentTheme={theme} setTheme={handleThemeChange} />
                <ThemeOption value="dark" label={t('dark mode')} currentTheme={theme} setTheme={handleThemeChange} />
                <ThemeOption value="system" label={t('system preference')} currentTheme={theme} setTheme={handleThemeChange} />
            </div>
        </div>

        <div className="space-y-4 p-6 border rounded-lg dark:border-neutral-700">
            <h3 className="text-lg font-medium">{t('time date format')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                    <label className="block text-sm font-medium mb-3">{t('week start')}</label>
                    <div className="space-y-2">
                        <label className="flex items-center"><input type="radio" name="weekStart" value="Sunday" checked={timeDateSettings.weekStart === 'Sunday'} onChange={handleTimeDateChange} className="h-4 w-4 text-primary-600"/><span className="ml-3 text-sm">{t('week start sunday')}</span></label>
                        <label className="flex items-center"><input type="radio" name="weekStart" value="Monday" checked={timeDateSettings.weekStart === 'Monday'} onChange={handleTimeDateChange} className="h-4 w-4 text-primary-600"/><span className="ml-3 text-sm">{t('week start monday')}</span></label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-3">{t('time format')}</label>
                    <div className="space-y-2">
                        <label className="flex items-center"><input type="radio" name="timeFormat" value="24h" checked={timeDateSettings.timeFormat === '24h'} onChange={handleTimeDateChange} className="h-4 w-4 text-primary-600"/><span className="ml-3 text-sm">{t('time format 24h')}</span></label>
                        <label className="flex items-center"><input type="radio" name="timeFormat" value="12h" checked={timeDateSettings.timeFormat === '12h'} onChange={handleTimeDateChange} className="h-4 w-4 text-primary-600"/><span className="ml-3 text-sm">{t('time format 12h')}</span></label>
                    </div>
                </div>
            </div>
            <div className="pt-4">
                <label className="block text-sm font-medium mb-3">{t('date format')}</label>
                <div className="space-y-2">
                    <label className="flex items-center"><input type="radio" name="dateFormat" value="mm/dd/yyyy" checked={timeDateSettings.dateFormat === 'mm/dd/yyyy'} onChange={handleTimeDateChange} className="h-4 w-4 text-primary-600"/><span className="ml-3 text-sm">{t('date format mmddyyyy')}</span></label>
                    <label className="flex items-center"><input type="radio" name="dateFormat" value="dd/mm/yyyy" checked={timeDateSettings.dateFormat === 'dd/mm/yyyy'} onChange={handleTimeDateChange} className="h-4 w-4 text-primary-600"/><span className="ml-3 text-sm">{t('date format ddmmyyyy')}</span></label>
                    <label className="flex items-center"><input type="radio" name="dateFormat" value="yyyy/mm/dd" checked={timeDateSettings.dateFormat === 'yyyy/mm/dd'} onChange={handleTimeDateChange} className="h-4 w-4 text-primary-600"/><span className="ml-3 text-sm">{t('date format yyyymmdd')}</span></label>
                </div>
            </div>
            <div className="flex justify-end items-center mt-4 pt-4 border-t dark:border-neutral-700 gap-4">
                {isTimeDateSaved && (<span className="text-sm font-medium text-green-600">✓ {t('settings saved successfully')}</span>)}
                <button onClick={handleSaveTimeDateSettings} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg">{t('save changes')}</button>
            </div>
        </div>
        
        <div className="space-y-4 p-6 border rounded-lg dark:border-neutral-700">
            <h3 className="text-lg font-medium">{t('email signature')}</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="signatureText" className="block text-sm font-medium">{t('signature text')}</label>
                    <textarea id="signatureText" rows={3} value={signatureText} onChange={(e) => setSignatureText(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">{t('upload logo')}</label>
                    <div className="mt-1 flex items-center gap-4">
                        <div className="w-24 h-24 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-md overflow-hidden">
                            {signatureLogo ? <img src={signatureLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" /> : <span className="text-xs">{t('upload logo')}</span>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden"/>
                        <div className="flex flex-col gap-2">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm border rounded-md">{signatureLogo ? t('change') : t('upload logo')}</button>
                            {signatureLogo && <button type="button" onClick={handleRemoveLogo} className="px-3 py-1.5 text-sm text-red-600">{t('remove')}</button>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">{t('signature preview')}</h4>
                <div className="p-4 border rounded-md dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700/50">
                    <div className="flex items-center gap-3">
                        {signatureLogo && <img src={signatureLogo} alt="Logo" className="h-12 w-12 object-contain rounded" />}
                        <div className="w-0.5 h-10 bg-gradient-to-b from-fuchsia-500 to-indigo-500"></div>
                        <div>
                            <p className="font-bold uppercase text-sm">{user.name}</p>
                            <p className="text-xs whitespace-pre-wrap">{signatureText}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end items-center mt-4 gap-4">
                {isSignatureSaved && <span className="text-sm font-medium text-green-600">✓ {t('signature saved successfully')}</span>}
                <button onClick={handleSaveSignature} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg">{t('save signature')}</button>
            </div>
        </div>
      </div>

      <UpdateAvatarModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAvatarUpdate}
        currentUserId={user.id}
      />
    </div>
  );
};

export default ProfileSettings;
