import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCategories, useCreateCategory, useDeleteCategory } from '../api/categories'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: 'EXPENSE' } })

  const onSubmit = handleSubmit((values) => {
    createCategory.mutate(values, {
      onSuccess: () => {
        reset()
        setShowForm(false)
      },
    })
  })

  const topLevel = categories?.filter((c) => !c.parentId) ?? []

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Kategori</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showForm ? 'Batal' : '+ Tambah Kategori'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nama</label>
            <input {...register('name')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tipe</label>
            <select {...register('type')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Warna</label>
            <input type="color" {...register('color')} className="mt-1 h-9 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1" />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createCategory.isPending}
              className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {['EXPENSE', 'INCOME'].map((type) => (
          <div key={type} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h2 className="border-b border-gray-100 dark:border-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
            </h2>
            {isLoading ? (
              <p className="p-4 text-sm text-gray-500">Memuat...</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {topLevel
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <li key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        {c.color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />}
                        {c.name}
                      </span>
                      <button
                        onClick={() => deleteCategory.mutate(c.id)}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        Hapus
                      </button>
                    </li>
                  ))}
                {topLevel.filter((c) => c.type === type).length === 0 && (
                  <li className="px-4 py-3 text-sm text-gray-500">Belum ada kategori.</li>
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
