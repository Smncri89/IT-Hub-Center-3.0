import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Incident, User, Role, TicketPriority } from '@/types';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import Spinner from '@/components/Spinner';
import { ICONS, INCIDENT_STATUS_COLORS, INCIDENT_CATEGORY_COLORS } from '@/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import * as api from '@/services/api';

const INCIDENT_CATEGORIES = [
    'Service Outage',
    'Security Breach',
    'Performance Degradation',
    'Data Loss',
    'Network',
    'Software',
    'Hardware',
    'Password Reset',
    'Other'
];

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

const IncidentFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  incidentToEdit: Incident | null;
  assignableUsers: User[];
}> = ({ isOpen, onClose, incidentToEdit, assignableUsers }) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const { refetchData } = useData();
    const [formData, setFormData] = useState<Partial<Incident>>({
        title: '',
        description: '',
        priority: TicketPriority.Medium,
        category: INCIDENT_CATEGORIES[0],
        status: 'Investigating',
        tags: [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);
    const isEditMode = !!incidentToEdit;

    useEffect(() => {
        if (incidentToEdit) {
            setFormData({
                ...incidentToEdit,
                assignee: incidentToEdit.assignee as any, // Store just the id
            });
        } else {
            setFormData({
                title: '',
                description: '',
                priority: TicketPriority.Medium,
                category: INCIDENT_CATEGORIES[0],
                status: 'Investigating',
                tags: [],
            });
        }
    }, [incidentToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }));
    };

    const handleSave = async () => {
        if (!formData.title || !formData.description || !currentUser) {
            setError(t('fill required fields'));
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            const dataToSave = {
                ...formData,
                assignee: assignableUsers.find(u => u.id === (formData.assignee as any)),
            };

            if (isEditMode && incidentToEdit) {
                await api.updateIncident(incidentToEdit.id, dataToSave);
            } else {
                await api.createIncident(dataToSave, currentUser);
            }
            refetchData('incidents');
            onClose();
        } catch (e) {
            console.error(e);
            setError(t('unexpected error'));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isRendered) return null;

    const labelStyle = "block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1";
    const inputStyle = "w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

    return (
        <div className={`fixed inset-0 bg-black z-40 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 transform ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{isEditMode ? t('edit incident') : t('create incident')}</h2>
                </header>
                <main className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {error && <p className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
                    <div>
                        <label htmlFor="title" className={labelStyle}>{t('title')}*</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="description" className={labelStyle}>{t('description')}*</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} className={inputStyle}></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className={labelStyle}>{t('category')}</label>
                            <select id="category" name="category" value={formData.category} onChange={handleChange} className={inputStyle}>
                                {INCIDENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{t(`incident category ${cat.toLowerCase().replace(/ /g, ' ')}`)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="priority" className={labelStyle}>{t('priority')}</label>
                            <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className={inputStyle}>
                                {(Object.values(TicketPriority) as string[]).map(p => <option key={p} value={p}>{t(p.toLowerCase())}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className={labelStyle}>{t('status')}</label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputStyle}>
                                {['Investigating', 'Identified', 'Monitoring', 'Resolved'].map(s => <option key={s} value={s}>{t(`incident status ${s.toLowerCase()}`)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="assignee" className={labelStyle}>{t('assignee')}</label>
                            <select id="assignee" name="assignee" value={(formData.assignee as any)?.id || ''} onChange={handleChange} className={inputStyle}>
                                <option value="">{t('unassigned')}</option>
                                {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="tags" className={labelStyle}>{t('tags comma separated')}</label>
                        <input type="text" id="tags" name="tags" value={formData.tags?.join(', ') || ''} onChange={handleTagsChange} className={inputStyle} />
                    </div>
                </main>
                <footer className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors">{t('cancel')}</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-500/30 transition-all active:scale-95">
                        {isSaving ? <Spinner size="sm" /> : (isEditMode ? t('save changes') : t('create incident'))}
                    </button>
                </footer>
            </div>
        </div>
    );
};

// Defined outside component to prevent re-renders
const FilterSelect: React.FC<{name: string, value: string, children: React.ReactNode, label: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void}> = ({name, value, children, label, onChange}) => (
    <div>
        <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{label}</label>
        <select name={name} value={value} onChange={onChange} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 w-full p-2.5 appearance-none text-neutral-900 dark:text-neutral-100">
            {children}
        </select>
    </div>
);

export const IncidentsList: React.FC = () => {
    const { t, language } = useLocalization();
    const navigate = useNavigate();
    const { incidents, users, isLoading, refetchData } = useData();
    const { user: currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incidentToEdit, setIncidentToEdit] = useState<Incident | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [filters, setFilters] = useState<{
        category: string;
        priority: string;
        year: string;
        month: string;
        day: string;
    }>({
        category: 'all',
        priority: 'all',
        year: 'all',
        month: 'all',
        day: 'all',
    });

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importStatus, setImportStatus] = useState<{ success: number; errors: string[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isRendered: isImportModalRendered, isAnimating: isImportModalAnimating } = useAnimatedModal(isImportModalOpen);


    const assignableUsers = useMemo(() => users.filter(u => u.role === Role.Admin || u.role === Role.Agent), [users]);
    
    const availableYears: string[] = useMemo(() => {
        const years = new Set(incidents.map(i => new Date(i.createdAt).getFullYear().toString()));
        return Array.from(years).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    }, [incidents]);

    const availableMonths: { value: string; label: string }[] = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            value: (i + 1).toString(),
            label: new Date(2000, i, 1).toLocaleString(language, { month: 'long' })
        }));
    }, [language]);

    const availableDays: string[] = useMemo(() => {
        return Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    }, []);

    const filteredIncidents = useMemo(() => {
        return incidents.filter(incident => {
            const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
            const searchMatch = !lowerCaseQuery ||
                (incident.id || '').toLowerCase().includes(lowerCaseQuery) ||
                (incident.title || '').toLowerCase().includes(lowerCaseQuery) ||
                (incident.tags || []).some(tag => String(tag).toLowerCase().includes(lowerCaseQuery));
            
            const categoryMatch = filters.category === 'all' || incident.category === filters.category;
            const priorityMatch = filters.priority === 'all' || incident.priority === filters.priority;
            
            const createdAt = new Date(incident.createdAt);
            const yearMatch = filters.year === 'all' || createdAt.getFullYear() === parseInt(filters.year, 10);
            const monthMatch = filters.month === 'all' || (createdAt.getMonth() + 1) === parseInt(filters.month, 10);
            const dayMatch = filters.day === 'all' || createdAt.getDate() === parseInt(filters.day, 10);

            return searchMatch && categoryMatch && priorityMatch && yearMatch && monthMatch && dayMatch;
        });
    }, [incidents, debouncedSearchQuery, filters]);
    
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

        const headers = ['id', 'title', 'description', 'status', 'priority', 'category', 'reporter_email', 'assignee_email', 'tags', 'created_at', 'updated_at'];
        
        const rows = filteredIncidents.map(incident => toCsvRow([
            incident.id,
            incident.title,
            incident.description,
            incident.status,
            incident.priority,
            incident.category,
            incident.reporter.email,
            incident.assignee?.email,
            incident.tags.join(';'),
            incident.createdAt,
            incident.updatedAt,
        ]));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `incidents_export_${new Date().toISOString().split('T')[0]}.csv`);
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
        if (!currentUser) return;
        setIsImporting(true);
        setImportStatus({ success: 0, errors: [] });
        setIsImportModalOpen(true);

        try {
            const text = await file.text();
            const rows = text.trim().split('\n');
            const headerRow = rows.shift()?.trim() || '';
            const headers = parseCsvRow(headerRow);
            
            const requiredHeaders = ['title', 'description'];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                setImportStatus({ success: 0, errors: [`Invalid headers. CSV must include: ${requiredHeaders.join(', ')}.`] });
                setIsImporting(false);
                return;
            }
            
            const headerMap = headers.reduce((acc, h, i) => ({ ...acc, [h.trim()]: i }), {} as Record<string, number>);

            const importPromises = rows.map(async (rowStr, index) => {
                if (!rowStr.trim()) return { status: 'skipped' as const };
// FIX: Type error as unknown for safety to prevent crashes on non-Error exceptions.
                try {
                    const row = parseCsvRow(rowStr);
                    
                    const getCell = (header: string): string | undefined => {
                        const idx = headerMap[header];
                        return idx !== undefined ? row[idx] : undefined;
                    };

                    const reporterEmail = getCell('reporter_email');
                    const reporter = (reporterEmail && users.find(u => u.email === reporterEmail)) || currentUser;

                    const assigneeEmail = getCell('assignee_email');
                    const assignee = assigneeEmail ? users.find(u => u.email === assigneeEmail) : undefined;
                    
                    const priorityStr = getCell('priority');
                    const validPriorities = Object.values(TicketPriority) as string[];
                    const priority = validPriorities.includes(priorityStr || '')
                        ? (priorityStr as TicketPriority)
                        : TicketPriority.Medium;

                    const incidentData = {
                        title: getCell('title') || '',
                        description: getCell('description') || '',
                        priority: priority,
                        category: getCell('category') || 'Other',
                        status: (getCell('status') as any) || 'Investigating',
                        assignee: assignee,
                        tags: getCell('tags')?.split(';').map(t => t.trim()).filter(t => !!t) || [],
                    };

                    await api.createIncident(incidentData, reporter);
                    return { status: 'success' as const };
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : String(error);
                    return { status: 'error' as const, message: `Row ${index + 2}: ${msg}` };
                }
            });

            const results = await Promise.allSettled(importPromises);
            const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 'success').length;
            
            const errors = results.map((r, i) => {
                if (r.status === 'fulfilled') {
                    const val = r.value as any;
                    if (val.status === 'error') {
                        return val.message as string;
                    }
                    return null;
                } else {
                    const reason = r.reason;
                    let message = 'An unknown error occurred';
                    if (reason instanceof Error) {
                        message = reason.message;
                    } else if (typeof reason === 'string') {
                        message = reason;
                    } else {
                        try {
                            message = String(reason);
                            if (message === '[object Object]' && reason && typeof reason === 'object') {
                                message = JSON.stringify(reason);
                            }
                        } catch {
                            message = 'Unknown error';
                        }
                    }
                    return `Row ${i + 2}: ${message}`;
                }
            }).filter((e): e is string => e !== null);
            
            setImportStatus({ success: successCount, errors });
// FIX: Type error as unknown for safety and correctly extract the message.
        } catch (err: unknown) {
             let message = '';
             if (err instanceof Error) {
                 message = err.message;
             } else if (typeof err === 'string') {
                 message = err;
             } else {
                 message = String(err);
                 if (message === '[object Object]') {
                     message = JSON.stringify(err);
                 }
             }
             setImportStatus({ success: 0, errors: [message] });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            refetchData('incidents');
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Spinner /></div>;
    }
    
    const canCreate = currentUser?.role === Role.Admin || currentUser?.role === Role.Agent;
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{t('page title incidents')}</h1>
                {canCreate && (
                     <div className="flex items-center gap-2">
                        <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-600">
                            {React.cloneElement(ICONS.upload as React.ReactElement<{ className?: string }>, { className: "h-4 w-4"})}
                            <span>{t('import')}</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={e => {if(e.target.files?.[0]) handleFileImport(e.target.files[0])}} />
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-600">
                            {React.cloneElement(ICONS.download as React.ReactElement<{ className?: string }>, { className: "h-4 w-4"})}
                            <span>{t('export')}</span>
                        </button>
                        <button onClick={() => { setIncidentToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                            {React.cloneElement(ICONS.plus as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                            <span>{t('create incident')}</span>
                        </button>
                    </div>
                )}
            </div>

             <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-2">
                         <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{t('search')}</label>
                         <div className="relative">
                            <input type="search" placeholder={t('incident search placeholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100"/>
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                {React.cloneElement(ICONS.search as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                            </div>
                        </div>
                    </div>
                    <FilterSelect name="category" value={filters.category} label={t('category')} onChange={handleFilterChange}>
                        <option value="all">{t('all categories')}</option>
                        {INCIDENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{t(`incident category ${cat.toLowerCase().replace(/ /g, ' ')}`)}</option>)}
                    </FilterSelect>
                    <FilterSelect name="year" value={filters.year} label={t('year')} onChange={handleFilterChange}>
                        <option value="all">{t('all years')}</option>
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </FilterSelect>
                    <FilterSelect name="month" value={filters.month} label={t('month')} onChange={handleFilterChange}>
                        <option value="all">{t('all months')}</option>
                        {availableMonths.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                    </FilterSelect>
                    <FilterSelect name="day" value={filters.day} label={t('day')} onChange={handleFilterChange}>
                        <option value="all">{t('all days')}</option>
                        {availableDays.map(day => <option key={day} value={day}>{day}</option>)}
                    </FilterSelect>
                </div>
            </div>

            <div className="space-y-4">
                {filteredIncidents.map(incident => (
                    <div key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)} className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div className="flex-grow">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${INCIDENT_CATEGORY_COLORS[incident.category]}`}>{t(`incident category ${(incident.category || '').toLowerCase().replace(/ /g, ' ')}`)}</span>
                                <h3 className="font-bold text-lg mt-1 text-neutral-900 dark:text-neutral-100">{incident.title}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">{incident.description}</p>
                            </div>
                            <div className="flex-shrink-0 flex sm:flex-col items-end gap-2 sm:gap-0 sm:items-end w-full sm:w-auto">
                                <span className={`px-2 py-1 text-sm font-semibold rounded-full ${INCIDENT_STATUS_COLORS[incident.status]}`}>{t(`incident status ${incident.status.toLowerCase()}`)}</span>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{new Date(incident.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <IncidentFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                incidentToEdit={incidentToEdit}
                assignableUsers={assignableUsers}
            />

            {isImportModalRendered && (
                <div className={`fixed inset-0 bg-black z-40 flex justify-center items-center transition-opacity duration-200 ${isImportModalAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={() => setIsImportModalOpen(false)}>
                    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${isImportModalAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-semibold">{t('import status')}</h2>
                        {isImporting ? (
                            <div className="py-8 text-center">{t('importing data')}<Spinner /></div>
                        ) : (
                            importStatus && (
                                <div className="mt-4">
                                    <p className="text-green-600">{t('import success', { count: importStatus.success })}</p>
                                    {importStatus.errors.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="font-semibold text-red-500">{t('import errors')}</h3>
                                            <ul className="list-disc list-inside mt-2 text-sm text-red-500 max-h-64 overflow-y-auto bg-neutral-100 dark:bg-neutral-700 p-2 rounded">
                                                {importStatus.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                        <div className="flex justify-end pt-4 mt-4 border-t dark:border-neutral-700">
                            <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white">{t('close')}</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
