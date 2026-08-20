import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { InspectionDetail } from "@/app/lib/types";

export const DATA_TTL = 5 * 60 * 1000;

interface DetailEntry {
  data: InspectionDetail;
  cachedAt: number;
}

interface DataStoreState {
  details: Record<string, DetailEntry>;
  listVersion: number;
  getDetail: (id: string) => InspectionDetail | null;
  setDetail: (id: string, data: InspectionDetail) => void;
  invalidateDetail: (id: string) => void;
  invalidateList: () => void;
}

export const useDataStore = create<DataStoreState>()(
  persist(
    (set, get) => ({
      details: {},
      listVersion: 0,
      getDetail: (id) => {
        const entry = get().details[id];
        if (!entry) return null;
        if (Date.now() - entry.cachedAt > DATA_TTL) {
          set((s) => {
            const details = { ...s.details };
            delete details[id];
            return { details };
          });
          return null;
        }
        return entry.data;
      },
      setDetail: (id, data) =>
        set((s) => ({
          details: { ...s.details, [id]: { data, cachedAt: Date.now() } },
        })),
      invalidateDetail: (id) =>
        set((s) => {
          const details = { ...s.details };
          delete details[id];
          return { details };
        }),
      invalidateList: () => set({ listVersion: Date.now() }),
    }),
    {
      name: "ovi-data-cache",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ details: s.details, listVersion: s.listVersion }),
    },
  ),
);