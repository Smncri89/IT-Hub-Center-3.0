
// FIX: The entire file was incorrect, containing translation data and a circular import.
// It has been replaced with the correct type definitions for the entire application.
// This resolves numerous "Module has no exported member" and "Module declares '...' locally, but it is not exported" errors across the project.

export enum Language {
  en = 'en',
  it = 'it',
  es = 'es',
}

export enum Role {
  Admin = 'Admin',
  Agent = 'Agent',
  Member = 'Member',
  EndUser = 'End User',
}

export enum UserStatus {
  Online = 'Online',
  Away = 'Away',
  DoNotDisturb = 'Do Not Disturb',
  Invisible = 'Invisible',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  company?: string;
  avatarUrl: string;
  isTwoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  statusMessage?: string;
  statusMessageTimestamp?: string;
  signatureText?: string;
  signatureLogo?: string;
  weekStart?: 'Sunday' | 'Monday';
  timeFormat?: '12h' | '24h';
  dateFormat?: 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd';
  muteUntil?: string;
  muteWeekends?: boolean;
  muteOutsideHours?: boolean;
  quietHoursStart?: string; // e.g. "18:00"
  quietHoursEnd?: string; // e.g. "09:00"
  loginEnabled?: boolean;
}

export enum TicketStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export enum TicketPriority {
  Urgent = 'Urgent',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export interface Comment {
    id: string;
    author: User;
    content: string;
    createdAt: string;
    isInternalNote: boolean;
}

export interface VendorComment {
    id: string;
    author: User;
    content: string;
    isEmail: boolean; // true if sent as email, false if internal note
    createdAt: string;
    attachments?: string[]; // Array of URLs
}

export interface VendorInteraction {
    id: string;
    vendorId: string;
    subject: string;
    status: 'Open' | 'Pending Intervention' | 'Resolved' | 'Closed';
    createdAt: string;
    resolvedAt?: string;
    createdBy?: User;
    comments?: VendorComment[];
    scheduledDate?: string; // For programmed interventions
}

export interface Vendor {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    notes?: string;
    tags?: string[];
    // Contract & Performance
    contractStartDate?: string;
    contractEndDate?: string;
    contractUrl?: string; // Link to PDF/Doc
    serviceCount?: number; // Number of interventions
    avgResponseTime?: number; // Hours
    documents?: string[]; // Array of URLs for general docs
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  subcategory: string;
  requester: User;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  asset?: { id: string, name: string };
  isAiTriaged?: boolean;
  contactInfo?: string;
  department?: string;
  site?: string;
  floor?: string;
  office?: string;
  attachments?: string[];
  slaDueAt?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
}

export type AssetStatus = 
  | 'In Use' 
  | 'Ready to Deploy' 
  | 'Pending' 
  | 'Archived' 
  | 'Broken - Not Fixable'
  | 'Lost/Stolen'
  | 'Out for Diagnostics'
  | 'Out for Repair';


export interface Asset {
  id: string;
  name: string;
  assetTag: string;
  image?: string;
  type: string;
  model?: string;
  status: AssetStatus;
  purchaseDate?: string;
  purchaseCost?: number;
  currentValue?: number;
  warrantyEndDate?: string;
  assignedTo?: User;
  lastCheckin?: string;
  lastCheckout?: string;
  serialNumber?: string;
  location?: string;
  quantity?: number;
  notes?: string;
  vendorId?: string;
  vendor?: Vendor;
  latitude?: number;
  longitude?: number;
  // Smartphone specific
  phoneNumber?: string;
  carrier?: string;
  simSerial?: string;
  esimSerial?: string;
  // For AssetDetail
  tickets?: Ticket[];
}

export interface LicenseAssignment {
  id: string;
  user: User;
  assignedDate: string;
}

export interface License {
  id: string;
  name: string;
  software: string;
  totalSeats: number;
  assignments: LicenseAssignment[];
  purchaseDate: string;
  expirationDate: string;
  totalCost?: number;
  costPerSeat?: number;
  vendorId?: string;
  vendor?: Vendor;
}

export interface IncidentTimelineEntry {
    timestamp: string;
    update: string;
    author_id: string;
    author_name: string; // denormalized for easy display
    type: 'creation' | 'status_change' | 'assignment' | 'comment';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  priority: TicketPriority;
  category: string;
  reporter: User;
  assignee?: User;
  solution?: string;
  impactAnalysis?: string;
  rootCauseAnalysis?: string;
  tags: string[];
  timeline: IncidentTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SLAPolicy {
  id: string;
  priority: TicketPriority;
  response_time_minutes: number;
  resolution_time_minutes: number;
}

export interface KBArticle {
  id: string;
  title: { [key in Language]: string };
  content: { [key in Language]: string };
  category: string;
  author: User;
  tags: string[];
  audience: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
    timestamp: string;
    read: boolean;
    link?: string;
    category?: 'SLA' | 'GENERAL' | 'ASSET' | 'LICENSE' | 'VENDOR';
}

export interface Integration {
  id: number;
  user_id: string;
  service_name: string;
  api_key: string;
  created_at: string;
}
