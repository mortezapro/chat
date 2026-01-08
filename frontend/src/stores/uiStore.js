import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      theme: 'light', // 'light' or 'dark'
      sidebarOpen: true,
      chatSearchQuery: '',
      chatFilter: 'all', // 'all', 'unread', 'groups', 'private'
      activityFilter: null, // 'active', 'inactive', null

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }));
      },

      setTheme: (theme) => {
        set({ theme });
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebarOpen: !state.sidebarOpen
        }));
      },

      setChatSearchQuery: (query) => {
        set({ chatSearchQuery: query });
      },

      setChatFilter: (filter) => {
        set({ chatFilter: filter });
      },

      setActivityFilter: (filter) => {
        set({ activityFilter: filter });
      },
      
      mobileTab: 0,
      isMobile: false,
      setMobileTab: (tab) => set({ mobileTab: tab }),
      setIsMobile: (isMobile) => set({ isMobile })
    }),
    {
      name: 'ui-storage'
    }
  )
);

export { useUIStore };



