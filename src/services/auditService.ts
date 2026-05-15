import { supabase } from './supabaseClient.js';

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'assign' | 'checkin' | 'checkout' | 'import' | 'export';
    entityType: 'ticket' | 'asset' | 'license' | 'incident' | 'kb_article' | 'vendor' | 'user' | 'sla_policy' | 'system';
    entityId?: string;
    entityName?: string;
    details?: string;
    changes?: Record<string, { from: unknown; to: unknown }>;
}

const STORAGE_KEY = 'it_hub_audit_log';
const MAX_LOCAL_ENTRIES = 500;

const getLocalLog = (): AuditLogEntry[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveLocalLog = (entries: AuditLogEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_LOCAL_ENTRIES)));
};

export const logAuditEvent = async (
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> => {
    const fullEntry: AuditLogEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
    };

    const existing = getLocalLog();
    saveLocalLog([fullEntry, ...existing]);

    try {
        await supabase.from('audit_logs').insert({
            id: fullEntry.id,
            timestamp: fullEntry.timestamp,
            user_id: fullEntry.userId,
            user_name: fullEntry.userName,
            action: fullEntry.action,
            entity_type: fullEntry.entityType,
            entity_id: fullEntry.entityId || null,
            entity_name: fullEntry.entityName || null,
            details: fullEntry.details || null,
            changes: fullEntry.changes ? JSON.stringify(fullEntry.changes) : null,
        });
    } catch {
        // DB table may not exist yet - local storage is the fallback
    }
};

export const getAuditLog = async (filters?: {
    entityType?: string;
    action?: string;
    userId?: string;
    limit?: number;
}): Promise<AuditLogEntry[]> => {
    const limit = filters?.limit || 100;

    try {
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (filters?.entityType) query = query.eq('entity_type', filters.entityType);
        if (filters?.action) query = query.eq('action', filters.action);
        if (filters?.userId) query = query.eq('user_id', filters.userId);

        const { data, error } = await query;
        if (error || !data) throw error;

        return data.map((row: any) => ({
            id: row.id,
            timestamp: row.timestamp,
            userId: row.user_id,
            userName: row.user_name,
            action: row.action,
            entityType: row.entity_type,
            entityId: row.entity_id,
            entityName: row.entity_name,
            details: row.details,
            changes: row.changes ? JSON.parse(row.changes) : undefined,
        }));
    } catch {
        return getLocalLog().slice(0, limit);
    }
};

export const clearAuditLog = () => {
    localStorage.removeItem(STORAGE_KEY);
};

// Log retention policy: remove entries older than 12 months
const LOG_RETENTION_DAYS = 365;

export const enforceLogRetention = async (): Promise<number> => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LOG_RETENTION_DAYS);
    const cutoffISO = cutoff.toISOString();
    let purged = 0;

    // Purge from localStorage
    const local = getLocalLog();
    const filtered = local.filter(e => e.timestamp >= cutoffISO);
    purged = local.length - filtered.length;
    if (purged > 0) saveLocalLog(filtered);

    // Purge from Supabase
    try {
        const { count } = await supabase
            .from('audit_logs')
            .delete({ count: 'exact' })
            .lt('timestamp', cutoffISO);
        purged += count || 0;
    } catch { /* DB table may not exist */ }

    return purged;
};
