// ============================================================
// Core Types
// ============================================================

export type Currency = 'ETB' | 'USD' | 'EUR' | 'GBP';

export interface SyncMeta {
  id?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
  isDeleted?: boolean;
}

// ============================================================
// Auth & User
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'founder' | 'admin' | 'member';
  avatar?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  companyName: string;
  companyLogo?: string;
  defaultCurrency: Currency;
  timezone: string;
  notificationPreferences: NotificationPreferences;
  theme: 'light' | 'dark';
}

export interface NotificationPreferences {
  followUpReminders: boolean;
  overdueInvoices: boolean;
  upcomingMeetings: boolean;
  tasksDueToday: boolean;
  scheduledContent: boolean;
  budgetWarnings: boolean;
  pushNotifications: boolean;
}

// ============================================================
// Finance
// ============================================================

export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'client_project'
  | 'consulting'
  | 'product_revenue'
  | 'remote_contracts'
  | 'other_income';

export type ExpenseCategory = string;

export interface CustomCategory extends SyncMeta {
  name: string;
  color?: string;
  description?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'online' | 'other';

export type TimePeriod = 'today' | 'week' | 'month' | 'all';

export interface ExpensePreset extends SyncMeta {
  name: string; // e.g. "Injera (Office Lunch)"
  category: ExpenseCategory;
  defaultAmount: number;
  paymentMethod: PaymentMethod;
  vendorName?: string;
  description?: string;
  icon?: string;
}

export interface Transaction extends SyncMeta {
  title: string;
  amount: number; // stored in cents or base units (we'll format consistently)
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod;
  clientId?: string;
  vendorName?: string;
  referenceNumber?: string;
  description?: string;
  attachmentUrl?: string;
  currency: Currency;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface Invoice extends SyncMeta {
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountRate?: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  payments: InvoicePayment[];
  notes?: string;
  currency: Currency;
}

export interface Budget extends SyncMeta {
  category: ExpenseCategory;
  month: string; // YYYY-MM format
  plannedAmount: number;
  actualAmount: number;
  currency: Currency;
}

// ============================================================
// CRM / Client Outreach
// ============================================================

export type FollowUpType = 'call' | 'visit' | 'messaging' | 'other';

export type PipelineStage =
  | 'new_lead'
  | 'followup'
  | 'requirement'
  | 'proposal'
  | 'deal'
  | 'rejected'
  // Legacy compatibility
  | 'identified'
  | 'researched'
  | 'contacted'
  | 'interested'
  | 'meeting_scheduled'
  | 'requirements_gathered'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type LeadSource =
  | 'referral'
  | 'social_media'
  | 'website'
  | 'cold_outreach'
  | 'event'
  | 'other';

export interface Prospect extends SyncMeta {
  businessName: string;
  industry: string;
  contactName: string;
  position?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  };
  location?: string;
  businessDescription?: string;
  identifiedProblems?: string;
  proposedSolution?: string;
  estimatedValue: number;
  leadSource: LeadSource;
  assignedTo?: string; // 'Neba' | 'Zizu' | 'Sade'
  priority: Priority;
  stage: PipelineStage;
  notes?: string;
  followUpType?: FollowUpType; // 'call' (To Call) | 'visit' (To Go) | 'messaging'
  nextFollowUpDate?: string;
  lostReason?: string;
  currency: Currency;
  // Delivery & Project Lead Handover (Zizu - Operations & Delivery Management)
  projectLead?: string; // e.g. 'Zizu'
  deliveryScheduleDate?: string;
  deliveryNotes?: string;
  deliveryStatus?: 'pending_kickoff' | 'scheduled' | 'in_development' | 'delivered';
}

export interface TeamMember {
  id: string;
  name: string;
  division: string;
  role: string;
  avatarText: string;
  responsibilities: string[];
}

export const RHIZAN_TEAM: TeamMember[] = [
  {
    id: 'neba',
    name: 'Neba',
    division: 'Business Growth & Marketing',
    role: 'Growth, Finance & Marketing Lead',
    avatarText: 'NB',
    responsibilities: [
      'Finance Management — Track revenue, expenses, invoices, budgets, and financial records',
      'Client Outreach & Research — Research potential clients, identify business opportunities, and coordinate outreach',
      'TikTok & Social Media Marketing — Plan content, coordinate publishing, and grow online presence',
    ],
  },
  {
    id: 'zizu',
    name: 'Zizu',
    division: 'Operations & Delivery Management',
    role: 'Operations & Project Delivery Lead',
    avatarText: 'ZZ',
    responsibilities: [
      'Time Tracking & Meeting Management — Monitor work hours, organize meetings, and document decisions',
      'Client Project Management — Coordinate client project requirements, timelines, deliverables, and progress',
      'Internal Project Development — Plan and manage internal tools and systems (RHIZAN Hub & testing)',
      'Quality Assurance & Delivery Management — Coordinate testing, deployment readiness, and client handover',
    ],
  },
  {
    id: 'sade',
    name: 'Sade',
    division: 'Strategic Development & Administration',
    role: 'Strategic Development & Admin Lead',
    avatarText: 'SD',
    responsibilities: [
      'VC Opportunities & Remote Jobs — Funding, venture capital, remote contracts, applications and tracking',
      'Startup Certification & Administration — Startup certification, registration documents, and compliance',
      'Product Development — Plan, develop, and improve RHIZAN products based on market needs',
    ],
  },
];

export type CommunicationChannel = 'email' | 'phone' | 'whatsapp' | 'linkedin' | 'in_person' | 'other';

export interface OutreachActivity extends SyncMeta {
  prospectId: string;
  date: string;
  channel: CommunicationChannel;
  messageSent?: string;
  responseReceived?: string;
  responseStatus: 'pending' | 'responded' | 'no_response' | 'follow_up_needed';
  nextAction?: string;
  nextActionDate?: string;
}

export interface MarketResearch extends SyncMeta {
  industry: string;
  marketProblem: string;
  targetCustomers: string;
  competitors?: string;
  existingSolutions?: string;
  proposedSolution: string;
  opportunityAssessment: 'high' | 'medium' | 'low';
  estimatedMarketPotential?: number;
  researchSources?: string;
  recommendations?: string;
  currency: Currency;
}

// ============================================================
// Marketing
// ============================================================

export type ContentPillar = 'ethiopian_business_problems' | 'founder_journey' | 'solutions_demos';
export type Platform = 'tiktok' | 'instagram' | 'facebook' | 'linkedin' | 'youtube';

export type ContentStatus =
  | 'idea'
  | 'researching'
  | 'script_writing'
  | 'ready_to_record'
  | 'recording'
  | 'editing'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published';

export interface ContentItem extends SyncMeta {
  title: string;
  pillar: ContentPillar;
  platform: Platform;
  topic: string;
  objective?: string;
  targetAudience?: string;
  hook?: string;
  script?: string;
  caption?: string;
  hashtags?: string[];
  videoDuration?: number; // seconds
  requiredAssets?: string;
  assignedTo?: string;
  recordingDate?: string;
  publishingDate?: string;
  status: ContentStatus;
  attachments?: string[];
}

export interface ContentPerformance extends SyncMeta {
  contentId: string;
  platform: Platform;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followersGained: number;
  profileVisits: number;
  businessInquiries: number;
  recordedAt: string;
}

export interface ContentIdea extends SyncMeta {
  title: string;
  pillar?: ContentPillar;
  description?: string;
  references?: string;
  hook?: string;
  category?: string;
  convertedToContentId?: string;
}

// ============================================================
// Tasks & Meetings
// ============================================================

export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';
export type TaskModule = 'finance' | 'clients' | 'marketing' | 'meetings' | 'general';

export interface Task extends SyncMeta {
  title: string;
  description?: string;
  module: TaskModule;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  reminderDate?: string;
  notes?: string;
  attachments?: string[];
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  completedAt?: string;
}

export type MeetingType =
  | 'client_discovery'
  | 'sales_meeting'
  | 'marketing_planning'
  | 'financial_review'
  | 'internal_founder'
  | 'other';

export interface Meeting extends SyncMeta {
  title: string;
  dateTime: string;
  endTime?: string;
  participants: string[];
  meetingType: MeetingType;
  relatedClientId?: string;
  agenda?: string;
  notes?: string;
  decisions?: string;
  actionItems?: string[];
  followUpDate?: string;
  location?: string;
}

// ============================================================
// Audit Log
// ============================================================

export interface AuditLog {
  id?: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes?: Record<string, { old: unknown; new: unknown }>;
  userId: string;
  timestamp: string;
}

// ============================================================
// Notifications
// ============================================================

export type NotificationType =
  | 'follow_up_due'
  | 'invoice_overdue'
  | 'meeting_upcoming'
  | 'task_due'
  | 'content_scheduled'
  | 'budget_warning';

export interface AppNotification {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  createdAt: string;
}
