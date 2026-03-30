import { supabase } from './supabaseClient';
import { User, Asset, Notification } from '@/types';
import { getUsers, getAssets, updateAsset } from './api';

// --- TYPES ---

export interface OnboardingProcess {
  id: string;
  organization_id: string;
  employee_name: string;
  employee_email?: string;
  type: 'onboarding' | 'offboarding';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  department?: string;
  position?: string;
  start_date?: string;
  location?: string;
  assigned_to?: string;
  assignee?: User;
  notes?: string;
  assigned_asset_ids?: string[];
  assigned_assets?: Asset[];
  created_at: string;
  updated_at: string;
  checklist_items?: OnboardingChecklistItem[];
}

export interface OnboardingChecklistItem {
  id: string;
  process_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  due_date?: string;
  assigned_to?: string;
  category?: string;
  sort_order: number;
}

export interface OnboardingTemplate {
  id: string;
  organization_id: string;
  name: string;
  type: 'onboarding' | 'offboarding';
  description?: string;
  created_at: string;
  items?: OnboardingTemplateItem[];
}

export interface OnboardingTemplateItem {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  category?: string;
  sort_order: number;
}

// --- DEFAULT TEMPLATES ---

const DEFAULT_ONBOARDING_ITEMS = [
  { title: 'Creare account email aziendale', category: 'Account & Accessi', sort_order: 0 },
  { title: 'Creare account Active Directory / SSO', category: 'Account & Accessi', sort_order: 1 },
  { title: 'Assegnare licenze software (Office 365, ecc.)', category: 'Account & Accessi', sort_order: 2 },
  { title: 'Configurare accesso VPN', category: 'Account & Accessi', sort_order: 3 },
  { title: 'Aggiungere ai gruppi Teams/Slack di reparto', category: 'Account & Accessi', sort_order: 4 },
  { title: 'Preparare postazione di lavoro', category: 'Hardware', sort_order: 5 },
  { title: 'Assegnare laptop/PC', category: 'Hardware', sort_order: 6 },
  { title: 'Assegnare monitor, tastiera, mouse', category: 'Hardware', sort_order: 7 },
  { title: 'Assegnare telefono aziendale (se previsto)', category: 'Hardware', sort_order: 8 },
  { title: 'Configurare stampante di reparto', category: 'Hardware', sort_order: 9 },
  { title: 'Consegnare badge/chiavi di accesso', category: 'Sicurezza & Badge', sort_order: 10 },
  { title: 'Configurare autenticazione a due fattori', category: 'Sicurezza & Badge', sort_order: 11 },
  { title: 'Briefing policy sicurezza IT', category: 'Sicurezza & Badge', sort_order: 12 },
  { title: 'Firma policy uso accettabile dispositivi', category: 'Documenti', sort_order: 13 },
  { title: 'Firma NDA (se richiesto)', category: 'Documenti', sort_order: 14 },
  { title: 'Welcome meeting con il team IT', category: 'Formazione', sort_order: 15 },
  { title: 'Training strumenti aziendali', category: 'Formazione', sort_order: 16 },
  { title: 'Tour sede e presentazione colleghi', category: 'Formazione', sort_order: 17 },
];

const DEFAULT_OFFBOARDING_ITEMS = [
  { title: 'Ritirare laptop/PC aziendale', category: 'Hardware', sort_order: 0 },
  { title: 'Ritirare telefono aziendale', category: 'Hardware', sort_order: 1 },
  { title: 'Ritirare monitor e periferiche', category: 'Hardware', sort_order: 2 },
  { title: 'Ritirare badge e chiavi di accesso', category: 'Hardware', sort_order: 3 },
  { title: 'Disattivare account email', category: 'Account & Accessi', sort_order: 4 },
  { title: 'Disattivare account Active Directory / SSO', category: 'Account & Accessi', sort_order: 5 },
  { title: 'Revocare accesso VPN', category: 'Account & Accessi', sort_order: 6 },
  { title: 'Revocare licenze software', category: 'Account & Accessi', sort_order: 7 },
  { title: 'Rimuovere da gruppi Teams/Slack', category: 'Account & Accessi', sort_order: 8 },
  { title: 'Backup dati utente', category: 'Dati & Sicurezza', sort_order: 9 },
  { title: 'Trasferire ownership file condivisi', category: 'Dati & Sicurezza', sort_order: 10 },
  { title: 'Revocare accesso sistemi interni', category: 'Dati & Sicurezza', sort_order: 11 },
  { title: 'Wipe dispositivi personali (MDM)', category: 'Dati & Sicurezza', sort_order: 12 },
  { title: 'Formattare e ripristinare dispositivi', category: 'Reset Dispositivi', sort_order: 13 },
  { title: 'Aggiornare inventario asset', category: 'Reset Dispositivi', sort_order: 14 },
  { title: 'Colloquio di uscita IT', category: 'Amministrativo', sort_order: 15 },
  { title: 'Conferma completamento offboarding', category: 'Amministrativo', sort_order: 16 },
];

// --- HELPER ---

const enrichProcesses = async (
  rows: any[]
): Promise<OnboardingProcess[]> => {
  const [users, assets] = await Promise.all([getUsers(), getAssets()]);
  const usersMap = new Map(users.map(u => [u.id, u]));
  const assetsMap = new Map(assets.map(a => [a.id, a]));

  return rows.map(r => {
    const assetIds: string[] = r.assigned_asset_ids || [];
    return {
      ...r,
      assignee: r.assigned_to ? usersMap.get(r.assigned_to) ?? undefined : undefined,
      assigned_assets: assetIds.map(id => assetsMap.get(id)).filter(Boolean) as Asset[],
    };
  });
};

// --- ENSURE DEFAULT TEMPLATES ---

export const ensureDefaultTemplates = async (): Promise<void> => {
  const { data: existing } = await supabase
    .from('onboarding_templates')
    .select('id')
    .limit(1);

  if (existing && existing.length > 0) return; // templates already exist

  // Create Onboarding template
  const { data: onbTpl } = await supabase
    .from('onboarding_templates')
    .insert({ name: 'Onboarding IT Standard', type: 'onboarding', description: 'Template standard per onboarding nuovi dipendenti - include setup account, hardware e formazione.' })
    .select()
    .single();

  if (onbTpl) {
    await supabase.from('onboarding_template_items').insert(
      DEFAULT_ONBOARDING_ITEMS.map(item => ({ ...item, template_id: onbTpl.id }))
    );
  }

  // Create Offboarding template
  const { data: offTpl } = await supabase
    .from('onboarding_templates')
    .insert({ name: 'Offboarding IT Standard', type: 'offboarding', description: 'Template standard per offboarding - include ritiro hardware, revoca accessi e wipe dispositivi.' })
    .select()
    .single();

  if (offTpl) {
    await supabase.from('onboarding_template_items').insert(
      DEFAULT_OFFBOARDING_ITEMS.map(item => ({ ...item, template_id: offTpl.id }))
    );
  }
};

// --- PROCESSES ---

export const getOnboardingProcesses = async (): Promise<OnboardingProcess[]> => {
  const { data, error } = await supabase
    .from('onboarding_processes')
    .select('*, checklist_items:onboarding_checklist_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return enrichProcesses(data ?? []);
};

export const getOnboardingProcessById = async (
  id: string
): Promise<OnboardingProcess | null> => {
  const { data, error } = await supabase
    .from('onboarding_processes')
    .select('*, checklist_items:onboarding_checklist_items(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  const [enriched] = await enrichProcesses([data]);
  if (enriched.checklist_items) {
    enriched.checklist_items.sort((a, b) => a.sort_order - b.sort_order);
  }
  return enriched;
};

export const createOnboardingProcess = async (
  proc: Partial<OnboardingProcess>
): Promise<OnboardingProcess> => {
  const { data, error } = await supabase
    .from('onboarding_processes')
    .insert({
      employee_name: proc.employee_name,
      employee_email: proc.employee_email || null,
      type: proc.type || 'onboarding',
      status: proc.status || 'pending',
      department: proc.department || null,
      position: proc.position || null,
      start_date: proc.start_date || null,
      location: proc.location || null,
      assigned_to: proc.assigned_to || null,
      notes: proc.notes || null,
      assigned_asset_ids: proc.assigned_asset_ids || [],
    })
    .select()
    .single();
  if (error) throw error;
  return (await getOnboardingProcessById(data.id))!;
};

export const updateOnboardingProcess = async (
  id: string,
  updates: Partial<OnboardingProcess>
): Promise<OnboardingProcess> => {
  const db: any = { updated_at: new Date().toISOString() };
  if (updates.employee_name !== undefined) db.employee_name = updates.employee_name;
  if (updates.employee_email !== undefined) db.employee_email = updates.employee_email;
  if (updates.type !== undefined) db.type = updates.type;
  if (updates.status !== undefined) db.status = updates.status;
  if (updates.department !== undefined) db.department = updates.department;
  if (updates.position !== undefined) db.position = updates.position;
  if (updates.start_date !== undefined) db.start_date = updates.start_date;
  if (updates.location !== undefined) db.location = updates.location;
  if (updates.assigned_to !== undefined) db.assigned_to = updates.assigned_to;
  if (updates.notes !== undefined) db.notes = updates.notes;
  if (updates.assigned_asset_ids !== undefined) db.assigned_asset_ids = updates.assigned_asset_ids;

  const { error } = await supabase
    .from('onboarding_processes')
    .update(db)
    .eq('id', id);
  if (error) throw error;
  return (await getOnboardingProcessById(id))!;
};

export const deleteOnboardingProcess = async (id: string): Promise<void> => {
  await supabase.from('onboarding_checklist_items').delete().eq('process_id', id);
  const { error } = await supabase
    .from('onboarding_processes')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// --- CHECKLIST ITEMS ---

export const toggleChecklistItem = async (
  itemId: string,
  completed: boolean,
  userId: string
): Promise<OnboardingChecklistItem> => {
  const { data, error } = await supabase
    .from('onboarding_checklist_items')
    .update({
      is_completed: completed,
      completed_by: completed ? userId : null,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw error;
  return data as OnboardingChecklistItem;
};

export const addChecklistItem = async (
  processId: string,
  item: Partial<OnboardingChecklistItem>
): Promise<OnboardingChecklistItem> => {
  const { data: existing } = await supabase
    .from('onboarding_checklist_items')
    .select('sort_order')
    .eq('process_id', processId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('onboarding_checklist_items')
    .insert({
      process_id: processId,
      title: item.title,
      description: item.description || null,
      category: item.category || null,
      due_date: item.due_date || null,
      assigned_to: item.assigned_to || null,
      is_completed: false,
      sort_order: item.sort_order ?? nextOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return data as OnboardingChecklistItem;
};

export const updateChecklistItem = async (
  id: string,
  updates: Partial<OnboardingChecklistItem>
): Promise<OnboardingChecklistItem> => {
  const db: any = {};
  if (updates.title !== undefined) db.title = updates.title;
  if (updates.description !== undefined) db.description = updates.description;
  if (updates.category !== undefined) db.category = updates.category;
  if (updates.due_date !== undefined) db.due_date = updates.due_date;
  if (updates.assigned_to !== undefined) db.assigned_to = updates.assigned_to;
  if (updates.sort_order !== undefined) db.sort_order = updates.sort_order;

  const { data, error } = await supabase
    .from('onboarding_checklist_items')
    .update(db)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as OnboardingChecklistItem;
};

export const deleteChecklistItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('onboarding_checklist_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// --- TEMPLATES ---

export const getOnboardingTemplates = async (): Promise<OnboardingTemplate[]> => {
  const { data, error } = await supabase
    .from('onboarding_templates')
    .select('*, items:onboarding_template_items(*)')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(t => ({
    ...t,
    items: (t.items ?? []).sort(
      (a: OnboardingTemplateItem, b: OnboardingTemplateItem) =>
        a.sort_order - b.sort_order
    ),
  }));
};

export const getTemplateById = async (
  id: string
): Promise<OnboardingTemplate | null> => {
  const { data, error } = await supabase
    .from('onboarding_templates')
    .select('*, items:onboarding_template_items(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return {
    ...data,
    items: (data.items ?? []).sort(
      (a: OnboardingTemplateItem, b: OnboardingTemplateItem) =>
        a.sort_order - b.sort_order
    ),
  };
};

export const createTemplate = async (
  tpl: Partial<OnboardingTemplate>
): Promise<OnboardingTemplate> => {
  const { data, error } = await supabase
    .from('onboarding_templates')
    .insert({
      name: tpl.name,
      type: tpl.type || 'onboarding',
      description: tpl.description || null,
    })
    .select()
    .single();
  if (error) throw error;
  return { ...data, items: [] };
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await supabase.from('onboarding_template_items').delete().eq('template_id', id);
  const { error } = await supabase
    .from('onboarding_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const addTemplateItem = async (
  templateId: string,
  item: Partial<OnboardingTemplateItem>
): Promise<OnboardingTemplateItem> => {
  const { data: existing } = await supabase
    .from('onboarding_template_items')
    .select('sort_order')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('onboarding_template_items')
    .insert({
      template_id: templateId,
      title: item.title,
      description: item.description || null,
      category: item.category || null,
      sort_order: item.sort_order ?? nextOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return data as OnboardingTemplateItem;
};

export const deleteTemplateItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('onboarding_template_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// --- CREATE PROCESS FROM TEMPLATE ---

export const createProcessFromTemplate = async (
  templateId: string,
  processData: Partial<OnboardingProcess>
): Promise<OnboardingProcess> => {
  const tpl = await getTemplateById(templateId);
  if (!tpl) throw new Error('Template not found');

  const proc = await createOnboardingProcess({
    ...processData,
    type: tpl.type,
  });

  if (tpl.items && tpl.items.length > 0) {
    const items = tpl.items.map(ti => ({
      process_id: proc.id,
      title: ti.title,
      description: ti.description || null,
      category: ti.category || null,
      sort_order: ti.sort_order,
      is_completed: false,
    }));
    const { error } = await supabase
      .from('onboarding_checklist_items')
      .insert(items);
    if (error) throw error;
  }

  return (await getOnboardingProcessById(proc.id))!;
};

// --- ASSET ASSIGNMENT ---

export const assignAssetToProcess = async (
  processId: string,
  assetId: string,
  employeeName: string
): Promise<OnboardingProcess> => {
  // Get current process
  const proc = await getOnboardingProcessById(processId);
  if (!proc) throw new Error('Process not found');

  const currentIds = proc.assigned_asset_ids || [];
  if (currentIds.includes(assetId)) return proc;

  // Update process with new asset
  const newIds = [...currentIds, assetId];
  const { error } = await supabase
    .from('onboarding_processes')
    .update({ assigned_asset_ids: newIds, updated_at: new Date().toISOString() })
    .eq('id', processId);
  if (error) throw error;

  // Mark asset as "In Use" with notes
  await supabase.from('assets').update({
    status: 'In Use',
    notes: `Assegnato tramite ${proc.type} — ${employeeName}`,
  }).eq('id', assetId);

  return (await getOnboardingProcessById(processId))!;
};

export const unassignAssetFromProcess = async (
  processId: string,
  assetId: string
): Promise<OnboardingProcess> => {
  const proc = await getOnboardingProcessById(processId);
  if (!proc) throw new Error('Process not found');

  const newIds = (proc.assigned_asset_ids || []).filter(id => id !== assetId);

  const { error } = await supabase
    .from('onboarding_processes')
    .update({ assigned_asset_ids: newIds, updated_at: new Date().toISOString() })
    .eq('id', processId);
  if (error) throw error;

  // Set asset back to Ready to Deploy
  await supabase.from('assets').update({
    status: 'Ready to Deploy',
    notes: null,
  }).eq('id', assetId);

  return (await getOnboardingProcessById(processId))!;
};

// --- DEADLINE NOTIFICATIONS ---

export const checkOnboardingDeadlines = async (): Promise<Notification[]> => {
  const processes = await getOnboardingProcesses();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const notifications: Notification[] = [];

  for (const proc of processes) {
    if (!proc.start_date) continue;
    if (proc.status === 'completed' || proc.status === 'cancelled') continue;

    const startDate = new Date(proc.start_date);
    startDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const typeLabel = proc.type === 'onboarding' ? 'Onboarding' : 'Offboarding';

    if (diffDays === 3 || diffDays === 2 || diffDays === 1) {
      notifications.push({
        id: `onb-deadline-${proc.id}-${diffDays}`,
        type: diffDays === 1 ? 'error' : 'warning',
        message: `${typeLabel} di ${proc.employee_name} tra ${diffDays} giorn${diffDays === 1 ? 'o' : 'i'}!`,
        timestamp: new Date().toISOString(),
        read: false,
        link: `/onboarding/${proc.id}`,
        category: 'GENERAL',
      });
    } else if (diffDays === 0) {
      notifications.push({
        id: `onb-deadline-${proc.id}-today`,
        type: 'error',
        message: `${typeLabel} di ${proc.employee_name} è OGGI!`,
        timestamp: new Date().toISOString(),
        read: false,
        link: `/onboarding/${proc.id}`,
        category: 'GENERAL',
      });
    } else if (diffDays < 0 && diffDays >= -3) {
      notifications.push({
        id: `onb-deadline-${proc.id}-overdue`,
        type: 'error',
        message: `${typeLabel} di ${proc.employee_name} è scaduto da ${Math.abs(diffDays)} giorn${Math.abs(diffDays) === 1 ? 'o' : 'i'}!`,
        timestamp: new Date().toISOString(),
        read: false,
        link: `/onboarding/${proc.id}`,
        category: 'GENERAL',
      });
    }
  }

  return notifications;
};