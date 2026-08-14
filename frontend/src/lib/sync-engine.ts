import { isAxiosError } from 'axios'
import { api } from './api'
import {
  isLocalId,
  type FintraDB,
  type LocalAccount,
  type LocalBudget,
  type LocalCategory,
  type LocalRecurringRule,
  type LocalTransaction,
  type LocalTransfer,
  type SyncQueueItem,
} from './db'
import { pingBackend, useNetworkStore } from './network-status'

type ServerRecord = { id: string } & Record<string, unknown>

const ENDPOINTS: Record<SyncQueueItem['entity'], string> = {
  account: '/accounts',
  category: '/categories',
  transaction: '/transactions',
  transfer: '/transfers',
  budget: '/budgets',
  recurringRule: '/recurring-rules',
}

/** Fields (across all entities) that reference another entity's id and must
 * be rewritten when that entity's temp local id is replaced by its real one. */
const REFERENCE_FIELDS = ['accountId', 'categoryId', 'fromAccountId', 'toAccountId'] as const

function remapReferences(payload: Record<string, unknown> | undefined, oldId: string, newId: string) {
  if (!payload) return
  for (const field of REFERENCE_FIELDS) {
    if (payload[field] === oldId) payload[field] = newId
  }
}

async function remapLocalId(db: FintraDB, entity: SyncQueueItem['entity'], oldId: string, newId: string, remainingQueue: SyncQueueItem[]) {
  // Rewrite any other local records that reference the old id.
  if (entity === 'account') {
    await db.transactions.where('accountId').equals(oldId).modify({ accountId: newId })
    await db.transfers.where('fromAccountId').equals(oldId).modify({ fromAccountId: newId })
    await db.transfers.where('toAccountId').equals(oldId).modify({ toAccountId: newId })
    await db.recurringRules.where('accountId').equals(oldId).modify({ accountId: newId })
  } else if (entity === 'category') {
    await db.transactions.where('categoryId').equals(oldId).modify({ categoryId: newId })
    await db.budgets.where('categoryId').equals(oldId).modify({ categoryId: newId })
    await db.recurringRules.where('categoryId').equals(oldId).modify({ categoryId: newId })
  }

  // Rewrite references inside not-yet-processed queue items (in-memory, so
  // the rest of this pushQueue() run targets the right ids/URLs).
  for (const item of remainingQueue) {
    if (item.localId === oldId) item.localId = newId
    remapReferences(item.payload, oldId, newId)
  }
}

async function replaceLocalRecordId<T extends { id: string }>(
  table: { get: (id: string) => Promise<T | undefined>; delete: (id: string) => Promise<void>; put: (item: T) => Promise<string> },
  oldId: string,
  serverRecord: T,
) {
  const existing = await table.get(oldId)
  if (existing) await table.delete(oldId)
  await table.put(serverRecord)
}

interface PushResult {
  processed: number
  stoppedOnNetworkError: boolean
}

/** Sends every queued mutation to the API, in order, remapping temp local
 * ids to real server ids as creates succeed. Stops (without throwing) on the
 * first network failure so the rest of the queue survives for the next
 * attempt; drops items that the server rejects outright (4xx) so one bad
 * item can't block everything behind it forever. */
export async function pushQueue(db: FintraDB): Promise<PushResult> {
  const queue = await db.syncQueue.orderBy('id').toArray()
  let processed = 0

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i]
    const remaining = queue.slice(i + 1)
    const endpoint = ENDPOINTS[item.entity]

    try {
      if (item.operation === 'create') {
        const { data } = await api.post<ServerRecord>(endpoint, item.payload)
        if (isLocalId(item.localId)) {
          await applyServerRecord(db, item.entity, item.localId, data);
          await remapLocalId(db, item.entity, item.localId, data.id, remaining)
        }
      } else if (item.operation === 'update') {
        await api.patch(`${endpoint}/${item.localId}`, item.payload)
      } else {
        await api.delete(`${endpoint}/${item.localId}`)
      }

      await db.syncQueue.delete(item.id!)
      processed++
    } catch (err) {
      if (isAxiosError(err) && !err.response) {
        // No response at all: we're offline (or the server is down). Stop
        // here — everything from this item onward stays queued.
        useNetworkStore.getState().setOnline(false)
        return { processed, stoppedOnNetworkError: true }
      }
      // The server actively rejected this operation (e.g. 400/404/403).
      // It can never succeed as-is, so drop it rather than block the queue.
      const message = isAxiosError(err) ? String(err.response?.data ?? err.message) : String(err)
      await db.syncQueue.update(item.id!, { lastError: message })
      await db.syncQueue.delete(item.id!)
      processed++
    }
  }

  return { processed, stoppedOnNetworkError: false }
}

async function applyServerRecord(db: FintraDB, entity: SyncQueueItem['entity'], oldId: string, data: ServerRecord) {
  switch (entity) {
    case 'account':
      await replaceLocalRecordId(db.accounts, oldId, data as unknown as LocalAccount)
      break
    case 'category':
      await replaceLocalRecordId(db.categories, oldId, data as unknown as LocalCategory)
      break
    case 'transaction':
      await replaceLocalRecordId(db.transactions, oldId, data as unknown as LocalTransaction)
      break
    case 'transfer':
      await replaceLocalRecordId(db.transfers, oldId, data as unknown as LocalTransfer)
      break
    case 'budget':
      await replaceLocalRecordId(db.budgets, oldId, data as unknown as LocalBudget)
      break
    case 'recurringRule':
      await replaceLocalRecordId(db.recurringRules, oldId, data as unknown as LocalRecurringRule)
      break
  }
}

/** Refreshes the local cache from the server. Only call this after
 * pushQueue() has drained (or at least attempted) pending local changes,
 * otherwise it can transiently overwrite unsynced edits with stale data. */
export async function pullAll(db: FintraDB): Promise<void> {
  const [accounts, categories, transactions, transfers, budgets, recurringRules] = await Promise.all([
    api.get<LocalAccount[]>('/accounts'),
    api.get<LocalCategory[]>('/categories'),
    api.get<{ items: LocalTransaction[] }>('/transactions', { params: { limit: 200 } }),
    api.get<LocalTransfer[]>('/transfers'),
    api.get<LocalBudget[]>('/budgets'),
    api.get<LocalRecurringRule[]>('/recurring-rules'),
  ])

  await db.transaction(
    'rw',
    [db.accounts, db.categories, db.transactions, db.transfers, db.budgets, db.recurringRules, db.meta],
    async () => {
      await db.accounts.clear()
      await db.accounts.bulkPut(stripComputed(accounts.data, ['balance']))
      await db.categories.clear()
      await db.categories.bulkPut(stripComputed(categories.data, ['subcategories']))
      await db.transactions.clear()
      await db.transactions.bulkPut(stripComputed(transactions.data.items, ['account', 'category']))
      await db.transfers.clear()
      await db.transfers.bulkPut(stripComputed(transfers.data, ['fromAccount', 'toAccount']))
      await db.budgets.clear()
      await db.budgets.bulkPut(
        stripComputed(budgets.data, ['category', 'periodStart', 'periodEnd', 'spent', 'remaining', 'percentage', 'status']),
      )
      await db.recurringRules.clear()
      await db.recurringRules.bulkPut(stripComputed(recurringRules.data, ['account', 'category']))
      await db.meta.put({ key: 'lastSyncedAt', value: new Date().toISOString() })
    },
  )
}

function stripComputed<T extends object>(items: T[], fields: string[]): T[] {
  return items.map((item) => {
    const copy = { ...item } as Record<string, unknown>
    for (const field of fields) delete copy[field]
    return copy as T
  })
}

/** Queues a mutation and kicks off a best-effort background sync attempt
 * (which is a no-op if we're offline — the item just stays queued). */
export async function enqueue(
  db: FintraDB,
  entity: SyncQueueItem['entity'],
  operation: SyncQueueItem['operation'],
  localId: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  await db.syncQueue.add({ entity, operation, localId, payload, createdAt: Date.now() })
  void runSync(db)
}

let syncInFlight: Promise<void> | null = null

/** Push then pull, coalescing concurrent callers into a single run. */
export async function runSync(db: FintraDB): Promise<void> {
  if (syncInFlight) return syncInFlight
  syncInFlight = (async () => {
    const online = await pingBackend()
    useNetworkStore.getState().setOnline(online)
    if (!online) return

    const result = await pushQueue(db)
    if (!result.stoppedOnNetworkError) {
      await pullAll(db)
    }
  })()
  try {
    await syncInFlight
  } finally {
    syncInFlight = null
  }
}
