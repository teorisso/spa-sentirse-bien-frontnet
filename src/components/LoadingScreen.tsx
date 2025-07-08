import PageHero from './PageHero';
import React from 'react';

interface LoadingScreenProps {
  title: string;
  description: string;
  /** Texto que se mostrará debajo del spinner. */
  message?: string;
}

export default function LoadingScreen({ title, description, message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <>
      <PageHero title={title} description={description} />
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </>
  );
} 