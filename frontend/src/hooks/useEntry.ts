import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { DayEntry } from '../types'

export function useEntry(year: number, month: number, day: number) {
  return useQuery({
    queryKey: ['entry', year, month, day],
    queryFn: () => api.getEntry(year, month, day),
  })
}

export function useMonthSummary(year: number, month: number) {
  return useQuery({
    queryKey: ['month', year, month],
    queryFn: () => api.getMonthSummary(year, month),
  })
}

export function useSaveEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ year, month, day, entry }: { year: number; month: number; day: number; entry: Partial<DayEntry> }) =>
      api.saveEntry(year, month, day, entry),
    onSuccess: (_, { year, month, day }) => {
      qc.invalidateQueries({ queryKey: ['entry', year, month, day] })
      qc.invalidateQueries({ queryKey: ['month', year, month] })
      qc.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
    staleTime: 60000,
  })
}
