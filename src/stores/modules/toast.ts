// src/store/modules/toast.ts
import { create } from "zustand";

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  show: false,
  message: '',
  type: 'success',
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    set({ show: true, message, type });
  },
  hideToast: () => set({ show: false, message: '', type: 'success' }),
}));