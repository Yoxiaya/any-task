import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import { Task, TaskType } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  existingTasks: Task[];
  taskType: TaskType;
}

export default function CreateTaskModal({ isOpen, onClose, onConfirm, existingTasks, taskType }: CreateTaskModalProps) {
  const [taskName, setTaskName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      // Generate default name
      let baseName = taskType === '流程' ? t('modal.default_process_name') : taskType === '定时' ? t('modal.default_scheduled_name') : t('modal.default_normal_name');
      let name = baseName;
      let counter = 1;
      
      const existingNames = new Set(existingTasks.map(t => t.name));
      
      if (existingNames.has(name)) {
        while (existingNames.has(`${baseName}_${counter}`)) {
          counter++;
        }
        name = `${baseName}_${counter}`;
      }
      
      setTaskName(name);
      setError(null);
    }
  }, [isOpen, existingTasks, taskType, t]);

  const handleConfirm = () => {
    const trimmedName = taskName.trim();
    if (!trimmedName) return;

    if (existingTasks.some(t => t.name === trimmedName)) {
      setError(t('modal.name_exists'));
      return;
    }

    onConfirm(trimmedName);
    setTaskName('');
    onClose();
  };

  const handleNameChange = (name: string) => {
    setTaskName(name);
    if (error) setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-6 flex items-center justify-between border-b border-outline-variant/10">
              <h2 className="text-xl font-extrabold font-headline text-on-surface tracking-tight">
                {t('modal.create_task')}
              </h2>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('modal.task_name')}</label>
                <input
                  autoFocus
                  type="text"
                  value={taskName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder={t('modal.task_name_placeholder')}
                  className={`w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-2 transition-all text-sm font-medium outline-none ${
                    error 
                      ? 'border-error/50 focus:ring-error/20 bg-error/5' 
                      : 'border-transparent focus:ring-primary/20 focus:bg-surface-container-lowest focus:border-primary/30'
                  }`}
                />
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-1.5 text-error text-[11px] font-bold"
                    >
                      <AlertCircle size={12} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-bold text-secondary hover:bg-surface-container rounded-lg transition-colors"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!taskName.trim()}
                  className="px-8 py-2.5 text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-dim rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('buttons.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
