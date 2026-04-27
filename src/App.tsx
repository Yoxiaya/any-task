/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  FileUp, 
  FileDown, 
  Search, 
  Filter, 
  GripVertical, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ListTodo,
  CheckSquare,
  Clock,
  Layers,
  LayoutTemplate,
  Globe,
  ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { MOCK_TASKS, MOCK_STEPS } from './constants';
import { TaskType, Task, TaskStep } from './types';
import EditModal from './components/EditModal';
import CreateTaskModal from './components/CreateTaskModal';
import CreateStepModal from './components/CreateStepModal';
import CascadingContextMenu from './components/CascadingContextMenu';
import ProcessTaskDetail from './components/ProcessTaskDetail';
import TopLevelTaskDetail from './components/TopLevelTaskDetail';
import ScheduledTaskDetail from './components/ScheduledTaskDetail';
import AddTaskMenu from './components/AddTaskMenu';

export default function App() {
  const { t, i18n } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [taskSteps, setTaskSteps] = useState<Record<string, TaskStep[]>>({});
  const [selectedTaskId, setSelectedTaskId] = useState('P-1001');
  const [history, setHistory] = useState<string[]>(['P-1001']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [editingStep, setEditingStep] = useState<TaskStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateStepModalOpen, setIsCreateStepModalOpen] = useState(false);
  const [newTaskType, setNewTaskType] = useState<TaskType>('流程');
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isUpLevelOpen, setIsUpLevelOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean; targetStepId?: string }>({
    x: 0,
    y: 0,
    isOpen: false,
  });

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];
  const currentSteps = taskSteps[selectedTaskId] || [];

  const referencingTasks = tasks.filter(t => {
    const steps = taskSteps[t.id] || [];
    return steps.some(step => step.name === selectedTask.name);
  });

  const navigateToTask = (taskId: string) => {
    if (taskId === history[historyIndex]) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(taskId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSelectedTaskId(taskId);
    setIsUpLevelOpen(false);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setSelectedTaskId(history[prev]);
      setIsUpLevelOpen(false);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setSelectedTaskId(history[next]);
      setIsUpLevelOpen(false);
    }
  };

  const handleEditStep = (step: TaskStep) => {
    setEditingStep(step);
    setIsModalOpen(true);
  };

  const handleCreateTask = (name: string) => {
    const prefix = newTaskType === '流程' ? 'P' : newTaskType === '定时' ? 'S' : 'T';
    const newId = `${prefix}-${2000 + tasks.length + 1}`;
    const newTask: Task = {
      id: newId,
      name,
      type: newTaskType,
    };
    setTasks([newTask, ...tasks]);
    navigateToTask(newId);
  };

  const handleCreateStep = (newStepData: Omit<TaskStep, 'id'>) => {
    const currentTaskSteps = taskSteps[selectedTaskId] || [];
    const maxId = currentTaskSteps.reduce((max, step) => {
      const num = parseInt(step.id, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const newId = (maxId + 1).toString().padStart(2, '0');
    const newStep: TaskStep = {
      id: newId,
      ...newStepData,
    };
    setTaskSteps(prev => ({
      ...prev,
      [selectedTaskId]: [...currentTaskSteps, newStep]
    }));
  };

  const handleAddTaskFromMenu = (task: Task) => {
    const currentTaskSteps = taskSteps[selectedTaskId] || [];
    
    if (contextMenu.targetStepId) {
      // Replace logic
      setTaskSteps(prev => ({
        ...prev,
        [selectedTaskId]: (prev[selectedTaskId] || []).map(s => 
          s.id === contextMenu.targetStepId 
            ? { 
                ...s, 
                category: task.type,
                name: task.name,
                successJump: '',
                failureJump: '',
                failureTip: '',
              } 
            : s
        )
      }));
    } else {
      // Add logic
      const maxId = currentTaskSteps.reduce((max, step) => {
        const num = parseInt(step.id, 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newId = (maxId + 1).toString().padStart(2, '0');
      const newStep: TaskStep = {
        id: newId,
        category: task.type,
        name: task.name,
        successJump: '',
        failureJump: '',
        failureTip: '',
      };
      setTaskSteps(prev => ({
        ...prev,
        [selectedTaskId]: [...currentTaskSteps, newStep]
      }));
    }
  };

  const handleAddEmptyRow = () => {
    const currentTaskSteps = taskSteps[selectedTaskId] || [];
    const maxId = currentTaskSteps.reduce((max, step) => {
      const num = parseInt(step.id, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const newId = (maxId + 1).toString().padStart(2, '0');
    const newStep: TaskStep = {
      id: newId,
      category: '-',
      name: '',
      successJump: '',
      failureJump: '',
      failureTip: '',
    };
    setTaskSteps(prev => ({
      ...prev,
      [selectedTaskId]: [...currentTaskSteps, newStep]
    }));
  };

  const handleContextMenu = (e: React.MouseEvent, stepId?: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      targetStepId: stepId,
    });
  };

  const handleDeleteStep = (stepId: string) => {
    setTaskSteps(prev => ({
      ...prev,
      [selectedTaskId]: (prev[selectedTaskId] || []).filter(s => s.id !== stepId)
    }));
  };

  const handleUpdateStep = (taskId: string, stepId: string, updates: Partial<TaskStep>) => {
    if (updates.name && updates.name.trim() !== '') {
      setTasks(prevTasks => {
        const taskExists = prevTasks.some(t => t.name === updates.name);
        if (!taskExists) {
          const step = (taskSteps[taskId] || []).find(s => s.id === stepId);
          const category = updates.category || (step?.category ?? '-');
          let newTaskType: TaskType = '流程';
          if (category === '顶级' || category === '流程' || category === '定时') {
            newTaskType = category as TaskType;
          }
          
          const prefix = newTaskType === '流程' ? 'P' : newTaskType === '定时' ? 'S' : 'T';
          const maxIdNum = prevTasks.reduce((max, t) => {
            const num = parseInt(t.id.split('-')[1], 10);
            return isNaN(num) ? max : Math.max(max, num);
          }, 2000);
          const newId = `${prefix}-${maxIdNum + 1}`;
          
          const newTask: Task = {
            id: newId,
            name: updates.name as string,
            type: newTaskType,
          };
          return [newTask, ...prevTasks];
        }
        return prevTasks;
      });
    }

    setTaskSteps(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(s => s.id === stepId ? { ...s, ...updates } : s)
    }));
  };

  const handleJumpToTask = (taskName: string) => {
    const targetTask = tasks.find(t => t.name === taskName);
    if (targetTask) {
      navigateToTask(targetTask.id);
    }
  };

  const currentNotes = taskNotes[selectedTaskId] || '';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Action Bar */}
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant/15 px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 mr-2 pr-4 border-r border-outline-variant/20">
            <button 
              onClick={handleGoBack}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-md transition-colors ${historyIndex <= 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-surface-container-high text-on-surface'}`}
              title={t('common.go_back', '回退')}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={handleGoForward}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-md transition-colors ${historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-surface-container-high text-on-surface'}`}
              title={t('common.go_forward', '前进')}
            >
              <ChevronRight size={18} />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsUpLevelOpen(!isUpLevelOpen)}
                onBlur={() => setTimeout(() => setIsUpLevelOpen(false), 200)}
                disabled={referencingTasks.length === 0}
                className={`p-1.5 rounded-md transition-colors ml-1 flex items-center gap-1 ${referencingTasks.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-surface-container-high text-on-surface'}`}
                title={t('common.up_level', '上一级')}
              >
                <ArrowUp size={16} />
              </button>
              
              {isUpLevelOpen && referencingTasks.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-surface-container-highest border border-outline-variant/20 rounded-lg shadow-xl py-1 z-50 overflow-hidden">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 bg-surface-container-highest">
                    {t('common.referenced_tasks', '引用的任务')}
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {referencingTasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => navigateToTask(t.id)}
                        className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-primary/10 transition-colors flex items-center gap-2"
                      >
                        <span className="font-mono text-primary font-bold">{t.id}</span>
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <AddTaskMenu onAddTask={(type) => {
            setNewTaskType(type);
            setIsCreateModalOpen(true);
          }} />

          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors">
            <FileUp size={18} />
            <span>{t('buttons.import')}</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors">
            <FileDown size={18} />
            <span>{t('buttons.export')}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors">
              <Globe size={16} />
              <span>{i18n.language === 'zh' ? '中文' : 'English'}</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-surface-container-lowest border border-outline-variant/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <button 
                onClick={() => i18n.changeLanguage('zh')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${i18n.language === 'zh' ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'}`}
              >
                中文
              </button>
              <button 
                onClick={() => i18n.changeLanguage('en')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${i18n.language === 'en' ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'}`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Task List */}
        <section className="w-[23%] min-w-[320px] bg-surface-container-low flex flex-col border-r border-outline-variant/15">
          <div className="p-6 shrink-0 border-b border-outline-variant/15">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                <ListTodo size={18} className="text-primary" />
                {t('sidebar.task_directory')}
              </h2>
              <button className="text-primary hover:bg-primary/5 p-1 rounded transition-colors">
                <Filter size={18} />
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" />
              <input 
                className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none relative z-10" 
                placeholder={t('sidebar.search_placeholder')} 
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchDropdownOpen(false), 200)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
              />
              {isSearchDropdownOpen && searchQuery.trim() !== '' && tasks.filter(task => 
                task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.type.toLowerCase().includes(searchQuery.toLowerCase())
              ).length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/20 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                  {tasks.filter(task => 
                    task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.type.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(task => (
                    <div 
                      key={task.id}
                      className="px-3 py-2 text-xs hover:bg-primary/10 cursor-pointer text-on-surface truncate"
                      onClick={() => {
                        setSearchQuery(task.name);
                        navigateToTask(task.id);
                        setIsSearchDropdownOpen(false);
                      }}
                    >
                      <span className="font-bold mr-2">{task.id}</span>
                      {task.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 bg-surface-container-high/90 backdrop-blur shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-[25%]">{t('sidebar.id')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-[50%]">{t('sidebar.task_name')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-[25%]">{t('sidebar.type')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {tasks.map((task) => (
                  <tr 
                    key={task.id}
                    onClick={() => navigateToTask(task.id)}
                    className={`hover:bg-primary/5 cursor-pointer transition-colors ${selectedTaskId === task.id ? 'bg-surface-container-lowest' : ''}`}
                  >
                    <td className={`px-4 py-3.5 text-xs font-mono truncate ${selectedTaskId === task.id ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                      {task.id}
                    </td>
                    <td className={`px-4 py-3.5 text-xs truncate ${selectedTaskId === task.id ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                      {task.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${task.type === '顶级' ? 'bg-blue-100 text-blue-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {task.type === '流程' ? t('task_type.process') : task.type === '定时' ? t('task_type.scheduled') : t('task_type.top_level')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Side: Dynamic Detail View */}
        <div key={selectedTaskId} className="flex-1 flex overflow-hidden">
          {selectedTask.type === '流程' ? (
            <ProcessTaskDetail 
              selectedTask={selectedTask}
              steps={currentSteps}
              notes={currentNotes}
              onUpdateNotes={(value) => setTaskNotes(prev => ({ ...prev, [selectedTaskId]: value }))}
              onEditStep={handleEditStep}
              onContextMenu={handleContextMenu}
              onReorderSteps={(newSteps) => {
                setTaskSteps(prev => ({
                  ...prev,
                  [selectedTaskId]: newSteps
                }));
              }}
              onDeleteStep={handleDeleteStep}
              onUpdateStep={(stepId, updates) => handleUpdateStep(selectedTaskId, stepId, updates)}
              onJumpToTask={handleJumpToTask}
            />
          ) : selectedTask.type === '定时' ? (
            <ScheduledTaskDetail 
              selectedTask={selectedTask} 
              tasks={tasks} 
              onSave={(updatedTask) => {
                setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
              }}
            />
          ) : (
            <TopLevelTaskDetail selectedTask={selectedTask} />
          )}
        </div>
      </main>

      <EditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        step={editingStep}
        onSave={(updatedStep) => {
          handleUpdateStep(selectedTaskId, updatedStep.id, updatedStep);
          setIsModalOpen(false);
        }}
      />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateTask}
        existingTasks={tasks}
        taskType={newTaskType}
      />

      <CreateStepModal 
        isOpen={isCreateStepModalOpen}
        onClose={() => setIsCreateStepModalOpen(false)}
        onConfirm={handleCreateStep}
      />

      <CascadingContextMenu 
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        tasks={tasks}
        onSelectTask={handleAddTaskFromMenu}
        onAddEmptyRow={handleAddEmptyRow}
        onDeleteRow={() => {
          if (contextMenu.targetStepId) {
            handleDeleteStep(contextMenu.targetStepId);
          }
        }}
        hasTarget={!!contextMenu.targetStepId}
      />
    </div>
  );
}
