// src/components/global-loader.tsx
"use client";

import type { FC } from 'react';
import { useTranslations } from 'next-intl';
import LoadingSpinner from '@/components/loading-spinner';

interface GlobalLoaderProps {
  operationMessage: string | null;
  isLoading: boolean;
}

const GlobalLoader: FC<GlobalLoaderProps> = ({ operationMessage, isLoading }) => {
  const t = useTranslations('GlobalLoader');
  
  if (!isLoading) { // Also check isLoading here, not just operationMessage
    return null;
  }

  const displayMessage = operationMessage || t('defaultLoadingMessage');

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-[200]">
      <LoadingSpinner size={48} />
      <p className="mt-4 text-lg font-semibold text-foreground">{displayMessage}</p>
    </div>
  );
};

export default GlobalLoader;
