export interface DayEntry {
  date: string // YYYY-MM-DD
  text: string
  categories: Record<string, string[]>
  hashtags: string[]
}

export interface MonthSummary {
  year: number
  month: number
  days_with_entries: number[]
}

export interface SearchResult {
  date: string
  snippet: string
  tags: string[]
}

export interface TagCount {
  tag: string
  count: number
}
