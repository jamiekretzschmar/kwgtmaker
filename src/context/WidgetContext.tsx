import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ExportFile } from '../types';

interface WidgetState {
  result: { mockupUrl: string; instructions: string; presetJson: any; id?: string } | null;
  results: { mockupUrl: string; instructions: string; presetJson: any; id?: string }[];
  selectedResultIndex: number;
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
  history: { result: any; results: any[]; selectedResultIndex: number }[];
  historyIndex: number;
}

interface WidgetContextType {
  state: WidgetState;
  setState: React.Dispatch<React.SetStateAction<WidgetState>>;
  pushToHistory: (result: any, results: any[], selectedResultIndex: number) => void;
  undo: () => void;
  redo: () => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const WidgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<WidgetState>({
    result: null,
    results: [],
    selectedResultIndex: 0,
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
    history: [],
    historyIndex: -1,
  });

  const pushToHistory = (result: any, results: any[], selectedResultIndex: number) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ result, results, selectedResultIndex });
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  };

  const undo = () => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      const { result, results, selectedResultIndex } = prev.history[newIndex];
      return {
        ...prev,
        result,
        results,
        selectedResultIndex,
        historyIndex: newIndex
      };
    });
  };

  const redo = () => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      const { result, results, selectedResultIndex } = prev.history[newIndex];
      return {
        ...prev,
        result,
        results,
        selectedResultIndex,
        historyIndex: newIndex
      };
    });
  };

  return (
    <WidgetContext.Provider value={{ state, setState, pushToHistory, undo, redo }}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) throw new Error('useWidget must be used within a WidgetProvider');
  return context;
};
