export type AccountType = 'CASH' | 'BANK' | 'EWALLET' | 'CREDIT_CARD'
export type CategoryType = 'INCOME' | 'EXPENSE'
export type TransactionType = 'INCOME' | 'EXPENSE'

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: string
  initialBalance: string
  isArchived: boolean
  balance: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  parentId: string | null
  subcategories?: Category[]
}

export interface Transaction {
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
  createdAt: string
  category?: Category | null
  account?: { id: string; name: string; currency: string }
}

export interface TransactionPage {
  items: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: string
  date: string
  note: string | null
  fromAccount?: { id: string; name: string }
  toAccount?: { id: string; name: string }
}
