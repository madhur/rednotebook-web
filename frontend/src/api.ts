import axios from 'axios'
import type { DayEntry, MonthSummary, SearchResult, TagCount } from './types'

const client = axios.create({ baseURL: '/api' })

export const api = {
  getEntry: async (year: number, month: number, day: number): Promise<DayEntry> => {
    const { data } = await client.get(`/entries/${year}/${month}/${day}`)
    return data
  },

  saveEntry: async (year: number, month: number, day: number, entry: Partial<DayEntry>): Promise<{ success: boolean }> => {
    const { data } = await client.put(`/entries/${year}/${month}/${day}`, {
      date: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
      text: entry.text ?? '',
      categories: entry.categories ?? {},
      hashtags: entry.hashtags ?? [],
    })
    return data
  },

  getMonthSummary: async (year: number, month: number): Promise<MonthSummary> => {
    const { data } = await client.get(`/entries/${year}/${month}`)
    return data
  },

  getAllMonths: async (): Promise<string[]> => {
    const { data } = await client.get('/months')
    return data.months
  },

  search: async (q: string, tag?: string): Promise<SearchResult[]> => {
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (tag) params.tag = tag
    const { data } = await client.get('/search', { params })
    return data
  },

  getTags: async (): Promise<TagCount[]> => {
    const { data } = await client.get('/tags')
    return data
  },

  renderMarkup: async (text: string): Promise<string> => {
    const { data } = await client.post('/render', { text })
    return data.html
  },
}
