import { useLiveQuery } from 'dexie-react-hooks'
import { useDb } from '../lib/use-db'
import { newLocalId } from '../lib/db'
import { enqueue } from '../lib/sync-engine'
import type { Category, CategoryType } from '../lib/types'

export function useCategories() {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const categories = await db.categories.toArray()
    const withChildren: Category[] = categories.map((c) => ({
      ...c,
      subcategories: categories.filter((child) => child.parentId === c.id),
    }))
    return withChildren
  }, [db])

  return { data, isLoading: data === undefined }
}

export interface CategoryInput {
  name: string
  type: CategoryType
  icon?: string
  color?: string
  parentId?: string
}

export function useCreateCategory() {
  const db = useDb()
  return {
    mutate: (payload: CategoryInput, opts?: { onSuccess?: (id: string) => void }) => {
      void (async () => {
        const id = newLocalId()
        await db.categories.put({
          id,
          name: payload.name,
          type: payload.type,
          icon: payload.icon ?? null,
          color: payload.color ?? null,
          parentId: payload.parentId ?? null,
        })
        await enqueue(db, 'category', 'create', id, { ...payload })
        opts?.onSuccess?.(id)
      })()
    },
    isPending: false,
  }
}

export function useUpdateCategory() {
  const db = useDb()
  return {
    mutate: (payload: Partial<CategoryInput> & { id: string }) => {
      void (async () => {
        const { id, ...changes } = payload
        const existing = await db.categories.get(id)
        if (!existing) return
        await db.categories.put({ ...existing, ...changes, parentId: changes.parentId ?? existing.parentId })
        await enqueue(db, 'category', 'update', id, { ...changes })
      })()
    },
  }
}

export function useDeleteCategory() {
  const db = useDb()
  return {
    mutate: (id: string) => {
      void (async () => {
        await db.categories.delete(id)
        await enqueue(db, 'category', 'delete', id)
      })()
    },
  }
}
