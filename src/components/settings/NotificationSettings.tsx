
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
        <div className={`block w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
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
    <div>
      <h2 className="text-xl font-semibold mb-1">{t('settings notifications')}</h2>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t('settings notifications desc')}</p>
      
      <div className="space-y-6">
        <div className="p-4 border rounded-lg dark:border-neutral-700">
          <ToggleSwitch id="email-notifications" label={t('notification email')} enabled={emailNotifications} onChange={setEmailNotifications} />
        </div>
        <div className="p-4 border rounded-lg dark:border-neutral-700">
          <ToggleSwitch id="in-app-notifications" label={t('notification in app')} enabled={inAppNotifications} onChange={setInAppNotifications} />
        </div>
        <div className="p-4 border rounded-lg dark:border-neutral-700">
          <ToggleSwitch id="ticket-updates" label={t('notification ticket updates')} enabled={ticketUpdates} onChange={setTicketUpdates} />
        </div>
        <div className="p-4 border rounded-lg dark:border-neutral-700">
          <ToggleSwitch id="sla-warnings" label={t('notification sla warnings')} enabled={slaWarnings} onChange={setSlaWarnings} />
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
