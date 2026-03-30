import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Role, Asset } from '@/types';
import { getAssets } from '@/services/api';
import {
  OnboardingProcess,
  OnboardingChecklistItem,
  getOnboardingProcessById,
  updateOnboardingProcess,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
  assignAssetToProcess,
  unassignAssetFromProcess,
} from '@/services/onboardingService';

const statusOptions = [
  { value: 'pending', label: 'In attesa', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In corso', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completato', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Annullato', color: 'bg-neutral-400' },
];

const OnboardingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();

  const [proc, setProc] = useState<OnboardingProcess | null>(null);
  const [loading, setLoading] = useState(true);

  // Checklist add
  const [newTask, setNewTask] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Asset assignment
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);

  const isAdminOrAgent = user?.role === Role.Admin || user?.role === Role.Agent;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [data, assets] = await Promise.all([
        getOnboardingProcessById(id),
        getAssets(),
      ]);
      setProc(data);
      setAllAssets(assets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* progress */
  const items = proc?.checklist_items ?? [];
  const done = items.filter(i => i.is_completed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  /* group by category */
  const grouped = useMemo(() => {
    const map = new Map<string, OnboardingChecklistItem[]>();
    for (const it of items) {
      const cat = it.category || 'Generale';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  /* available assets (Ready to Deploy, not already assigned) */
  const availableAssets = useMemo(() => {
    const assignedIds = new Set(proc?.assigned_asset_ids || []);
    let filtered = allAssets.filter(a => a.status === 'Ready to Deploy' && !assignedIds.has(a.id));
    if (assetSearch.trim()) {
      const q = assetSearch.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.model ?? '').toLowerCase().includes(q) ||
        (a.assetTag ?? '').toLowerCase().includes(q) ||
        (a.type ?? '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allAssets, proc?.assigned_asset_ids, assetSearch]);

  /* handlers */
  const handleToggle = async (item: OnboardingChecklistItem) => {
    if (!user || !proc) return;
    try {
      const updated = await toggleChecklistItem(item.id, !item.is_completed, user.id);
      const newItems = (proc.checklist_items ?? []).map(i =>
        i.id === updated.id ? updated : i
      );
      const allDone = newItems.length > 0 && newItems.every(i => i.is_completed);
      const anyDone = newItems.some(i => i.is_completed);
      let newStatus = proc.status;
      if (allDone && proc.status !== 'completed') newStatus = 'completed';
      else if (anyDone && proc.status === 'pending') newStatus = 'in_progress';

      if (newStatus !== proc.status) {
        await updateOnboardingProcess(proc.id, { status: newStatus as any });
      }

      setProc(prev => prev ? {
        ...prev,
        checklist_items: newItems,
        status: newStatus as any,
      } : prev);
    } catch (e) {
      console.error('Toggle error:', e);
    }
  };

  const handleAddTask = async () => {
    if (!proc || !newTask.trim()) return;
    setAddingTask(true);
    try {
      const item = await addChecklistItem(proc.id, {
        title: newTask.trim(),
        category: newTaskCategory.trim() || undefined,
      });
      setProc(prev =>
        prev
          ? { ...prev, checklist_items: [...(prev.checklist_items ?? []), item] }
          : prev
      );
      setNewTask('');
      setNewTaskCategory('');
    } catch (e) {
      console.error('Add task error:', e);
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (itemId: string) => {
    try {
      await deleteChecklistItem(itemId);
      setProc(prev =>
        prev
          ? { ...prev, checklist_items: prev.checklist_items?.filter(i => i.id !== itemId) }
          : prev
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!proc) return;
    try {
      await updateOnboardingProcess(proc.id, { status: status as any });
      setProc(prev => (prev ? { ...prev, status: status as any } : prev));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignAsset = async (assetId: string) => {
    if (!proc) return;
    setAssigning(assetId);
    try {
      const updated = await assignAssetToProcess(proc.id, assetId, proc.employee_name);
      setProc(updated);
      // Update local assets list
      setAllAssets(prev => prev.map(a =>
        a.id === assetId ? { ...a, status: 'In Use' as any } : a
      ));
    } catch (e) {
      console.error('Assign asset error:', e);
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassignAsset = async (assetId: string) => {
    if (!proc) return;
    if (!window.confirm('Rimuovere questo dispositivo dal processo?')) return;
    try {
      const updated = await unassignAssetFromProcess(proc.id, assetId);
      setProc(updated);
      setAllAssets(prev => prev.map(a =>
        a.id === assetId ? { ...a, status: 'Ready to Deploy' as any } : a
      ));
    } catch (e) {
      console.error('Unassign asset error:', e);
    }
  };

  /* ─── RENDER ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!proc) {
    return (
      <div className="text-center py-16 text-neutral-400">
        <p className="text-lg mb-4">Processo non trovato</p>
        <button onClick={() => nav('/onboarding')} className="text-primary-600 hover:underline text-sm">Torna alla lista</button>
      </div>
    );
  }

  const sOpt = statusOptions.find(s => s.value === proc.status);
  const assignedAssets = proc.assigned_assets ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => nav('/onboarding')} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Torna alla lista
      </button>

      {/* ─── INFO CARD ─── */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{proc.employee_name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${proc.type === 'onboarding' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                {proc.type === 'onboarding' ? 'Onboarding' : 'Offboarding'}
              </span>
            </div>
            {proc.position && <p className="text-sm text-neutral-500">{proc.position}{proc.department ? ` · ${proc.department}` : ''}</p>}
            {proc.employee_email && <p className="text-sm text-neutral-400 mt-0.5">{proc.employee_email}</p>}
          </div>
          {isAdminOrAgent && (
            <select value={proc.status} onChange={e => handleStatusChange(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-900 dark:text-white outline-none">
              {statusOptions.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-0.5">Stato</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${sOpt?.color}`} />
              <span className="font-medium text-neutral-700 dark:text-neutral-200">{sOpt?.label}</span>
            </div>
          </div>
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-0.5">Sede</p>
            <span className="font-medium text-neutral-700 dark:text-neutral-200">{proc.location || '—'}</span>
          </div>
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-0.5">Assegnato a</p>
            <span className="font-medium text-neutral-700 dark:text-neutral-200">{proc.assignee?.name || '—'}</span>
          </div>
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-0.5">Data inizio</p>
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {proc.start_date ? new Date(proc.start_date).toLocaleDateString('it-IT') : '—'}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Progresso: {done}/{total} completati</span>
            <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : 'text-primary-600'}`}>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ─── DISPOSITIVI ASSEGNATI ─── */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>
            <h2 className="font-semibold text-neutral-900 dark:text-white">Dispositivi assegnati</h2>
          </div>
          {isAdminOrAgent && (
            <button
              onClick={() => setShowAssetPicker(!showAssetPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Assegna dal magazzino
            </button>
          )}
        </div>

        {/* Assigned assets list */}
        {assignedAssets.length === 0 && !showAssetPicker ? (
          <div className="py-10 text-center text-neutral-400 text-sm">
            Nessun dispositivo assegnato a questo processo
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-700/40">
            {assignedAssets.map(asset => (
              <div key={asset.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/20 transition-colors">
                {asset.image ? (
                  <img src={asset.image} alt={asset.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-700" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/assets/${asset.id}`} className="font-medium text-sm text-neutral-900 dark:text-white hover:text-primary-600 transition-colors">
                    {asset.name}
                  </Link>
                  <p className="text-xs text-neutral-400 truncate">
                    {asset.type}{asset.model ? ` · ${asset.model}` : ''}{asset.assetTag ? ` · ${asset.assetTag}` : ''}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  In Use
                </span>
                {isAdminOrAgent && (
                  <button onClick={() => handleUnassignAsset(asset.id)} className="text-neutral-400 hover:text-red-500 transition-colors" title="Rimuovi">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Asset picker */}
        {showAssetPicker && (
          <div className="border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40">
            <div className="px-6 py-3">
              <input
                type="text"
                placeholder="Cerca dispositivo per nome, modello, tag..."
                value={assetSearch}
                onChange={e => setAssetSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none placeholder-neutral-400"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {availableAssets.length === 0 ? (
                <p className="px-6 py-4 text-sm text-neutral-400 text-center">
                  Nessun dispositivo "Ready to Deploy" disponibile
                </p>
              ) : (
                availableAssets.slice(0, 20).map(asset => (
                  <div key={asset.id} className="flex items-center gap-3 px-6 py-2.5 hover:bg-white dark:hover:bg-neutral-700/30 transition-colors">
                    {asset.image ? (
                      <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-lg object-cover bg-neutral-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{asset.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{asset.type}{asset.model ? ` · ${asset.model}` : ''}{asset.assetTag ? ` · ${asset.assetTag}` : ''}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 whitespace-nowrap">
                      Ready
                    </span>
                    <button
                      onClick={() => handleAssignAsset(asset.id)}
                      disabled={assigning === asset.id}
                      className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {assigning === asset.id ? '...' : 'Assegna'}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-2 border-t border-neutral-100 dark:border-neutral-700">
              <button onClick={() => { setShowAssetPicker(false); setAssetSearch(''); }} className="text-xs text-neutral-500 hover:text-neutral-700">
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── CHECKLIST ─── */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="font-semibold text-neutral-900 dark:text-white">Checklist</h2>
          </div>
          <span className="text-xs text-neutral-400">{done}/{total} completati</span>
        </div>

        {total === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm">
            <p className="mb-2">Nessun task nella checklist.</p>
            <p className="text-xs">Aggiungi task manualmente oppure crea il processo da un template.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-700/40">
            {grouped.map(([cat, catItems]) => (
              <div key={cat}>
                <div className="px-6 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{cat}</span>
                  <span className="text-[10px] text-neutral-400">
                    {catItems.filter(i => i.is_completed).length}/{catItems.length}
                  </span>
                </div>
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/20 transition-colors group"
                  >
                    <button
                      onClick={() => handleToggle(item)}
                      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        item.is_completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
                      }`}
                    >
                      {item.is_completed && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${item.is_completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        {item.title}
                      </span>
                      {item.description && <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>}
                    </div>
                    {item.completed_at && (
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {new Date(item.completed_at).toLocaleDateString('it-IT')}
                      </span>
                    )}
                    {isAdminOrAgent && (
                      <button
                        onClick={() => handleDeleteTask(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all"
                        title="Elimina task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Add task */}
        {isAdminOrAgent && (
          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nuovo task..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none placeholder-neutral-400"
              />
              <input
                type="text"
                placeholder="Categoria (opz.)"
                value={newTaskCategory}
                onChange={e => setNewTaskCategory(e.target.value)}
                className="sm:w-40 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none placeholder-neutral-400"
              />
              <button
                onClick={handleAddTask}
                disabled={addingTask || !newTask.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                Aggiungi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {proc.notes && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
          <p className="text-neutral-400 text-xs uppercase tracking-wide mb-2">Note</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">{proc.notes}</p>
        </div>
      )}
    </div>
  );
};

export default OnboardingDetail;