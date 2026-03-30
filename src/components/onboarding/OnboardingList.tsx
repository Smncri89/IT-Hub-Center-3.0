import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import { Role } from '@/types';
import {
  OnboardingProcess,
  OnboardingTemplate,
  getOnboardingProcesses,
  getOnboardingTemplates,
  createProcessFromTemplate,
  createOnboardingProcess,
  deleteOnboardingProcess,
  ensureDefaultTemplates,
} from '@/services/onboardingService';
import { getUsers } from '@/services/api';
import { getLocations, Location } from '@/services/locationsService';
import type { User } from '@/types';

/* ─── tiny helpers ─── */
const badge = (
  color: string,
  label: string
) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}
  >
    {label}
  </span>
);

const statusColor: Record<string, string> = {
  pending:
    'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  in_progress:
    'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  completed:
    'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  cancelled:
    'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400',
};

const typeColor: Record<string, string> = {
  onboarding:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  offboarding:
    'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const statusLabel: Record<string, string> = {
  pending: 'In attesa',
  in_progress: 'In corso',
  completed: 'Completato',
  cancelled: 'Annullato',
};

const OnboardingList: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const nav = useNavigate();

  const [processes, setProcesses] = useState<OnboardingProcess[]>([]);
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'onboarding' | 'offboarding'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // new-process modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employee_name: '',
    employee_email: '',
    type: 'onboarding' as 'onboarding' | 'offboarding',
    department: '',
    position: '',
    start_date: '',
    location: '',
    assigned_to: '',
    template_id: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isAdminOrAgent =
    user?.role === Role.Admin || user?.role === Role.Agent;

  /* ─── fetch ─── */
  useEffect(() => {
    (async () => {
      try {
        // Seed default templates if none exist
        await ensureDefaultTemplates();

        const [p, tpl, u, loc] = await Promise.all([
          getOnboardingProcesses(),
          getOnboardingTemplates(),
          getUsers(),
          getLocations(),
        ]);
        setProcesses(p);
        setTemplates(tpl);
        setUsers(u);
        setLocations(loc);
      } catch (e: any) {
        console.error('Fetch error:', e);
        setError(e.message || 'Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ─── derived data ─── */
  const filtered = useMemo(() => {
    let list = processes;
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.employee_name.toLowerCase().includes(q) ||
          (p.department ?? '').toLowerCase().includes(q) ||
          (p.position ?? '').toLowerCase().includes(q) ||
          (p.location ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [processes, typeFilter, statusFilter, search]);

  const kpi = useMemo(() => {
    const total = processes.length;
    const pending = processes.filter(p => p.status === 'pending').length;
    const inProgress = processes.filter(p => p.status === 'in_progress').length;
    const completed = processes.filter(p => p.status === 'completed').length;
    const onb = processes.filter(p => p.type === 'onboarding').length;
    const off = processes.filter(p => p.type === 'offboarding').length;
    return { total, pending, inProgress, completed, onb, off };
  }, [processes]);

  /* ─── progress % for a single process ─── */
  const progress = (p: OnboardingProcess) => {
    const items = p.checklist_items ?? [];
    if (items.length === 0) return 0;
    return Math.round(
      (items.filter(i => i.is_completed).length / items.length) * 100
    );
  };

  /* ─── create ─── */
  const handleCreate = async () => {
    if (!form.employee_name.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const base: Partial<OnboardingProcess> = {
        employee_name: form.employee_name.trim(),
        employee_email: form.employee_email.trim() || undefined,
        type: form.type,
        department: form.department.trim() || undefined,
        position: form.position.trim() || undefined,
        start_date: form.start_date || undefined,
        location: form.location || undefined,
        assigned_to: form.assigned_to || undefined,
        status: 'pending',
      };

      let proc: OnboardingProcess;
      if (form.template_id) {
        proc = await createProcessFromTemplate(form.template_id, base);
      } else {
        proc = await createOnboardingProcess(base);
      }
      setProcesses(prev => [proc, ...prev]);
      setShowModal(false);
      setForm({
        employee_name: '',
        employee_email: '',
        type: 'onboarding',
        department: '',
        position: '',
        start_date: '',
        location: '',
        assigned_to: '',
        template_id: '',
      });
    } catch (e: any) {
      console.error('Create error:', e);
      setCreateError(e.message || 'Errore nella creazione del processo');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questo processo?')) return;
    try {
      await deleteOnboardingProcess(id);
      setProcesses(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p className="text-sm mb-2">Errore: {error}</p>
        <button onClick={() => window.location.reload()} className="text-primary-600 hover:underline text-sm">Ricarica</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Onboarding / Offboarding
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Gestisci i processi di ingresso e uscita dei dipendenti
          </p>
        </div>
        {isAdminOrAgent && (
          <div className="flex gap-2">
            <button
              onClick={() => { setForm(f => ({ ...f, type: 'onboarding' })); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
              Onboarding
            </button>
            <button
              onClick={() => { setForm(f => ({ ...f, type: 'offboarding' })); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
              Offboarding
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Totali', value: kpi.total, color: 'text-neutral-900 dark:text-white' },
          { label: 'In attesa', value: kpi.pending, color: 'text-yellow-600' },
          { label: 'In corso', value: kpi.inProgress, color: 'text-blue-600' },
          { label: 'Completati', value: kpi.completed, color: 'text-green-600' },
          { label: 'Onboarding', value: kpi.onb, color: 'text-emerald-600' },
          { label: 'Offboarding', value: kpi.off, color: 'text-rose-600' },
        ].map(k => (
          <div
            key={k.label}
            className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm"
          >
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              {k.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Cerca dipendente, reparto, sede..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white outline-none"
        >
          <option value="all">Tutti i tipi</option>
          <option value="onboarding">Onboarding</option>
          <option value="offboarding">Offboarding</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white outline-none"
        >
          <option value="all">Tutti gli stati</option>
          <option value="pending">In attesa</option>
          <option value="in_progress">In corso</option>
          <option value="completed">Completato</option>
          <option value="cancelled">Annullato</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400 dark:text-neutral-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-sm">Nessun processo trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
                  <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400">Dipendente</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400">Tipo</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400">Stato</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400">Sede</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400">Progresso</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400">Assegnato a</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400">Data inizio</th>
                  {isAdminOrAgent && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                {filtered.map(p => {
                  const pct = progress(p);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 cursor-pointer transition-colors"
                      onClick={() => nav(`/onboarding/${p.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-neutral-900 dark:text-white">{p.employee_name}</div>
                        {p.position && <div className="text-xs text-neutral-400">{p.position}{p.department ? ` · ${p.department}` : ''}</div>}
                      </td>
                      <td className="px-5 py-3.5">{badge(typeColor[p.type], p.type === 'onboarding' ? 'Onboarding' : 'Offboarding')}</td>
                      <td className="px-5 py-3.5">{badge(statusColor[p.status] ?? '', statusLabel[p.status] || p.status)}</td>
                      <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-300">{p.location || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-neutral-500">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-300">
                        {p.assignee?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500">
                        {p.start_date ? new Date(p.start_date).toLocaleDateString('it-IT') : '—'}
                      </td>
                      {isAdminOrAgent && (
                        <td className="px-5 py-3.5">
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                            title="Elimina"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── NEW PROCESS MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowModal(false); setCreateError(null); }} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Header con badge tipo */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Nuovo processo</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${form.type === 'onboarding' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                {form.type === 'onboarding' ? 'Onboarding' : 'Offboarding'}
              </span>
            </div>

            {/* Errore creazione */}
            {createError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
                {createError}
              </div>
            )}

            {/* template selector */}
            {templates.filter(tp => tp.type === form.type).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Template (opzionale)
                </label>
                <select
                  value={form.template_id}
                  onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none"
                >
                  <option value="">— Nessun template —</option>
                  {templates.filter(tp => tp.type === form.type).map(tp => (
                    <option key={tp.id} value={tp.id}>
                      {tp.name} — {tp.items?.length ?? 0} task
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nome dipendente *</label>
                <input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none" placeholder="Es. Mario Rossi" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                <input type="email" value={form.employee_email} onChange={e => setForm(f => ({ ...f, employee_email: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none" placeholder="email@azienda.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any, template_id: '' }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none">
                  <option value="onboarding">Onboarding</option>
                  <option value="offboarding">Offboarding</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data inizio</label>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Reparto</label>
                <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none" placeholder="Es. IT, Finance, HR" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Posizione</label>
                <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none" placeholder="Es. Junior Developer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Sede</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none">
                  <option value="">— Seleziona sede —</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}{loc.city ? ` — ${loc.city}` : ''}{loc.is_headquarters ? ' (HQ)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Assegnato a</label>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white outline-none">
                  <option value="">— Nessuno —</option>
                  {users.filter(u => u.role === Role.Admin || u.role === Role.Agent).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowModal(false); setCreateError(null); }} className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors">
                Annulla
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.employee_name.trim()}
                className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 ${form.type === 'onboarding' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {creating ? 'Creazione...' : `Crea ${form.type === 'onboarding' ? 'Onboarding' : 'Offboarding'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingList;