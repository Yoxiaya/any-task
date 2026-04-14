import React, { useState } from 'react';
import { Task, TaskType } from '../types';
import { Settings, ChevronRight } from 'lucide-react';

interface ScheduledTaskDetailProps {
  selectedTask: Task;
  tasks: Task[];
  onSave: (updatedTask: Task) => void;
}

export default function ScheduledTaskDetail({ selectedTask, tasks, onSave }: ScheduledTaskDetailProps) {
  const [mode, setMode] = useState<'open' | 'close' | 'close_all'>(selectedTask.scheduledConfig?.mode || 'close');
  const [cycle, setCycle] = useState<number>(selectedTask.scheduledConfig?.cycle || 1000);
  const [taskName, setTaskName] = useState(selectedTask.name);
  const [selectedTargetTask, setSelectedTargetTask] = useState<Task | null>(
    tasks.find(t => t.id === selectedTask.scheduledConfig?.targetTaskId) || null
  );
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when selectedTask changes
  React.useEffect(() => {
    setMode(selectedTask.scheduledConfig?.mode || 'close');
    setCycle(selectedTask.scheduledConfig?.cycle || 1000);
    setTaskName(selectedTask.name);
    setSelectedTargetTask(tasks.find(t => t.id === selectedTask.scheduledConfig?.targetTaskId) || null);
  }, [selectedTask, tasks]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate a brief save animation
    setTimeout(() => {
      onSave({
        ...selectedTask,
        name: taskName,
        scheduledConfig: {
          mode,
          cycle,
          targetTaskId: selectedTargetTask?.id
        }
      });
      setIsSaving(false);
    }, 500);
  };

  const taskTypes: TaskType[] = ['顶级', '流程', '定时'];
  const tasksByType = taskTypes.reduce((acc, type) => {
    acc[type] = tasks.filter(t => t.type === type);
    return acc;
  }, {} as Record<TaskType, Task[]>);

  return (
    <section className="flex-1 bg-background overflow-hidden p-8 flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
          {selectedTask.name} <span className="text-primary text-lg ml-2">#{selectedTask.id}</span>
        </h1>
        <p className="text-on-surface-variant max-w-2xl">
          打开任务不要重复运行，否则定时任务的运行时间会被重新计算，一般放到初始化任务中即可
        </p>
      </div>

      <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Settings size={20} className="text-primary" />
            调度配置
          </h3>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-sm hover:bg-primary-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              '保存配置'
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-3xl">
          {/* 1. 模式 */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">模式</label>
            <div className="flex items-center gap-6">
              {[
                { id: 'open', label: '打开' },
                { id: 'close', label: '关闭' },
                { id: 'close_all', label: '全部关闭' }
              ].map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={mode === opt.id}
                    onChange={() => setMode(opt.id as any)}
                    className="w-4 h-4 text-primary border-outline-variant focus:ring-primary/20"
                  />
                  <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. 名称 */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">名称</label>
            <input 
              type="text" 
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="输入任务名称"
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            />
          </div>

          {/* 3. 运行周期 */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">运行周期 (ms)</label>
            <div className="flex flex-wrap items-center gap-4">
              {[50, 100, 200, 250, 500, 1000, 10000].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="cycle" 
                    checked={cycle === val}
                    onChange={() => setCycle(val)}
                    className="w-4 h-4 text-primary border-outline-variant focus:ring-primary/20"
                  />
                  <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{val}ms</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. 定时任务 (级联单选) */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">定时任务 (目标)</label>
            <div className="relative">
              <button 
                onClick={() => setIsTaskMenuOpen(!isTaskMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-all"
              >
                <span>{selectedTargetTask ? `${selectedTargetTask.name} (${selectedTargetTask.id})` : '选择目标任务...'}</span>
                <ChevronRight size={16} className={`transition-transform ${isTaskMenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {isTaskMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsTaskMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                    {taskTypes.map((type) => (
                      <div key={type} className="relative group/sub">
                        <div className="flex items-center justify-between px-4 py-2 text-sm text-on-surface hover:bg-primary/5 hover:text-primary cursor-default transition-colors">
                          <span className="font-bold">{type}任务</span>
                          <ChevronRight size={14} />
                        </div>
                        
                        {/* Submenu */}
                        <div className="absolute left-full top-0 ml-1 w-64 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl py-2 hidden group-hover/sub:block max-h-64 overflow-y-auto custom-scrollbar">
                          {tasksByType[type].length > 0 ? (
                            tasksByType[type].map((task) => (
                              <button
                                key={task.id}
                                onClick={() => {
                                  setSelectedTargetTask(task);
                                  setIsTaskMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors flex flex-col"
                              >
                                <span className="font-semibold">{task.name}</span>
                                <span className="text-[10px] text-on-surface-variant">ID: {task.id}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-xs text-on-surface-variant italic">暂无任务</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
