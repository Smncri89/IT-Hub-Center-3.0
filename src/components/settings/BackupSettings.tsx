
import React, { useState, useRef } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { createBackup, restoreBackup } from '@/services/api';
import Spinner from '@/components/Spinner';
import { ICONS } from '@/constants';

const BackupSettings: React.FC = () => {
    const { t } = useLocalization();
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateBackup = async () => {
        setIsBackingUp(true);
        setStatusMessage('');
        setError('');
        try {
            const blob = await createBackup();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `it_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setStatusMessage(t('backup success'));
        } catch (err) {
            console.error(err);
            setError(t('unexpected error'));
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm(t('restore warning'))) {
            e.target.value = '';
            return;
        }

        setIsRestoring(true);
        setStatusMessage('');
        setError('');
        try {
            await restoreBackup(file);
            setStatusMessage(t('restore success'));
        } catch (err) {
            console.error(err);
            setError(t('restore failed'));
        } finally {
            setIsRestoring(false);
            e.target.value = ''; // Reset input
        }
    };

    // Helper per renderizzare l'icona in sicurezza
    const renderIcon = (icon: React.ReactNode) => {
        if (React.isValidElement(icon)) {
            return React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-4 w-4" });
        }
        return null; // O un'icona di fallback se preferisci
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-1">{t('settings backup')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t('backup restore desc')}</p>

            <div className="space-y-6">
                {/* Backup Section */}
                <div className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-3">{t('backup')}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Download a JSON file containing all your database records. Keep this safe.
                    </p>
                    <button 
                        onClick={handleCreateBackup} 
                        disabled={isBackingUp || isRestoring}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-md shadow-primary-500/20"
                    >
                        {isBackingUp ? <Spinner size="sm" /> : renderIcon(ICONS.download)}
                        <span>{t('create backup')}</span>
                    </button>
                </div>

                {/* Restore Section */}
                <div className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-3">{t('restore')}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Upload a previously created backup file to restore your data.
                    </p>
                    <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 mb-4">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                            {t('restore warning')}
                        </p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                    <button 
                        onClick={handleRestoreClick} 
                        disabled={isBackingUp || isRestoring}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 disabled:opacity-50 transition-colors"
                    >
                        {isRestoring ? <Spinner size="sm" /> : renderIcon(ICONS.upload)}
                        <span>{t('upload backup')}</span>
                    </button>
                </div>

                {/* Status Messages */}
                {statusMessage && (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        {statusMessage}
                    </div>
                )}
                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackupSettings;
    