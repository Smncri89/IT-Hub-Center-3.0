
import React, { useState, useEffect } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { SLAPolicy, TicketPriority } from '@/types';
import { getSLAPolicies, updateSLAPolicies } from '@/services/api';
import Spinner from '@/components/Spinner';
import { PRIORITY_COLORS } from '@/constants';

const SLAPolicySettings: React.FC = () => {
    const { t } = useLocalization();
    const [policies, setPolicies] = useState<SLAPolicy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchPolicies = async () => {
            setIsLoading(true);
            try {
                const data = await getSLAPolicies();
                setPolicies(data);
            } catch (err) {
                console.error('Failed to load SLA policies', err);
                setError(t('failed to load sla policies'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchPolicies();
    }, [t]);

    const handlePolicyChange = (priority: TicketPriority, field: 'response_time_minutes' | 'resolution_time_minutes', value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setPolicies(prev => {
            const existingIndex = prev.findIndex(p => p.priority === priority);
            if (existingIndex > -1) {
                const newPolicies = [...prev];
                newPolicies[existingIndex] = { ...newPolicies[existingIndex], [field]: numValue };
                return newPolicies;
            } else {
                const newPolicy: SLAPolicy = {
                    id: priority,
                    priority,
                    response_time_minutes: field === 'response_time_minutes' ? numValue : 0,
                    resolution_time_minutes: field === 'resolution_time_minutes' ? numValue : 0,
                };
                return [...prev, newPolicy];
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            await updateSLAPolicies(policies);
            setSuccess(t('sla policy saved'));
        } catch (err) {
            console.error('Failed to save SLA policies', err);
            setError(t('failed to save sla policies'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Spinner />;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-1">{t('sla policies')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t('sla policies desc')}</p>

            {error && <p className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">{error}</p>}
            {success && <p className="text-green-500 mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">{success}</p>}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('priority column')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('first response time')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('resolution time')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                        {Object.values(TicketPriority).map(priority => {
                            const policy = policies.find(p => p.priority === priority) || { response_time_minutes: 0, resolution_time_minutes: 0 };
                            return (
                                <tr key={priority}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-transparent shadow-sm ${PRIORITY_COLORS[priority]}`}>
                                            {t(priority.toLowerCase())}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            min="0"
                                            value={policy.response_time_minutes || ''}
                                            onChange={(e) => handlePolicyChange(priority, 'response_time_minutes', e.target.value)}
                                            className="w-24 px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            min="0"
                                            value={policy.resolution_time_minutes || ''}
                                            onChange={(e) => handlePolicyChange(priority, 'resolution_time_minutes', e.target.value)}
                                            className="w-24 px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? <Spinner size="sm" /> : t('save changes')}
                </button>
            </div>
        </div>
    );
};

export default SLAPolicySettings;
