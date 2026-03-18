
import React, { useState, useEffect, useMemo } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import { ICONS } from '@/constants';
import { Role } from '@/types';
import ProfileSettings from './ProfileSettings';
import { SecuritySettings } from './SecuritySettings';
import { UsersSettings } from './UsersSettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import ApplicationSettings from './ApplicationSettings';
import PolicySettings from './PolicySettings';
import SLAPolicySettings from './SLAPolicySettings'; 
import BackupSettings from './BackupSettings'; // Import new component
import Spinner from '@/components/Spinner';

const Settings: React.FC = () => {
    const { t } = useLocalization();
    const { user } = useAuth();
    
    const settingsTabs = useMemo(() => [
        { id: 'profile', labelKey: 'settings profile', icon: ICONS.profile, component: <ProfileSettings />, allowedRoles: [Role.Admin, Role.Agent, Role.Member, Role.EndUser] },
        { id: 'security', labelKey: 'settings security', icon: ICONS.security, component: <SecuritySettings />, allowedRoles: [Role.Admin, Role.Agent, Role.Member, Role.EndUser] },
        { id: 'users', labelKey: 'settings users', icon: ICONS.users, component: <UsersSettings />, allowedRoles: [Role.Admin] },
        { id: 'integrations', labelKey: 'settings integrations', icon: ICONS.integrations, component: <IntegrationsSettings />, allowedRoles: [Role.Admin] },
        { id: 'policies', labelKey: 'policies', icon: ICONS.kb, component: <PolicySettings />, allowedRoles: [Role.Admin, Role.Agent] },
        { id: 'sla', labelKey: 'sla policies', icon: ICONS.sla, component: <SLAPolicySettings />, allowedRoles: [Role.Admin] },
        { id: 'backup', labelKey: 'settings backup', icon: ICONS.database, component: <BackupSettings />, allowedRoles: [Role.Admin] }, // Add Backup tab
        { id: 'application', labelKey: 'settings application', icon: ICONS.download, component: <ApplicationSettings />, allowedRoles: [Role.Admin, Role.Agent, Role.Member, Role.EndUser] },
    ], []);

    const accessibleTabs = useMemo(() => {
        if (!user) return [];
        return settingsTabs.filter(tab => tab.allowedRoles.includes(user.role));
    }, [user, settingsTabs]);

    const [activeTab, setActiveTab] = useState(accessibleTabs[0]?.id || 'profile');
    
    useEffect(() => {
        if (!accessibleTabs.find(tab => tab.id === activeTab)) {
            setActiveTab(accessibleTabs[0]?.id || 'profile');
        }
    }, [accessibleTabs, activeTab]);

    const ActiveComponent = useMemo(() => {
        return accessibleTabs.find(tab => tab.id === activeTab)?.component || null;
    }, [activeTab, accessibleTabs]);

    if (!user) {
        return <Spinner />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                <nav className="space-y-1 sticky top-24">
                    {accessibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-left transition-all duration-200 ${
                                activeTab === tab.id
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                            }`}
                        >
                            {React.cloneElement(tab.icon, { className: `w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'}` })}
                            <span>{t(tab.labelKey)}</span>
                        </button>
                    ))}
                </nav>
            </div>
            <div className="md:col-span-3 bg-white dark:bg-neutral-800 rounded-3xl shadow-soft border border-neutral-100 dark:border-neutral-800 p-8 min-h-[600px]">
                {ActiveComponent}
            </div>
        </div>
    );
};

export default Settings;
