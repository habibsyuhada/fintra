import { GUEST_USER_ID } from './auth-store'
import { getDb } from './db'
import { enqueue, resumeSync, runSync, suspendSync } from './sync-engine'

/** Copies every record created in guest mode into the newly-authenticated
 * user's local database (as pending creates) and syncs them to the server.
 * Safe to call unconditionally after login/register — it's a no-op if the
 * user wasn't a guest (check `wasGuest` BEFORE calling setAuth(), which
 * clears the guest-mode flag) or never created anything while guest.
 *
 * AuthProvider fires its own sync as soon as setAuth() makes the store look
 * like a logged-in real user, which can race this function's writes (its
 * pullAll() does a clear()+bulkPut() that would wipe out records this
 * function just wrote). suspendSync()/resumeSync() keep every runSync() a
 * no-op — including that one — until this migration's local writes are
 * fully queued, at which point the explicit runSync() call below is the
 * only one that actually runs. */
export async function migrateGuestDataIfAny(wasGuest: boolean, realUserId: string): Promise<number> {
  if (!wasGuest || realUserId === GUEST_USER_ID) return 0

  suspendSync()
  const guestDb = getDb(GUEST_USER_ID)
  const [accounts, categories, transactions, transfers, budgets, recurringRules] = await Promise.all([
    guestDb.accounts.toArray(),
    guestDb.categories.toArray(),
    guestDb.transactions.toArray(),
    guestDb.transfers.toArray(),
    guestDb.budgets.toArray(),
    guestDb.recurringRules.toArray(),
  ])

  const total = accounts.length + categories.length + transactions.length + transfers.length + budgets.length + recurringRules.length
  if (total === 0) {
    await guestDb.delete()
    resumeSync()
    return 0
  }

  const realDb = getDb(realUserId)
  const silent = { silent: true }

  try {
    // Accounts and categories have no dependencies — migrate them first so
    // the sync engine's id remapping can resolve references in the records
    // that depend on them (queued right after, in the same run).
    for (const account of accounts) {
      await realDb.accounts.put(account)
      await enqueue(
        realDb,
        'account',
        'create',
        account.id,
        {
          name: account.name,
          type: account.type,
          currency: account.currency,
          initialBalance: Number(account.initialBalance),
        },
        silent,
      )
    }
    for (const category of categories) {
      await realDb.categories.put(category)
      await enqueue(
        realDb,
        'category',
        'create',
        category.id,
        {
          name: category.name,
          type: category.type,
          icon: category.icon ?? undefined,
          color: category.color ?? undefined,
          parentId: category.parentId ?? undefined,
        },
        silent,
      )
    }
    for (const transaction of transactions) {
      await realDb.transactions.put(transaction)
      await enqueue(
        realDb,
        'transaction',
        'create',
        transaction.id,
        {
          accountId: transaction.accountId,
          categoryId: transaction.categoryId ?? undefined,
          amount: Number(transaction.amount),
          type: transaction.type,
          note: transaction.note ?? undefined,
          date: transaction.date,
          tags: transaction.tags,
          originalAmount: transaction.originalAmount != null ? Number(transaction.originalAmount) : undefined,
          originalCurrency: transaction.originalCurrency ?? undefined,
          exchangeRate: transaction.exchangeRate != null ? Number(transaction.exchangeRate) : undefined,
        },
        silent,
      )
    }
    for (const transfer of transfers) {
      await realDb.transfers.put(transfer)
      await enqueue(
        realDb,
        'transfer',
        'create',
        transfer.id,
        {
          fromAccountId: transfer.fromAccountId,
          toAccountId: transfer.toAccountId,
          amount: Number(transfer.amount),
          date: transfer.date,
          note: transfer.note ?? undefined,
        },
        silent,
      )
    }
    for (const budget of budgets) {
      await realDb.budgets.put(budget)
      await enqueue(
        realDb,
        'budget',
        'create',
        budget.id,
        {
          categoryId: budget.categoryId,
          amount: Number(budget.amount),
          period: budget.period,
          startDate: budget.startDate,
        },
        silent,
      )
    }
    for (const rule of recurringRules) {
      await realDb.recurringRules.put(rule)
      await enqueue(
        realDb,
        'recurringRule',
        'create',
        rule.id,
        {
          accountId: rule.accountId,
          categoryId: rule.categoryId ?? undefined,
          amount: Number(rule.amount),
          type: rule.type,
          note: rule.note ?? undefined,
          frequency: rule.frequency,
          nextRunDate: rule.nextRunDate,
        },
        silent,
      )
    }
  } finally {
    resumeSync()
  }

  await runSync(realDb)
  await guestDb.delete()
  return total
}
