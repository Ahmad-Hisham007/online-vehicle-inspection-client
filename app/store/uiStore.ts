import { create } from "zustand";

interface UIState {
  navPending: boolean;
  setNavPending: (pending: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  navPending: false,
  setNavPending: (pending) => set({ navPending: pending }),
}));