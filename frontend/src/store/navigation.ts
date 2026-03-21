import { create } from 'zustand'

interface NavigationStore {
  currentDate: Date
  view: 'edit' | 'preview'
  isDirty: boolean
  setCurrentDate: (date: Date) => void
  setView: (view: 'edit' | 'preview') => void
  setDirty: (dirty: boolean) => void
  goToPrevDay: () => void
  goToNextDay: () => void
  goToToday: () => void
}

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  currentDate: new Date(),
  view: 'edit',
  isDirty: false,

  setCurrentDate: (date) => set({ currentDate: date }),
  setView: (view) => set({ view }),
  setDirty: (isDirty) => set({ isDirty }),

  goToPrevDay: () => {
    const d = new Date(get().currentDate)
    d.setDate(d.getDate() - 1)
    set({ currentDate: d })
  },

  goToNextDay: () => {
    const d = new Date(get().currentDate)
    d.setDate(d.getDate() + 1)
    set({ currentDate: d })
  },

  goToToday: () => set({ currentDate: new Date() }),
}))
