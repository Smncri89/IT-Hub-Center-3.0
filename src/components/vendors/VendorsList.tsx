
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { Vendor, Role, VendorInteraction, VendorComment } from '@/types';
import * as api from '@/services/api';
import Spinner from '@/components/Spinner';
import { ICONS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { useData } from '@/hooks/useData';
import { useDebounce } from '@/hooks/useDebounce';

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

const MiniCalendar: React.FC<{ events: VendorInteraction[], onSelectDate: (date: Date) => void }> = ({ events, onSelectDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); 
    
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();
            const hasEvent = events.some(e => e.scheduledDate && new Date(e.scheduledDate).toDateString() === dateStr);

            days.push(
                <div 
                    key={d} 
                    onClick={() => onSelectDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
                    className={`h-8 w-8 flex items-center justify-center text-xs rounded-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 relative ${hasEvent ? 'font-bold text-primary-600' : 'text-neutral-700 dark:text-neutral-300'}`}
                >
                    {d}
                    {hasEvent && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></span>}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm mb-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">&lt;</button>
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="text-[10px] font-bold text-neutral-400 uppercase">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 justify-items-center">
                {renderDays()}
            </div>
        </div>
    );
};

const InteractionChat: React.FC<{ 
    interaction: VendorInteraction; 
    onUpdateStatus: (status: VendorInteraction['status']) => void; 
    onCloseInteraction: () => void 
}> = ({ interaction, onUpdateStatus, onCloseInteraction }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<VendorComment[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messageType, setMessageType] = useState<'email' | 'note'>('email');
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

    useEffect(() => {
        const loadComments = async () => {
            const data = await api.getVendorComments(interaction.id);
            setComments(data);
        };
        loadComments();
    }, [interaction.id]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setStagedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeStagedFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && stagedFiles.length === 0) || !user) return;
        setIsSending(true);
        try {
            let attachmentUrls: string[] = [];
            if (stagedFiles.length > 0) {
                const uploadPromises = stagedFiles.map(file => api.uploadInteractionAttachment(interaction.id, file));
                attachmentUrls = await Promise.all(uploadPromises);
            }

            const newComment = await api.addVendorComment(interaction.id, newMessage, user.id, messageType === 'email', attachmentUrls);
            
            setComments(prev => [...prev, newComment]);
            setNewMessage('');
            setStagedFiles([]);
        } catch (e) {
            alert('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const statusColors = {
        'Open': 'bg-green-100 text-green-700 border-green-200',
        'Pending Intervention': 'bg-amber-100 text-amber-700 border-amber-200',
        'Resolved': 'bg-blue-100 text-blue-700 border-blue-200',
        'Closed': 'bg-neutral-200 text-neutral-600 border-neutral-300'
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{interaction.subject}</h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                        <span>Started {new Date(interaction.createdAt).toLocaleDateString()}</span>
                        {interaction.scheduledDate && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                📅 {new Date(interaction.scheduledDate).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase border shadow-sm transition-all ${statusColors[interaction.status]}`}
                    >
                        {interaction.status}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    {isStatusMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsStatusMenuOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border dark:border-neutral-700 z-20 overflow-hidden animate-scaleIn">
                                <div className="p-1">
                                    {['Open', 'Pending Intervention', 'Resolved', 'Closed'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => { onUpdateStatus(status as any); setIsStatusMenuOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 ${interaction.status === status ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20' : 'text-neutral-700 dark:text-neutral-300'}`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${status === 'Open' ? 'bg-green-500' : status === 'Pending Intervention' ? 'bg-amber-500' : status === 'Resolved' ? 'bg-blue-500' : 'bg-neutral-400'}`}></span>
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-neutral-800">
                {comments.map(c => (
                    <div key={c.id} className={`flex gap-3 ${c.author.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg shadow-sm border ${c.isEmail ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50' : 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/50'}`}>
                            <div className="flex justify-between items-center mb-1 gap-2">
                                <span className="font-bold text-xs dark:text-neutral-200">{c.author.name}</span>
                                <span className="text-[10px] opacity-70 dark:text-neutral-400">{c.isEmail ? '📧 SENT EMAIL' : '📝 NOTE'}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap dark:text-neutral-100">{c.content}</p>
                            
                            {c.attachments && c.attachments.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 grid grid-cols-1 gap-1">
                                    {c.attachments.map((url, idx) => (
                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs bg-white/50 dark:bg-black/20 p-1.5 rounded hover:bg-white/80 dark:hover:bg-black/40 transition-colors dark:text-neutral-200">
                                            {React.cloneElement(ICONS.paperclip as React.ReactElement<{ className?: string }>, { className: "h-3 w-3" })}
                                            <span className="truncate">{url.split('/').pop()}</span>
                                        </a>
                                    ))}
                                </div>
                            )}

                            <span className="text-[10px] opacity-50 mt-1 block text-right dark:text-neutral-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
                <div ref={commentsEndRef} />
            </div>

            {interaction.status !== 'Closed' && (
                <div className="p-4 border-t dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex gap-2">
                            <button onClick={() => setMessageType('email')} className={`text-xs px-3 py-1 rounded-full border transition-all ${messageType === 'email' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 dark:text-neutral-300'}`}>Send Email</button>
                            <button onClick={() => setMessageType('note')} className={`text-xs px-3 py-1 rounded-full border transition-all ${messageType === 'note' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 dark:text-neutral-300'}`}>Internal Note</button>
                        </div>
                        <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400" title="Attach files">
                            {React.cloneElement(ICONS.paperclip as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                        </button>
                    </div>
                    
                    {stagedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {stagedFiles.map((file, i) => (
                                <div key={i} className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-xs dark:text-neutral-200">
                                    <span className="truncate max-w-[100px]">{file.name}</span>
                                    <button onClick={() => removeStagedFile(i)} className="text-red-500 font-bold ml-1">&times;</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <textarea
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder={messageType === 'email' ? "Write email to vendor..." : "Add internal note..."}
                            className="flex-1 p-2 border rounded-lg bg-white dark:bg-neutral-800 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-primary-500 dark:text-neutral-100 placeholder-neutral-400"
                            rows={2}
                        />
                        <button onClick={handleSendMessage} disabled={isSending || (!newMessage && stagedFiles.length === 0)} className="px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center shadow-md">
                            {isSending ? <Spinner size="sm"/> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const VendorModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; vendorToEdit?: Vendor | null }> = ({ isOpen, onClose, onSave, vendorToEdit }) => {
    const { t } = useLocalization();
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({
        name: '', contactName: '', email: '', phone: '', website: '', address: '', notes: '', tags: '',
        contractStartDate: '', contractEndDate: '', contractUrl: '', serviceCount: 0, avgResponseTime: 0
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'contract' | 'interactions'>('info');
    
    const [interactions, setInteractions] = useState<VendorInteraction[]>([]);
    const [selectedInteraction, setSelectedInteraction] = useState<VendorInteraction | null>(null);
    const [newSubject, setNewSubject] = useState('');
    const [newScheduledDate, setNewScheduledDate] = useState('');
    const [isCreatingInteraction, setIsCreatingInteraction] = useState(false);

    useEffect(() => {
        if (vendorToEdit) {
            setFormData({
                name: vendorToEdit.name,
                contactName: vendorToEdit.contactName || '',
                email: vendorToEdit.email || '',
                phone: vendorToEdit.phone || '',
                website: vendorToEdit.website || '',
                address: vendorToEdit.address || '',
                notes: vendorToEdit.notes || '',
                tags: vendorToEdit.tags ? vendorToEdit.tags.join(', ') : '',
                contractStartDate: vendorToEdit.contractStartDate ? new Date(vendorToEdit.contractStartDate).toISOString().split('T')[0] : '',
                contractEndDate: vendorToEdit.contractEndDate ? new Date(vendorToEdit.contractEndDate).toISOString().split('T')[0] : '',
                contractUrl: vendorToEdit.contractUrl || '',
                serviceCount: vendorToEdit.serviceCount || 0,
                avgResponseTime: vendorToEdit.avgResponseTime || 0
            });
            api.getVendorInteractions(vendorToEdit.id).then(setInteractions);
        } else {
            setFormData({ 
                name: '', contactName: '', email: '', phone: '', website: '', address: '', notes: '', tags: '',
                contractStartDate: '', contractEndDate: '', contractUrl: '', serviceCount: 0, avgResponseTime: 0
            });
            setInteractions([]);
        }
        setActiveTab('info');
        setSelectedInteraction(null);
    }, [vendorToEdit, isOpen]);

    const handleCreateInteraction = async () => {
        if (!newSubject.trim() || !vendorToEdit || !user) return;
        setIsCreatingInteraction(true);
        
        let scheduledISO: string | undefined = undefined;
        if (newScheduledDate) {
            const d = new Date(newScheduledDate);
            if (!isNaN(d.getTime())) {
                scheduledISO = d.toISOString();
            }
        }

        try {
            const newInt = await api.createVendorInteraction(vendorToEdit.id, newSubject, user.id, scheduledISO);
            
            if (scheduledISO) {
                 await api.updateVendorInteraction(newInt.id, { status: 'Pending Intervention' });
                 newInt.status = 'Pending Intervention';
            }
            
            setInteractions(prev => [newInt, ...prev]);
            setNewSubject('');
            setNewScheduledDate('');
            setSelectedInteraction(newInt);
        } catch (e) {
            console.error(e);
            alert('Failed to create interaction.');
        } finally {
            setIsCreatingInteraction(false);
        }
    };

    const handleUpdateStatus = async (status: VendorInteraction['status']) => {
        if (!selectedInteraction) return;
        
        const updates: Partial<VendorInteraction> = { status };
        if (status === 'Resolved') {
            updates.resolvedAt = new Date().toISOString();
        }
        
        await api.updateVendorInteraction(selectedInteraction.id, updates);
        
        const updated = { ...selectedInteraction, ...updates };
        setInteractions(prev => prev.map(i => i.id === selectedInteraction.id ? updated : i));
        setSelectedInteraction(updated);
    };

    const scheduledInteractions = useMemo(() => {
        return interactions
            .filter(i => i.scheduledDate && (i.status === 'Open' || i.status === 'Pending Intervention'))
            .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());
    }, [interactions]);

    if (!isRendered) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            try {
                const url = await api.uploadVendorDocument(e.target.files[0]);
                setFormData(prev => ({ ...prev, contractUrl: url }));
            } catch (error) {
                console.error("Upload failed", error);
                alert("Failed to upload document");
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
            const dataToSave = { 
                ...formData, 
                tags: tagsArray,
                contractStartDate: formData.contractStartDate || null,
                contractEndDate: formData.contractEndDate || null,
            };
            
            if (vendorToEdit) {
                await api.updateVendor(vendorToEdit.id, dataToSave);
            } else {
                await api.createVendor(dataToSave);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to save vendor");
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "w-full p-2 bg-neutral-100 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 text-sm focus:ring-primary-500 focus:border-primary-500 dark:text-neutral-100";
    const labelClass = "block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1 uppercase";

    return (
         <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh] transition-all duration-300 transform ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{vendorToEdit ? vendorToEdit.name : 'Add Vendor'}</h2>
                        <div className="flex gap-2">
                             <button onClick={() => setActiveTab('info')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'info' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:text-neutral-300'}`}>Information</button>
                             <button onClick={() => setActiveTab('contract')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'contract' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:text-neutral-300'}`}>Contract & KPIs</button>
                             {vendorToEdit && <button onClick={() => setActiveTab('interactions')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'interactions' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:text-neutral-300'}`}>Interactions</button>}
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 overflow-hidden flex">
                    {activeTab === 'interactions' && vendorToEdit ? (
                        <div className="flex flex-1 h-full">
                            <div className="w-[320px] border-r dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/30 flex flex-col">
                                <div className="p-4 border-b dark:border-neutral-700 space-y-2">
                                    <h4 className="text-xs font-bold uppercase text-neutral-500">New Interaction</h4>
                                    <input 
                                        className="w-full p-2 text-sm rounded border dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                                        placeholder="Subject / Issue..."
                                        value={newSubject}
                                        onChange={e => setNewSubject(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                         <input 
                                            type="datetime-local"
                                            className="w-full p-2 text-xs rounded border dark:border-neutral-600 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-300"
                                            value={newScheduledDate}
                                            onChange={e => setNewScheduledDate(e.target.value)}
                                        />
                                        <button onClick={handleCreateInteraction} disabled={!newSubject || isCreatingInteraction} className="bg-primary-600 text-white p-2 rounded hover:bg-primary-700 disabled:opacity-50 font-bold text-sm px-3">
                                            {isCreatingInteraction ? <Spinner size="sm"/> : 'Add'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <MiniCalendar 
                                        events={scheduledInteractions} 
                                        onSelectDate={(date) => {
                                            const int = scheduledInteractions.find(i => i.scheduledDate && new Date(i.scheduledDate).toDateString() === date.toDateString());
                                            if(int) setSelectedInteraction(int);
                                        }} 
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                    <p className="px-2 text-xs font-bold uppercase text-neutral-400">History</p>
                                    {interactions.map(int => (
                                        <div 
                                            key={int.id}
                                            onClick={() => setSelectedInteraction(int)}
                                            className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedInteraction?.id === int.id ? 'bg-white dark:bg-neutral-800 border-primary-500 ring-1 ring-primary-500 shadow-sm' : 'bg-transparent border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/50'}`}
                                        >
                                            <div className="flex justify-between mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${int.status === 'Open' ? 'bg-green-100 text-green-700' : int.status === 'Pending Intervention' ? 'bg-amber-100 text-amber-700' : int.status === 'Resolved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{int.status === 'Pending Intervention' ? 'Pending' : int.status}</span>
                                                <span className="text-[10px] text-neutral-400">{new Date(int.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-semibold truncate dark:text-neutral-200">{int.subject}</p>
                                            {int.scheduledDate && (
                                                <div className="mt-1 text-xs text-amber-600 flex items-center gap-1 font-medium">
                                                    <span>⏰</span> {new Date(int.scheduledDate).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {interactions.length === 0 && <p className="text-center text-xs text-neutral-500 mt-4">No interactions yet.</p>}
                                </div>
                            </div>
                            <div className="flex-1 bg-white dark:bg-neutral-800 border-l dark:border-neutral-700">
                                {selectedInteraction ? (
                                    <InteractionChat 
                                        interaction={selectedInteraction} 
                                        onUpdateStatus={handleUpdateStatus}
                                        onCloseInteraction={() => handleUpdateStatus('Closed')}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
                                        Select an interaction to view details
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 space-y-6 overflow-y-auto w-full custom-scrollbar">
                            {activeTab === 'info' ? (
                                <>
                                    <div><label className={labelClass}>Company Name *</label><input className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div><label className={labelClass}>Contact Person</label><input className={inputClass} value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} /></div>
                                        <div><label className={labelClass}>Email</label><input className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div><label className={labelClass}>Phone</label><input className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                                        <div><label className={labelClass}>Website</label><input className={inputClass} value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} /></div>
                                    </div>
                                    <div><label className={labelClass}>Tags</label><input placeholder="Hardware, SaaS, ISP..." className={inputClass} value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} /></div>
                                    <div><label className={labelClass}>Address</label><textarea className={inputClass} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} /></div>
                                    <div><label className={labelClass}>Notes</label><textarea className={inputClass} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} /></div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div><label className={labelClass}>Contract Start</label><input type="date" className={inputClass} value={formData.contractStartDate} onChange={e => setFormData({...formData, contractStartDate: e.target.value})} /></div>
                                        <div><label className={labelClass}>Contract End</label><input type="date" className={inputClass} value={formData.contractEndDate} onChange={e => setFormData({...formData, contractEndDate: e.target.value})} /></div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Contract Document</label>
                                        <div className="flex gap-2">
                                            <input className={inputClass} value={formData.contractUrl} onChange={e => setFormData({...formData, contractUrl: e.target.value})} placeholder="https://..." />
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 dark:text-neutral-200">Upload</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border dark:border-neutral-700">
                                        <div><label className={labelClass}>Service Interventions</label><input type="number" className={inputClass} value={formData.serviceCount} onChange={e => setFormData({...formData, serviceCount: parseInt(e.target.value) || 0})} /></div>
                                        <div><label className={labelClass}>Avg Response (Hours)</label><input type="number" className={inputClass} value={formData.avgResponseTime} onChange={e => setFormData({...formData, avgResponseTime: parseInt(e.target.value) || 0})} /></div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-2 bg-white dark:bg-neutral-800">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving || !formData.name} className="px-6 py-2.5 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/30">{isSaving ? <Spinner size="sm"/> : 'Save Changes'}</button>
                </div>
            </div>
        </div>
    );
};

const VendorsList: React.FC = () => {
    const { user } = useAuth();
    const { assets, licenses } = useData();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [interactionCounts, setInteractionCounts] = useState<Record<string, number>>({});
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchVendors = async () => {
        setIsLoading(true);
        try {
            const data = await api.getVendors();
            setVendors(data);
            const allInteractionsPromises = data.map(v => api.getVendorInteractions(v.id));
            const allInteractions = await Promise.all(allInteractionsPromises);
            const counts: Record<string, number> = {};
            data.forEach((v, index) => {
                const active = allInteractions[index].filter(i => i.status === 'Open' || i.status === 'Pending Intervention').length;
                counts[v.id] = active;
            });
            setInteractionCounts(counts);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const filteredVendors = useMemo(() => {
        const query = debouncedSearchQuery.toLowerCase();
        return vendors.filter(v => 
            v.name.toLowerCase().includes(query) ||
            v.contactName?.toLowerCase().includes(query) ||
            v.email?.toLowerCase().includes(query) ||
            v.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }, [vendors, debouncedSearchQuery]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this vendor?")) return;
        try {
            await api.deleteVendor(id);
            fetchVendors();
        } catch (e) {
            console.error(e);
        }
    };
    
    const handleEdit = (vendor: Vendor) => {
        setVendorToEdit(vendor);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setVendorToEdit(null);
        setIsModalOpen(true);
    };

    const handleExport = () => {
        const header = ['ID', 'Name', 'Contact', 'Email', 'Phone', 'Tags', 'Contract Start', 'Contract End', 'Service Count', 'Avg Response'];
        const rows = filteredVendors.map(v => [
            v.id, v.name, v.contactName || '', v.email || '', v.phone || '', v.tags?.join(';') || '',
            v.contractStartDate || '', v.contractEndDate || '', v.serviceCount || 0, v.avgResponseTime || 0
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," + [header.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "vendors.csv");
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
            try {
                const text = await file.text();
                const rows = text.trim().split('\n');
                const headerRow = rows.shift()?.trim() || '';
                const headers = parseCsvRow(headerRow);
                const headerMap = headers.reduce((acc, h, i) => ({ ...acc, [h.trim()]: i }), {} as Record<string, number>);

                if (!headers.includes('Name')) throw new Error("Missing 'Name' column");

                for (const rowStr of rows) {
                    const row = parseCsvRow(rowStr);
                    if (!row[headerMap['Name']]) continue;

                    const vendorData = {
                        name: row[headerMap['Name']],
                        contactName: row[headerMap['Contact']] || '',
                        email: row[headerMap['Email']] || '',
                        phone: row[headerMap['Phone']] || '',
                        tags: row[headerMap['Tags']] ? row[headerMap['Tags']].split(';') : [],
                        contractStartDate: row[headerMap['Contract Start']] || null,
                        contractEndDate: row[headerMap['Contract End']] || null,
                        serviceCount: parseInt(row[headerMap['Service Count']]) || 0,
                        avgResponseTime: parseInt(row[headerMap['Avg Response']]) || 0
                    };
                    await api.createVendor(vendorData);
                }
                fetchVendors();
                alert("Import successful");
            } catch (err: any) {
                alert("Import failed: " + err.message);
            } finally {
                setIsImporting(false);
            }
        }
    };
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

    if (isLoading) return <Spinner />;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Vendor Management</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input 
                            type="search" 
                            placeholder="Search vendors..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            className="pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 dark:text-neutral-100"
                        />
                        <div className="absolute left-3 top-2.5 text-neutral-400">
                             {React.cloneElement(ICONS.search as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
                        </div>
                    </div>

                    {user?.role === Role.Admin && (
                        <>
                            <button onClick={handleImportClick} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                {isImporting ? <Spinner size="sm"/> : React.cloneElement(ICONS.upload as React.ReactElement<{ className?: string }>, {className: "w-4 h-4"})}
                                <span>Import</span>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />

                            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                {React.cloneElement(ICONS.download as React.ReactElement<{ className?: string }>, {className: "w-4 h-4"})}
                                <span>Export</span>
                            </button>
                            
                            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-lg hover:bg-primary-700 transition-all hover:-translate-y-0.5 text-sm">
                                {React.cloneElement(ICONS.plus, {className: "w-4 h-4"})} Add Vendor
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVendors.map(vendor => {
                    const vendorAssets = assets.filter(a => a.vendorId === vendor.id);
                    const vendorLicenses = licenses.filter(l => l.vendorId === vendor.id);
                    const assetSpend = vendorAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
                    const licenseSpend = vendorLicenses.reduce((sum, l) => sum + (l.totalCost || 0), 0);
                    const totalSpend = assetSpend + licenseSpend;
                    
                    const hasContract = !!vendor.contractEndDate;
                    const isContractExpired = hasContract && new Date(vendor.contractEndDate!) < new Date();
                    const activeInteractions = interactionCounts[vendor.id] || 0;

                    return (
                        <div key={vendor.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-all flex flex-col group relative">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-700/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-xl text-neutral-900 dark:text-white cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleEdit(vendor)}>{vendor.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                             {hasContract && (
                                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${isContractExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {isContractExpired ? 'Contract Expired' : 'Active Contract'}
                                                </span>
                                            )}
                                            {activeInteractions > 0 && (
                                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                                    🔔 {activeInteractions} Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {user?.role === Role.Admin && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(vendor)} className="text-neutral-400 hover:text-primary-600 p-1"><span className="text-lg">✎</span></button>
                                            <button onClick={() => handleDelete(vendor.id)} className="text-neutral-400 hover:text-red-500 p-1"><span className="text-xl">&times;</span></button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {vendor.tags && vendor.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-md">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="p-6 grid grid-cols-2 gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                                 <div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Spend</p>
                                    <p className="text-lg font-black text-neutral-800 dark:text-neutral-100">{formatCurrency(totalSpend)}</p>
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Performance</p>
                                    <div className="text-sm text-neutral-800 dark:text-neutral-100">
                                        <span className="font-bold">{vendor.serviceCount || 0}</span> Interventions
                                        <br/>
                                        <span className="font-bold">{vendor.avgResponseTime || 0}h</span> Avg Response
                                    </div>
                                 </div>
                            </div>

                            <div className="p-6 flex-1 space-y-3 text-sm border-t border-neutral-100 dark:border-neutral-700/50">
                                {vendor.contactName && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-xs font-bold">{vendor.contactName.charAt(0)}</div>
                                        <div>
                                            <p className="font-semibold dark:text-neutral-200">{vendor.contactName}</p>
                                            <p className="text-xs text-neutral-500">Primary Contact</p>
                                        </div>
                                    </div>
                                )}
                                {vendor.email && (
                                    <a href={`mailto:${vendor.email}`} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        {vendor.email}
                                    </a>
                                )}
                                {vendor.contractUrl && (
                                    <a href={vendor.contractUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline mt-2">
                                        {React.cloneElement(ICONS.file as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
                                        View Contract
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <VendorModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={fetchVendors} 
                vendorToEdit={vendorToEdit}
            />
        </div>
    );
};

export default VendorsList;
