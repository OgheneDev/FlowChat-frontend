// components/ui/ToastContainer.tsx
"use client";

import React from 'react';
import { Toast } from './toast';
import { useToastStore } from '@/stores/modules/toast';

export const ToastContainer = () => {
  const { toasts, hideToast } = useToastStore();

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          show={true}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </>
  );
};