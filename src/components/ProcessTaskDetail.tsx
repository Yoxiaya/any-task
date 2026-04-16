import React, { useRef, useState, useEffect } from 'react';
import { MoreVertical, ChevronLeft, ChevronRight, GripVertical, Trash2, Edit3, Save, CheckCircle2 } from 'lucide-react';
import { Task, TaskStep } from '../types';
import { Reorder, motion, AnimatePresence } from 'motion/react';

interface ProcessTaskDetailProps {
  selectedTask: Task;
  steps: TaskStep[];
  notes: string;
  onUpdateNotes: (notes: string) => void;
  onEditStep: (step: TaskStep) => void;
  onContextMenu: (e: React.MouseEvent, stepId?: string) => void;
  onReorderSteps: (newSteps: TaskStep[]) => void;
  onDeleteStep: (stepId: string) => void;
  onUpdateStep: (stepId: string, updates: Partial<TaskStep>) => void;
  onJumpToTask: (taskName: string) => void;
}

export default function ProcessTaskDetail({
  selectedTask,
  steps,
  notes,
  onUpdateNotes,
  onEditStep,
  onContextMenu,
  onReorderSteps,
  onDeleteStep,
  onUpdateStep,
  onJumpToTask
}: ProcessTaskDetailProps) {
  const deleteZoneRef = useRef<HTMLDivElement>(null);
  const originalStepsRef = useRef<TaskStep[]>([]);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Reset selection when task changes
  useEffect(() => {
    setSelectedStepId(null);
    setIsEditingName(false);
  }, [selectedTask.id]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSave = () => {
    setSaveStatus('saving');
    console.log(steps)
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setSelectedStepId(null);
      setIsEditingName(false);
    }, 600);
  };

  const handleDragStart = () => {
    originalStepsRef.current = [...steps];
  };

  const handleDragEnd = (event: any, info: any, stepId: string) => {
    setIsOverDeleteZone(false);
    if (!deleteZoneRef.current) return;

    const rect = deleteZoneRef.current.getBoundingClientRect();
    const { x, y } = info.point;

    const isInsideDeleteZone = (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );

    if (isInsideDeleteZone) {
      onDeleteStep(stepId);
      return;
    }

    // Handle Modifier Keys
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    if (isCtrl || isShift) {
      const originalSteps = originalStepsRef.current;
      const newIndex = steps.findIndex(s => s.id === stepId);
      const oldIndex = originalSteps.findIndex(s => s.id === stepId);

      if (newIndex !== -1 && oldIndex !== -1) {
        if (isCtrl) {
          // Copy logic: Restore original list and insert a copy at the new position
          const maxId = originalSteps.reduce((max, step) => {
            const num = parseInt(step.id, 10);
            return isNaN(num) ? max : Math.max(max, num);
          }, 0);
          const newId = (maxId + 1).toString().padStart(2, '0');
          const copy = { ...originalSteps[oldIndex], id: newId };
          
          const finalSteps = [...originalSteps];
          // Insert the copy at the drop position (newIndex)
          finalSteps.splice(newIndex, 0, copy);
          onReorderSteps(finalSteps);
        } else if (isShift && newIndex !== oldIndex) {
          // Swap logic: Swap the items at oldIndex and newIndex
          const finalSteps = [...originalSteps];
          const targetItem = originalSteps[newIndex];
          finalSteps[newIndex] = originalSteps[oldIndex];
          finalSteps[oldIndex] = targetItem;
          onReorderSteps(finalSteps);
        }
      }
    }
  };

  const handleDrag = (event: any, info: any) => {
    if (!deleteZoneRef.current) return;
    const rect = deleteZoneRef.current.getBoundingClientRect();
    const { x, y } = info.point;
    
    const isInside = (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
    
    if (isInside !== isOverDeleteZone) {
      setIsOverDeleteZone(isInside);
    }
  };

  return (
    <section className="flex-1 bg-background overflow-hidden p-8 flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Task Notes Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">任务备注</label>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-outline-variant font-medium">失去焦点自动保存</span>
          </div>
        </div>
        <textarea 
          key={selectedTask.id}
          className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium resize-none custom-scrollbar"
          placeholder="在此输入任务备注..."
          rows={3}
          defaultValue={notes}
          onBlur={(e) => onUpdateNotes(e.target.value)}
        />
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsEditingName(true)}
          disabled={!selectedStepId}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            selectedStepId 
              ? 'bg-primary text-on-primary shadow-md hover:bg-primary-dim active:scale-95' 
              : 'bg-surface-container-high text-outline-variant cursor-not-allowed opacity-50'
          }`}
        >
          <Edit3 size={16} />
          <span>修改名称</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:scale-100 ${
            saveStatus === 'saved' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-secondary text-on-secondary hover:bg-secondary/90'
          }`}
        >
          {saveStatus === 'saving' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Save size={16} />
            </motion.div>
          ) : saveStatus === 'saved' ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          <span>{saveStatus === 'saving' ? '正在保存...' : saveStatus === 'saved' ? '已保存' : '保存数据'}</span>
        </button>

        {/* Delete Zone */}
        <div 
          ref={deleteZoneRef}
          className={`h-12 flex-1 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all duration-300 ${
            isOverDeleteZone 
              ? 'bg-error/10 border-error text-error scale-[1.01] shadow-lg' 
              : 'bg-surface-container-low border-outline-variant/30 text-outline-variant'
          }`}
        >
          <Trash2 size={18} className={isOverDeleteZone ? 'animate-bounce' : ''} />
          <span className="text-xs font-bold tracking-wide">
            {isOverDeleteZone ? '松开鼠标以删除' : '将步骤拖入此处删除'}
          </span>
        </div>
      </div>

      <div 
        onContextMenu={onContextMenu}
        className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 flex flex-col flex-1"
      >
        <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-container-high border-b border-outline-variant/20">
                <th className="px-4 py-4 w-10"></th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[8%]">序号</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[12%]">任务类</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[25%]">任务名</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[12%]">成功跳转</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[12%]">失败跳转</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[23%]">失败提示</th>
              </tr>
            </thead>
            <Reorder.Group 
              as="tbody" 
              axis="y" 
              values={steps} 
              onReorder={onReorderSteps}
              className="divide-y divide-outline-variant/5"
            >
              {steps.map((step) => {
                const isSelected = selectedStepId === step.id;
                const rowBgClass = isSelected 
                  ? 'bg-blue-100/80!' 
                  : 'group-hover:bg-primary/5 transition-colors';

                return (
                  <Reorder.Item 
                    as="tr" 
                    key={step.id} 
                    value={step}
                    onDragStart={handleDragStart}
                    onDragEnd={(e, info) => handleDragEnd(e, info, step.id)}
                    onDrag={handleDrag}
                    onClick={() => setSelectedStepId(step.id === selectedStepId ? null : step.id)}
                    onDoubleClick={() => step.name && onJumpToTask(step.name)}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, step.id);
                    }}
                    className={`shimmer-row group relative z-0 cursor-pointer ${isSelected ? 'z-10' : ''}`}
                  >
                    <td className={`px-4 py-4 text-center ${rowBgClass}`}>
                      <GripVertical size={18} className="text-outline-variant hover:text-primary cursor-grab active:cursor-grabbing transition-colors" />
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium text-on-surface-variant ${rowBgClass}`}>{step.id}</td>
                    <td className={`px-6 py-4 ${rowBgClass}`}>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                        step.category === 'INIT_SYSTEM' ? 'bg-blue-100 text-blue-700' :
                        step.category === 'DB_CONN' ? 'bg-purple-100 text-purple-700' :
                        step.category === 'CACHE_WARM' ? 'bg-amber-100 text-amber-700' :
                        step.category === 'SEC_POL' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {step.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold text-on-surface ${rowBgClass}`}>
                      {isEditingName && isSelected ? (
                        <input 
                          autoFocus
                          type="text"
                          defaultValue={step.name}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const newName = e.target.value;
                            if (newName && newName !== step.name) {
                              const maxId = steps.reduce((max, s) => {
                                const num = parseInt(s.id, 10);
                                return isNaN(num) ? max : Math.max(max, num);
                              }, 0);
                              const newId = (maxId + 1).toString().padStart(2, '0');
                              const currentIndex = steps.findIndex(s => s.id === step.id);
                              const newSteps = [...steps];
                              newSteps.splice(currentIndex + 1, 0, {
                                ...step,
                                id: newId,
                                name: newName
                              });
                              onReorderSteps(newSteps);
                            }
                            setIsEditingName(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newName = e.currentTarget.value;
                              if (newName && newName !== step.name) {
                                const maxId = steps.reduce((max, s) => {
                                  const num = parseInt(s.id, 10);
                                  return isNaN(num) ? max : Math.max(max, num);
                                }, 0);
                                const newId = (maxId + 1).toString().padStart(2, '0');
                                const currentIndex = steps.findIndex(s => s.id === step.id);
                                const newSteps = [...steps];
                                newSteps.splice(currentIndex + 1, 0, {
                                  ...step,
                                  id: newId,
                                  name: newName
                                });
                                onReorderSteps(newSteps);
                              }
                              setIsEditingName(false);
                            }
                          }}
                          className="w-full bg-surface-container-lowest border-2 border-primary rounded-lg px-3 py-1.5 text-sm font-bold outline-none shadow-lg animate-in zoom-in-95 duration-200"
                        />
                      ) : (
                        <span>{step.name || <span className="text-outline-variant font-normal italic">未命名步骤</span>}</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${rowBgClass}`}>
                      <input 
                        type="text"
                        defaultValue={step.successJump}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => onUpdateStep(step.id, { successJump: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-lg px-3 py-1.5 text-sm text-tertiary font-medium outline-none transition-all shadow-sm"
                      />
                    </td>
                    <td className={`px-6 py-4 ${rowBgClass}`}>
                      <input 
                        type="text"
                        defaultValue={step.failureJump}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => onUpdateStep(step.id, { failureJump: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-error/50 focus:ring-2 focus:ring-error/10 rounded-lg px-3 py-1.5 text-sm text-error font-medium outline-none transition-all shadow-sm"
                      />
                    </td>
                    <td className={`px-6 py-4 ${rowBgClass}`}>
                      <input 
                        type="text"
                        defaultValue={step.failureTip}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => onUpdateStep(step.id, { failureTip: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant italic outline-none transition-all shadow-sm"
                      />
                    </td>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </table>
        </div>
      </div>
    </section>
  );
}
