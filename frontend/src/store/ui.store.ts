import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  registrationModalEventId: string | null
  shareModalEventId: string | null
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  openRegistrationModal: (eventId: string) => void
  closeRegistrationModal: () => void
  openShareModal: (eventId: string) => void
  closeShareModal: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  commandPaletteOpen: false,
  registrationModalEventId: null,
  shareModalEventId: null,

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  openRegistrationModal: (registrationModalEventId) => set({ registrationModalEventId }),
  closeRegistrationModal: () => set({ registrationModalEventId: null }),
  openShareModal: (shareModalEventId) => set({ shareModalEventId }),
  closeShareModal: () => set({ shareModalEventId: null }),
}))
