import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown } from 'lucide-react';
import { TaskStep } from '../types';

interface CreateStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (step: Omit<TaskStep, 'id'>) => void;
}

export default function CreateStepModal({ isOpen, onClose, onConfirm }: CreateStepModalProps) {
  const { t } = useTranslation();
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case '顶级': return t('task_type.top_level');
      case '流程': return t('task_type.process');
      case '定时': return t('task_type.scheduled');
      case '-': return t('common.uncategorized');
      default: return category;
    }
  };
  const [formData, setFormData] = useState({
    name: '',
    category: '流程',
    successJump: '',
    failureJump: '',
    failureTip: '',
  });

  const handleConfirm = () => {
    if (formData.name.trim()) {
      onConfirm(formData);
      setFormData({
        name: '',
        category: '流程',
        successJump: '',
        failureJump: '',
        failureTip: '',
      });
      onClose();
    }
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
            className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-6 flex items-center justify-between border-b border-outline-variant/10">
              <h2 className="text-xl font-extrabold font-headline text-on-surface tracking-tight">{t('modal.add_task_step')}</h2>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('common.name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('modal.task_name_placeholder')}
                    className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('common.category')}</label>
                  <div className="relative group">
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full appearance-none px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium pr-10"
                    >
                      {['顶级', '流程', '定时', '-'].map((key) => (
                        <option key={key} value={key}>{getCategoryLabel(key)}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('common.success_jump')}</label>
                  <input
                    type="text"
                    value={formData.successJump}
                    onChange={(e) => setFormData({ ...formData, successJump: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('common.failure_jump')}</label>
                  <input
                    type="text"
                    value={formData.failureJump}
                    onChange={(e) => setFormData({ ...formData, failureJump: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('common.failure_tip')}</label>
                <textarea
                  value={formData.failureTip}
                  onChange={(e) => setFormData({ ...formData, failureTip: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium resize-none"
                  rows={3}
                />
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
                  disabled={!formData.name.trim()}
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
