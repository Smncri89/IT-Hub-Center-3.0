
import React, { useState } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { Role } from '@/types';

const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}> = ({ id, label, enabled, onChange, disabled = false }) => {
  return (
    <label htmlFor={id} className={`flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
        </span>
        <div className="relative">
            <input
            type="checkbox"
            id={id}
            className="sr-only"
            checked={enabled}
            onChange={(e) => !disabled && onChange(e.target.checked)}
            disabled={disabled}
            />
            <div className={`block w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
        </div>
    </label>
  );
};

const PolicySettings: React.FC = () => {
    const { t } = useLocalization();
    const [geofencingEnabled, setGeofencingEnabled] = useState(false);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-1">{t('page title policies')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t('settings policies desc')}</p>

            <div className="space-y-8">
                {/* Asset Policies Card */}
                <div className="p-6 border rounded-lg dark:border-neutral-700">
                    <h3 className="text-lg font-medium">{t('asset policies title')}</h3>
                    <div className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                        <p>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-100">{t(`role ${Role.Admin.toLowerCase()}`)} &amp; {t(`role ${Role.Agent.toLowerCase()}`)}:</span>
                            {' '}{t('asset policies desc admin')}
                        </p>
                        <p>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-100">{t(`role ${Role.EndUser.toLowerCase().replace(/ /g, '-')}`)} &amp; {t(`role ${Role.Member.toLowerCase()}`)}:</span>
                            {' '}{t('asset policies desc user')}
                        </p>
                    </div>
                </div>

                {/* Geolocation Policies Card */}
                <div className="p-6 border rounded-lg dark:border-neutral-700">
                    <h3 className="text-lg font-medium">{t('geolocation policies title')}</h3>
                    <div className="mt-4 space-y-3">
                        <ToggleSwitch 
                            id="geofencing-toggle"
                            label={t('enable geofencing')}
                            enabled={geofencingEnabled}
                            onChange={setGeofencingEnabled}
                            disabled={true}
                        />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('geofencing desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicySettings;
