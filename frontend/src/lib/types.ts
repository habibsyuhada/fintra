export type AccountType = 'CASH' | 'BANK' | 'EWALLET' | 'CREDIT_CARD'
export type CategoryType = 'INCOME' | 'EXPENSE'
export type TransactionType = 'INCOME' | 'EXPENSE'
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type BudgetStatus = 'OK' | 'NEAR' | 'OVER'

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

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurringRule {
  id: string
  accountId: string
  categoryId: string | null
  amount: string
  type: TransactionType
  note: string | null
  frequency: RecurringFrequency
  nextRunDate: string
  isActive: boolean
  account?: { id: string; name: string }
  category?: Category | null
}

export interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: string
  date: string
  note: string | null
  createdAt: string
  fromAccount?: { id: string; name: string }
  toAccount?: { id: string; name: string }
}

export interface Budget {
  id: string
  categoryId: string
  amount: string
  period: BudgetPeriod
  startDate: string
  category?: Category
  periodStart: string
  periodEnd: string
  spent: number
  remaining: number
  percentage: number
  status: BudgetStatus
}

export type ArticleStatus = 'UNREAD' | 'READ' | 'FAVORIT'

export interface ArticleSource {
  title: string
  url: string
}

export interface Article {
  id: string
  title: string
  slug: string
  bodyMd: string
  topicId: string | null
  status: ArticleStatus
  isPublic: boolean
  sources: ArticleSource[] | null
  createdAt: string
}

export interface ArticlePage {
  items: Article[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CashflowReport {
  year: number
  months: { month: number; income: number; expense: number; net: number }[]
}

export interface CategoryBreakdownReport {
  type: TransactionType
  total: number
  items: { categoryId: string | null; categoryName: string; color: string | null; amount: number; percentage: number }[]
}

export interface TrendReport {
  type: TransactionType
  granularity: 'day' | 'week' | 'month'
  items: { date: string; total: number }[]
}
