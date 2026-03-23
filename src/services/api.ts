
import { supabase } from './supabaseClient';
import { 
  Ticket, Asset, License, Incident, KBArticle, User, 
  Vendor, VendorInteraction, VendorComment,
  Integration, SLAPolicy, 
  TicketStatus, TicketPriority, Role, Language,
  LicenseAssignment, Comment, IncidentTimelineEntry
} from '@/types';
import { GoogleGenAI } from '@google/genai';
import { mapTicketData, mapAssetData, mapLicenseData, mapIncidentData, mapKBArticleData, mapProfileToUser, mapCommentData } from '@/utils/mappers';

// Helper to handle AI if configured
const genAI = (typeof process !== 'undefined' && process.env?.API_KEY) ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data.map(mapProfileToUser).filter((u): u is User => u !== null);
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  // Map User fields to DB columns
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.role) dbUpdates.role = updates.role;
  if (updates.company) dbUpdates.company = updates.company;
  if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.statusMessage !== undefined) dbUpdates.status_message = updates.statusMessage;
  if (updates.statusMessageTimestamp !== undefined) dbUpdates.status_message_timestamp = updates.statusMessageTimestamp;
  if (updates.signatureText !== undefined) dbUpdates.signature_text = updates.signatureText;
  if (updates.signatureLogo !== undefined) dbUpdates.signature_logo = updates.signatureLogo;
  if (updates.weekStart) dbUpdates.week_start = updates.weekStart;
  if (updates.timeFormat) dbUpdates.time_format = updates.timeFormat;
  if (updates.dateFormat) dbUpdates.date_format = updates.dateFormat;
  if (updates.muteUntil !== undefined) dbUpdates.mute_until = updates.muteUntil;
  if (updates.muteWeekends !== undefined) dbUpdates.mute_weekends = updates.muteWeekends;
  if (updates.muteOutsideHours !== undefined) dbUpdates.mute_outside_hours = updates.muteOutsideHours;
  if (updates.quietHoursStart) dbUpdates.quiet_hours_start = updates.quietHoursStart;
  if (updates.quietHoursEnd) dbUpdates.quiet_hours_end = updates.quietHoursEnd;
  if (updates.isTwoFactorEnabled !== undefined) dbUpdates.is_two_factor_enabled = updates.isTwoFactorEnabled;

  const { data, error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId).select().single();
  if (error) throw error;
  return mapProfileToUser(data);
};

export const createUser = async (userData: { name: string; email: string; role: Role; company?: string }): Promise<void> => {
  // This typically triggers a Supabase Auth invite in a real backend, 
  // but for this demo we might just insert into profiles if auth user exists or stub it.
  // We'll assume this is for inviting via Auth API.
  // Since we can't create auth users directly from client without admin key usually, 
  // we'll assume this function uses a server function or just logs for now if not using Edge Functions.
  console.log("Invite user:", userData);
  // Implementation depends on backend setup (Edge Function recommended)
};

export const importOrUpdateUser = async (userData: any): Promise<{ status: 'invited' | 'updated' | 'error', message?: string }> => {
    // Placeholder for bulk import logic
    return { status: 'invited' };
};

export const bulkCreateUsers = async (usersData: Partial<User>[]): Promise<void> => {
    const dbData = usersData.map(userData => ({
        id: crypto.randomUUID(), // Generate a UUID for the profile
        name: userData.name,
        email: userData.email,
        role: userData.role || 'user',
        department: userData.department,
        location: userData.location,
        status: userData.status || 'active'
    }));
    const { error } = await supabase.from('profiles').insert(dbData);
    if (error) throw error;
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
};

// --- TICKETS ---

export const getTickets = async (): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      comments (*),
      attachments
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Need to fetch users and assets to map relations
  const users = await getUsers();
  const { data: assetsData } = await supabase.from('assets').select('id, name');
  
  const usersMap = new Map(users.map(u => [u.id, u]));
  const assetsMap = new Map<string, { id: string; name: string }>(
    (assetsData || []).map((a: any) => [a.id, a])
  );

  return data.map(t => mapTicketData(t, usersMap, assetsMap));
};

export const getTicketById = async (id: string): Promise<Ticket | null> => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`*, comments (*), attachments`)
    .eq('id', id)
    .single();

  if (error) return null;

  const users = await getUsers();
  const { data: assetsData } = await supabase.from('assets').select('id, name');
  
  const usersMap = new Map(users.map(u => [u.id, u]));
  const assetsMap = new Map<string, { id: string; name: string }>(
    (assetsData || []).map((a: any) => [a.id, a])
  );

  return mapTicketData(data, usersMap, assetsMap);
};

export const createTicket = async (ticketData: Partial<Ticket> & { asset_id?: string, assignee_id?: string }, requester: User, attachments: File[]): Promise<Ticket> => {
  // Upload attachments first
  const attachmentUrls = [];
  for (const file of attachments) {
      const path = `tickets/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('attachments').upload(path, file);
      if (!upErr) {
          const { data } = supabase.storage.from('attachments').getPublicUrl(path);
          attachmentUrls.push(data.publicUrl);
      }
  }

  const { data, error } = await supabase.from('tickets').insert({
    subject: ticketData.subject,
    description: ticketData.description,
    status: ticketData.status || TicketStatus.Open,
    priority: ticketData.priority || TicketPriority.Medium,
    category: ticketData.category,
    subcategory: ticketData.subcategory,
    requester_id: requester.id,
    assignee_id: ticketData.assignee_id || null,
    asset_id: ticketData.asset_id || null,
    attachments: attachmentUrls,
    contact_info: ticketData.contactInfo,
    department: ticketData.department,
    site: ticketData.site,
    floor: ticketData.floor,
    office: ticketData.office
  }).select().single();

  if (error) throw error;
  // Re-fetch to get full object or map partially
  return getTicketById(data.id) as Promise<Ticket>;
};

export const bulkCreateTickets = async (ticketsData: Partial<Ticket>[], requesterId: string): Promise<void> => {
    const dbData = ticketsData.map(ticketData => ({
        subject: ticketData.subject,
        description: ticketData.description,
        status: ticketData.status || TicketStatus.Open,
        priority: ticketData.priority || TicketPriority.Medium,
        category: ticketData.category,
        subcategory: ticketData.subcategory,
        requester_id: ticketData.requester?.id || requesterId,
        assignee_id: ticketData.assignee?.id || null,
        asset_id: ticketData.asset?.id || null,
        contact_info: ticketData.contactInfo,
        department: ticketData.department,
        site: ticketData.site,
        floor: ticketData.floor,
        office: ticketData.office
    }));
    const { error } = await supabase.from('tickets').insert(dbData);
    if (error) throw error;
};

export const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
  const dbUpdates: any = {};
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.priority) dbUpdates.priority = updates.priority;
  if (updates.assignee) dbUpdates.assignee_id = updates.assignee.id;
  if (updates.resolvedAt) dbUpdates.resolved_at = updates.resolvedAt;
  if (updates.status === TicketStatus.Resolved || updates.status === TicketStatus.Closed) {
      if (!updates.resolvedAt) dbUpdates.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from('tickets').update(dbUpdates).eq('id', id);
  if (error) throw error;
  return getTicketById(id) as Promise<Ticket>;
};

export const addCommentToTicket = async (ticketId: string, author: User, content: string, isInternal: boolean): Promise<Comment> => {
  const { data, error } = await supabase.from('comments').insert({
    ticket_id: ticketId,
    author_id: author.id,
    content,
    is_internal_note: isInternal
  }).select().single();

  if (error) throw error;
  return mapCommentData(data, new Map([[author.id, author]]))!;
};

export const addAttachmentsToTicket = async (ticketId: string, files: File[], existingUrls: string[]): Promise<Ticket> => {
    const newUrls = [...existingUrls];
    for (const file of files) {
        const path = `tickets/${ticketId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from('attachments').upload(path, file);
        if (!upErr) {
            const { data } = supabase.storage.from('attachments').getPublicUrl(path);
            newUrls.push(data.publicUrl);
        }
    }
    const { error } = await supabase.from('tickets').update({ attachments: newUrls }).eq('id', ticketId);
    if (error) throw error;
    return getTicketById(ticketId) as Promise<Ticket>;
};

export const generateTicketReply = async (ticket: Ticket, history: string): Promise<string> => {
    if (!genAI) return "AI not configured.";
    const prompt = `
    You are a helpful IT support agent. Draft a reply to this ticket.
    Ticket Subject: ${ticket.subject}
    Description: ${ticket.description}
    History:
    ${history}
    
    Keep it professional, concise, and helpful.
    `;
    try {
        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return result.text || "";
    } catch (e) {
        console.error("Gemini Error", e);
        return "Failed to generate reply.";
    }
};

// --- ASSETS ---

export const getAssets = async (): Promise<Asset[]> => {
  const { data, error } = await supabase.from('assets').select('*');
  if (error) throw error;
  const users = await getUsers();
  const usersMap = new Map(users.map(u => [u.id, u]));
  return data.map(a => mapAssetData(a, usersMap));
};

export const getAssetById = async (id: string): Promise<Asset | null> => {
  const { data, error } = await supabase.from('assets').select('*').eq('id', id).single();
  if (error) return null;
  const users = await getUsers();
  const usersMap = new Map(users.map(u => [u.id, u]));
  const asset = mapAssetData(data, usersMap);
  
  // Fetch ticket history
  const { data: tickets } = await supabase.from('tickets').select('*').eq('asset_id', id);
  if (tickets) {
      // Need simplistic mapping here or refetch full tickets
      asset.tickets = tickets.map(t => ({...t, subject: t.subject, status: t.status, updatedAt: t.updated_at} as any));
  }
  return asset;
};

export const createAsset = async (assetData: Partial<Asset>): Promise<Asset> => {
  const dbData: any = {
      name: assetData.name,
      asset_tag: assetData.assetTag,
      type: assetData.type,
      model: assetData.model,
      status: assetData.status,
      serial_number: assetData.serialNumber,
      purchase_date: assetData.purchaseDate,
      purchase_cost: assetData.purchaseCost,
      current_value: assetData.currentValue,
      warranty_end_date: assetData.warrantyEndDate,
      location: assetData.location,
      quantity: assetData.quantity,
      notes: assetData.notes,
      assigned_to_id: assetData.assignedTo?.id || null,
      phone_number: assetData.phoneNumber,
      carrier: assetData.carrier,
      sim_serial: assetData.simSerial,
      esim_serial: assetData.esimSerial,
      image: assetData.image
  };
  const { data, error } = await supabase.from('assets').insert(dbData).select().single();
  if (error) throw error;
  return getAssetById(data.id) as Promise<Asset>;
};

export const bulkCreateAssets = async (assetsData: Partial<Asset>[]): Promise<void> => {
    const dbData = assetsData.map(assetData => ({
        name: assetData.name,
        asset_tag: assetData.assetTag,
        type: assetData.type,
        model: assetData.model,
        status: assetData.status,
        serial_number: assetData.serialNumber,
        purchase_date: assetData.purchaseDate,
        purchase_cost: assetData.purchaseCost,
        current_value: assetData.currentValue,
        warranty_end_date: assetData.warrantyEndDate,
        location: assetData.location,
        quantity: assetData.quantity,
        notes: assetData.notes,
        assigned_to_id: assetData.assignedTo?.id || null,
        phone_number: assetData.phoneNumber,
        carrier: assetData.carrier,
        sim_serial: assetData.simSerial,
        esim_serial: assetData.esimSerial,
        image: assetData.image
    }));
    const { error } = await supabase.from('assets').insert(dbData);
    if (error) throw error;
};

export const updateAsset = async (id: string, updates: Partial<Asset>): Promise<Asset> => {
  const dbData: any = {};
  if (updates.name) dbData.name = updates.name;
  if (updates.status) dbData.status = updates.status;
  if (updates.assignedTo !== undefined) dbData.assigned_to_id = updates.assignedTo?.id || null;
  if (updates.location) dbData.location = updates.location;
  if (updates.currentValue !== undefined) dbData.current_value = updates.currentValue;
  if (updates.image) dbData.image = updates.image;
  if (updates.latitude) dbData.latitude = updates.latitude;
  if (updates.longitude) dbData.longitude = updates.longitude;
  
  // Add other fields as needed
  
  const { error } = await supabase.from('assets').update(dbData).eq('id', id);
  if (error) throw error;
  return getAssetById(id) as Promise<Asset>;
};

export const deleteAsset = async (id: string): Promise<void> => {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw error;
};

export const uploadAssetImage = async (file: File): Promise<string> => {
    const path = `assets/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('assets').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    return data.publicUrl;
};

export const getAssetImageSuggestion = async (query: string): Promise<string | null> => {
    // Stub for Google Search or Image Search API
    // In a real app, you would call a backend function that uses Serper or Google Search API
    return null;
};

export const findImageForModel = async (model: string): Promise<string | null> => {
    const { data } = await supabase.from('assets').select('image').ilike('model', model).not('image', 'is', null).limit(1);
    return data?.[0]?.image || null;
};

// --- LICENSES ---

export const getLicenses = async (): Promise<License[]> => {
  const { data, error } = await supabase.from('licenses').select(`*, assignments:license_assignments(*)`);
  if (error) throw error;
  const users = await getUsers();
  const usersMap = new Map(users.map(u => [u.id, u]));
  return data.map(l => mapLicenseData(l, usersMap));
};

export const createLicense = async (licenseData: Partial<License>): Promise<License> => {
    const { data, error } = await supabase.from('licenses').insert({
        name: licenseData.name,
        software: licenseData.software,
        total_seats: licenseData.totalSeats,
        purchase_date: licenseData.purchaseDate,
        expiration_date: licenseData.expirationDate,
        total_cost: licenseData.totalCost,
        cost_per_seat: licenseData.costPerSeat
    }).select().single();
    if (error) throw error;
    return getLicenses().then(ls => ls.find(l => l.id === data.id)!);
};

export const bulkCreateLicenses = async (licensesData: Partial<License>[]): Promise<void> => {
    const dbData = licensesData.map(licenseData => ({
        name: licenseData.name,
        software: licenseData.software,
        total_seats: licenseData.totalSeats,
        purchase_date: licenseData.purchaseDate,
        expiration_date: licenseData.expirationDate,
        total_cost: licenseData.totalCost,
        cost_per_seat: licenseData.costPerSeat
    }));
    const { error } = await supabase.from('licenses').insert(dbData);
    if (error) throw error;
};

export const updateLicense = async (id: string, updates: Partial<License>): Promise<void> => {
    const dbData: any = {};
    if (updates.name) dbData.name = updates.name;
    if (updates.totalSeats) dbData.total_seats = updates.totalSeats;
    // ... other fields
    const { error } = await supabase.from('licenses').update(dbData).eq('id', id);
    if (error) throw error;
};

export const deleteLicense = async (id: string): Promise<void> => {
    const { error } = await supabase.from('licenses').delete().eq('id', id);
    if (error) throw error;
};

export const assignUserToLicense = async (licenseId: string, userId: string): Promise<void> => {
    const { error } = await supabase.from('license_assignments').insert({ license_id: licenseId, user_id: userId, assigned_date: new Date().toISOString() });
    if (error) throw error;
};

export const unassignUserFromLicense = async (assignmentId: string): Promise<void> => {
    const { error } = await supabase.from('license_assignments').delete().eq('id', assignmentId);
    if (error) throw error;
};

export const checkLicenseExpirationsAndCreateTickets = async (adminUser: User): Promise<void> => {
    // Logic to check expiration and create tickets if needed
    // This is better handled by a backend cron job, but we'll stub it here.
    console.log("Checking license expirations...");
};

// --- INCIDENTS ---

export const getIncidents = async (): Promise<Incident[]> => {
    const { data, error } = await supabase.from('incidents').select('*');
    if (error) throw error;
    const users = await getUsers();
    const usersMap = new Map(users.map(u => [u.id, u]));
    return data.map(i => mapIncidentData(i, usersMap));
};

export const getIncidentById = async (id: string): Promise<Incident | null> => {
    const { data, error } = await supabase.from('incidents').select('*').eq('id', id).single();
    if (error) return null;
    const users = await getUsers();
    const usersMap = new Map(users.map(u => [u.id, u]));
    return mapIncidentData(data, usersMap);
};

export const createIncident = async (incidentData: Partial<Incident>, reporter: User): Promise<Incident> => {
    const { data, error } = await supabase.from('incidents').insert({
        title: incidentData.title,
        description: incidentData.description,
        status: incidentData.status,
        priority: incidentData.priority,
        category: incidentData.category,
        reporter_id: reporter.id,
        assignee_id: incidentData.assignee?.id || null,
        tags: incidentData.tags
    }).select().single();
    if (error) throw error;
    return getIncidentById(data.id) as Promise<Incident>;
};

export const updateIncident = async (id: string, updates: Partial<Incident> & { newTimelineEntry?: any }): Promise<Incident> => {
    const dbData: any = {};
    if (updates.status) dbData.status = updates.status;
    if (updates.solution) dbData.solution = updates.solution;
    if (updates.impactAnalysis) dbData.impact_analysis = updates.impactAnalysis;
    if (updates.rootCauseAnalysis) dbData.root_cause_analysis = updates.rootCauseAnalysis;
    
    if (updates.newTimelineEntry) {
        // Fetch current timeline
        const { data: current } = await supabase.from('incidents').select('timeline').eq('id', id).single();
        const currentTimeline = current?.timeline || [];
        dbData.timeline = [...currentTimeline, updates.newTimelineEntry];
    }

    const { error } = await supabase.from('incidents').update(dbData).eq('id', id);
    if (error) throw error;
    return getIncidentById(id) as Promise<Incident>;
};

export const generatePostMortemSummary = async (incident: Incident): Promise<Partial<Incident>> => {
    if (!genAI) throw new Error("AI not configured");
    const prompt = `Generate a post-mortem analysis for this incident:
    Title: ${incident.title}
    Description: ${incident.description}
    Timeline: ${JSON.stringify(incident.timeline)}
    
    Provide JSON with fields: rootCauseAnalysis, impactAnalysis, solution.`;
    
    const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    const text = result.text;
    // Basic parsing, assuming AI returns valid JSON or we wrap in try/catch
    try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
    } catch {
        return { rootCauseAnalysis: text }; // Fallback
    }
};

// --- KB ---

export const getKBArticles = async (): Promise<KBArticle[]> => {
    const { data, error } = await supabase.from('kb_articles').select('*');
    if (error) throw error;
    const users = await getUsers();
    const usersMap = new Map(users.map(u => [u.id, u]));
    return data.map(a => mapKBArticleData(a, usersMap));
};

export const getKBArticleById = async (id: string): Promise<KBArticle | null> => {
    const { data, error } = await supabase.from('kb_articles').select('*').eq('id', id).single();
    if (error) return null;
    const users = await getUsers();
    const usersMap = new Map(users.map(u => [u.id, u]));
    return mapKBArticleData(data, usersMap);
};

export const createKBArticle = async (articleData: Partial<KBArticle>, author: User): Promise<KBArticle> => {
    const { data, error } = await supabase.from('kb_articles').insert({
        title: articleData.title,
        content: articleData.content,
        category: articleData.category,
        author_id: author.id,
        tags: articleData.tags,
        audience: articleData.audience
    }).select().single();
    if (error) throw error;
    return getKBArticleById(data.id) as Promise<KBArticle>;
};

export const updateKBArticle = async (id: string, updates: Partial<KBArticle>): Promise<KBArticle> => {
    const { error } = await supabase.from('kb_articles').update(updates).eq('id', id);
    if (error) throw error;
    return getKBArticleById(id) as Promise<KBArticle>;
};

export const deleteKBArticle = async (id: string): Promise<void> => {
    const { error } = await supabase.from('kb_articles').delete().eq('id', id);
    if (error) throw error;
};

// --- INTEGRATIONS ---

export const getIntegrations = async (): Promise<Integration[]> => {
    const { data, error } = await supabase.from('user_integrations').select('*');
    if (error) return []; // Return empty if error or table missing
    return data as Integration[];
};

export const saveIntegration = async (userId: string, serviceName: string, apiKey: string): Promise<void> => {
    // Upsert logic
    const { error } = await supabase.from('user_integrations').upsert({
        user_id: userId,
        service_name: serviceName,
        api_key: apiKey
    }, { onConflict: 'user_id,service_name' });
    if (error) throw error;
};

export const deleteIntegration = async (userId: string, serviceName: string): Promise<void> => {
    const { error } = await supabase.from('user_integrations').delete().eq('user_id', userId).eq('service_name', serviceName);
    if (error) throw error;
};

export const submitIntegrationSuggestion = async (name: string, reason: string): Promise<void> => {
    // Just log for now
    console.log("Suggestion:", name, reason);
};

// --- VENDORS ---

export const getVendors = async (): Promise<Vendor[]> => {
    const { data, error } = await supabase.from('vendors').select('*');
    if (error) return [];
    return data.map(v => ({
        id: v.id,
        name: v.name,
        contactName: v.contact_name,
        email: v.email,
        phone: v.phone,
        website: v.website,
        address: v.address,
        notes: v.notes,
        tags: v.tags,
        contractStartDate: v.contract_start_date,
        contractEndDate: v.contract_end_date,
        contractUrl: v.contract_url,
        serviceCount: v.service_count,
        avgResponseTime: v.avg_response_time
    }));
};

export const createVendor = async (vendor: Partial<Vendor>): Promise<void> => {
    const { error } = await supabase.from('vendors').insert({
        name: vendor.name,
        contact_name: vendor.contactName,
        email: vendor.email,
        phone: vendor.phone,
        website: vendor.website,
        address: vendor.address,
        notes: vendor.notes,
        tags: vendor.tags,
        contract_start_date: vendor.contractStartDate,
        contract_end_date: vendor.contractEndDate,
        service_count: vendor.serviceCount,
        avg_response_time: vendor.avgResponseTime
    });
    if (error) throw error;
};

export const updateVendor = async (id: string, vendor: Partial<Vendor>): Promise<void> => {
    const dbData: any = {};
    if (vendor.name) dbData.name = vendor.name;
    if (vendor.contactName) dbData.contact_name = vendor.contactName;
    // ... map others
    const { error } = await supabase.from('vendors').update(dbData).eq('id', id);
    if (error) throw error;
};

export const deleteVendor = async (id: string): Promise<void> => {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) throw error;
};

export const getVendorInteractions = async (vendorId: string): Promise<VendorInteraction[]> => {
    const { data, error } = await supabase.from('vendor_interactions').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
    if (error) return [];
    return data.map(i => ({
        id: i.id,
        vendorId: i.vendor_id,
        subject: i.subject,
        status: i.status,
        createdAt: i.created_at,
        resolvedAt: i.resolved_at,
        scheduledDate: i.scheduled_date
    }));
};

export const getVendorComments = async (interactionId: string): Promise<VendorComment[]> => {
    const { data, error } = await supabase.from('vendor_comments').select('*').eq('interaction_id', interactionId).order('created_at', { ascending: true });
    if (error) return [];
    const users = await getUsers();
    const usersMap = new Map(users.map(u => [u.id, u]));
    
    return data.map(c => ({
        id: c.id,
        content: c.content,
        author: usersMap.get(c.author_id)!,
        isEmail: c.is_email,
        createdAt: c.created_at,
        attachments: c.attachments
    }));
};

export const createVendorInteraction = async (vendorId: string, subject: string, userId: string, scheduledDate?: string): Promise<VendorInteraction> => {
    const { data, error } = await supabase.from('vendor_interactions').insert({
        vendor_id: vendorId,
        subject,
        created_by: userId,
        status: 'Open',
        scheduled_date: scheduledDate || null // Ensure NULL if undefined
    }).select().single();
    if (error) throw error;
    return {
        id: data.id,
        vendorId: data.vendor_id,
        subject: data.subject,
        status: data.status,
        createdAt: data.created_at,
        scheduledDate: data.scheduled_date
    };
};

export const updateVendorInteraction = async (id: string, updates: Partial<VendorInteraction>): Promise<void> => {
    const dbData: any = {};
    if (updates.status) dbData.status = updates.status;
    if (updates.resolvedAt) dbData.resolved_at = updates.resolvedAt;
    const { error } = await supabase.from('vendor_interactions').update(dbData).eq('id', id);
    if (error) throw error;
};

export const addVendorComment = async (interactionId: string, content: string, userId: string, isEmail: boolean, attachments: string[]): Promise<VendorComment> => {
    const { data, error } = await supabase.from('vendor_comments').insert({
        interaction_id: interactionId,
        content,
        author_id: userId,
        is_email: isEmail,
        attachments
    }).select().single();
    if (error) throw error;
    
    const users = await getUsers();
    const user = users.find(u => u.id === userId)!;
    
    return {
        id: data.id,
        content: data.content,
        author: user,
        isEmail: data.is_email,
        createdAt: data.created_at,
        attachments: data.attachments
    };
};

export const uploadVendorDocument = async (file: File): Promise<string> => {
    const path = `vendors/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return data.publicUrl;
};

export const uploadInteractionAttachment = async (interactionId: string, file: File): Promise<string> => {
    const path = `interactions/${interactionId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('attachments').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl;
};

export const getVendorInteractionsAll = async (): Promise<VendorInteraction[]> => {
    const { data, error } = await supabase.from('vendor_interactions').select('*');
    if (error) return [];
    return data.map(i => ({
        id: i.id,
        vendorId: i.vendor_id,
        subject: i.subject,
        status: i.status,
        createdAt: i.created_at,
        resolvedAt: i.resolved_at,
        scheduledDate: i.scheduled_date
    }));
};

export const closeVendorInteraction = async (interactionId: string): Promise<void> => {
    const { error } = await supabase.from('vendor_interactions').update({ status: 'Closed' }).eq('id', interactionId);
    if (error) throw error;
};

// --- MISC ---

export const getSLAPolicies = async (): Promise<SLAPolicy[]> => {
    const { data, error } = await supabase.from('sla_policies').select('*');
    if (error) return [];
    return data as SLAPolicy[];
};

export const updateSLAPolicies = async (policies: SLAPolicy[]): Promise<void> => {
    const { error } = await supabase.from('sla_policies').upsert(policies);
    if (error) throw error;
};

export const createBackup = async (): Promise<Blob> => {
    // Stub
    return new Blob([JSON.stringify({ date: new Date() })], { type: 'application/json' });
};

export const restoreBackup = async (file: File): Promise<void> => {
    // Stub
    console.log("Restoring from", file.name);
};

// --- AI UTILS ---

export const translateTextWithAI = async (text: string, targetLanguage: string): Promise<string> => {
    if (!genAI) return text; // fallback
    const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;
    try {
        const result = await genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return result.text || text;
    } catch (e) {
        console.error(e);
        return text;
    }
};

export const getAIWritingAssistance = async (text: string, language: string, mode: 'correct' | 'complete'): Promise<string> => {
    if (!genAI) return text;
    const prompt = mode === 'correct' 
        ? `Correct the grammar and spelling of the following text in ${language}:\n\n${text}`
        : `Complete the following text in ${language}:\n\n${text}`;
    
    try {
        const result = await genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return result.text || text;
    } catch (e) { return text; }
};

export const generateArticleContentFromTopic = async (topic: string, language: string, examples: KBArticle[]): Promise<string> => {
    if (!genAI) return "";
    const prompt = `Write a knowledge base article about "${topic}" in ${language}. Use markdown formatting.`;
    try {
        const result = await genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return result.text || "";
    } catch (e) { return ""; }
};

export const getAIChatResponse = async (history: any[], input: string, context: any, language: string): Promise<string> => {
    if (!genAI) return "AI unavailable.";
    // Simplified context usage
    const prompt = `You are a helpful IT Assistant. 
    Context: 
    - ${context.tickets.length} tickets
    - ${context.kb.length} kb articles
    
    User: ${input}`;
    
    try {
        const result = await genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return result.text || "I couldn't generate a response.";
    } catch (e) { return "Error contacting AI."; }
};
