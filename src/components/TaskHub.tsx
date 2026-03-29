import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown, Activity, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

const CARD_COLORS = [
  'bg-sky-900/40 border-sky-500/30 text-sky-200',
  'bg-yellow-900/40 border-yellow-500/30 text-yellow-200',
  'bg-lime-900/40 border-lime-500/30 text-lime-200',
];

export function TaskHub() {
  const { tasks, removeTask } = useTask();
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  const activeTasksCount = tasks.filter(t => t.status === 'pending' || t.status === 'processing').length;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-80 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-96"
          >
            <div className="bg-white/10 border-b border-white/10 px-4 py-3 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Background Tasks
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
              {tasks.map((task, index) => {
                const colorClass = CARD_COLORS[index % CARD_COLORS.length];
                return (
                  <div key={task.id} className={`p-3 rounded-xl border ${colorClass} relative overflow-hidden`}>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="flex items-center gap-2">
                        {task.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                        {task.status === 'pending' && <Activity className="w-4 h-4 text-neutral-400" />}
                        {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {task.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        <span className="text-sm font-medium leading-tight">{task.name}</span>
                      </div>
                      {(task.status === 'completed' || task.status === 'failed') && (
                        <button onClick={() => removeTask(task.id)} className="text-white/50 hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {task.status === 'processing' && task.progress !== undefined && (
                      <div className="w-full bg-black/40 rounded-full h-1.5 mt-2 relative z-10 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {task.status === 'failed' && task.error && (
                      <p className="text-xs text-red-300 mt-2 relative z-10">{task.error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-neutral-900/80 backdrop-blur-md border border-white/10 shadow-lg rounded-full px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-800/90 transition-all group"
      >
        <div className="relative flex items-center justify-center">
          {activeTasksCount > 0 ? (
            <>
              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-50"></div>
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full relative z-10"></div>
            </>
          ) : (
            <div className="w-2.5 h-2.5 bg-neutral-500 rounded-full"></div>
          )}
        </div>
        <span className="text-sm font-medium text-white">
          {activeTasksCount > 0 ? `${activeTasksCount} Active` : 'Tasks'}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
        )}
      </button>
    </div>
  );
}
