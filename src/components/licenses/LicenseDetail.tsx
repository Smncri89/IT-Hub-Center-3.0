
import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { License, User, Role } from '@/types';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { useData } from '@/hooks/useData';
import * as api from '@/services/api';
import { ICONS } from '@/constants';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import LicenseFormModal from './LicenseFormModal';

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  licenseName: string;
}> = ({ isOpen, onClose, onConfirm, licenseName }) => {
  const { t } = useLocalization();
  const { isRendered, isAnimating } = useAnimatedModal(isOpen);

  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
      <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md transition-all duration-300 ${isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('delete license')}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">{t('confirm delete license')}</p>
        <p className="font-semibold text-neutral-800 dark:text-neutral-100">{`"${licenseName}"`}</p>
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{t('delete warning')}</p>
        <div className="flex justify-end mt-6 space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100">{t('cancel')}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">{t('delete')}</button>
        </div>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{label: string, value?: string | React.ReactNode, children?: React.ReactNode}> = ({label, value, children}) => (
    <div className="flex justify-between items-center py-3 border-b border-neutral-200 dark:border-neutral-700/50 last:border-b-0">
        <span className="font-medium text-neutral-500 dark:text-neutral-400 text-sm">{label}</span>
        {value ? <span className="text-right text-neutral-900 dark:text-neutral-100 font-medium text-sm">{value}</span> : <div className="w-1/2 flex justify-end">{children}</div>}
    </div>
);

interface LicenseDetailProps {
    licenseIdOverride?: string;
    onCloseDrawer?: () => void;
}

const LicenseDetail: React.FC<LicenseDetailProps> = ({ licenseIdOverride, onCloseDrawer }) => {
    const { t } = useLocalization();
    const { licenseId: paramId } = useParams<{ licenseId: string }>();
    const licenseId = licenseIdOverride || paramId;
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { licenses, users, isLoading, refetchData } = useData();

    const [userToAssign, setUserToAssign] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const license = useMemo(() => licenses.find(l => l.id === licenseId), [licenses, licenseId]);

    const canManage = currentUser?.role === 'Admin' || currentUser?.role === 'Agent';
    const canDelete = currentUser?.role === 'Admin';
    const isAdmin = currentUser?.role === 'Admin';

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || value === null) return 'N/A';
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
    };

    const availableUsers = useMemo(() => {
        if (!license) return [];
        const assignedUserIds = new Set(license.assignments.map(a => a.user.id));
        return users.filter(u => !assignedUserIds.has(u.id));
    }, [license, users]);

    const handleAssignUser = async () => {
        if (!license || !userToAssign) return;
        setIsSubmitting(true);
        try {
            await api.assignUserToLicense(license.id, userToAssign);
            refetchData('licenses');
            setUserToAssign('');
        } catch(e: any) {
            console.error(e);
            alert(t(e.message || 'unexpected error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnassignUser = async (assignmentId: string) => {
        if (!window.confirm(t('confirm unassign user'))) return;
        try {
            await api.unassignUserFromLicense(assignmentId);
            refetchData('licenses');
        } catch(e: any) {
            console.error(e);
            alert(t(e.message || 'unexpected error'));
        }
    };

    const handleDelete = async () => {
        if (!license) return;
        try {
            await api.deleteLicense(license.id);
            refetchData('licenses');
            if (onCloseDrawer) onCloseDrawer();
            else navigate('/licenses');
        } catch (e: any) {
            console.error(e);
            alert(t(e.message || 'unexpected error'));
        }
    };
    
    if (isLoading) return <Spinner />;
    if (!license) return <div className="text-center p-8">{t('license not found')}</div>;

    const usedSeats = license.assignments.length;
    const totalSeats = license.totalSeats;
    const usagePercentage = totalSeats > 0 ? (usedSeats / totalSeats) * 100 : 0;
    
    const isExpired = license.expirationDate && new Date(license.expirationDate) < new Date();

    return (
        <>
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        {!licenseIdOverride && <Link to="/licenses" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">&larr; {t('back to licenses')}</Link>}
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">{license.name}</h1>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">{license.software}</p>
                    </div>
                     <div className="flex items-center gap-2 flex-shrink-0">
                        {canManage && (
                            <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/20">
                                {React.cloneElement(ICONS.edit, { className: 'h-4 w-4' })}
                                <span>{t('edit license')}</span>
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-500/20">
                                {React.cloneElement(ICONS.delete, { className: 'h-4 w-4' })}
                                <span>{t('delete license')}</span>
                            </button>
                        )}
                    </div>
                </div>
                
                <div className={`grid grid-cols-1 ${licenseIdOverride ? '' : 'lg:grid-cols-3'} gap-6`}>
                    <div className={`${licenseIdOverride ? '' : 'lg:col-span-1'} space-y-4`}>
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-100 dark:border-neutral-700/50">
                            <h3 className="text-sm font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-4 tracking-wider">{t('license details')}</h3>
                            <div className="space-y-1">
                                <DetailRow label={t('software')} value={license.software} />
                                <DetailRow label={t('purchase date')} value={license.purchaseDate ? new Date(license.purchaseDate).toLocaleDateString() : 'N/A'} />
                                <DetailRow label={t('expiration date')} value={license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : 'N/A'} />
                                {isAdmin && (
                                    <>
                                        <DetailRow label={t('total cost')} value={formatCurrency(license.totalCost)} />
                                        <DetailRow label={t('cost per seat')} value={formatCurrency(license.costPerSeat)} />
                                    </>
                                )}
                                <DetailRow label={t('status')}>
                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${isExpired ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 ring-1 ring-red-500/20' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 ring-1 ring-emerald-500/20'}`}>
                                        {isExpired ? t('expired') : t('active')}
                                    </span>
                                </DetailRow>
                            </div>
                        </div>
                         <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-100 dark:border-neutral-700/50">
                            <h3 className="text-sm font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-4 tracking-wider">{t('seats status')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-3xl font-black text-neutral-900 dark:text-white">{usedSeats}</span>
                                    <span className="text-sm font-bold text-neutral-500 mb-1">/ {totalSeats}</span>
                                </div>
                                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-primary-500'}`} style={{ width: `${usagePercentage}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-neutral-400 uppercase tracking-wide">
                                    <span>{t('used')}</span>
                                    <span>{t('total')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${licenseIdOverride ? '' : 'lg:col-span-2'} bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700/50 p-6`}>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
                            {t('assigned users')}
                            <span className="text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full">{license.assignments.length}</span>
                        </h3>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {license.assignments.length > 0 ? license.assignments.map(a => (
                                <div key={a.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <img src={a.user.avatarUrl} alt={a.user.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-700 shadow-sm" />
                                        <div>
                                            <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{a.user.name}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{a.user.email}</p>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <button onClick={() => handleUnassignUser(a.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" title={t('unassign')}>
                                            {React.cloneElement(ICONS.delete, { className: 'w-4 h-4' })}
                                        </button>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900/30 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
                                    <p className="text-neutral-500 font-medium">{t('no users assigned')}</p>
                                </div>
                            )}
                        </div>

                        {canManage && usedSeats < totalSeats && (
                            <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-700">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">{t('assign user')}</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-grow">
                                        <select value={userToAssign} onChange={e => setUserToAssign(e.target.value)} className="w-full pl-4 pr-10 py-2.5 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none text-neutral-700 dark:text-neutral-200">
                                            <option value="">{t('select user')}...</option>
                                            {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                        </div>
                                    </div>
                                    <button onClick={handleAssignUser} disabled={isSubmitting || !userToAssign} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/20 transition-all active:scale-95">
                                        {isSubmitting ? <Spinner size="sm"/> : t('assign')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <LicenseFormModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                licenseToEdit={license}
            />
            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                licenseName={license.name}
            />
        </>
    );
};

export default LicenseDetail;
