
import { User, Role, Ticket, Asset, License, Incident, KBArticle, Comment, LicenseAssignment, IncidentTimelineEntry, TicketStatus } from '@/types';

// This file centralizes data mapping logic to ensure consistency
// between initial data fetches and realtime updates.

const sanitizeAudience = (audience: any): Role[] => {
    if (!Array.isArray(audience)) return [];
    return audience.map((role: string) => {
        if (role === 'EndUser' || role === 'End-user') {
            return Role.EndUser;
        }
        if (Object.values(Role).includes(role as Role)) {
            return role as Role;
        }
        return null;
    }).filter(Boolean) as Role[];
};

const UNKNOWN_USER: User = {
    id: 'unknown',
    name: 'Unknown User',
    email: 'unknown@example.com',
    role: Role.EndUser,
    avatarUrl: 'https://ui-avatars.com/api/?name=Unknown+User'
};


export const mapProfileToUser = (profile: any): User | null => {
  if (!profile || !profile.id || !profile.email) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    company: profile.company,
    avatarUrl: profile.avatar_url,
    isTwoFactorEnabled: profile.is_two_factor_enabled,
    twoFactorSecret: profile.two_factor_secret,
    statusMessage: profile.status_message,
    statusMessageTimestamp: profile.status_message_timestamp,
    signatureText: profile.signature_text,
    signatureLogo: profile.signature_logo,
    weekStart: profile.week_start,
    timeFormat: profile.time_format,
    dateFormat: profile.date_format,
    muteUntil: profile.mute_until,
    muteWeekends: profile.mute_weekends,
    muteOutsideHours: profile.mute_outside_hours,
    quietHoursStart: profile.quiet_hours_start,
    quietHoursEnd: profile.quiet_hours_end,
  };
};

export const mapCommentData = (comment: any, profilesMap: Map<string, User>): Comment | null => {
  if (!comment.author_id) return null;
  return {
    id: comment.id,
    author: profilesMap.get(comment.author_id) || UNKNOWN_USER,
    content: comment.content,
    createdAt: comment.created_at,
    isInternalNote: comment.is_internal_note,
  }
}

export const mapTicketData = (ticket: any, profilesMap: Map<string, User>, assetsMap: Map<string, {id: string, name: string}>): Ticket => ({
  id: ticket.id,
  subject: ticket.subject,
  description: ticket.description,
  status: ticket.status as TicketStatus,
  priority: ticket.priority,
  category: ticket.category,
  subcategory: ticket.subcategory,
  requester: profilesMap.get(ticket.requester_id) || UNKNOWN_USER,
  assignee: ticket.assignee_id ? profilesMap.get(ticket.assignee_id) : undefined,
  createdAt: ticket.created_at,
  updatedAt: ticket.updated_at,
  comments: (ticket.comments || []).map((c: any) => mapCommentData(c, profilesMap)).filter(Boolean) as Comment[],
  asset: ticket.asset_id ? assetsMap.get(ticket.asset_id) : undefined,
  isAiTriaged: ticket.is_ai_triaged,
  contactInfo: ticket.contact_info,
  department: ticket.department,
  site: ticket.site,
  floor: ticket.floor,
  office: ticket.office,
  attachments: ticket.attachments,
  slaDueAt: ticket.sla_due_at,
  firstResponseAt: ticket.first_response_at,
  resolvedAt: ticket.resolved_at,
});

export const mapAssetData = (asset: any, profilesMap: Map<string, User>): Asset => ({
  id: asset.id,
  name: asset.name,
  assetTag: asset.asset_tag,
  image: asset.image,
  type: asset.type,
  model: asset.model,
  status: asset.status,
  purchaseDate: asset.purchase_date,
  purchaseCost: asset.purchase_cost,
  currentValue: asset.current_value,
  warrantyEndDate: asset.warranty_end_date,
  assignedTo: asset.assigned_to_id ? profilesMap.get(asset.assigned_to_id) : undefined,
  lastCheckin: asset.last_checkin,
  lastCheckout: asset.last_checkout,
  serialNumber: asset.serial_number,
  location: asset.location,
  quantity: asset.quantity,
  notes: asset.notes,
  phoneNumber: asset.phone_number,
  carrier: asset.carrier,
  simSerial: asset.sim_serial,
  esimSerial: asset.esim_serial,
});

export const mapLicenseAssignmentData = (assignment: any, usersMap: Map<string, User>): LicenseAssignment | null => {
    if (!assignment.user_id) return null;
    const user = usersMap.get(assignment.user_id) || (assignment.user ? mapProfileToUser(assignment.user) : null);
    if (!user) return null;
    return {
        id: assignment.id,
        user: user,
        assignedDate: assignment.assigned_date,
    };
};

export const mapLicenseData = (license: any, usersMap: Map<string, User>): License => ({
    id: license.id,
    name: license.name,
    software: license.software,
    totalSeats: license.total_seats,
    assignments: (license.assignments || []).map((a: any) => mapLicenseAssignmentData(a, usersMap)).filter(Boolean) as LicenseAssignment[],
    purchaseDate: license.purchase_date,
    expirationDate: license.expiration_date,
    totalCost: license.total_cost,
    costPerSeat: license.cost_per_seat,
});

export const mapIncidentData = (incident: any, usersMap: Map<string, User>): Incident => ({
    id: incident.id,
    title: incident.title,
    description: incident.description,
    status: incident.status,
    severity: incident.severity,
    priority: incident.priority,
    category: incident.category,
    reporter: usersMap.get(incident.reporter_id) || UNKNOWN_USER,
    assignee: incident.assignee_id ? usersMap.get(incident.assignee_id) : undefined,
    solution: incident.solution,
    impactAnalysis: incident.impact_analysis,
    rootCauseAnalysis: incident.root_cause_analysis,
    tags: incident.tags || [],
    timeline: (incident.timeline || []) as IncidentTimelineEntry[],
    createdAt: incident.created_at,
    updatedAt: incident.updated_at,
});

export const mapKBArticleData = (article: any, usersMap: Map<string, User>): KBArticle => ({
    id: article.id,
    title: article.title || {},
    content: article.content || {},
    category: article.category,
    author: usersMap.get(article.author_id) || UNKNOWN_USER,
    tags: article.tags || [],
    audience: sanitizeAudience(article.audience),
    createdAt: article.created_at,
    updatedAt: article.updated_at,
});
