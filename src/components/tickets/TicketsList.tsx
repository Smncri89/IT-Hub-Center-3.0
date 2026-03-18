
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Ticket, User, Asset, TicketPriority, TicketStatus, Role } from '@/types';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import Spinner from '@/components/Spinner';
import { ICONS, STATUS_COLORS, PRIORITY_COLORS, TICKET_CATEGORIES } from '@/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import * as api from '@/services/api';

// Helper for CSV parsing (copied from other lists)
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

const NewTicketModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    assets: Asset[];
    defaults?: any; // Accept defaults prop
}> = ({ isOpen, onClose, users, assets, defaults }) => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const { refetchData } = useData();
    const [formData, setFormData] = useState<{
        subject: string;
        description: string;
        priority: TicketPriority;
        category: string;
        subcategory: string;
        asset_id: string;
        assignee_id: string;
        contact_info: string;
        department: string;
        site: string;
        floor: string;
        office: string;
    }>({
        subject: '',
        description: '',
        priority: TicketPriority.Medium,
        category: 'Hardware', // Default
        subcategory: 'Laptop', // Default
        asset_id: '',
        assignee_id: '',
        contact_info: '',
        department: '',
        site: '',
        floor: '',
        office: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);

    useEffect(() => {
        if (isOpen && defaults) {
            setFormData(prev => ({
                ...prev,
                subject: defaults.subject || '',
                category: defaults.category || 'Hardware',
                subcategory: defaults.subcategory || '',
                priority: defaults.priority || TicketPriority.Medium
            }));
        } else if (isOpen && !defaults) {
            // Reset if opening without defaults (e.g. from header button)
             setFormData({
                subject: '',
                description: '',
                priority: TicketPriority.Medium,
                category: 'Hardware',
                subcategory: 'Laptop',
                asset_id: '',
                assignee_id: '',
                contact_info: '',
                department: '',
                site: '',
                floor: '',
                office: '',
            });
        }
    }, [isOpen, defaults]);

    // ... logic for categories/subcategories options ...
    const categories = Object.keys(TICKET_CATEGORIES);
    const subcategories = TICKET_CATEGORIES[formData.category as keyof typeof TICKET_CATEGORIES] || [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };
            if (name === 'category') {
                updates.subcategory = TICKET_CATEGORIES[value as keyof typeof TICKET_CATEGORIES]?.[0] || '';
            }
            return updates;
        });
    };

    const handleSubmit = async () => {
        if (!formData.subject || !formData.description) {
            setError(t('fill required fields'));
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            await api.createTicket(formData, user!, []); // Attachments handled separately usually, passing empty array for now
            refetchData('tickets');
            onClose();
        } catch (e: any) {
            setError(t('unexpected error'));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isRendered) return null;

    const labelStyle = "block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1";
    const inputStyle = "w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

    return (
        <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 transform ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{t('create new ticket')}</h2>
                </header>
                <main className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {error && <p className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
                    <div>
                        <label className={labelStyle}>{t('subject')} *</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label className={labelStyle}>{t('description')} *</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>{t('category')}</label>
                            <select name="category" value={formData.category} onChange={handleChange} className={inputStyle}>
                                {categories.map(c => <option key={c} value={c}>{t(`category ${c.toLowerCase()}`)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>{t('subcategory')}</label>
                            <select name="subcategory" value={formData.subcategory} onChange={handleChange} className={inputStyle}>
                                {subcategories.map(s => <option key={s} value={s}>{t(`subcategory ${formData.category.toLowerCase()} ${s.toLowerCase().replace(/ /g, '_')}`)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>{t('priority')}</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className={inputStyle}>
                                {Object.values(TicketPriority).map(p => <option key={p} value={p}>{t(p.toLowerCase())}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>{t('related asset')}</label>
                            <select name="asset_id" value={formData.asset_id} onChange={handleChange} className={inputStyle}>
                                <option value="">{t('none')}</option>
                                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-neutral-100 dark:border-neutral-700 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3 uppercase tracking-wide">Location & Contact Details</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                             <div>
                                <label className={labelStyle}>{t('contact info')}</label>
                                <input type="text" name="contact_info" value={formData.contact_info} onChange={handleChange} className={inputStyle} placeholder="Phone or Extension" />
                            </div>
                            <div>
                                <label className={labelStyle}>{t('department')}</label>
                                <input type="text" name="department" value={formData.department} onChange={handleChange} className={inputStyle} placeholder="IT, HR, Sales..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelStyle}>{t('site')}</label>
                                <input type="text" name="site" value={formData.site} onChange={handleChange} className={inputStyle} placeholder="Building A" />
                            </div>
                            <div>
                                <label className={labelStyle}>{t('floor')}</label>
                                <input type="text" name="floor" value={formData.floor} onChange={handleChange} className={inputStyle} placeholder="2nd Floor" />
                            </div>
                            <div>
                                <label className={labelStyle}>{t('office')}</label>
                                <input type="text" name="office" value={formData.office} onChange={handleChange} className={inputStyle} placeholder="Room 204" />
                            </div>
                        </div>
                    </div>
                </main>
                <footer className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors">{t('cancel')}</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-500/30 transition-all active:scale-95">
                        {isSaving ? <Spinner size="sm" /> : t('create new ticket')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

const TicketBoard: React.FC<{ tickets: Ticket[], navigate: any, t: any }> = ({ tickets, navigate, t }) => {
    const columns = Object.values(TicketStatus);
    
    return (
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x">
            {columns.map(status => {
                const columnTickets = tickets.filter(t => t.status === status);
                return (
                    <div key={status} className="flex-shrink-0 w-80 snap-center">
                        <div className="flex items-center justify-between mb-4 sticky left-0">
                            <h3 className="font-bold text-neutral-700 dark:text-neutral-200 uppercase text-xs tracking-wider flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status].split(' ')[0]}`}></span>
                                {t(`ticket status ${status.toLowerCase().replace(/ /g, ' ')}`)}
                            </h3>
                            <span className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full">{columnTickets.length}</span>
                        </div>
                        <div className="space-y-3">
                            {columnTickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                                    className={`bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 ${
                                        ticket.priority === 'Urgent' ? 'border-l-red-500 dark:border-l-red-600' :
                                        ticket.priority === 'High' ? 'border-l-orange-500 dark:border-l-orange-600' :
                                        ticket.priority === 'Medium' ? 'border-l-blue-500 dark:border-l-blue-600' :
                                        'border-l-neutral-300 dark:border-l-neutral-600'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-mono text-neutral-400 font-bold">{ticket.id}</span>
                                        {ticket.assignee && (
                                            <img src={ticket.assignee.avatarUrl} alt={ticket.assignee.name} className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-neutral-900" title={ticket.assignee.name} />
                                        )}
                                    </div>
                                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white mb-2 line-clamp-2">{ticket.subject}</h4>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/50">
                                        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                            {React.cloneElement(ICONS.profile as React.ReactElement<{ className?: string }>, { className: "w-3 h-3" })}
                                            <span className="truncate max-w-[80px]">{ticket.requester.name.split(' ')[0]}</span>
                                        </div>
                                        <span className="text-[10px] text-neutral-400">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {columnTickets.length === 0 && (
                                <div className="h-24 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 text-xs font-medium">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

// Defined outside to prevent re-creation on every render
const FilterSelect: React.FC<{name: string, value: string, children: React.ReactNode, label: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void}> = ({name, value, children, label, onChange}) => (
    <div>
        <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{label}</label>
        <select name={name} value={value} onChange={onChange} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 w-full p-2.5 appearance-none text-neutral-900 dark:text-neutral-100">
            {children}
        </select>
    </div>
);

export const TicketsList: React.FC = () => {
    const { t } = useLocalization();
    const navigate = useNavigate();
    const location = useLocation(); // Use useLocation
    const { tickets, assets, users, isLoading, refetchData } = useData();
    const { user } = useAuth();
    const canManage = user?.role === Role.Admin || user?.role === Role.Agent;
    
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDefaults, setModalDefaults] = useState(null);
    
    // Import state
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importStatus, setImportStatus] = useState<{ success: number; errors: string[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isRendered: isImportModalRendered, isAnimating: isImportModalAnimating } = useAnimatedModal(isImportModalOpen);

    // View Mode - Persisted
    const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
        return (localStorage.getItem('ticketsViewMode') as 'list' | 'board') || 'list';
    });

    useEffect(() => {
        localStorage.setItem('ticketsViewMode', viewMode);
    }, [viewMode]);

    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all'
    });

    // Effect to handle navigation state for opening modal (from Dashboard Service Catalog)
    useEffect(() => {
        if (location.state?.openModal) {
            setIsModalOpen(true);
            if (location.state.ticketDefaults) {
                setModalDefaults(location.state.ticketDefaults);
            } else {
                setModalDefaults(null);
            }
            // Clean up state so it doesn't reopen on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const matchesSearch = !debouncedSearchQuery || 
                ticket.subject.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                ticket.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
            const matchesStatus = filters.status === 'all' || ticket.status === filters.status;
            const matchesPriority = filters.priority === 'all' || ticket.priority === filters.priority;
            
            // Permission check: End users see their own, Agents/Admins see all
            const hasPermission = canManage 
                ? true 
                : ticket.requester.id === user?.id;

            return matchesSearch && matchesStatus && matchesPriority && hasPermission;
        });
    }, [tickets, debouncedSearchQuery, filters, user, canManage]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // --- Import/Export ---
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

        const headers = ['id', 'subject', 'description', 'status', 'priority', 'category', 'subcategory', 'requester_email', 'assignee_email', 'created_at', 'updated_at'];
        
        const rows = filteredTickets.map(t => toCsvRow([
            t.id,
            t.subject,
            t.description,
            t.status,
            t.priority,
            t.category,
            t.subcategory,
            t.requester.email,
            t.assignee?.email,
            t.createdAt,
            t.updatedAt
        ]));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
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
    
    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setIsImporting(true);
            setImportStatus({ success: 0, errors: [] });
            setIsImportModalOpen(true);
            
            try {
                const text = await file.text();
                const rows = text.trim().split('\n');
                const headerRow = rows.shift()?.trim() || '';
                const headers = parseCsvRow(headerRow);

                const requiredHeaders = ['subject', 'description', 'requester_email'];
                if (!requiredHeaders.every(h => headers.includes(h))) {
                    setImportStatus({ success: 0, errors: [`Invalid headers. CSV must include: ${requiredHeaders.join(', ')}.`] });
                    setIsImporting(false);
                    return;
                }

                const headerMap = headers.reduce((acc, h, i) => ({ ...acc, [h.trim()]: i }), {} as Record<string, number>);

                const importPromises = rows.map(async (rowStr, index) => {
                    if (!rowStr.trim()) return { status: 'skipped' as const };
                    const row = parseCsvRow(rowStr);
                    try {
                        const requesterEmail = row[headerMap['requester_email']];
                        const requester = users.find(u => u.email === requesterEmail);
                        if (!requester) throw new Error(`Requester email '${requesterEmail}' not found.`);

                        const assigneeEmail = row[headerMap['assignee_email']];
                        const assignee = assigneeEmail ? users.find(u => u.email === assigneeEmail) : undefined;

                        const ticketData = {
                            subject: row[headerMap['subject']],
                            description: row[headerMap['description']],
                            priority: (row[headerMap['priority']] as TicketPriority) || TicketPriority.Medium,
                            category: row[headerMap['category']] || 'Other',
                            subcategory: row[headerMap['subcategory']] || 'Other',
                            assignee_id: assignee?.id
                        };

                        await api.createTicket(ticketData, requester, []); // No attachments for CSV import
                        return { status: 'success' as const };
                    } catch (error: any) {
                        return { status: 'error' as const, message: `Row ${index + 2}: ${error.message}` };
                    }
                });

                const results = await Promise.allSettled(importPromises);
                const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
                const errors = results
                    .filter((r): r is PromiseRejectedResult | { status: 'fulfilled'; value: { status: 'error'; message: string } } => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as any).status === 'error'))
                    .map(r => {
                        if (r.status === 'rejected') {
                            const reason = r.reason;
                            let message = 'An unknown error occurred';
                            if (reason && typeof reason === 'object' && 'message' in reason) {
                                message = String((reason as any).message);
                            } else {
                                message = String(reason);
                            }
                            return message;
                        }
                        return (r.value as any).message;
                    });

                setImportStatus({ success: successCount, errors });
                refetchData('tickets');
            } catch (err: any) {
                setImportStatus({ success: 0, errors: [err.message || 'Failed to process file'] });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    if (isLoading) return <Spinner />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t('tickets')}</h1>
                <div className="flex items-center gap-2">
                    {canManage && (
                        <>
                            <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                {React.cloneElement(ICONS.upload as React.ReactElement<{ className?: string }>, { className: "h-4 w-4"})}
                                <span className="hidden sm:inline">{t('import')}</span>
                            </button>
                            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                {React.cloneElement(ICONS.download as React.ReactElement<{ className?: string }>, { className: "h-4 w-4"})}
                                <span className="hidden sm:inline">{t('export')}</span>
                            </button>
                        </>
                    )}
                    <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg flex text-sm font-medium">
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                        >
                            {t('switch to list view')}
                        </button>
                        <button 
                            onClick={() => setViewMode('board')} 
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                        >
                            {t('switch to board view')}
                        </button>
                    </div>
                    <button onClick={() => { setModalDefaults(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                        {React.cloneElement(ICONS.plus, { className: "h-4 w-4"})}
                        <span>{t('new ticket')}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{t('search')}</label>
                        <div className="relative">
                            <input 
                                type="search" 
                                placeholder={t('ticket search placeholder')} 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100"
                            />
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                {React.cloneElement(ICONS.search, { className: 'w-5 h-5' })}
                            </div>
                        </div>
                    </div>
                    <FilterSelect name="status" value={filters.status} label={t('status')} onChange={handleFilterChange}>
                        <option value="all">{t('all statuses')}</option>
                        {Object.values(TicketStatus).map(s => <option key={s} value={s}>{t(`ticket status ${s.toLowerCase().replace(/ /g, ' ')}`)}</option>)}
                    </FilterSelect>
                    <FilterSelect name="priority" value={filters.priority} label={t('priority')} onChange={handleFilterChange}>
                        <option value="all">{t('all')}</option>
                        {Object.values(TicketPriority).map(p => <option key={p} value={p}>{t(p.toLowerCase())}</option>)}
                    </FilterSelect>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('subject')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('requester')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('priority')}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-neutral-900 dark:text-white">{ticket.subject}</div>
                                            <div className="text-xs text-neutral-500">{ticket.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={ticket.requester.avatarUrl} alt={ticket.requester.name} className="w-8 h-8 rounded-full object-cover" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{ticket.requester.name}</span>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{ticket.requester.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[ticket.status]}`}>
                                                {t(`ticket status ${ticket.status.toLowerCase().replace(/ /g, ' ')}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>
                                                {t(ticket.priority.toLowerCase())}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <Link to={`/tickets/${ticket.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">{t('details')}</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredTickets.length === 0 && (
                        <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">{t('no tickets found filter')}</div>
                    )}
                </div>
            ) : (
                <TicketBoard tickets={filteredTickets} navigate={navigate} t={t} />
            )}

            <NewTicketModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                users={users} 
                assets={assets} 
                defaults={modalDefaults}
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
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
        </div>
    );
};

export default TicketsList;
