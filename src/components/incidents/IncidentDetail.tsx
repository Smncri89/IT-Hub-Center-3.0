
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Incident, Role, User, TicketPriority, IncidentTimelineEntry } from '@/types';
import { getIncidentById, updateIncident, getUsers, generatePostMortemSummary } from '@/services/api';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { ICONS, INCIDENT_STATUS_COLORS, INCIDENT_CATEGORY_COLORS } from '@/constants';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { useData } from '@/hooks/useData';

const DetailRow: React.FC<{label: string, value?: string | React.ReactNode, children?: React.ReactNode}> = ({label, value, children}) => (
    <div className="py-3 border-b border-neutral-200 dark:border-neutral-700/50 last:border-b-0">
        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</dt>
        <dd className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{value || children}</dd>
    </div>
);

interface EditableSectionProps {
    title: string;
    field: 'solution' | 'impactAnalysis' | 'rootCauseAnalysis';
    isEditing: boolean;
    setEditing: (isEditing: boolean) => void;
    value: string;
    onChange: (field: 'solution' | 'impactAnalysis' | 'rootCauseAnalysis', value: string) => void;
    onSave: (field: 'solution' | 'impactAnalysis' | 'rootCauseAnalysis') => void;
    canManage: boolean;
    t: (key: string) => string;
}

const EditableSection: React.FC<EditableSectionProps> = ({ title, field, isEditing, setEditing, value, onChange, onSave, canManage, t }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                {canManage && !isEditing && (
                    <button onClick={() => setEditing(true)} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        {value ? t('edit') : t('add')}
                    </button>
                )}
            </div>
            {isEditing ? (
                <div>
                    <textarea
                        value={value}
                        onChange={e => onChange(field, e.target.value)}
                        rows={5}
                        className="w-full p-2 bg-neutral-100 dark:bg-neutral-700/50 rounded-md border border-neutral-300 dark:border-neutral-600 focus:ring-primary-500"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditing(false)} className="px-3 py-1 text-sm rounded-md bg-neutral-200 dark:bg-neutral-600">{t('cancel')}</button>
                        <button onClick={() => onSave(field)} className="px-3 py-1 text-sm text-white bg-primary-600 rounded-md">{t('save')}</button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                    {value || <span className="italic text-neutral-500">{t('incident not documented')}</span>}
                </p>
            )}
        </div>
    );
};

const ResolveIncidentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onJustResolve: () => void;
  onResolveAndCreateKB: () => void;
}> = ({ isOpen, onClose, onJustResolve, onResolveAndCreateKB }) => {
  const { t } = useLocalization();
  const { isRendered, isAnimating } = useAnimatedModal(isOpen);

  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
      <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md transition-all duration-300 ${isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('resolve incident')}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">{t('resolve incident prompt kb')}</p>
        <div className="flex justify-end mt-6 space-x-2">
          <button onClick={onJustResolve} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100">
            {t('no just resolve')}
          </button>
          <button onClick={onResolveAndCreateKB} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
            {t('yes create kb')}
          </button>
        </div>
      </div>
    </div>
  );
};


const IncidentDetail: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const { t } = useLocalization();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { refetchData } = useData();
  
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  
  const [activeTab, setActiveTab] = useState<'timeline' | 'analysis'>('timeline');
  const [newUpdate, setNewUpdate] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ updates: Partial<Incident>, timelineEntry?: Omit<IncidentTimelineEntry, 'timestamp'> } | null>(null);


  // States for editable analysis fields
  const [isEditingSolution, setIsEditingSolution] = useState(false);
  const [isEditingImpact, setIsEditingImpact] = useState(false);
  const [isEditingRca, setIsEditingRca] = useState(false);
  const [editableFields, setEditableFields] = useState({
      solution: '',
      impactAnalysis: '',
      rootCauseAnalysis: '',
  });

  const canManage = useMemo(() => currentUser?.role === Role.Admin || currentUser?.role === Role.Agent, [currentUser]);
  
  const incidentStatuses = ['Investigating', 'Identified', 'Monitoring', 'Resolved'];
  const severities = ['Critical', 'High', 'Medium', 'Low'];

  const fetchIncident = useCallback(async () => {
    if (!incidentId) return;
    try {
      const fetchedIncident = await getIncidentById(incidentId);
      if (fetchedIncident) {
        setIncident(fetchedIncident);
        setEditableFields({
            solution: fetchedIncident.solution || '',
            impactAnalysis: fetchedIncident.impactAnalysis || '',
            rootCauseAnalysis: fetchedIncident.rootCauseAnalysis || '',
        });
      } else {
        setError(t("incident not found"));
      }
    } catch (err: any) {
      setError(t(err.message || "incident fetch failed"));
    }
  }, [incidentId, t]);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchIncident(),
            getUsers().then(users => setAssignableUsers(users.filter(u => u.role === Role.Admin || u.role === Role.Agent)))
        ]);
        setIsLoading(false);
    }
    loadData();
  }, [fetchIncident]);

    const executeUpdate = useCallback(async (updates: Partial<Incident>, timelineEntry?: Omit<IncidentTimelineEntry, 'timestamp'>) => {
        if (!incident || !currentUser) return;
        
        const newTimelineEntry: IncidentTimelineEntry | undefined = timelineEntry 
            ? { ...timelineEntry, timestamp: new Date().toISOString() } 
            : undefined;

        try {
            const updatedIncident = await updateIncident(incident.id, { ...updates, newTimelineEntry });
            if (updatedIncident) {
                setIncident(updatedIncident);
                 setEditableFields({
                    solution: updatedIncident.solution || '',
                    impactAnalysis: updatedIncident.impactAnalysis || '',
                    rootCauseAnalysis: updatedIncident.rootCauseAnalysis || '',
                });
                refetchData('incidents');
            }
        } catch (err: any) {
            console.error("Update failed", err);
            setError(t(err.message || 'unexpected error'));
        }
    }, [incident, currentUser, t, refetchData]);

    const handleUpdate = useCallback(async (updates: Partial<Incident>, timelineEntry?: Omit<IncidentTimelineEntry, 'timestamp'>) => {
        if (!incident) return;
        
        if (updates.status === 'Resolved' && incident.solution && incident.status !== 'Resolved') {
            setPendingUpdate({ updates, timelineEntry });
            setIsResolveModalOpen(true);
            return;
        }

        await executeUpdate(updates, timelineEntry);
    }, [incident, executeUpdate]);

    const handleJustResolve = useCallback(async () => {
        if (pendingUpdate) {
            await executeUpdate(pendingUpdate.updates, pendingUpdate.timelineEntry);
        }
        setIsResolveModalOpen(false);
        setPendingUpdate(null);
    }, [pendingUpdate, executeUpdate]);

    const handleResolveAndCreateKB = useCallback(async () => {
        if (pendingUpdate && incident) {
            await executeUpdate(pendingUpdate.updates, pendingUpdate.timelineEntry);

            const content = t('kb from incident template', {
                id: incident.id,
                description: incident.description,
                solution: incident.solution || '',
            });

            navigate('/kb/new', { 
                state: { 
                    title: incident.title,
                    content: content,
                    category: incident.category,
                    tags: incident.tags,
                } 
            });
        }
        setIsResolveModalOpen(false);
        setPendingUpdate(null);
    }, [pendingUpdate, incident, executeUpdate, navigate, t]);

    
    const handleAddTimelineUpdate = async () => {
        if (!newUpdate.trim() || !currentUser) return;
        setIsSubmittingUpdate(true);
        await handleUpdate({}, {
            update: newUpdate,
            author_id: currentUser.id,
            author_name: currentUser.name,
            type: 'comment'
        });
        setNewUpdate('');
        setIsSubmittingUpdate(false);
    };

    const handleGeneratePostMortem = async () => {
        if (!incident) return;
        setIsAiGenerating(true);
        try {
            const summary = await generatePostMortemSummary(incident);
            await handleUpdate(summary);
        } catch (e: any) {
            console.error(e);
            setError(t(e.message || 'ai assistant connection error'));
        } finally {
            setIsAiGenerating(false);
        }
    };
    
    const handleEditableFieldChange = (field: 'solution' | 'impactAnalysis' | 'rootCauseAnalysis', value: string) => {
        setEditableFields(prev => ({ ...prev, [field]: value }));
    };

    const handleAnalysisFieldSave = async (field: 'solution' | 'impactAnalysis' | 'rootCauseAnalysis') => {
        await handleUpdate({ [field]: editableFields[field] });
        if (field === 'solution') setIsEditingSolution(false);
        if (field === 'impactAnalysis') setIsEditingImpact(false);
        if (field === 'rootCauseAnalysis') setIsEditingRca(false);
    };

  if (isLoading) return <Spinner />;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!incident) return <div className="text-center p-8">No incident data available.</div>;
  
  const renderTimelineEntry = (entry: IncidentTimelineEntry) => {
    let content = entry.update;
    if (entry.type === 'creation') {
        content = t('timeline entry creation', { author: entry.author_name });
    }
    return (
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center ring-4 ring-neutral-100 dark:ring-neutral-800">
            {/* Icon based on type can go here */}
          </div>
          <div className="w-px h-full bg-neutral-200 dark:bg-neutral-700"></div>
        </div>
        <div className="pb-8">
          <p className="text-sm text-neutral-500">{new Date(entry.timestamp).toLocaleString()}</p>
          <p className="mt-1 text-neutral-800 dark:text-neutral-200">{content}</p>
        </div>
      </div>
    );
  };

  return (
    <>
        <div className="space-y-6">
            <div>
                <Link to="/incidents" className="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center gap-1">&larr; {t('back to incidents')}</Link>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                    {incident.title} <span className="font-mono text-xl text-neutral-500">#{incident.id}</span>
                </h1>
            </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 h-fit">
                <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">{t('incident details')}</h3>
                <dl>
                    <DetailRow label={t('status')}>
                        {canManage ? (
                            <select value={incident.status} onChange={e => handleUpdate({ status: e.target.value as Incident['status'] })} className="w-full p-1 bg-neutral-100 dark:bg-neutral-700/50 rounded-md border-transparent focus:ring-1 focus:ring-primary-500 text-sm">
                                {incidentStatuses.map(s => <option key={s} value={s}>{t(`incident status ${s.toLowerCase()}`)}</option>)}
                            </select>
                        ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${INCIDENT_STATUS_COLORS[incident.status]}`}>
                                {t(`incident status ${incident.status.toLowerCase()}`)}
                            </span>
                        )}
                    </DetailRow>
                     <DetailRow label={t('severity')}>
                        {canManage ? (
                            <select value={incident.severity} onChange={e => handleUpdate({ severity: e.target.value as Incident['severity'] })} className="w-full p-1 bg-neutral-100 dark:bg-neutral-700/50 rounded-md border-transparent focus:ring-1 focus:ring-primary-500 text-sm">
                                {severities.map(s => <option key={s} value={s}>{t(`severity ${s.toLowerCase()}`)}</option>)}
                            </select>
                        ) : (<span>{t(`severity ${incident.severity.toLowerCase()}`)}</span>)}
                    </DetailRow>
                    <DetailRow label={t('category')}>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${INCIDENT_CATEGORY_COLORS[incident.category]}`}>
                            {t(`incident category ${(incident.category || '').toLowerCase().replace(/ /g, ' ')}`)}
                        </span>
                    </DetailRow>
                    <DetailRow label={t('reporter')} value={incident.reporter?.name} />
                    <DetailRow label={t('assignee')}>
                    {canManage ? (
                        <select value={incident.assignee?.id || ''} onChange={e => handleUpdate({ assignee: assignableUsers.find(u => u.id === e.target.value) })} className="w-full p-1 bg-neutral-100 dark:bg-neutral-700/50 rounded-md border-transparent focus:ring-1 focus:ring-primary-500 text-sm">
                            <option value="">{t('unassigned')}</option>
                            {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    ) : (<span>{incident.assignee?.name || t('unassigned')}</span>)}
                    </DetailRow>
                    <DetailRow label={t('created at')} value={new Date(incident.createdAt).toLocaleString()} />
                    <DetailRow label={t('updated at')} value={new Date(incident.updatedAt).toLocaleString()} />
                </dl>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl shadow-md">
                <div className="border-b border-neutral-200 dark:border-neutral-700">
                    <nav className="flex -mb-px">
                        <button onClick={() => setActiveTab('timeline')} className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'timeline' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>{t('timeline')}</button>
                        <button onClick={() => setActiveTab('analysis')} className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'analysis' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>{t('analysis')}</button>
                    </nav>
                </div>
                
                {activeTab === 'timeline' && (
                    <div className="p-6">
                        <div className="flow-root">
                            {incident.timeline.map(renderTimelineEntry)}
                        </div>
                        {canManage && (
                            <div className="mt-6">
                                <textarea value={newUpdate} onChange={(e) => setNewUpdate(e.target.value)} rows={3} placeholder={t('add timeline update placeholder')} className="w-full p-2 bg-neutral-100 dark:bg-neutral-700/50 rounded-md border border-neutral-300 dark:border-neutral-600 focus:ring-primary-500"></textarea>
                                <div className="flex justify-end mt-2">
                                    <button onClick={handleAddTimelineUpdate} disabled={isSubmittingUpdate} className="px-4 py-2 text-sm text-white bg-primary-600 rounded-md disabled:bg-primary-400">{isSubmittingUpdate ? <Spinner size="sm"/> : t('add update')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="p-6 space-y-6">
                        {incident.status === 'Resolved' && canManage && (
                            <div className="flex justify-end">
                                <button onClick={handleGeneratePostMortem} disabled={isAiGenerating} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:opacity-90 disabled:opacity-50">
                                    {isAiGenerating ? <Spinner size="sm"/> : React.cloneElement(ICONS.sparkle, {className: 'w-4 h-4'})}
                                    {t('generate post mortem ai')}
                                </button>
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('description')}</h3>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{incident.description}</p>
                        </div>
                        <hr className="dark:border-neutral-700/50"/>
                        <EditableSection 
                            title={t('impact analysis')} 
                            field="impactAnalysis" 
                            isEditing={isEditingImpact} 
                            setEditing={setIsEditingImpact} 
                            value={editableFields.impactAnalysis}
                            onChange={handleEditableFieldChange}
                            onSave={handleAnalysisFieldSave}
                            canManage={canManage}
                            t={t}
                        />
                        <hr className="dark:border-neutral-700/50"/>
                        <EditableSection 
                            title={t('root cause analysis')} 
                            field="rootCauseAnalysis" 
                            isEditing={isEditingRca} 
                            setEditing={setIsEditingRca}
                            value={editableFields.rootCauseAnalysis}
                            onChange={handleEditableFieldChange}
                            onSave={handleAnalysisFieldSave}
                            canManage={canManage}
                            t={t}
                        />
                        <hr className="dark:border-neutral-700/50"/>
                        <EditableSection 
                            title={t('solution')} 
                            field="solution" 
                            isEditing={isEditingSolution} 
                            setEditing={setIsEditingSolution}
                            value={editableFields.solution}
                            onChange={handleEditableFieldChange}
                            onSave={handleAnalysisFieldSave}
                            canManage={canManage}
                            t={t}
                        />
                    </div>
                )}
            </div>
        </div>
        </div>
        <ResolveIncidentModal
            isOpen={isResolveModalOpen}
            onClose={() => {
                setIsResolveModalOpen(false);
                setPendingUpdate(null);
            }}
            onJustResolve={handleJustResolve}
            onResolveAndCreateKB={handleResolveAndCreateKB}
        />
    </>
  );
};

export default IncidentDetail;
