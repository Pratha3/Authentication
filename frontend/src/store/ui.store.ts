import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  registrationModalEventId: string | null
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  openRegistrationModal: (eventId: string) => void
  closeRegistrationModal: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  registrationModalEventId: null,

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openRegistrationModal: (registrationModalEventId) => set({ registrationModalEventId }),
  closeRegistrationModal: () => set({ registrationModalEventId: null }),
}))
