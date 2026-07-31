'use client'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { HOT_ITEMS } from '@/enums';

type HotKeys = typeof HOT_ITEMS.valueType;

type AppState = {
  hiddenItems: HotKeys[];
  setHiddenItems: (items: HotKeys[]) => void;
  sortItems: HotKeys[];
  setSortItems: (items: HotKeys[]) => void;
}

type PersistedAppState = Pick<AppState, 'hiddenItems' | 'sortItems'>;

export const useAppStore = create<AppState>()(
  persist<AppState, [], [], PersistedAppState>(
    (set) => ({
      hiddenItems: [],
      setHiddenItems: (items) => {
        set({ hiddenItems: items })
      },

      sortItems: HOT_ITEMS.values,
      setSortItems: (items) => {
        set({ sortItems: items })
      },
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hiddenItems: state.hiddenItems,
        sortItems: state.sortItems
      }),
    },
  ),
)
