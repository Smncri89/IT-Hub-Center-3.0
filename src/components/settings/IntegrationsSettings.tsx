
import React, { useState, useEffect, useMemo } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import { ICONS } from '@/constants';
import { Integration } from '@/types';
import * as api from '@/services/api';
import Spinner from '@/components/Spinner';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';

const availableServices = [
    { id: 'slack', name: 'Slack', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/slack.svg" alt="Slack" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration slack desc', url: 'https://slack.com' },
    { id: 'jira', name: 'Jira', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/jira.svg" alt="Jira" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration jira desc', url: 'https://www.atlassian.com/software/jira' },
    { id: 'github', name: 'GitHub', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/github.svg" alt="GitHub" className="w-12 h-12 dark:invert" referrerPolicy="no-referrer" />, descKey: 'integration github desc', url: 'https://github.com' },
    { id: 'datadog', name: 'Datadog', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/datadog.svg" alt="Datadog" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration datadog desc', url: 'https://www.datadoghq.com' },
    { id: 'zendesk', name: 'Zendesk', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/zendesk.svg" alt="Zendesk" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration zendesk desc', url: 'https://www.zendesk.com' },
    { id: 'zapier', name: 'Zapier', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/zapier.svg" alt="Zapier" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration zapier desc', url: 'https://zapier.com' },
    { id: 'msteams', name: 'Microsoft Teams', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/microsoft-teams.svg" alt="Microsoft Teams" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration msteams desc', url: 'https://www.microsoft.com/en-us/microsoft-teams/group-chat-software' },
    { id: 'pagerduty', name: 'PagerDuty', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/pagerduty.svg" alt="PagerDuty" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration pagerduty desc', url: 'https://www.pagerduty.com' },
    { id: 'okta', name: 'Okta', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/okta.svg" alt="Okta" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration okta desc', url: 'https://www.okta.com' },
    { id: 'onepassword', name: '1Password', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/1password.svg" alt="1Password" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration onepassword desc', url: 'https://1password.com' },
    { id: 'salesforce', name: 'Salesforce', logo: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/salesforce/salesforce-original.svg" alt="Salesforce" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration salesforce desc', url: 'https://www.salesforce.com' },
    { id: 'clickup', name: 'ClickUp', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/clickup.svg" alt="ClickUp" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration clickup desc', url: 'https://clickup.com' },
    { id: 'telegram', name: 'Telegram', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/telegram.svg" alt="Telegram" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration telegram desc', url: 'https://telegram.org' },
    { id: 'whatsapp', name: 'WhatsApp', logo: <img src="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/whatsapp.svg" alt="WhatsApp" className="w-12 h-12" referrerPolicy="no-referrer" />, descKey: 'integration whatsapp desc', url: 'https://www.whatsapp.com/business' },
];

const ManageConnectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    service: typeof availableServices[0];
    initialApiKey: string;
    onSave: (service: string, apiKey: string) => Promise<void>;
    onDelete: (service: string) => Promise<void>;
}> = ({ isOpen, onClose, service, initialApiKey, onSave, onDelete }) => {
    const { t } = useLocalization();
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);

    useEffect(() => {
        if (isOpen) setApiKey(initialApiKey);
    }, [isOpen, initialApiKey]);
    
    const handleSave = async () => {
        setIsSaving(true);
        await onSave(service.id, apiKey);
        setIsSaving(false);
        onClose();
    };
    
    const handleDelete = async () => {
        if (window.confirm(t('confirm disconnect', { service: service.name }))) {
            setIsDeleting(true);
            await onDelete(service.id);
            setIsDeleting(false);
            onClose();
        }
    };

    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4">{t('manage connection to', { service: service.name })}</h2>
                <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">{t('api key')}</label>
                    <input
                        type="password"
                        id="api-key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={t('enter api key', { service: service.name })}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md"
                    />
                </div>
                <div className="flex justify-between items-center mt-6">
                    <button onClick={handleDelete} disabled={isDeleting || !initialApiKey} className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50 disabled:opacity-50">
                         {isDeleting ? <Spinner size="sm"/> : t('disconnect')}
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-600">{t('cancel')}</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">
                            {isSaving ? <Spinner size="sm"/> : t('save changes')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SuggestIntegrationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);
    const [integrationName, setIntegrationName] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIntegrationName('');
            setReason('');
            setIsSubmitting(false);
            setIsSuccess(false);
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!integrationName.trim()) return;
        setIsSubmitting(true);
        setError('');
        try {
            await api.submitIntegrationSuggestion(integrationName, reason);
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000); // Auto-close after 2 seconds
        } catch (err: any) {
            console.error("Error submitting integration suggestion:", err);
            setIsSubmitting(false);
            setError(t('failed to submit suggestion'));
        }
    };

    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4">{t('suggest integration title')}</h2>
                {isSuccess ? (
                    <div className="text-center py-8">
                        <p className="text-green-600 dark:text-green-400 font-medium">{t('suggestion thanks')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md">{error}</p>}
                        <div>
                            <label htmlFor="integration-name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">{t('integration name')}</label>
                            <input
                                type="text"
                                id="integration-name"
                                value={integrationName}
                                onChange={(e) => setIntegrationName(e.target.value)}
                                placeholder="e.g., Trello"
                                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="integration-reason" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">{t('integration reason')}</label>
                            <textarea
                                id="integration-reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md"
                            />
                        </div>
                        <div className="flex justify-end items-center mt-6 gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-600">{t('cancel')}</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">
                                {isSubmitting ? <Spinner size="sm"/> : t('submit suggestion')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};


export const IntegrationsSettings: React.FC = () => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedService, setSelectedService] = useState<typeof availableServices[0] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

    useEffect(() => {
        const fetchIntegrations = async () => {
            setIsLoading(true);
            try {
                const data = await api.getIntegrations();
                setIntegrations(data);
            } catch (err: any) {
                setError(t(err.message));
            } finally {
                setIsLoading(false);
            }
        };
        fetchIntegrations();
    }, [t]);
    
    const refetch = async () => {
        try {
            const data = await api.getIntegrations();
            setIntegrations(data);
        } catch (err: any) {
             setError(t(err.message));
        }
    };

    const handleSave = async (serviceId: string, apiKey: string) => {
        if (!user) return;
        try {
            await api.saveIntegration(user.id, serviceId, apiKey);
            refetch();
        } catch(e: any) {
            setError(t(e.message));
        }
    };
    
    const handleDelete = async (serviceId: string) => {
        if (!user) return;
        try {
            await api.deleteIntegration(user.id, serviceId);
            refetch();
        } catch(e: any) {
            setError(t(e.message));
        }
    };
    
    const openModal = (service: typeof availableServices[0]) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const filteredServices = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return availableServices.filter(s => s.name.toLowerCase().includes(lowercasedQuery));
    }, [searchQuery]);

    if (isLoading) return <Spinner />;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-1">{t('settings integrations')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t('settings integrations desc')}</p>
            {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
            
             <div className="mb-6">
                <input 
                    type="search"
                    placeholder={t('integration search placeholder')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm px-3 py-2 bg-white dark:bg-neutral-700/50 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredServices.map(service => {
                    const integration = integrations.find(i => i.service_name === service.id);
                    const isConnected = !!integration;
                    return (
                        <div key={service.id} className="border dark:border-neutral-700 rounded-lg p-4 flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">{service.logo}</div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{service.name}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t(service.descKey)}</p>
                            </div>
                            <div className="flex-shrink-0 self-center">
                                <button
                                    onClick={() => openModal(service)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                                        isConnected
                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                        : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                    }`}
                                >
                                    {isConnected ? t('manage') : t('connect')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

             <div className="mt-8 text-center text-sm text-neutral-500">
                <span>{t('cant find integration')}</span>
                <button onClick={() => setIsSuggestModalOpen(true)} className="ml-1 text-primary-600 hover:underline font-medium">{t('suggest one')}</button>
            </div>
            
            {selectedService && (
                <ManageConnectionModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    service={selectedService}
                    initialApiKey={integrations.find(i => i.service_name === selectedService.id)?.api_key || ''}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            )}
             <SuggestIntegrationModal 
                isOpen={isSuggestModalOpen}
                onClose={() => setIsSuggestModalOpen(false)}
            />
        </div>
    );
};
