import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export function useSearch(query: string, tag?: string, enabled = true) {
  return useQuery({
    queryKey: ['search', query, tag],
    queryFn: () => api.search(query, tag),
    enabled: enabled && (query.length > 1 || (tag?.length ?? 0) > 0),
    staleTime: 10000,
  })
}
