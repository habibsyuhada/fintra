import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCategories, useCreateCategory, useDeleteCategory } from '../api/categories'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingRows } from '../components/ui/Spinner'
import { PlusIcon, TagIcon, TrashIcon } from '../components/ui/icons'

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
    <div className="space-y-4">
      <PageHeader
        title="Kategori"
        description="Kelompokkan transaksi agar laporan lebih rapi."
        actions={
          <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Batal' : 'Tambah Kategori'}
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-fade-in p-5">
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Input label="Nama" {...register('name')} error={errors.name?.message} />
            <Select label="Tipe" {...register('type')}>
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
            </Select>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Warna</label>
              <input type="color" {...register('color')} className="mt-1.5 h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-1 py-1 dark:border-slate-700 dark:bg-slate-800/60" />
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={createCategory.isPending} className="w-full">
                Simpan
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {['EXPENSE', 'INCOME'].map((type) => (
          <Card key={type} className="overflow-hidden">
            <CardHeader title={type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'} />
            {isLoading ? (
              <LoadingRows rows={2} />
            ) : topLevel.filter((c) => c.type === type).length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {topLevel
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: c.color ? `${c.color}1a` : undefined, color: c.color ?? undefined }}
                        >
                          {c.color ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} /> : <TagIcon className="h-3.5 w-3.5 text-slate-400" />}
                        </span>
                        {c.name}
                      </span>
                      <button
                        onClick={() => deleteCategory.mutate(c.id)}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                        aria-label="Hapus"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <EmptyState icon={<TagIcon className="h-5 w-5" />} title="Belum ada kategori" />
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
