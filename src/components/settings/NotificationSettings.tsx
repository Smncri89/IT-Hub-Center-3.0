
import React, { useState } from 'react';
import { useLocalization } from '@/hooks/useLocalization';

const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ id, label, enabled, onChange }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-12 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-gradient-to-r from-primary-600 to-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-all duration-200 ${enabled ? 'translate-x-6' : ''}`}></div>
      </div>
      <span className="ml-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
    </label>
  );
};

const NotificationSettings: React.FC = () => {
  const { t } = useLocalization();
  // These states are for UI demonstration purposes.
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [ticketUpdates, setTicketUpdates] = useState(true);
  const [slaWarnings, setSlaWarnings] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="border-l-4 border-primary-500 pl-3 text-base font-bold text-neutral-900 dark:text-white">{t('settings notifications')}</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">{t('settings notifications desc')}</p>
      </div>

      <div className="bg-white dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl border border-neutral-100 dark:border-neutral-700/50 shadow-sm divide-y divide-neutral-100 dark:divide-neutral-700/50">
        <div className="p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/20 transition-colors rounded-t-2xl">
          <ToggleSwitch id="email-notifications" label={t('notification email')} enabled={emailNotifications} onChange={setEmailNotifications} />
        </div>
        <div className="p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/20 transition-colors">
          <ToggleSwitch id="in-app-notifications" label={t('notification in app')} enabled={inAppNotifications} onChange={setInAppNotifications} />
        </div>
        <div className="p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/20 transition-colors">
          <ToggleSwitch id="ticket-updates" label={t('notification ticket updates')} enabled={ticketUpdates} onChange={setTicketUpdates} />
        </div>
        <div className="p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/20 transition-colors rounded-b-2xl">
          <ToggleSwitch id="sla-warnings" label={t('notification sla warnings')} enabled={slaWarnings} onChange={setSlaWarnings} />
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
