import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit3, Save, CheckCircle2 } from 'lucide-react';
import { Task, TaskStep } from '../types';
import { Reorder, motion } from 'motion/react';
import { getCategoryLabel } from '../utils';

// Force file change to trigger GitHub sync update
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
  onEditStep: _onEditStep,
  onContextMenu,
  onReorderSteps,
  onDeleteStep,
  onUpdateStep,
  onJumpToTask
}: ProcessTaskDetailProps) {
  const deleteZoneRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLTableSectionElement>(null);
  const originalStepsRef = useRef<TaskStep[]>([]);
  const isShiftPressed = useRef(false);
  const draggingStepIdRef = useRef<string | null>(null);
  const isShiftDragRef = useRef(false);
  const targetIndexRef = useRef<number>(-1);
  const [targetIndex, setTargetIndex] = useState<number>(-1);
  const [previewSteps, setPreviewSteps] = useState<TaskStep[] | null>(null);
  const [isShiftDrag, setIsShiftDrag] = useState(false);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { t } = useTranslation();

  const displaySteps = previewSteps || steps;

  const activeRowIndex = selectedStepId ? displaySteps.findIndex(s => s.id === selectedStepId) : -1;

  const handleRowClick = (index: number) => {
    // If clicking a static column, we want to select the row conceptually
    const clickedStep = displaySteps[index];
    if (clickedStep) {
      setSelectedStepId(clickedStep.id === selectedStepId ? null : clickedStep.id);
    }
  };

  const handleNameEditComplete = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>, step: TaskStep) => {
    const newName = e.currentTarget.value;
    if (newName && newName !== step.name) {
      onUpdateStep(step.id, { name: newName });
    }
    setIsEditingName(false);
  };

  // Helper to re-map content to fixed slots (ID, successJump, failureJump, failureTip)
  const applyFixedSlots = (newContentOrder: TaskStep[], baseSlots: TaskStep[]): TaskStep[] => {
    return newContentOrder.map((content, idx) => ({
      ...baseSlots[idx], // Keep ID, successJump, etc. from the physical slot
      category: content.category,
      name: content.name,
      _uid: content._uid
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressed.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressed.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Reset selection and preview when task changes
  useEffect(() => {
    setSelectedStepId(null);
    setIsEditingName(false);
    setPreviewSteps(null);
    setTargetIndex(-1);
    setIsShiftDrag(false);
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

  const handleDragStart = (event: any, id: string, index: number) => {
    originalStepsRef.current = [...steps];
    draggingStepIdRef.current = id;

    let isShift = isShiftPressed.current;
    if (event && 'shiftKey' in event) {
      isShift = event.shiftKey;
      isShiftPressed.current = isShift;
    }

    setIsShiftDrag(isShift);
    isShiftDragRef.current = isShift;
    
    if (isShift) {
      setTargetIndex(index);
      targetIndexRef.current = index;
      setPreviewSteps(null); // Keep items static visually during Shift-drag
    } else {
      setPreviewSteps([...steps]);
      setTargetIndex(-1);
      targetIndexRef.current = -1;
    }
  };

  const handleReorder = (newSteps: TaskStep[]) => {
    if (!isShiftDrag) {
      setPreviewSteps(newSteps);
    }
  };

  const handleDragEnd = (event: any, info: any, stepId: string) => {
    setIsOverDeleteZone(false);
    const wasShift = isShiftDragRef.current;
    const finalTargetIndex = targetIndexRef.current;
    const currentPreviewSteps = previewSteps;
    const originalSteps = originalStepsRef.current;
    
    draggingStepIdRef.current = null;
    isShiftDragRef.current = false;
    setPreviewSteps(null);
    setTargetIndex(-1);
    targetIndexRef.current = -1;
    setIsShiftDrag(false);
    
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

    if (wasShift) {
      const oldIndex = originalSteps.findIndex(s => s.id === stepId);
      const newIndex = finalTargetIndex;

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const finalSteps = [...originalSteps];
        const stepOld = originalSteps[oldIndex];
        const stepNew = originalSteps[newIndex];

        // Core fix: Only swap identity fields (Category, Name)
        // Keep slot fields (id, successJump, failureJump, failureTip) at their original physical indices
        finalSteps[oldIndex] = {
          ...stepOld,
          category: stepNew.category,
          name: stepNew.name,
          _uid: stepNew._uid
        };
        finalSteps[newIndex] = {
          ...stepNew,
          category: stepOld.category,
          name: stepOld.name,
          _uid: stepOld._uid
        };

        onReorderSteps(finalSteps);
        return;
      }
      return;
    }

    if (isCtrl) {
      // Reordered list (entire items)
      const reorderedItems = currentPreviewSteps || steps;
      const newIndex = reorderedItems.findIndex(s => s.id === stepId);
      const oldIndex = originalSteps.findIndex(s => s.id === stepId);

      if (newIndex !== -1 && oldIndex !== -1) {
        const maxId = originalSteps.reduce((max, step) => {
          const num = parseInt(step.id, 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const newId = (maxId + 1).toString().padStart(2, '0');
        const sourceData = originalSteps[oldIndex];
        const copy = { ...sourceData, id: newId, _uid: Math.random().toString(36).substr(2, 9) };
        
        // 1. First reorder the content of existing steps
        const contentOrder = reorderedItems.map(item => ({ ...item }));
        
        // 2. Insert the copy into contentOrder
        contentOrder.splice(newIndex, 0, copy);
        
        // 3. To maintain slots for standard reorder + copy:
        // This is tricky because we added a new step.
        // Usually copy adds a new row, so it gets a new slot.
        // We just need to make sure existing rows keep their successJump etc at their OLD indices?
        // Actually, if we add a row, it shifts slots below it.
        // For simplicity with 'Slot Fixation', the most logical interpretation is:
        // Reordering re-maps categories/names. Adding a step adds a new slot at the end? 
        // Or shifts slots? User said '序号...不交换'. 
        // If we insert a step at index 3, row 3 becomes index 4.
        // Let's assume standard behavior for insert: the new item gets its own data.
        
        onReorderSteps(contentOrder); // For copy, we just move items since it's a structural change
        return;
      }
    }

    // Standard reorder
    if (currentPreviewSteps) {
      // Apply Slot Fixation: Categories and Names move with reordering, 
      // but ID, Jumps, and Tips stay assigned to the index.
      const finalSteps = applyFixedSlots(currentPreviewSteps, originalSteps);
      onReorderSteps(finalSteps);
    }
  };

  const handleDrag = (event: any, info: any) => {
    // 1. Check Shift state dynamically in case pressed during drag
    let currentShift = isShiftPressed.current;
    if (event && 'shiftKey' in event) {
      currentShift = event.shiftKey;
      isShiftPressed.current = currentShift;
    }
    
    // Handle shift state transitions during drag
    if (currentShift !== isShiftDragRef.current) {
      isShiftDragRef.current = currentShift;
      setIsShiftDrag(currentShift);
      if (currentShift) {
        setPreviewSteps(null);
      } else {
        setPreviewSteps([...originalStepsRef.current]);
      }
    }

    const clientX = event?.clientX ?? event?.touches?.[0]?.clientX ?? info.point.x;
    const clientY = event?.clientY ?? event?.touches?.[0]?.clientY ?? (info.point.y - window.scrollY);

    if (deleteZoneRef.current) {
      const rect = deleteZoneRef.current.getBoundingClientRect();
      const isInside = (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
      if (isInside !== isOverDeleteZone) {
        setIsOverDeleteZone(isInside);
      }
    }

    if (isShiftDragRef.current) {
      // Use document.elementsFromPoint which handles overlap perfectly
      const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
      
      for (const el of elementsAtPoint) {
        const stepRow = el.closest('[data-step-id]');
        if (stepRow) {
          const id = stepRow.getAttribute('data-step-id');
          if (id && id !== draggingStepIdRef.current) {
            const foundIndex = parseInt(stepRow.getAttribute('data-target-index') || '-1', 10);
            if (foundIndex !== -1) {
              setTargetIndex((prev) => {
                if (prev !== foundIndex) {
                  targetIndexRef.current = foundIndex;
                  return foundIndex;
                }
                return prev;
              });
            }
            break; // Found the top-most target row
          }
        }
      }
    }
  };

  return (
    <section className="flex-1 bg-background overflow-hidden p-8 flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Task Notes Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{t('process.task_notes')}</label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-outline-variant font-medium">{t('process.auto_save_tip')}</span>
          </div>
        </div>
        <textarea 
          key={`notes-${selectedTask.id}-${notes || ''}`}
          className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-[15px] font-medium resize-none custom-scrollbar"
          placeholder={t('process.notes_placeholder')}
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[15px] font-bold transition-all ${
            selectedStepId 
              ? 'bg-primary text-on-primary shadow-md hover:bg-primary-dim active:scale-95' 
              : 'bg-surface-container-high text-outline-variant cursor-not-allowed opacity-50'
          }`}
        >
          <Edit3 size={16} />
          <span>{t('process.edit_name')}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[15px] font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:scale-100 ${
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
          <span>{saveStatus === 'saving' ? t('process.saving') : saveStatus === 'saved' ? t('process.saved') : t('process.save_data')}</span>
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
          <span className="text-[15px] font-bold tracking-wide">
            {isOverDeleteZone ? t('process.release_to_delete') : t('process.drag_to_delete')}
          </span>
        </div>
      </div>

      <div 
        onContextMenu={onContextMenu}
        className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 flex flex-col flex-1"
      >
        <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1 relative">
          <div className="flex flex-row w-full min-w-[900px]">
            {/* COLUMN 1: ID (Static) */}
            <div className="flex flex-col w-[8%] shrink-0 relative">
              <div className="h-16 flex items-center px-6 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                {t('common.step_id')}
              </div>
              {steps.map((step, index) => {
                const isSelected = index === activeRowIndex;
                let rowBgClass = 'transition-colors duration-200 ';
                if (isSelected) {
                  rowBgClass += '!bg-blue-100/80 ';
                } else if (isShiftDrag && index === targetIndex) {
                  rowBgClass += '!bg-amber-100';
                } else {
                  rowBgClass += 'hover:bg-primary/5 ';
                }
                
                return (
                  <div key={`id-${step.id}`} className={`h-[72px] flex items-center px-6 border-b border-outline-variant/5 text-[15px] font-medium text-on-surface-variant ${rowBgClass}`} onClick={() => handleRowClick(index)}>
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                )
              })}
            </div>

            {/* COLUMN 2: Task Category/Name (Draggable via Reorder.Group) */}
            <div className="flex flex-col w-[40%] shrink-0 border-x border-outline-variant/10 relative">
              <div className="h-16 flex items-center px-4 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                {t('process.task_category_name')}
              </div>
              <Reorder.Group 
                ref={containerRef}
                axis="y" 
                values={displaySteps} 
                onReorder={handleReorder}
                className="flex flex-col w-full"
              >
                {displaySteps.map((step, index) => {
                  const isSelected = selectedStepId === step.id;
                  const isTarget = isShiftDrag && index === targetIndex && step.id !== draggingStepIdRef.current;
                  
                  let rowBgClass = 'transition-colors duration-200 ';
                  if (isSelected) {
                    rowBgClass += '!bg-blue-100/80 ';
                  } else if (isTarget) {
                    rowBgClass += '!bg-amber-100 !outline !outline-2 !outline-amber-400 !z-10 relative ';
                  } else {
                    rowBgClass += 'hover:bg-primary/5 ';
                  }

                  return (
                    <Reorder.Item 
                      key={step._uid || step.id} 
                      value={step}
                      data-step-id={step.id}
                      data-target-index={index}
                      onDragStart={(e) => handleDragStart(e, step.id, index)}
                      onDragEnd={(e, info) => handleDragEnd(e, info, step.id)}
                      onDrag={handleDrag}
                      onClick={() => setSelectedStepId(step.id === selectedStepId ? null : step.id)}
                      onDoubleClick={() => step.name && onJumpToTask(step.name)}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, step.id);
                      }}
                      className={`h-[72px] group relative z-0 cursor-pointer flex items-center px-4 border-b border-outline-variant/5 ${isSelected ? 'z-10' : ''} ${rowBgClass}`}
                    >

                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {isEditingName && isSelected ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="text-[15px] font-semibold text-on-surface whitespace-nowrap shrink-0">
                                {getCategoryLabel(step.category, t)} /
                              </span>
                              <input 
                                autoFocus
                                type="text"
                                defaultValue={step.name}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => handleNameEditComplete(e, step)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleNameEditComplete(e, step);
                                }}
                                className="flex-1 bg-surface-container-lowest border-2 border-primary rounded-lg px-3 py-1.5 text-[15px] font-bold outline-none shadow-lg animate-in zoom-in-95 duration-200"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[15px] font-semibold text-on-surface flex min-w-0">
                              <span className="shrink-0">{getCategoryLabel(step.category, t)}</span>
                              <span className="text-outline-variant font-normal">/</span>
                              <span className="truncate">
                                {step.name || <span className="text-outline-variant font-normal italic">{t('common.unnamed_step')}</span>}
                              </span>
                            </div>
                          )}
                        </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </div>

            {/* COLUMN 3: Success Jump (Static) */}
            <div className="flex flex-col w-[12%] shrink-0 relative">
              <div className="h-16 flex items-center px-6 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                {t('common.success_jump')}
              </div>
              {steps.map((step, index) => {
                const isSelected = index === activeRowIndex;
                let rowBgClass = 'transition-colors duration-200 ';
                if (isSelected) {
                  rowBgClass += '!bg-blue-100/80 ';
                } else if (isShiftDrag && index === targetIndex) {
                  rowBgClass += '!bg-amber-100';
                } else {
                  rowBgClass += 'hover:bg-primary/5 ';
                }
                
                return (
                  <div key={`sj-${step.id}`} className={`h-[72px] flex items-center px-6 border-b border-outline-variant/5 ${rowBgClass}`} onClick={() => handleRowClick(index)}>
                     <input 
                        key={`input-sj-${step.id}-${step.successJump || ''}`}
                        type="text"
                        defaultValue={step.successJump}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => onUpdateStep(step.id, { successJump: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-lg px-3 py-2 text-[15px] text-tertiary font-medium outline-none transition-all shadow-sm"
                      />
                  </div>
                )
              })}
            </div>

            {/* COLUMN 4: Failure Jump (Static) */}
            <div className="flex flex-col w-[12%] shrink-0 relative">
              <div className="h-16 flex items-center px-6 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                {t('common.failure_jump')}
              </div>
              {steps.map((step, index) => {
                 const isSelected = index === activeRowIndex;
                 let rowBgClass = 'transition-colors duration-200 ';
                 if (isSelected) {
                   rowBgClass += '!bg-blue-100/80 ';
                 } else if (isShiftDrag && index === targetIndex) {
                   rowBgClass += '!bg-amber-100';
                 } else {
                   rowBgClass += 'hover:bg-primary/5 ';
                 }
                 
                return (
                  <div key={`fj-${step.id}`} className={`h-[72px] flex items-center px-6 border-b border-outline-variant/5 ${rowBgClass}`} onClick={() => handleRowClick(index)}>
                     <input 
                        key={`input-fj-${step.id}-${step.failureJump || ''}`}
                        type="text"
                        defaultValue={step.failureJump}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => onUpdateStep(step.id, { failureJump: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-error/50 focus:ring-2 focus:ring-error/10 rounded-lg px-3 py-2 text-[15px] text-error font-medium outline-none transition-all shadow-sm"
                      />
                  </div>
                )
              })}
            </div>

            {/* COLUMN 5: Failure Tip (Static) */}
            <div className="flex flex-col w-[28%] shrink-0 relative">
              <div className="h-16 flex items-center px-6 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                {t('common.failure_tip')}
              </div>
              {steps.map((step, index) => {
                 const isSelected = index === activeRowIndex;
                 let rowBgClass = 'transition-colors duration-200 ';
                 if (isSelected) {
                   rowBgClass += '!bg-blue-100/80 ';
                 } else if (isShiftDrag && index === targetIndex) {
                   rowBgClass += '!bg-amber-100';
                 } else {
                   rowBgClass += 'hover:bg-primary/5 ';
                 }

                return (
                  <div key={`tip-${step.id}`} className={`h-[72px] flex items-center px-6 border-b border-outline-variant/5 ${rowBgClass}`} onClick={() => handleRowClick(index)}>
                     <input 
                        key={`input-tip-${step.id}-${step.failureTip || ''}`}
                        type="text"
                        defaultValue={step.failureTip}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => onUpdateStep(step.id, { failureTip: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-lg px-3 py-2 text-sm text-on-surface-variant italic outline-none transition-all shadow-sm"
                      />
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
