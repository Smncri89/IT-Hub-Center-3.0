
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Asset, User, Role } from '@/types';
import { getAssetById, deleteAsset, updateAsset, getUsers } from '@/services/api';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { ICONS, ASSET_TYPES_CONFIG } from '@/constants';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { useData } from '@/hooks/useData';
import { calculateCurrentValue } from '@/utils/depreciation';
import * as QRCode from 'qrcode';

const DetailRow: React.FC<{label: string, value?: string, children?: React.ReactNode}> = ({label, value, children}) => (
    <div className="flex justify-between items-start py-2 border-b border-neutral-200 dark:border-neutral-700/50 last:border-b-0">
        <span className="font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
        {value ? <span className="text-right text-neutral-800 dark:text-neutral-200 break-all">{value}</span> : <div className="w-1/2 flex justify-end">{children}</div>}
    </div>
);

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assetName: string;
  isArchive: boolean;
}> = ({ isOpen, onClose, onConfirm, assetName, isArchive }) => {
  const { t } = useLocalization();
  const { isRendered, isAnimating } = useAnimatedModal(isOpen);

  if (!isRendered) return null;

  const title = isArchive ? (assetName === 'Archived' ? t('unarchive asset') : t('archive asset')) : t('delete asset');
  const confirmation = isArchive ? (assetName === 'Archived' ? t('confirm unarchive asset') : t('confirm archive asset')) : t('confirm delete asset');

  return (
    <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
      <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md transition-all duration-300 ${isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">{confirmation}</p>
        <p className="font-semibold text-neutral-800 dark:text-neutral-100">{`"${assetName}"`}</p>
        {!isArchive && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{t('delete warning')}</p>}
        <div className="flex justify-end mt-6 space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100">{t('cancel')}</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-md ${isArchive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}>{isArchive ? (assetName === 'Archived' ? t('unarchive') : t('archive')) : t('delete')}</button>
        </div>
      </div>
    </div>
  );
};

const AssetDetail: React.FC = () => {
    const { assetId } = useParams<{ assetId: string }>();
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { refetchData } = useData();

    const [asset, setAsset] = useState<Asset | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    const canManage = useMemo(() => currentUser?.role === Role.Admin || currentUser?.role === Role.Agent, [currentUser]);
    const canDelete = useMemo(() => currentUser?.role === Role.Admin, [currentUser]);

    const isDepreciable = useMemo(() => {
        if (!asset) return false;
        const config = ASSET_TYPES_CONFIG[asset.type as keyof typeof ASSET_TYPES_CONFIG];
        return !!(config as any)?.lifespanYears;
    }, [asset]);

    const displayedCurrentValue = useMemo(() => {
        if (!asset) return undefined;
        if (asset.currentValue !== null && asset.currentValue !== undefined && !isNaN(asset.currentValue)) {
            return asset.currentValue;
        }
        const calculated = calculateCurrentValue(asset);
        return calculated !== null ? calculated : undefined;
    }, [asset]);

    useEffect(() => {
        if (!assetId) {
            navigate('/assets');
            return;
        }
        const fetchAssetAndUsers = async () => {
            setIsLoading(true);
            try {
                 const [fetchedAsset, usersData] = await Promise.all([
                    getAssetById(assetId),
                    getUsers()
                ]);

                if (fetchedAsset) {
                    setAsset(fetchedAsset);
                    // Generate QR Code
                    const qrUrl = await QRCode.toDataURL(window.location.href);
                    setQrCodeUrl(qrUrl);
                } else {
                    setError(t('asset not found'));
                }
                setAllUsers(usersData);
            } catch (err) {
                setError(t('unexpected error'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssetAndUsers();
    }, [assetId, t, navigate]);

    const handleDelete = async () => {
        if (!asset) return;
        try {
            await deleteAsset(asset.id);
            refetchData('assets');
            navigate('/assets');
        } catch (err) {
            console.error("Failed to delete asset:", err);
            setError(t('unexpected error'));
        }
    };

    const handleArchiveToggle = async () => {
        if (!asset) return;
        const newStatus = asset.status === 'Archived' ? 'Ready to Deploy' : 'Archived';
        try {
            const updatedAsset = await updateAsset(asset.id, { status: newStatus });
            setAsset(updatedAsset);
            refetchData('assets');
            setIsArchiveModalOpen(false);
        } catch (err) {
            console.error("Failed to archive/unarchive asset:", err);
            setError(t('unexpected error'));
        }
    };
    
    const handleFieldUpdate = async (updates: Partial<Asset>) => {
        if (!asset) return;
        try {
            const updatedAsset = await updateAsset(asset.id, updates);
            setAsset(updatedAsset);
            refetchData('assets');
        } catch (err) {
            console.error("Failed to update asset:", err);
            setError(t('unexpected error'));
        }
    };

    const handleRecalculateDepreciation = () => {
        if (!asset) return;
        const newValue = calculateCurrentValue(asset);
        if (newValue !== null) {
            handleFieldUpdate({ currentValue: parseFloat(newValue.toFixed(2)) });
        }
    };

    const handlePrintLabel = () => {
        const printWindow = window.open('', '', 'width=600,height=600');
        if (printWindow && asset) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Asset Label - ${asset.assetTag}</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 20px; }
                        .label { border: 2px solid black; padding: 20px; display: inline-block; border-radius: 10px; }
                        h1 { margin: 0; font-size: 18px; }
                        p { margin: 5px 0; font-size: 14px; }
                        img { width: 150px; height: 150px; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <h1>${asset.name}</h1>
                        <p>ID: ${asset.assetTag}</p>
                        <img src="${qrCodeUrl}" alt="QR Code" />
                        <p>${t('scan to view')}</p>
                    </div>
                    <script>window.print();</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const getWarrantyStatus = (warrantyEndDate?: string) => {
        if (!warrantyEndDate) {
            return (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {t('warranty lifetime')}
                </span>
            );
        }
        const endDate = new Date(warrantyEndDate);
        const now = new Date();
        const isExpired = endDate < now;
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isExpired ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                {isExpired ? t('warranty expired') : t('warranty active')}
            </span>
        );
    };

    const statusOptions = useMemo(() => {
        if (!asset) return [];
        const config = ASSET_TYPES_CONFIG[asset.type as keyof typeof ASSET_TYPES_CONFIG];
        if (config) {
            const statusField = config.fields.find(f => f.id === 'status');
            if (statusField && statusField.type === 'select') {
                return statusField.options;
            }
        }
        return ASSET_TYPES_CONFIG['PC/Laptop'].fields.find(f => f.id === 'status')?.options || [];
    }, [asset]);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || value === null) return 'N/A';
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
    };

    if (isLoading) return <Spinner />;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (!asset) return <div className="text-center p-8">{t('asset not found')}</div>;

    const statusColors: Record<string, string> = {
        'In Use': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'In Stock': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'status_ready_to_assign': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
        'Archived': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    
    const getStatusTranslationKey = (status: string) => {
        if (status === 'status_ready_to_assign') {
            return 'status ready to assign';
        }
        return `status ${status.toLowerCase().replace(/ /g, ' ')}`;
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <Link to="/assets" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">&larr; {t('back to assets')}</Link>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">{asset.name}</h1>
                        <p className="text-neutral-500 dark:text-neutral-400">{asset.model || t(`asset type ${asset.type.toLowerCase().replace('/','-').replace(/ /g, ' ')}`)}</p>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={handlePrintLabel} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h-4v-4H8m13-9l2 2m0 0l-2 2m2-2H6" /></svg>
                                <span>{t('print qr label')}</span>
                            </button>
                            <button onClick={() => navigate(`/assets/edit/${asset.id}`)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                                {React.cloneElement(ICONS.edit, { className: 'h-4 w-4' })}
                                <span>{t('edit asset')}</span>
                            </button>
                             <button onClick={() => setIsArchiveModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-100 bg-yellow-400 rounded-lg hover:bg-yellow-500">
                                {React.cloneElement(ICONS.archive, { className: 'h-4 w-4' })}
                                <span>{asset.status === 'Archived' ? t('unarchive') : t('archive')}</span>
                            </button>
                            {canDelete && (
                                <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                                    {React.cloneElement(ICONS.delete, { className: 'h-4 w-4' })}
                                    <span>{t('delete')}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Details Column */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6">
                             {asset.image && (
                                 <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-700">
                                     <img src={asset.image} alt={asset.name} className="w-full h-auto object-cover max-h-64" />
                                 </div>
                             )}
                             {qrCodeUrl && (
                                <div className="flex flex-col items-center mb-6 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                                    <img src={qrCodeUrl} alt="Asset QR Code" className="w-32 h-32 mb-2 mix-blend-multiply dark:mix-blend-normal dark:invert" />
                                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">{asset.assetTag}</span>
                                </div>
                             )}
                             <div className="space-y-3 text-sm">
                                <DetailRow label={t('status')}>
                                    {canManage ? (
                                        <select
                                            value={asset.status}
                                            onChange={(e) => handleFieldUpdate({ status: e.target.value as Asset['status'] })}
                                            className="w-full p-1 text-sm bg-neutral-100 dark:bg-neutral-700 rounded-md border-transparent focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
                                            aria-label={t('status')}
                                        >
                                            {statusOptions.map((opt: any) => (
                                                <option key={opt.value} value={opt.value}>{t(opt.labelKey.replace(/_/g, ' '))}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[asset.status]}`}>
                                            {t(getStatusTranslationKey(asset.status))}
                                        </span>
                                    )}
                                </DetailRow>
                                <DetailRow label={t('asset type')} value={t(`asset type ${asset.type.toLowerCase().replace('/','-').replace(/ /g, ' ')}`)} />
                                <DetailRow label={t('assigned to')}>
                                    {canManage ? (
                                        <select
                                            value={asset.assignedTo?.id || ''}
                                            onChange={(e) => handleFieldUpdate({ assignedTo: allUsers.find(u => u.id === e.target.value) })}
                                            className="w-full p-1 text-sm bg-neutral-100 dark:bg-neutral-700 rounded-md border-transparent focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
                                            aria-label={t('assigned to')}
                                        >
                                            <option value="">{t('unassigned')}</option>
                                            {allUsers.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span>{asset.assignedTo?.name || t('unassigned')}</span>
                                    )}
                                </DetailRow>
                                <DetailRow label={t('serial number')} value={asset.serialNumber} />
                                <DetailRow label={t('purchase date')} value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'} />
                                <DetailRow label={t('purchase cost')} value={formatCurrency(asset.purchaseCost)} />
                                <DetailRow label={t('current value')}>
                                    <div className="flex items-center gap-2 justify-end">
                                        <span>{formatCurrency(displayedCurrentValue)}</span>
                                        {canManage && isDepreciable && (
                                            <button
                                                onClick={handleRecalculateDepreciation}
                                                className="p-1 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                                title={t('recalculate depreciation')}
                                            >
                                                {React.cloneElement(ICONS.refresh, { className: 'w-4 h-4' })}
                                            </button>
                                        )}
                                    </div>
                                </DetailRow>
                                <DetailRow label={t('warranty status')}>{getWarrantyStatus(asset.warrantyEndDate)}</DetailRow>
                                <DetailRow label={t('warranty end date')} value={asset.warrantyEndDate ? new Date(asset.warrantyEndDate).toLocaleDateString() : 'N/A'} />
                                <DetailRow label={t('location')} value={asset.location} />
                                <DetailRow label={t('quantity')} value={asset.quantity?.toString()} />

                                {/* Smartphone specific fields */}
                                {asset.type === 'Smartphone' && (
                                    <>
                                        <hr className="dark:border-neutral-700" />
                                        <DetailRow label={t('phone number')} value={asset.phoneNumber} />
                                        <DetailRow label={t('carrier')} value={asset.carrier} />
                                        <DetailRow label={t('sim serial')} value={asset.simSerial} />
                                        <DetailRow label={t('esim serial')} value={asset.esimSerial} />
                                    </>
                                )}
                             </div>
                        </div>
                         {asset.notes && (
                            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">{t('notes')}</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">{asset.notes}</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Ticket History */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">{t('ticket history')}</h3>
                            {asset.tickets && asset.tickets.length > 0 ? (
                                <ul className="space-y-4">
                                    {asset.tickets.map(ticket => (
                                        <li key={ticket.id} className="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900/50 hover:bg-neutral-200 dark:hover:bg-neutral-700/50">
                                            <Link to={`/tickets/${ticket.id}`} className="block">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold text-neutral-800 dark:text-neutral-100">{ticket.subject}</p>
                                                     <span className="text-xs font-mono text-primary-500">{ticket.id}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                     <span>{t(`ticket status ${ticket.status.toLowerCase().replace(' ', ' ')}`)}</span>
                                                    <span>&bull;</span>
                                                    <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-neutral-500 py-8">{t('no ticket history')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                assetName={asset.name}
                isArchive={false}
            />
            <DeleteConfirmationModal
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                onConfirm={handleArchiveToggle}
                assetName={asset.status}
                isArchive={true}
            />
        </>
    );
};

export default AssetDetail;
