import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useArticles } from '../api/articles'
import { useAddTopic } from '../api/topics'
import { formatDate } from '../lib/format'
import type { ArticleStatus } from '../lib/types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingRows } from '../components/ui/Spinner'
import { BookOpenIcon, InboxIcon, PlusIcon, StarIcon } from '../components/ui/icons'
import clsx from 'clsx'

const topicSchema = z.object({
  topic: z.string().min(3, 'Topik minimal 3 karakter'),
  context: z.string().optional(),
})
type TopicFormValues = z.input<typeof topicSchema>
type TopicFormOutput = z.output<typeof topicSchema>

const FILTERS: { value: ArticleStatus | ''; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'UNREAD', label: 'Belum dibaca' },
  { value: 'FAVORIT', label: 'Favorit' },
  { value: 'READ', label: 'Sudah dibaca' },
]

export default function ArticlesPage() {
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('')
  const [showTopicForm, setShowTopicForm] = useState(false)
  const { data, isLoading } = useArticles({ status: statusFilter })
  const addTopic = useAddTopic()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopicFormValues, unknown, TopicFormOutput>({ resolver: zodResolver(topicSchema) })

  const onSubmit = handleSubmit((values) => {
    addTopic.mutate(
      { topic: values.topic, context: values.context || undefined },
      { onSuccess: () => { reset(); setShowTopicForm(false) } },
    )
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Article"
        description="Artikel literasi keuangan harian — dari mana duit datang, dan cara duit bekerja."
        actions={
          <>
            <Link to="/topics">
              <Button variant="secondary" icon={<InboxIcon className="h-4 w-4" />}>
                Lihat Topik
              </Button>
            </Link>
            <Button
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setShowTopicForm((v) => !v)}
              variant={showTopicForm ? 'secondary' : 'primary'}
            >
              {showTopicForm ? 'Batal' : 'Tambah Topik'}
            </Button>
          </>
        }
      />

      {showTopicForm && (
        <Card className="animate-fade-in p-5">
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Ide topik baru</p>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Topik"
              placeholder="mis. Bagaimana cara kerja asuransi jiwa?"
              wrapClassName="sm:col-span-2"
              {...register('topic')}
              error={errors.topic?.message}
            />
            <Input label="Catatan (opsional)" placeholder="Sudut pandang, sumber, dll." {...register('context')} />
            <div className="sm:col-span-3">
              <Button type="submit" loading={addTopic.isPending}>
                Simpan Topik
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={clsx(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              statusFilter === f.value
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <LoadingRows rows={4} />
        </Card>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-2.5">
          {data.items.map((article) => (
            <Link key={article.id} to={`/articles/${article.slug}`}>
              <Card
                className={clsx(
                  'flex items-center justify-between gap-3 p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-900',
                  article.status === 'UNREAD' && 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900 dark:bg-indigo-500/5',
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={clsx(
                        'truncate text-sm',
                        article.status === 'UNREAD' ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300',
                      )}
                    >
                      {article.title}
                    </p>
                    {article.status === 'UNREAD' && <Badge tone="indigo">Baru</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(article.createdAt)}</p>
                </div>
                {article.status === 'FAVORIT' && (
                  <StarIcon className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<BookOpenIcon className="h-6 w-6" />}
            title="Belum ada artikel"
            description="Artikel baru digenerate otomatis tiap pagi. Tambahkan ide topik supaya AI punya bahan untuk ditulis."
          />
        </Card>
      )}
    </div>
  )
}
