import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Topic, TopicPage } from '../lib/types'

export type TopicStatusFilter = 'pending' | 'used' | 'all'

export interface TopicFilters {
  status?: TopicStatusFilter
  page?: number
  limit?: number
}

export function useTopics(filters: TopicFilters = {}) {
  return useQuery({
    queryKey: ['topics', filters],
    queryFn: async () => {
      const { data } = await api.get<TopicPage>('/topics', {
        params: {
          status: filters.status,
          page: filters.page,
          limit: filters.limit,
        },
      })
      return data
    },
  })
}

export interface AddTopicInput {
  topic: string
  context?: string
}

export function useAddTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AddTopicInput) => (await api.post<Topic>('/topics', payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['topics'], exact: false })
    },
  })
}

export function useMarkTopicDone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) =>
      (await api.patch<Topic>(`/topics/${id}`, { done })).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['topics'], exact: false })
    },
  })
}
