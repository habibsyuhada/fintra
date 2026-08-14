import Dexie, { type Table } from 'dexie'
import type {
  AccountType,
  BudgetPeriod,
  CategoryType,
  RecurringFrequency,
  TransactionType,
} from './types'

// Raw, persisted shapes only — no server-computed fields (balance, budget
// status, joined account/category objects). Those are always derived fresh
// from this data via selectors in offline-calc.ts, so they can never go
// stale relative to what's actually stored locally.

export interface LocalAccount {
  id: string
  name: string
  type: AccountType
  currency: string
  initialBalance: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface LocalCategory {
  id: string
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  parentId: string | null
}

export interface LocalTransaction {
  id: string
  accountId: string
  categoryId: string | null
  amount: string
  type: TransactionType
  note: string | null
  date: string
  attachmentUrl: string | null
  tags: string[]
  isDeleted: boolean
  isRecurringInstance: boolean
  recurringRuleId: string | null
  originalAmount: string | null
  originalCurrency: string | null
  exchangeRate: string | null
  createdAt: string
}

export interface LocalTransfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: string
  date: string
  note: string | null
  createdAt: string
}

export interface LocalBudget {
  id: string
  categoryId: string
  amount: string
  period: BudgetPeriod
  startDate: string
  createdAt: string
}

export interface LocalRecurringRule {
  id: string
  accountId: string
  categoryId: string | null
  amount: string
  type: TransactionType
  note: string | null
  frequency: RecurringFrequency
  nextRunDate: string
  isActive: boolean
}

export type SyncEntity = 'account' | 'category' | 'transaction' | 'transfer' | 'budget' | 'recurringRule'
export type SyncOperation = 'create' | 'update' | 'delete'

export interface SyncQueueItem {
  id?: number
  entity: SyncEntity
  operation: SyncOperation
  /** id of the local record this operation targets (may be a temp `local-` id for creates) */
  localId: string
  /** request body for create/update; unused for delete */
  payload?: Record<string, unknown>
  createdAt: number
  /** set once a push attempt fails with a non-network (4xx) error, so the UI can surface it */
  lastError?: string
}

export const LOCAL_ID_PREFIX = 'local-'

export function isLocalId(id: string): boolean {
  return id.startsWith(LOCAL_ID_PREFIX)
}

export function newLocalId(): string {
  return `${LOCAL_ID_PREFIX}${crypto.randomUUID()}`
}

export class FintraDB extends Dexie {
  accounts!: Table<LocalAccount, string>
  categories!: Table<LocalCategory, string>
  transactions!: Table<LocalTransaction, string>
  transfers!: Table<LocalTransfer, string>
  budgets!: Table<LocalBudget, string>
  recurringRules!: Table<LocalRecurringRule, string>
  syncQueue!: Table<SyncQueueItem, number>
  meta!: Table<{ key: string; value: unknown }, string>

  constructor(userId: string) {
    super(`fintra-${userId}`)
    this.version(1).stores({
      accounts: 'id, isArchived',
      categories: 'id, type, parentId',
      transactions: 'id, accountId, categoryId, date, isDeleted, recurringRuleId',
      transfers: 'id, fromAccountId, toAccountId, date',
      budgets: 'id, categoryId',
      recurringRules: 'id, accountId, categoryId, isActive',
      syncQueue: '++id, entity, createdAt',
      meta: 'key',
    })
  }
}

const instances = new Map<string, FintraDB>()

export function getDb(userId: string): FintraDB {
  let db = instances.get(userId)
  if (!db) {
    db = new FintraDB(userId)
    instances.set(userId, db)
  }
  return db
}
