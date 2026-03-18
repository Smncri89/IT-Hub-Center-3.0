
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { License, Role } from '@/types';
import { useLocalization } from '@/hooks/useLocalization';
import { useData } from '@/hooks/useData';
import Spinner from '@/components/Spinner';
import { ICONS } from '@/constants';
import { useDebounce } from '@/hooks/useDebounce';
import LicenseFormModal from './LicenseFormModal';
import { useAuth } from '@/hooks/useAuth';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { createLicense } from '@/services/api';
import LicenseDetail from './LicenseDetail';

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

// NEW: Centered Modal for License Details (replacing the Drawer)
const LicenseDetailModal: React.FC<{ licenseId: string | null; onClose: () => void }> = ({ licenseId, onClose }) => {
    const { isRendered, isAnimating } = useAnimatedModal(!!licenseId);
    const { t } = useLocalization();
    
    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 transform ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        {t('license details')}
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {licenseId && <LicenseDetail licenseIdOverride={licenseId} onCloseDrawer={onClose} />}
                </div>
            </div>
        </div>
    );
};

const LicensesList: React.FC = () => {
    const { t } = useLocalization();
    const { licenses, isLoading, refetchData } = useData();
    const { user } = useAuth();
    const isAdmin = useMemo(() => user?.role === Role.Admin, [user]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
    
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importStatus, setImportStatus] = useState<{ success: number; errors: string[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isRendered: isImportModalRendered, isAnimating: isImportModalAnimating } = useAnimatedModal(isImportModalOpen);
    
    const [filters, setFilters] = useState({
        status: 'all', 
    });

    const filteredLicenses = useMemo(() => {
        const now = new Date();
        return licenses.filter(license => {
            const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
            const searchMatch = !lowerCaseQuery ||
                license.name.toLowerCase().includes(lowerCaseQuery) ||
                license.software.toLowerCase().includes(lowerCaseQuery);

            let statusMatch = true;
            if (filters.status === 'active') {
                statusMatch = !license.expirationDate || new Date(license.expirationDate) >= now;
            } else if (filters.status === 'expired') {
                statusMatch = license.expirationDate && new Date(license.expirationDate) < now;
            } else if (filters.status === 'low') {
                const usage = license.totalSeats > 0 ? (license.assignments.length / license.totalSeats) : 0;
                statusMatch = usage >= 0.9;
            }
            
            return searchMatch && statusMatch;
        });
    }, [licenses, debouncedSearchQuery, filters.status]);
    
    const { totalCompanyCost, averageCostPerUser, sumOfSeatCosts } = useMemo(() => {
        if (!isAdmin) return { totalCompanyCost: 0, averageCostPerUser: 0, sumOfSeatCosts: 0 };
        
        const totalCost = licenses.reduce((sum, license) => sum + (license.totalCost || 0), 0);
        const seatCostSum = licenses.reduce((sum, license) => sum + (license.costPerSeat || 0), 0);
        
        const uniqueAssignedUserIds = new Set<string>();
        licenses.forEach(license => {
            license.assignments.forEach(assignment => {
                uniqueAssignedUserIds.add(assignment.user.id);
            });
        });

        const avgCost = uniqueAssignedUserIds.size > 0 ? totalCost / uniqueAssignedUserIds.size : 0;
        
        return { totalCompanyCost: totalCost, averageCostPerUser: avgCost, sumOfSeatCosts: seatCostSum };
    }, [licenses, isAdmin]);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || value === null) return 'N/A';
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
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

        const baseHeaders = ['id', 'name', 'software', 'total_seats', 'used_seats', 'purchase_date', 'expiration_date'];
        if (isAdmin) {
            baseHeaders.push('total_cost', 'cost_per_seat');
        }

        const rows = filteredLicenses.map(l => {
            const baseRow = [l.id, l.name, l.software, l.totalSeats, l.assignments.length, l.purchaseDate, l.expirationDate];
            if (isAdmin) {
                baseRow.push(l.totalCost, l.costPerSeat);
            }
            return toCsvRow(baseRow);
        });

        const csvContent = "data:text/csv;charset=utf-8," + [baseHeaders.join(','), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `licenses_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleFileImport = async (file: File) => {
        setIsImporting(true);
        setImportStatus({ success: 0, errors: [] });
        setIsImportModalOpen(true);

        const text = await file.text();
        const rows = text.trim().split('\n');
        const headerRow = rows.shift()?.trim() || '';
        const headers = parseCsvRow(headerRow);
        
        const requiredHeaders = ['name', 'software', 'total_seats'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            setImportStatus({ success: 0, errors: [`Invalid headers. CSV must include: ${requiredHeaders.join(', ')}.`] });
            setIsImporting(false);
            return;
        }
        
        const headerMap = headers.reduce((acc, h, i) => ({ ...acc, [h.trim()]: i }), {} as Record<string, number>);

        const importPromises = rows.map(async (rowStr, index) => {
            if (!rowStr.trim()) return { status: 'skipped' };
            const row = parseCsvRow(rowStr);
            try {
                const totalSeatsStr = row[headerMap['total_seats']];
                const totalSeats = parseInt(totalSeatsStr, 10);
                if (isNaN(totalSeats) || totalSeats < 0) {
                    throw new Error(`Invalid 'total_seats' value: '${totalSeatsStr}'. Must be a non-negative number.`);
                }

                let totalCost: number | undefined = undefined;
                if (isAdmin && row[headerMap['total_cost']]) {
                    const parsedTotalCost = parseFloat(row[headerMap['total_cost']]);
                    if (isNaN(parsedTotalCost) || parsedTotalCost < 0) {
                        throw new Error(`Invalid 'total_cost' value: '${row[headerMap['total_cost']]}'. Must be a non-negative number.`);
                    }
                    totalCost = parsedTotalCost;
                }

                let costPerSeat: number | undefined = undefined;
                if (isAdmin && row[headerMap['cost_per_seat']]) {
                    const parsedCostPerSeat = parseFloat(row[headerMap['cost_per_seat']]);
                    if (isNaN(parsedCostPerSeat) || parsedCostPerSeat < 0) {
                        throw new Error(`Invalid 'cost_per_seat' value: '${row[headerMap['cost_per_seat']]}'. Must be a non-negative number.`);
                    }
                    costPerSeat = parsedCostPerSeat;
                }

                const licenseData: Partial<License> = {
                    name: row[headerMap['name']],
                    software: row[headerMap['software']],
                    totalSeats: totalSeats,
                    purchaseDate: row[headerMap['purchase_date']] || null,
                    expirationDate: row[headerMap['expiration_date']] || null,
                    totalCost: totalCost,
                    costPerSeat: costPerSeat,
                };

                if (!licenseData.name || !licenseData.software || isNaN(licenseData.totalSeats as number)) {
                    throw new Error("Missing or invalid required fields (name, software, total_seats).");
                }
                await createLicense(licenseData);
                return { status: 'success' };
            } catch (error: any) {
                return { status: 'error', message: `Row ${index + 2}: ${error.message}` };
            }
        });

        const results = await Promise.allSettled(importPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
        const errors = results
            .filter((r): r is PromiseRejectedResult | { status: 'fulfilled'; value: { status: 'error'; message: string } } => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'error'))
            .map(r => {
                if (r.status === 'rejected') {
                    const reason = r.reason;
                    let message = 'An unknown error occurred';
                    if (reason && typeof reason === 'object' && 'message' in reason) {
                        message = String((reason as { message: unknown }).message);
                    } else {
                        message = String(reason as any);
                    }
                    return `Row ${results.indexOf(r) + 2}: ${message}`;
                }
                return r.value.message;
            });

        setImportStatus({ success: successCount, errors });
        setIsImporting(false);
        refetchData('licenses');
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const tableHeaders = useMemo(() => {
        const baseHeaders = ['license name', 'software', 'seats status'];
        if (isAdmin) {
            baseHeaders.push('total cost', 'cost per seat');
        }
        baseHeaders.push('expiration date', 'actions');
        return baseHeaders;
    }, [isAdmin]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Spinner /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">{t('page title licenses')}</h1>
                 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm transition-all">
                        {React.cloneElement(ICONS.upload, { className: "h-4 w-4"})}
                        <span>{t('import')}</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={e => {if(e.target.files?.[0]) handleFileImport(e.target.files[0])}} />
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm transition-all">
                        {React.cloneElement(ICONS.download, { className: "h-4 w-4"})}
                        <span>{t('export')}</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        {React.cloneElement(ICONS.plus, { className: 'w-5 h-5' })}
                        <span>{t('new license')}</span>
                    </button>
                </div>
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-neutral-200/50 dark:border-neutral-700/50">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-xl text-primary-600 dark:text-primary-400">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.002 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.002 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('total cost')}</p>
                            <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{formatCurrency(totalCompanyCost)}</p>
                        </div>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-neutral-200/50 dark:border-neutral-700/50">
                         <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('average cost per user')}</p>
                            <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{formatCurrency(averageCostPerUser)}</p>
                        </div>
                    </div>
                     <div className="glass-panel p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-neutral-200/50 dark:border-neutral-700/50">
                         <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('sum of seat costs')}</p>
                            <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{formatCurrency(sumOfSeatCosts)}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-panel p-5 rounded-2xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider block">{t('search')}</label>
                        <div className="relative">
                            <input
                                type="search"
                                placeholder={t('search by name or software')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 transition-all"
                            />
                             <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                                {React.cloneElement(ICONS.search, { className: 'w-5 h-5' })}
                            </div>
                        </div>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider block">{t('status')}</label>
                        <div className="relative">
                            <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 pl-3 pr-8 py-2.5 appearance-none text-neutral-700 dark:text-neutral-200 transition-all hover:border-neutral-300 dark:hover:border-neutral-500">
                                <option value="all">{t('all')}</option>
                                <option value="active">{t('expiration status active')}</option>
                                <option value="expired">{t('expiration status expired')}</option>
                                <option value="low">{t('low licenses')}</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-neutral-800 rounded-3xl shadow-soft border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-neutral-50/50 dark:bg-neutral-900/30 border-b border-neutral-100 dark:border-neutral-800">
                            <tr>
                                {tableHeaders.map(header => (
                                    <th key={header} className={`px-6 py-4 text-left text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ${header === 'actions' ? 'text-right sticky right-0 bg-white dark:bg-neutral-800 z-20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}>{t(header)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredLicenses.map((license, index) => {
                                const usedSeats = license.assignments.length;
                                const totalSeats = license.totalSeats;
                                const isExpired = license.expirationDate && new Date(license.expirationDate) < new Date();
                                const usagePercentage = totalSeats > 0 ? (usedSeats / totalSeats) * 100 : 0;
                                const rowClass = index % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50/30 dark:bg-neutral-800/50';

                                return (
                                <tr key={license.id} className={`${rowClass} hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{license.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{license.software}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                                        <div className="flex items-center gap-3 w-48">
                                            <div className="flex-grow bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                                                <div className={`${usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'} h-2 rounded-full transition-all duration-500`} style={{ width: `${usagePercentage}%` }}></div>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 w-12 text-right">{usedSeats}/{totalSeats}</span>
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-neutral-500 dark:text-neutral-400">{formatCurrency(license.totalCost)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-neutral-500 dark:text-neutral-400">{formatCurrency(license.costPerSeat)}</td>
                                        </>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                            {license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 z-10 ${rowClass} shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)]`}>
                                        <button onClick={() => setSelectedLicenseId(license.id)} className="text-primary-600 dark:text-primary-400 hover:underline font-medium text-sm">
                                            {t('details')}
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Card View for Mobile */}
            <div className="grid grid-cols-1 lg:hidden gap-4">
                {filteredLicenses.map(license => {
                    const usedSeats = license.assignments.length;
                    const totalSeats = license.totalSeats;
                    const isExpired = license.expirationDate && new Date(license.expirationDate) < new Date();
                    const usagePercentage = totalSeats > 0 ? (usedSeats / totalSeats) * 100 : 0;
                    
                    return (
                        <div key={license.id} className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700/50 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white">{license.name}</h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{license.software}</p>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${isExpired ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                    {isExpired ? t('expired') : t('active')}
                                </span>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wide">
                                    <span>{t('seats status')}</span>
                                    <span>{usedSeats} / {totalSeats}</span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'} `} 
                                        style={{ width: `${usagePercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-neutral-100 dark:border-neutral-700/50">
                                    <div>
                                        <p className="text-xs text-neutral-400 uppercase font-bold mb-0.5">{t('total cost')}</p>
                                        <p className="font-mono font-medium">{formatCurrency(license.totalCost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-400 uppercase font-bold mb-0.5">{t('cost per seat')}</p>
                                        <p className="font-mono font-medium">{formatCurrency(license.costPerSeat)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-auto">
                                <span className="text-xs font-medium text-neutral-400">
                                    {t('expires')}: <span className={isExpired ? 'text-red-500 font-bold' : 'text-neutral-600 dark:text-neutral-300'}>{license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : 'N/A'}</span>
                                </span>
                                <button onClick={() => setSelectedLicenseId(license.id)} className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">
                                    {t('details')} &rarr;
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <LicenseFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                licenseToEdit={null}
            />
            
            <LicenseDetailModal
                licenseId={selectedLicenseId}
                onClose={() => setSelectedLicenseId(null)}
            />

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
        </div>
    );
};

export default LicensesList;
