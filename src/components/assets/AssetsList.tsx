
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Asset, AssetStatus, Role, User } from '@/types';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { ICONS, STATUS_COLORS, ASSET_TYPES_CONFIG, ASSET_IMAGE_LIBRARY } from '@/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { useData } from '@/hooks/useData';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { createAsset, updateAsset } from '@/services/api';
import AssetMap from '@/components/maps/AssetMap';

import ImportModal from '@/components/ImportModal';

// --- HELPER: CSV PARSER ---
const parseCsvRow = (row: string): string[] => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values.map(v => v.trim().replace(/^"|"$/g, ''));
};

// --- BULK EDIT MODAL ---
const BulkEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    users: User[];
    onConfirm: (updates: Partial<Asset>) => Promise<void>;
}> = ({ isOpen, onClose, selectedCount, users, onConfirm }) => {
    const { t } = useLocalization();
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);
    const [isSaving, setIsSaving] = useState(false);
    
    // States for fields. Empty string or specific value means "No Change"
    const [status, setStatus] = useState<string>('__NO_CHANGE__');
    const [assignedTo, setAssignedTo] = useState<string>('__NO_CHANGE__');
    const [location, setLocation] = useState<string>('');
    const [changeLocation, setChangeLocation] = useState(false);

    const statusOptions = [
        'Ready to Deploy', 'In Use', 'Pending', 'Out for Repair', 
        'Out for Diagnostics', 'Broken - Not Fixable', 'Lost/Stolen', 'Archived'
    ];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates: Partial<Asset> = {};
            
            if (status !== '__NO_CHANGE__') {
                updates.status = status as AssetStatus;
            }
            
            if (assignedTo !== '__NO_CHANGE__') {
                if (assignedTo === '__UNASSIGN__') {
                    updates.assignedTo = null as any;
                } else {
                    const user = users.find(u => u.id === assignedTo);
                    if (user) updates.assignedTo = user;
                }
            }

            if (changeLocation) {
                updates.location = location;
            }

            await onConfirm(updates);
            onClose();
        } catch (error) {
            console.error("Bulk update failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isRendered) return null;

    const labelStyle = "block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1";
    const inputStyle = "w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition";

    return (
        <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col transition-all duration-300 transform ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        Bulk Edit ({selectedCount} Assets)
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">Select fields to update. Leave as "No Change" to keep current values.</p>
                </header>
                
                <main className="p-6 space-y-4">
                    {/* Status */}
                    <div>
                        <label className={labelStyle}>{t('status')}</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={inputStyle}>
                            <option value="__NO_CHANGE__">-- No Change --</option>
                            {statusOptions.map(s => <option key={s} value={s}>{t(`status ${s.toLowerCase().replace(/ /g, ' ')}`)}</option>)}
                        </select>
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className={labelStyle}>{t('assigned to')}</label>
                        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={inputStyle}>
                            <option value="__NO_CHANGE__">-- No Change --</option>
                            <option value="__UNASSIGN__">Unassign (Clear User)</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    {/* Location */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className={labelStyle}>{t('location')}</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="changeLoc" 
                                    checked={changeLocation} 
                                    onChange={e => setChangeLocation(e.target.checked)}
                                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="changeLoc" className="text-xs text-neutral-500 cursor-pointer">Update Location</label>
                            </div>
                        </div>
                        <input 
                            type="text" 
                            value={location} 
                            onChange={e => setLocation(e.target.value)} 
                            disabled={!changeLocation}
                            placeholder={changeLocation ? "Enter new location" : "Check box to update"} 
                            className={`${inputStyle} ${!changeLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </main>

                <footer className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-500/30 transition-all active:scale-95">
                        {isSaving ? <Spinner size="sm" /> : t('save changes')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

// Reusable Filter Select Component
const FilterSelectWrapper: React.FC<{name: string, value: string, children: React.ReactNode, label: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void}> = ({name, value, children, label, onChange}) => (
    <div>
        <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{label}</label>
        <select name={name} value={value} onChange={onChange} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 w-full p-2.5 appearance-none text-neutral-900 dark:text-neutral-100">
            {children}
        </select>
    </div>
);

export const AssetsList: React.FC = () => {
    const { t } = useLocalization();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { assets, users, isLoading, refetchData } = useData();
    
    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    
    // View Mode: List or Map
    const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
        return (localStorage.getItem('assetsViewMode') as 'list' | 'map') || 'list';
    });

    useEffect(() => {
        localStorage.setItem('assetsViewMode', viewMode);
    }, [viewMode]);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importStatus, setImportStatus] = useState<{ success: number; errors: string[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isRendered: isImportModalRendered, isAnimating: isImportModalAnimating } = useAnimatedModal(isImportModalOpen);

    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        assignedTo: 'all',
    });

    // --- DERIVED DATA & FILTERING ---
    const assetTypes = useMemo(() => [...new Set(assets.map(a => a.type))].sort(), [assets]);
    
    const filteredAssets = useMemo(() => {
        let initialAssets = assets;
        if (user?.role === Role.EndUser) {
            initialAssets = assets.filter(asset => asset.assignedTo?.id === user.id);
        }

        return initialAssets.filter(asset => {
            const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
            const searchMatch = !lowerCaseQuery ||
                (asset.name || '').toLowerCase().includes(lowerCaseQuery) ||
                (asset.model || '').toLowerCase().includes(lowerCaseQuery) ||
                (asset.serialNumber || '').toLowerCase().includes(lowerCaseQuery);
            
            const statusMatch = filters.status === 'all' || asset.status === filters.status;
            const typeMatch = filters.type === 'all' || asset.type === filters.type;
            
            // Assigned Logic: 'all' = everyone, 'unassigned' = no user, specific ID = that user
            const assignedMatch = filters.assignedTo === 'all' ? true :
                filters.assignedTo === 'unassigned' ? !asset.assignedTo :
                asset.assignedTo?.id === filters.assignedTo;
            
            return searchMatch && statusMatch && typeMatch && assignedMatch;
        });
    }, [assets, debouncedSearchQuery, filters, user]);

    // --- METRICS (KPI CARDS) ---
    const metrics = useMemo(() => {
        const totalValue = assets.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
        
        const counts = {
            ready: 0,
            inUse: 0,
            repair: 0
        };

        assets.forEach(a => {
            if (a.status === 'Ready to Deploy') counts.ready++;
            else if (a.status === 'In Use') counts.inUse++;
            else if (a.status === 'Out for Repair' || a.status === 'Out for Diagnostics') counts.repair++;
        });
        
        return {
            total: assets.length,
            totalValue,
            counts
        };
    }, [assets]);

    // --- HANDLERS ---
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleExport = () => {
        const toCsvRow = (items: (string | number | undefined | null)[]) => {
            return items.map(item => {
                const str = String(item || '');
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',');
        };

        const headers = ['id', 'name', 'type', 'model', 'status', 'serial_number', 'purchase_date', 'warranty_end_date', 'assigned_to_email', 'location'];
        const rows = filteredAssets.map(asset => toCsvRow([
            asset.id, asset.name, asset.type, asset.model, asset.status, asset.serialNumber,
            asset.purchaseDate, asset.warrantyEndDate, asset.assignedTo?.email, asset.location
        ]));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `assets_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleImportClick = () => {
        setIsUploadModalOpen(true);
    };

    const handleBulkImport = async (data: any[]) => {
        setImportStatus({ success: 0, errors: [] });
        setIsImportModalOpen(true);

        const requiredHeaders = ['name', 'type', 'status'];
        const headers = Object.keys(data[0] || {});
        if (!requiredHeaders.every(h => headers.includes(h))) {
            setImportStatus({ success: 0, errors: [`Invalid headers. File must include: ${requiredHeaders.join(', ')}.`] });
            return;
        }
        
        const validAssetTypes = Object.keys(ASSET_TYPES_CONFIG);
        const validAssetStatuses = Object.values(ASSET_TYPES_CONFIG).flatMap(config => 
            config.fields.find(f => f.id === 'status')?.options?.map((opt: {value: string}) => opt.value) || []
        ).filter((value, index, self) => self.indexOf(value) === index);

        const importPromises = data.map(async (row, index) => {
            try {
                const assignedToEmail = row['assigned_to_email'];
                let assignedToUser = undefined;
                if (assignedToEmail) {
                    assignedToUser = users.find(u => u.email === assignedToEmail);
                    if (!assignedToUser) throw new Error(`Assigned user '${assignedToEmail}' not found.`);
                }

                const type = row['type'];
                if (!type || !validAssetTypes.includes(type)) throw new Error(`Invalid type '${type}'.`);
                
                const status = row['status'];
                if (!status || !validAssetStatuses.includes(status)) throw new Error(`Invalid status '${status}'.`);

                const quantityStr = row['quantity'];
                let quantity = quantityStr ? parseInt(quantityStr, 10) : (ASSET_TYPES_CONFIG[type as keyof typeof ASSET_TYPES_CONFIG]?.required.includes('quantity') ? 1 : undefined);

                const assetData: Partial<Asset> = {
                    name: row['name'],
                    type: type,
                    status: status as Asset['status'],
                    model: row['model'] || null,
                    serialNumber: row['serial_number'] || null,
                    purchaseDate: row['purchase_date'] || null,
                    warrantyEndDate: row['warranty_end_date'] || null,
                    assignedTo: assignedToUser,
                    location: row['location'] || null,
                    quantity: quantity,
                    phoneNumber: row['phone_number'] || null,
                    carrier: row['carrier'] || null,
                    simSerial: row['sim_serial'] || null,
                    esimSerial: row['esim_serial'] || null,
                    notes: row['notes'] || null,
                };

                await createAsset(assetData);
                return { status: 'success' };
            } catch (error: any) {
                return { status: 'error', message: `Row ${index + 2}: ${error.message}` };
            }
        });

        const results = await Promise.allSettled(importPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
        const errors = results.filter((r): r is PromiseRejectedResult | { status: 'fulfilled'; value: { status: 'error'; message: string } } => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'error'))
            .map(r => {
                if (r.status === 'rejected') {
                    const reason = r.reason;
                    let message = 'An unknown error occurred';
                    if (reason instanceof Error) {
                        message = reason.message;
                    } else if (typeof reason === 'string') {
                        message = reason;
                    } else {
                        message = String(reason as any);
                    }
                    return `Row ${results.indexOf(r) + 2}: ${message}`;
                }
                return r.value.message;
            });

        setImportStatus({ success: successCount, errors });
        refetchData('assets');
    };

    // --- BULK SELECTION ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedAssetIds(filteredAssets.map(a => a.id));
        else setSelectedAssetIds([]);
    };

    const handleSelectOne = (id: string) => {
        setSelectedAssetIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    };

    const handleBulkSave = async (updates: Partial<Asset>) => {
        if (selectedAssetIds.length === 0) return;
        // Execute updates in parallel
        await Promise.all(selectedAssetIds.map(id => updateAsset(id, updates)));
        refetchData('assets');
        setSelectedAssetIds([]); // Clear selection after success
    };

    // --- HELPERS ---
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

    const getStatusTranslationKey = (status: string) => {
        return `status ${status.toLowerCase().replace(/ /g, ' ')}`;
    };

    // Intelligent Image Resolution
    const resolveAssetImage = (asset: Asset) => {
        // 1. Prefer user-uploaded image
        if (asset.image) return asset.image;
        
        const searchText = `${asset.model || ''} ${asset.name || ''} ${asset.type || ''}`.toLowerCase();
        
        // 2. Find best match in library based on keyword scoring
        let bestMatch = null;
        let maxScore = 0;

        for (const key in ASSET_IMAGE_LIBRARY) {
            const entry = ASSET_IMAGE_LIBRARY[key];
            let score = 0;
            
            // Check for exact phrase matches or strong keywords
            for (const keyword of entry.keywords) {
                if (searchText.includes(keyword.toLowerCase())) {
                    score += 2; // Base score for match
                    // Bonus for specific model match
                    if (asset.model?.toLowerCase().includes(keyword.toLowerCase())) score += 3;
                    // Bonus for name match
                    if (asset.name?.toLowerCase().includes(keyword.toLowerCase())) score += 1;
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestMatch = entry.url;
            }
        }

        if (bestMatch) return bestMatch;
        
        // 3. Fallback based on type category
        const typeLower = asset.type.toLowerCase();
        if (typeLower.includes('phone') || typeLower.includes('mobile')) return ASSET_IMAGE_LIBRARY.iphone.url;
        if (typeLower.includes('laptop') || typeLower.includes('pc')) return ASSET_IMAGE_LIBRARY.macbook_pro_16.url;
        if (typeLower.includes('server')) return ASSET_IMAGE_LIBRARY.server_rack.url;
        if (typeLower.includes('monitor')) return ASSET_IMAGE_LIBRARY.monitor.url;
        if (typeLower.includes('printer')) return ASSET_IMAGE_LIBRARY.printer.url;
        if (typeLower.includes('switch')) return ASSET_IMAGE_LIBRARY.switch.url;
        if (typeLower.includes('tablet')) return ASSET_IMAGE_LIBRARY.ipad.url;
        
        // 4. Generic fallback
        return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=100&q=80';
    };

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t('page title assets')}</h1>
                
                <div className="flex gap-2 items-center">
                    {user?.role !== Role.EndUser && (
                        <>
                             {/* List / Map Toggle */}
                            <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg flex text-sm font-medium mr-2">
                                <button 
                                    onClick={() => setViewMode('list')} 
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    List
                                </button>
                                <button 
                                    onClick={() => setViewMode('map')} 
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                    Map
                                </button>
                            </div>

                            {selectedAssetIds.length > 0 && (
                                <button 
                                    onClick={() => setIsBulkEditModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-md transition-all active:scale-95"
                                >
                                    {React.cloneElement(ICONS.edit, { className: "h-4 w-4"})}
                                    <span>Bulk Edit ({selectedAssetIds.length})</span>
                                </button>
                            )}
                            
                            <button onClick={handleImportClick} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                {React.cloneElement(ICONS.upload as React.ReactElement<{ className?: string }>, { className: "h-4 w-4"})}
                                <span>{t('import')}</span>
                            </button>
                            <button onClick={handleExport} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                {React.cloneElement(ICONS.download as React.ReactElement<{ className?: string }>, { className: "h-4 w-4"})}
                                <span>{t('export')}</span>
                            </button>
                            <Link to="/assets/new" className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all hover:-translate-y-0.5 active:scale-95">
                                {React.cloneElement(ICONS.plus as React.ReactElement<{ className?: string }>, { className: "h-5 w-5"})}
                                <span className="hidden sm:inline">{t('add asset')}</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* --- KPI CARDS (Only visible in List Mode) --- */}
            {viewMode === 'list' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* 1. Total Assets */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Assets</span>
                        <div className="p-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300">
                            {React.cloneElement(ICONS.assets, { className: "h-4 w-4" })}
                        </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">{metrics.total}</p>
                </div>

                {/* 2. Total Value */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Value</span>
                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                            {React.cloneElement(ICONS.chart_bar, { className: "h-4 w-4" })}
                        </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">{formatCurrency(metrics.totalValue)}</p>
                </div>

                {/* 3. Ready to Deploy */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider truncate" title="Ready to Deploy">Ready</span>
                        <div className="p-1.5 rounded-lg text-blue-600 bg-blue-100 dark:bg-blue-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">{metrics.counts.ready}</p>
                </div>

                {/* 4. In Use */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">In Use</span>
                        <div className="p-1.5 rounded-lg text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20">
                            {React.cloneElement(ICONS.profile, { className: "h-4 w-4" })}
                        </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">{metrics.counts.inUse}</p>
                </div>

                {/* 5. In Repair */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Repair</span>
                        <div className="p-1.5 rounded-lg text-orange-600 bg-orange-100 dark:bg-orange-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">{metrics.counts.repair}</p>
                </div>

            </div>
            )}

            {/* FILTERS */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{t('search')}</label>
                        <div className="relative">
                            <input
                                type="search"
                                placeholder={t('asset search placeholder')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                {React.cloneElement(ICONS.search as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                            </div>
                        </div>
                    </div>
                    <FilterSelectWrapper name="status" value={filters.status} label={t('status')} onChange={handleFilterChange}>
                        <option value="all">{t('all statuses')}</option>
                        <option value="Ready to Deploy">{t('status ready to deploy')}</option>
                        <option value="In Use">{t('status in use')}</option>
                        <option value="Pending">{t('status pending')}</option>
                        <option value="Out for Repair">{t('status out for repair')}</option>
                        <option value="Out for Diagnostics">{t('status out for diagnostics')}</option>
                        <option value="Broken - Not Fixable">{t('status broken')}</option>
                        <option value="Lost/Stolen">{t('status lost stolen')}</option>
                        <option value="Archived">{t('status archived')}</option>
                    </FilterSelectWrapper>
                    <FilterSelectWrapper name="type" value={filters.type} label={t('asset type')} onChange={handleFilterChange}>
                        <option value="all">{t('all types')}</option>
                        {assetTypes.map(type => <option key={type} value={type}>{t(`asset type ${type.toLowerCase().replace('/','-').replace(/ /g, ' ')}`)}</option>)}
                    </FilterSelectWrapper>
                    <FilterSelectWrapper name="assignedTo" value={filters.assignedTo} label={t('assigned to')} onChange={handleFilterChange}>
                        <option value="all">{t('all users')}</option>
                        <option value="unassigned">{t('unassigned')}</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </FilterSelectWrapper>
                </div>
            </div>

            {/* VIEW CONTENT: LIST or MAP */}
            {viewMode === 'map' ? (
                 <AssetMap assets={filteredAssets} />
            ) : (
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left">
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedAssetIds.length === filteredAssets.length && filteredAssets.length > 0} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700" />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"></th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('asset name')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('asset type')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('assigned to')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('purchase date')}</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {filteredAssets.map(asset => (
                                    <tr key={asset.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedAssetIds.includes(asset.id)} 
                                                onChange={() => handleSelectOne(asset.id)} 
                                                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700" 
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <img 
                                                src={resolveAssetImage(asset)} 
                                                alt={asset.name} 
                                                className="h-10 w-10 rounded-md object-cover bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-neutral-900 dark:text-white">{asset.name}</div>
                                            <div className="text-xs text-neutral-500 font-mono">{asset.assetTag}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{t(`asset type ${asset.type.toLowerCase().replace('/','-').replace(/ /g, ' ')}`)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[asset.status] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                                                {t(getStatusTranslationKey(asset.status))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {asset.assignedTo ? (
                                                <div className="flex items-center gap-3">
                                                    {asset.assignedTo.avatarUrl ? (
                                                        <img src={asset.assignedTo.avatarUrl} alt={asset.assignedTo.name} className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">
                                                            {asset.assignedTo.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{asset.assignedTo.name}</span>
                                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{asset.assignedTo.email}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-neutral-400 italic">{t('unassigned')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                            {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link to={`/assets/${asset.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                                                    {t('details')}
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredAssets.length === 0 && (
                        <div className="p-12 text-center text-neutral-500 dark:text-neutral-400 font-medium">
                            {t('no results found')}
                        </div>
                    )}
                </div>
            )}

            {isImportModalRendered && (
                <div className={`fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex justify-center items-center transition-opacity duration-200 ${isImportModalAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsImportModalOpen(false)}>
                    <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${isImportModalAnimating ? 'scale-100' : 'scale-95'}`} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{t('import status')}</h2>
                        {isImporting ? (
                            <div className="py-12 text-center">
                                <p className="text-neutral-500 mb-4">{t('importing data')}</p>
                                <Spinner />
                            </div>
                        ) : (
                            importStatus && (
                                <div className="mt-4">
                                    <p className="text-emerald-600 font-bold text-lg mb-2">{t('import success', { count: importStatus.success })}</p>
                                    {importStatus.errors.length > 0 && (
                                        <div className="mt-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                                            <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">{t('import errors')}</h3>
                                            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                {importStatus.errors.map((err, i) => <li key={i}>{err}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                        <div className="flex justify-end pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-700">
                            <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2.5 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30">{t('close')}</button>
                        </div>
                    </div>
                </div>
            )}

            <BulkEditModal 
                isOpen={isBulkEditModalOpen}
                onClose={() => setIsBulkEditModalOpen(false)}
                selectedCount={selectedAssetIds.length}
                users={users}
                onConfirm={handleBulkSave}
            />

            <ImportModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onImport={handleBulkImport}
                title={t('Import Assets')}
                expectedColumns={['name', 'type', 'status', 'model', 'serial_number', 'purchase_date', 'warranty_end_date', 'assigned_to_email', 'location', 'quantity', 'phone_number', 'carrier', 'sim_serial', 'esim_serial', 'notes']}
            />
        </div>
    );
};
