import Dexie, { type EntityTable } from 'dexie';
import type {
  Transaction,
  Invoice,
  Budget,
  Prospect,
  OutreachActivity,
  MarketResearch,
  ContentItem,
  ContentPerformance,
  ContentIdea,
  Task,
  Meeting,
  AuditLog,
  AppNotification,
  User,
  UserProfile,
} from '../types';

class RhizanDatabase extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  invoices!: EntityTable<Invoice, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  prospects!: EntityTable<Prospect, 'id'>;
  outreachActivities!: EntityTable<OutreachActivity, 'id'>;
  marketResearch!: EntityTable<MarketResearch, 'id'>;
  contentItems!: EntityTable<ContentItem, 'id'>;
  contentPerformance!: EntityTable<ContentPerformance, 'id'>;
  contentIdeas!: EntityTable<ContentIdea, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  meetings!: EntityTable<Meeting, 'id'>;
  auditLogs!: EntityTable<AuditLog, 'id'>;
  notifications!: EntityTable<AppNotification, 'id'>;
  users!: EntityTable<User, 'id'>;
  userProfiles!: EntityTable<UserProfile, 'id'>;

  constructor() {
    super('RhizanBusinessDB');

    this.version(1).stores({
      transactions: 'id, type, category, date, clientId, syncStatus, currency',
      invoices: 'id, invoiceNumber, clientId, status, dueDate, issueDate, syncStatus',
      budgets: 'id, category, month, syncStatus',
      prospects: 'id, businessName, industry, stage, priority, nextFollowUpDate, syncStatus',
      outreachActivities: 'id, prospectId, date, channel, responseStatus, syncStatus',
      marketResearch: 'id, industry, opportunityAssessment, syncStatus',
      contentItems: 'id, pillar, platform, status, publishingDate, recordingDate, syncStatus',
      contentPerformance: 'id, contentId, platform, recordedAt, syncStatus',
      contentIdeas: 'id, pillar, category, syncStatus',
      tasks: 'id, module, priority, status, dueDate, syncStatus',
      meetings: 'id, dateTime, meetingType, relatedClientId, syncStatus',
      auditLogs: 'id, entityType, entityId, action, timestamp',
      notifications: 'id, type, isRead, createdAt',
      users: 'id, email',
      userProfiles: 'id, userId',
    });
  }
}

export const db = new RhizanDatabase();

export async function clearDatabase() {
  await Promise.all([
    db.transactions.clear(),
    db.invoices.clear(),
    db.budgets.clear(),
    db.prospects.clear(),
    db.outreachActivities.clear(),
    db.marketResearch.clear(),
    db.contentItems.clear(),
    db.contentPerformance.clear(),
    db.contentIdeas.clear(),
    db.tasks.clear(),
    db.meetings.clear(),
    db.auditLogs.clear(),
    db.notifications.clear(),
  ]);
}

export async function createAuditLog(
  entityType: string,
  entityId: string,
  action: 'create' | 'update' | 'delete',
  userId: string,
  changes?: Record<string, { old: unknown; new: unknown }>
) {
  try {
    await db.auditLogs.add({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      entityId,
      action,
      changes,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
