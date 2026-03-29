import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BackgroundTask {
  id: string;
  name: string;
  status: TaskStatus;
  progress?: number;
  result?: any;
  error?: string;
}

interface TaskContextType {
  tasks: BackgroundTask[];
  addTask: (task: Omit<BackgroundTask, 'id'>) => string;
  updateTask: (id: string, updates: Partial<BackgroundTask>) => void;
  removeTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);

  const addTask = useCallback((task: Omit<BackgroundTask, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setTasks(prev => [...prev, { ...task, id }]);
    return id;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<BackgroundTask>) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, removeTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTask must be used within a TaskProvider');
  return context;
};
