import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useArticle, useUpdateArticle } from '../api/articles'
import { formatDate } from '../lib/format'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { BookOpenIcon, ChevronLeftIcon, StarIcon } from '../components/ui/icons'
import clsx from 'clsx'

const markdownComponents = {
  h1: (p: React.ComponentPropsWithoutRef<'h1'>) => <h2 className="mt-6 text-lg font-bold text-slate-900 first:mt-0 dark:text-slate-100" {...p} />,
  h2: (p: React.ComponentPropsWithoutRef<'h2'>) => <h2 className="mt-6 text-lg font-bold text-slate-900 first:mt-0 dark:text-slate-100" {...p} />,
  h3: (p: React.ComponentPropsWithoutRef<'h3'>) => <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-slate-100" {...p} />,
  p: (p: React.ComponentPropsWithoutRef<'p'>) => <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300" {...p} />,
  ul: (p: React.ComponentPropsWithoutRef<'ul'>) => <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300" {...p} />,
  ol: (p: React.ComponentPropsWithoutRef<'ol'>) => <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300" {...p} />,
  li: (p: React.ComponentPropsWithoutRef<'li'>) => <li {...p} />,
  strong: (p: React.ComponentPropsWithoutRef<'strong'>) => <strong className="font-semibold text-slate-900 dark:text-slate-100" {...p} />,
  blockquote: (p: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="mt-3 border-l-2 border-indigo-300 pl-3 text-sm italic text-slate-600 dark:border-indigo-700 dark:text-slate-400" {...p} />
  ),
  code: (p: React.ComponentPropsWithoutRef<'code'>) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200" {...p} />
  ),
}

export default function ArticleDetailPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>()
  const { data: article, isLoading } = useArticle(idOrSlug)
  const updateArticle = useUpdateArticle()

  useEffect(() => {
    if (article && article.status === 'UNREAD') {
      updateArticle.mutate({ idOrSlug: article.slug, status: 'READ' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id])

  const toggleFavorite = () => {
    if (!article) return
    updateArticle.mutate({ idOrSlug: article.slug, status: article.status === 'FAVORIT' ? 'READ' : 'FAVORIT' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Spinner className="h-5 w-5" /> Memuat artikel...
      </div>
    )
  }

  if (!article) {
    return (
      <Card>
        <EmptyState icon={<BookOpenIcon className="h-6 w-6" />} title="Artikel tidak ditemukan" />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/articles" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <ChevronLeftIcon className="h-3.5 w-3.5" /> Kembali ke daftar artikel
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{article.title}</h1>
            <p className="mt-1.5 text-xs text-slate-500">{formatDate(article.createdAt)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFavorite}
            loading={updateArticle.isPending}
            icon={<StarIcon className={clsx('h-3.5 w-3.5', article.status === 'FAVORIT' && 'fill-amber-400 text-amber-500')} />}
          >
            {article.status === 'FAVORIT' ? 'Favorit' : 'Favoritkan'}
          </Button>
        </div>

        <div className="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <ReactMarkdown components={markdownComponents}>{article.bodyMd}</ReactMarkdown>
        </div>
      </Card>
    </div>
  )
}
