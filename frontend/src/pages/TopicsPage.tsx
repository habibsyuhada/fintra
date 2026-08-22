import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTopics, useMarkTopicDone, type TopicStatusFilter } from '../api/topics'
import { formatDate } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingRows } from '../components/ui/Spinner'
import { ChevronLeftIcon, CheckCircleIcon, InboxIcon } from '../components/ui/icons'
import clsx from 'clsx'

const FILTERS: { value: TopicStatusFilter; label: string }[] = [
  { value: 'pending', label: 'Belum selesai' },
  { value: 'used', label: 'Selesai' },
  { value: 'all', label: 'Semua' },
]

export default function TopicsPage() {
  const [statusFilter, setStatusFilter] = useState<TopicStatusFilter>('pending')
  const { data, isLoading } = useTopics({ status: statusFilter })
  const markDone = useMarkTopicDone()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Topik Artikel"
        description="Topik yang kamu masukkan untuk bahan artikel harian. Tandai selesai kalau artikelnya sudah sesuai."
        actions={
          <Link to="/articles" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            <ChevronLeftIcon className="h-4 w-4" /> Kembali ke Article
          </Link>
        }
      />

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
          {data.items.map((topic) => (
            <Card key={topic.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{topic.topic}</p>
                  {topic.usedAt ? (
                    <Badge tone="green">Selesai</Badge>
                  ) : (
                    <Badge tone="amber">Belum selesai</Badge>
                  )}
                </div>
                {topic.context && <p className="mt-1 text-xs text-slate-500">{topic.context}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  Ditambahkan {formatDate(topic.createdAt)}
                  {topic.usedAt ? ` · Ditandai selesai ${formatDate(topic.usedAt)}` : ''}
                </p>
              </div>
              <button
                onClick={() => markDone.mutate({ id: topic.id, done: !topic.usedAt })}
                disabled={markDone.isPending}
                className={clsx(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  topic.usedAt
                    ? 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
                )}
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {topic.usedAt ? 'Batal tandai' : 'Tandai selesai'}
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<InboxIcon className="h-6 w-6" />}
            title={statusFilter === 'used' ? 'Belum ada topik yang selesai' : 'Tidak ada topik'}
            description="Tambahkan ide topik dari halaman Article supaya AI punya bahan untuk ditulis."
          />
        </Card>
      )}
    </div>
  )
}
