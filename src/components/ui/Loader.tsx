'use client';

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export function Loader({ text = 'טוען...', fullScreen = true }: LoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
          <div className="text-gray-700">{text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

// Loader context for global usage
import { createContext, useContext, useState, ReactNode } from 'react';

interface LoaderContextType {
  isLoading: boolean;
  show: (text?: string) => void;
  hide: () => void;
  loadingText: string;
}

const LoaderContext = createContext<LoaderContextType | null>(null);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('טוען...');

  const show = (text = 'טוען...') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hide = () => {
    setIsLoading(false);
  };

  return (
    <LoaderContext.Provider value={{ isLoading, show, hide, loadingText }}>
      {children}
      {isLoading && <Loader text={loadingText} />}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  return context;
}
