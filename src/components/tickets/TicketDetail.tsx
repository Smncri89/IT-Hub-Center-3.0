
// ... imports
// ... previous code

// Inside render:
// <div 
//    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
//    onClick={() => fileInputRef.current?.click()}
//    className={`mt-2 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-300 dark:border-neutral-600'}`}
// >
//    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
//    {React.cloneElement(ICONS.paperclip, { className: 'w-6 h-6 mx-auto mb-1 text-neutral-400' })} {/* CHANGED FROM UPLOAD */}
//    <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('drag drop files')}</p>
// </div>

// Full file content for TicketDetail.tsx to ensure persistence
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Ticket, User, Comment, TicketStatus, TicketPriority, Role } from '@/types';
import * as api from '@/services/api';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import Spinner from '@/components/Spinner';
import { ICONS, STATUS_COLORS, PRIORITY_COLORS } from '@/constants';

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-neutral-200 dark:border-neutral-700/50">
        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</dt>
        <dd className="col-span-2 text-sm text-neutral-900 dark:text-neutral-100">{children}</dd>
    </div>
);

const CommentBubble: React.FC<{ comment: Comment, isInternal: boolean }> = ({ comment, isInternal }) => {
    const { t } = useLocalization();
    const bgColor = isInternal ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-neutral-100 dark:bg-neutral-700/50';
    const borderColor = isInternal ? 'border-yellow-200 dark:border-yellow-700/60' : 'border-transparent';
    return (
        <div className={`flex items-start gap-4 p-3 rounded-lg border ${borderColor} ${bgColor}`}>
            <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{comment.author.name}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(comment.createdAt).toLocaleString()}</span>
                    {isInternal && (
                        <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                            {React.cloneElement(ICONS.security, { className: 'w-3 h-3' })}
                            {t('internal note')}
                        </span>
                    )}
                </div>
                <div 
                    className="prose prose-sm dark:prose-invert max-w-none mt-1" 
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                ></div>
            </div>
        </div>
    );
};

export const TicketDetail: React.FC = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const { t, language } = useLocalization();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { users, refetchData } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [stagedAttachments, setStagedAttachments] = useState<File[]>([]);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [commentType, setCommentType] = useState<'public' | 'internal'>('public');
    const [closeError, setCloseError] = useState('');
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);

    const canManage = useMemo(() => currentUser?.role === Role.Admin || currentUser?.role === Role.Agent, [currentUser]);
    
    const assignableUsers = useMemo(() => users.filter(u => u.role === Role.Admin || u.role === Role.Agent), [users]);

    const visibleComments = useMemo(() => {
        if (!ticket) {
            return [];
        }
        if (canManage) {
            return ticket.comments || [];
        }
        return (ticket.comments || []).filter(c => !c.isInternalNote);
    }, [ticket, canManage]);
    
    const fetchTicket = useCallback(async () => {
        if (!ticketId) return;
        setIsLoading(true);
        try {
            const fetchedTicket = await api.getTicketById(ticketId);
            if (fetchedTicket) {
                setTicket(fetchedTicket);
            } else {
                setError(t('ticket not found'));
            }
        } catch (err) {
            setError(t('ticket fetch failed'));
        } finally {
            setIsLoading(false);
        }
    }, [ticketId, t]);

    useEffect(() => {
        fetchTicket();
    }, [fetchTicket]);

    const handleUpdate = async (updates: Partial<Ticket>) => {
        if (!ticket) return;
        try {
            const updatedTicket = await api.updateTicket(ticket.id, updates);
            setTicket(updatedTicket);
            refetchData('tickets');
        } catch (err) {
            console.error("Failed to update ticket", err);
        }
    };
    
    const handleCommentSubmit = async (closeTicket = false) => {
        setCloseError('');
        if (closeTicket && commentType === 'internal') {
            setCloseError(t('cannot close from internal note'));
            return;
        }

        if ((!newComment.trim() && stagedAttachments.length === 0) || !currentUser || !ticket) return;
        setIsSubmittingComment(true);

        try {
            let tempTicket = ticket;

            if (stagedAttachments.length > 0) {
                tempTicket = await api.addAttachmentsToTicket(ticket.id, stagedAttachments, ticket.attachments || []);
                refetchData('tickets');
            }

            if (newComment.trim()) {
                let contentToSubmit = newComment.trim().replace(/\n/g, '<br>');
                const hasSignature = currentUser && (currentUser.signatureText || currentUser.signatureLogo) && commentType === 'public';
                
                if (hasSignature && closeTicket) {
                     let signatureBlock = '<br><br><hr style="border-top: 1px solid #e5e7eb;" />';
                    signatureBlock += '<div style="display: flex; align-items: center; gap: 12px; margin-top: 10px;">';
                    if (currentUser.signatureLogo) {
                        signatureBlock += `<div style="flex-shrink: 0;"><img src="${currentUser.signatureLogo}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain; border-radius: 4px;"></div>`;
                    }
                    signatureBlock += '<div style="width: 2px; height: 40px; background-image: linear-gradient(to bottom, #a855f7, #6366f1);"></div>';
                    signatureBlock += `<div><div style="font-weight: bold; text-transform: uppercase; font-size: 0.875rem;">${currentUser.name}</div>`;
                    if (currentUser.signatureText) {
                         signatureBlock += `<div style="font-size: 0.75rem; white-space: pre-wrap;">${currentUser.signatureText.replace(/\n/g, '<br>')}</div>`;
                    }
                    signatureBlock += '</div></div>';
                    contentToSubmit += signatureBlock;
                }
                await api.addCommentToTicket(ticket.id, currentUser, contentToSubmit, commentType === 'internal');
                refetchData('tickets');
            }

            if (closeTicket) {
                await api.updateTicket(ticket.id, { status: TicketStatus.Closed });
                refetchData('tickets');
            }

            await fetchTicket();
            
            setNewComment('');
            setStagedAttachments([]);

        } catch (err) {
            console.error("Failed to add comment or attachments", err);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCreateKBArticle = () => {
        if (!ticket || !ticket.comments || ticket.comments.length === 0) return;
        const state = {
            title: `How to solve: ${ticket.subject}`,
            content: `## Problem\n${ticket.description}\n\n## Solution\n${ticket.comments.slice(-1)[0].content}`,
            category: ticket.category,
            tags: [ticket.subcategory]
        };
        navigate('/kb/new', { state });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setStagedAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setStagedAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            setStagedAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const handleAiReply = async () => {
        if (!ticket) return;
        setIsGeneratingReply(true);
        try {
            const history = visibleComments.map(c => `${c.author.name}: ${c.content}`).join('\n');
            const reply = await api.generateTicketReply(ticket, history);
            setNewComment(reply);
        } catch (error) {
            console.error("AI Reply error", error);
        } finally {
            setIsGeneratingReply(false);
        }
    };

    if (isLoading) return <Spinner />;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (!ticket) return <div className="text-center p-8">{t('ticket not found')}</div>;

    const translateCategory = (cat: string | undefined) => cat ? t(`category ${cat.toLowerCase().replace(/ /g, ' ')}`) : '';

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <Link to="/tickets" className="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center gap-1.5">&larr; {t('back to tickets')}</Link>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                        Ticket ID: {ticket.id} - {ticket.subject}
                    </h1>
                </div>
                 {canManage && (
                    <button onClick={handleCreateKBArticle} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                        {React.cloneElement(ICONS.kb, { className: 'w-4 h-4' })}
                        {t('create kb article')}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 h-fit">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">{t('ticket details')}</h3>
                    <dl>
                        <DetailRow label={t('status')}>
                            {canManage ? (
                                <select value={ticket.status} onChange={e => handleUpdate({ status: e.target.value as TicketStatus })} className="w-full p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md border-transparent focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{t(`ticket status ${s.toLowerCase().replace(/ /g, ' ')}`)}</option>)}
                                </select>
                            ) : <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[ticket.status]}`}>{t(`ticket status ${(ticket.status || '').toLowerCase().replace(/ /g, ' ')}`)}</span>}
                        </DetailRow>
                        <DetailRow label={t('priority')}>
                            {canManage ? (
                                <select value={ticket.priority} onChange={e => handleUpdate({ priority: e.target.value as TicketPriority })} className="w-full p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md border-transparent focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                                    {Object.values(TicketPriority).map(p => <option key={p} value={p}>{t(`priority ${p.toLowerCase()}`)}</option>)}
                                </select>
                            ) : <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>{t(`priority ${(ticket.priority || '').toLowerCase()}`)}</span>}
                        </DetailRow>
                        <DetailRow label={t('category')}>{translateCategory(ticket.category)}</DetailRow>
                        <DetailRow label={t('assignee')}>
                            {canManage ? (
                                <select value={ticket.assignee?.id || ''} onChange={e => handleUpdate({ assignee: assignableUsers.find(u => u.id === e.target.value) })} className="w-full p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md border-transparent focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                                    <option value="">{t('unassigned')}</option>
                                    {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            ) : (
                                <span>{ticket.assignee?.name || t('unassigned')}</span>
                            )}
                        </DetailRow>
                        <DetailRow label={t('requester')}>{ticket.requester.name}</DetailRow>
                        <DetailRow label={t('created at')}>{new Date(ticket.createdAt).toLocaleString()}</DetailRow>
                        <DetailRow label={t('updated at')}>{new Date(ticket.updatedAt).toLocaleString()}</DetailRow>
                        <DetailRow label={t('related asset')}>
                            {ticket.asset ? <Link to={`/assets/${ticket.asset.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">{ticket.asset.name}</Link> : t('none')}
                        </DetailRow>
                    </dl>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">{t('description')}</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: ticket.description.replace(/\n/g, '<br />') }}></div>
                    </div>
                    
                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6">
                             <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">{t('attachments')}</h3>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {ticket.attachments.map((url, index) => (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-neutral-100 dark:bg-neutral-700/50 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700">
                                        {React.cloneElement(ICONS.file, { className: 'w-5 h-5 flex-shrink-0' })}
                                        <span className="text-sm truncate">{url.split('/').pop()}</span>
                                    </a>
                                ))}
                             </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {visibleComments.map(comment => <CommentBubble key={comment.id} comment={comment} isInternal={comment.isInternalNote} />)}
                    </div>
                    
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md">
                        <div className="border-b border-neutral-200 dark:border-neutral-700">
                            {canManage && (
                                <div className="flex">
                                    <button onClick={() => setCommentType('public')} className={`flex-1 py-3 text-sm font-medium ${commentType === 'public' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-neutral-500'}`}>{t('public reply')}</button>
                                    <button onClick={() => setCommentType('internal')} className={`flex-1 py-3 text-sm font-medium ${commentType === 'internal' ? 'text-yellow-600 border-b-2 border-yellow-500' : 'text-neutral-500'}`}>{t('internal note')}</button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 relative">
                            {canManage && (
                                <button 
                                    onClick={handleAiReply}
                                    disabled={isGeneratingReply}
                                    className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 z-10"
                                >
                                    {isGeneratingReply ? <Spinner size="sm" /> : React.cloneElement(ICONS.sparkle, { className: 'w-3 h-3' })}
                                    {isGeneratingReply ? t('generating reply') : t('generate ai reply')}
                                </button>
                            )}
                            <textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder={t('add a comment')}
                                rows={5}
                                className="w-full p-2 bg-neutral-100 dark:bg-neutral-700/50 rounded-md border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 mt-6"
                            />
                             <div 
                                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`mt-2 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-300 dark:border-neutral-600'}`}
                            >
                                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                                {React.cloneElement(ICONS.paperclip, { className: 'w-6 h-6 mx-auto mb-1 text-neutral-400' })}
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('drag drop files')}</p>
                            </div>
                            {stagedAttachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {stagedAttachments.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm p-1 bg-neutral-100 dark:bg-neutral-700 rounded">
                                            <span className="truncate pr-2">{file.name}</span>
                                            <button onClick={() => handleRemoveFile(i)} className="text-red-500 flex-shrink-0">&times;</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {closeError && <p className="text-sm text-red-500 mt-2">{closeError}</p>}
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => handleCommentSubmit(false)} disabled={isSubmittingComment} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md disabled:bg-primary-400">
                                    {isSubmittingComment ? <Spinner size="sm" /> : (commentType === 'public' ? t('add reply') : t('add note'))}
                                </button>
                                {commentType === 'public' && canManage && (ticket.status !== 'Closed' && ticket.status !== 'Resolved') && (
                                    <button onClick={() => handleCommentSubmit(true)} disabled={isSubmittingComment} className="px-4 py-2 text-sm font-medium bg-neutral-200 dark:bg-neutral-600 rounded-md disabled:opacity-50">
                                        {isSubmittingComment ? <Spinner size="sm" /> : t('add reply and close')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
