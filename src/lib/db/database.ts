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
  ExpensePreset,
  CustomCategory,
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
  expensePresets!: EntityTable<ExpensePreset, 'id'>;
  customCategories!: EntityTable<CustomCategory, 'id'>;

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

    this.version(2).stores({
      expensePresets: 'id, name, category, defaultAmount, syncStatus',
    });

    this.version(3).stores({
      customCategories: 'id, name, syncStatus',
    });
  }
}

export const db = new RhizanDatabase();

export async function ensureDefaultCategories() {
  const count = await db.customCategories.count();
  if (count === 0) {
    await db.customCategories.bulkAdd([
      { id: 'cat-office', name: 'Office & Meals (Injera, Buna)', color: '#16A34A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncStatus: 'synced' },
      { id: 'cat-transport', name: 'Transportation & Taxi', color: '#315C91', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncStatus: 'synced' },
      { id: 'cat-internet', name: 'Internet & Telecom', color: '#173F75', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncStatus: 'synced' },
      { id: 'cat-software', name: 'Software & Subscriptions', color: '#8B5CF6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncStatus: 'synced' },
      { id: 'cat-marketing', name: 'Marketing & Production', color: '#D97706', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncStatus: 'synced' },
      { id: 'cat-payroll', name: 'Payroll & Team Payments', color: '#EC4899', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncStatus: 'synced' },
      { id: 'cat-infra', name: 'Hosting & Infrastructure', color: '#06B6D4', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncStatus: 'synced' },
      { id: 'cat-other', name: 'Other Operating Expenses', color: '#64748B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncStatus: 'synced' },
    ]);
  }
}

export async function ensureDefaultExpensePresets() {
  const count = await db.expensePresets.count();
  if (count === 0) {
    await db.expensePresets.bulkAdd([
      {
        id: 'preset-injera',
        name: 'Injera (Office Lunch)',
        category: 'office_expenses',
        defaultAmount: 150,
        paymentMethod: 'mobile_money',
        description: 'Daily team lunch injera',
        icon: 'Utensils',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
      },
      {
        id: 'preset-buna',
        name: 'Buna (Coffee & Tea)',
        category: 'office_expenses',
        defaultAmount: 50,
        paymentMethod: 'cash',
        description: 'Office coffee & tea break',
        icon: 'Coffee',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
      },
      {
        id: 'preset-taxi',
        name: 'Taxi / Ride Transport',
        category: 'transportation',
        defaultAmount: 250,
        paymentMethod: 'mobile_money',
        description: 'Client meeting or errand transport',
        icon: 'Car',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
      },
      {
        id: 'preset-internet',
        name: 'Ethio Telecom / Internet',
        category: 'internet',
        defaultAmount: 350,
        paymentMethod: 'mobile_money',
        description: 'Data package top-up',
        icon: 'Wifi',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
      },
      {
        id: 'preset-water',
        name: 'Office Water & Supplies',
        category: 'office_expenses',
        defaultAmount: 120,
        paymentMethod: 'cash',
        description: 'Bottled water and pantry supplies',
        icon: 'ShoppingBag',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
      },
    ]);
  }
}

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
    db.expensePresets.clear(),
    db.customCategories.clear(),
  ]);
  await Promise.all([ensureDefaultExpensePresets(), ensureDefaultCategories()]);
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
