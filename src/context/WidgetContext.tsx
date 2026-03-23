import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ExportFile } from '../types';

interface WidgetState {
  result: { mockupUrl: string; instructions: string; presetJson: any } | null;
  loading: boolean;
  auditResult: { compliant: boolean; suggestions: string } | null;
  isAuditing: boolean;
  videoUrl: string | null;
  isGeneratingVideo: boolean;
  videoLoadingMessage: string;
  videoError: string | null;
  fonts: ExportFile[];
  icons: ExportFile[];
  bitmaps: ExportFile[];
  fileErrors: { fonts?: string; icons?: string; bitmaps?: string };
  favoriteColors: string[];
}

interface WidgetContextType {
  state: WidgetState;
  setState: React.Dispatch<React.SetStateAction<WidgetState>>;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const WidgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<WidgetState>({
    result: null,
    loading: false,
    auditResult: null,
    isAuditing: false,
    videoUrl: null,
    isGeneratingVideo: false,
    videoLoadingMessage: '',
    videoError: null,
    fonts: [],
    icons: [],
    bitmaps: [],
    fileErrors: {},
    favoriteColors: [],
  });

  return (
    <WidgetContext.Provider value={{ state, setState }}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) throw new Error('useWidget must be used within a WidgetProvider');
  return context;
};
