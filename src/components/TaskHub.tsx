import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown, Activity, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

const CARD_COLORS = [
  'bg-white/40 border-[#7e9c7e]/20 text-[#1a201a]',
  'bg-white/40 border-yellow-500/20 text-[#1a201a]',
  'bg-white/40 border-emerald-500/20 text-[#1a201a]',
];

export function TaskHub() {
  const { tasks, removeTask } = useTask();
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  const activeTasksCount = tasks.filter(t => t.status === 'pending' || t.status === 'processing').length;

  return (
    <div className="fixed bottom-24 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-6 w-80 neo-card bg-white/80 backdrop-blur-xl border-white/50 shadow-2xl overflow-hidden flex flex-col max-h-96"
          >
            <div className="bg-[#7e9c7e]/10 border-b border-[#7e9c7e]/10 px-6 py-4 flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#1a201a] flex items-center gap-2 uppercase tracking-widest">
                <Activity className="w-4 h-4 text-[#7e9c7e]" />
                Background Tasks
              </h3>
              <button onClick={() => setIsOpen(false)} className="neo-button p-1 text-[#7e9c7e] hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {tasks.map((task, index) => {
                const colorClass = CARD_COLORS[index % CARD_COLORS.length];
                return (
                  <div key={task.id} className={`p-4 rounded-2xl border-2 ${colorClass} relative overflow-hidden shadow-sm`}>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="flex items-center gap-3">
                        {task.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-[#7e9c7e]" />}
                        {task.status === 'pending' && <Activity className="w-4 h-4 text-[#7e9c7e]/60" />}
                        {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {task.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-sm font-bold leading-tight text-[#1a201a]">{task.name}</span>
                      </div>
                      {(task.status === 'completed' || task.status === 'failed') && (
                        <button onClick={() => removeTask(task.id)} className="text-[#7e9c7e]/40 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {task.status === 'processing' && task.progress !== undefined && (
                      <div className="w-full bg-[#7e9c7e]/10 rounded-full h-2 mt-3 relative z-10 overflow-hidden shadow-inner">
                        <div 
                          className="bg-[#7e9c7e] h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {task.status === 'failed' && task.error && (
                      <p className="text-xs text-red-600 mt-2 relative z-10 font-bold">{task.error}</p>
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
        className="neo-button px-6 py-3 flex items-center gap-4 transition-all group bg-white/80"
      >
        <div className="relative flex items-center justify-center">
          {activeTasksCount > 0 ? (
            <>
              <div className="absolute inset-0 bg-[#7e9c7e] rounded-full animate-ping opacity-40"></div>
              <div className="w-3 h-3 bg-[#7e9c7e] rounded-full relative z-10 shadow-sm shadow-[#7e9c7e]/40"></div>
            </>
          ) : (
            <div className="w-3 h-3 bg-[#7e9c7e]/20 rounded-full shadow-inner"></div>
          )}
        </div>
        <span className="text-sm font-bold text-[#1a201a] uppercase tracking-widest">
          {activeTasksCount > 0 ? `${activeTasksCount} Active` : 'Tasks'}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-[#7e9c7e] group-hover:text-[#1a201a] transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-[#7e9c7e] group-hover:text-[#1a201a] transition-colors" />
        )}
      </button>
    </div>
  );
}
