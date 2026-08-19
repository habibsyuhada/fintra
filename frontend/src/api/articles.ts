import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Article, ArticlePage, ArticleStatus } from '../lib/types'

export interface ArticleFilters {
  status?: ArticleStatus | ''
  page?: number
  limit?: number
}

export function useArticles(filters: ArticleFilters = {}) {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      const { data } = await api.get<ArticlePage>('/articles', {
        params: {
          status: filters.status || undefined,
          page: filters.page,
          limit: filters.limit,
        },
      })
      return data
    },
  })
}

export function useArticle(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['articles', idOrSlug],
    queryFn: async () => (await api.get<Article>(`/articles/${idOrSlug}`)).data,
    enabled: Boolean(idOrSlug),
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      idOrSlug,
      ...payload
    }: { idOrSlug: string; status?: ArticleStatus; isPublic?: boolean }) =>
      (await api.patch<Article>(`/articles/${idOrSlug}`, payload)).data,
    onSuccess: (article) => {
      qc.setQueryData(['articles', article.slug], article)
      qc.setQueryData(['articles', article.id], article)
      void qc.invalidateQueries({ queryKey: ['articles'], exact: false })
    },
  })
}

export interface AddTopicInput {
  topic: string
  context?: string
}

export function useAddTopic() {
  return useMutation({
    mutationFn: async (payload: AddTopicInput) => (await api.post('/topics', payload)).data,
  })
}
