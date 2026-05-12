import React, { useState, useEffect } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { getAuditLog, AuditLogEntry } from '@/services/auditService';
import Spinner from '@/components/Spinner';

const ACTION_COLORS: Record<string, string> = {
    create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delete: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    login: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    logout: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
    assign: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    checkin: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    checkout: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    import: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    export: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

const AuditLogSettings: React.FC = () => {
    const { t } = useLocalization();
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('');
    const [filterAction, setFilterAction] = useState<string>('');

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const data = await getAuditLog({
                entityType: filterType || undefined,
                action: filterAction || undefined,
                limit: 200,
            });
            setEntries(data);
            setIsLoading(false);
        };
        load();
    }, [filterType, filterAction]);

    if (isLoading) return <Spinner />;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-1">Audit Log</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">Registro completo di tutte le azioni eseguite nel sistema.</p>

            <div className="flex gap-3 mb-6">
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                    <option value="">Tutti i tipi</option>
                    <option value="ticket">Ticket</option>
                    <option value="asset">Asset</option>
                    <option value="license">Licenza</option>
                    <option value="incident">Incidente</option>
                    <option value="kb_article">Knowledge Base</option>
                    <option value="vendor">Vendor</option>
                    <option value="user">Utente</option>
                    <option value="system">Sistema</option>
                </select>
                <select
                    value={filterAction}
                    onChange={e => setFilterAction(e.target.value)}
                    className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                    <option value="">Tutte le azioni</option>
                    <option value="create">Creazione</option>
                    <option value="update">Modifica</option>
                    <option value="delete">Eliminazione</option>
                    <option value="assign">Assegnazione</option>
                    <option value="checkin">Check-in</option>
                    <option value="checkout">Check-out</option>
                    <option value="import">Import</option>
                    <option value="export">Export</option>
                </select>
            </div>

            {entries.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                    <p className="text-lg font-medium">Nessuna voce nel registro</p>
                    <p className="text-sm mt-1">Le azioni verranno registrate automaticamente.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data/Ora</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Utente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Azione</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Elemento</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Dettagli</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                            {entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800 dark:text-neutral-200 font-medium">
                                        {entry.userName}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${ACTION_COLORS[entry.action] || 'bg-neutral-100 text-neutral-600'}`}>
                                            {entry.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                                        {entry.entityType.replace('_', ' ')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200 max-w-[200px] truncate">
                                        {entry.entityName || entry.entityId || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 max-w-[250px] truncate">
                                        {entry.details || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditLogSettings;
