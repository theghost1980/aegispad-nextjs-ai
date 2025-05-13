// src/components/global-loader.tsx
"use client";

import type { FC } from 'react';
import LoadingSpinner from '@/components/loading-spinner';

interface GlobalLoaderProps {
  operationMessage: string | null;
  isLoading: boolean;
}

const GlobalLoader: FC<GlobalLoaderProps> = ({ operationMessage, isLoading }) => {
  if (!isLoading || !operationMessage) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-[200]">
      <LoadingSpinner size={48} />
      <p className="mt-4 text-lg font-semibold text-foreground">{operationMessage}</p>
    </div>
  );
};

export default GlobalLoader;
