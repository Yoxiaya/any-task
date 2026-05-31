/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileUp, 
  FileDown, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ListTodo,
  Globe,
  ArrowUp,
  Save,
  Play,
  Copy,
  ClipboardPaste
} from 'lucide-react';
import { TaskType, Task, TaskStep } from './types';
import EditModal from './components/EditModal';
import CreateTaskModal from './components/CreateTaskModal';
import CreateStepModal from './components/CreateStepModal';
import CascadingContextMenu from './components/CascadingContextMenu';
import ProcessTaskDetail from './components/ProcessTaskDetail';
import TopLevelTaskDetail from './components/TopLevelTaskDetail';
import ScheduledTaskDetail from './components/ScheduledTaskDetail';
import AddTaskMenu from './components/AddTaskMenu';
import { useTaskManagement } from './hooks/useTaskManagement';
import { useTaskStore } from './store/taskStore';
// 注释

export default function App() {
  const { t, i18n } = useTranslation();
  
  const {
    tasks,
    taskSteps,
    selectedTaskId,
    selectedTask,
    currentSteps,
    historyIndex,
    history,
    referencingTasks,
    navigateToTask,
    handleGoBack,
    handleGoForward,
    handleCreateTask,
    handleCreateStep,
    handleDeleteStep,
    handleUpdateStep,
    handleReorderSteps,
    handleAddEmptyRow,
    handleAddTaskFromMenu,
    updateTask,
  } = useTaskManagement();

  const [editingStep, setEditingStep] = useState<TaskStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateStepModalOpen, setIsCreateStepModalOpen] = useState(false);
  const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
  const [pendingPasteFile, setPendingPasteFile] = useState<File | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('流程');
  const { taskNotes, setTaskNote } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isUpLevelOpen, setIsUpLevelOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean; targetStepId?: string }>({
    x: 0,
    y: 0,
    isOpen: false,
  });

  const handleEditStep = (step: TaskStep) => {
    setEditingStep(step);
    setIsModalOpen(true);
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

  const handleJumpToTask = (taskName: string) => {
    const targetTask = tasks.find(t => t.name === taskName);
    if (targetTask) {
      navigateToTask(targetTask.id);
    }
  };

  const currentNotes = selectedTaskId ? (taskNotes[selectedTaskId] || '') : '';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (tasks.length > 0) {
      setIsImportConfirmModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await useTaskStore.getState().importTasks(file);
      e.target.value = ''; // reset
    }
  };

  const confirmImport = async () => {
    setIsImportConfirmModalOpen(false);
    if (pendingPasteFile) {
      await useTaskStore.getState().importTasks(pendingPasteFile);
      setPendingPasteFile(null);
    } else {
      fileInputRef.current?.click();
    }
  };

  const cancelImport = () => {
    setIsImportConfirmModalOpen(false);
    setPendingPasteFile(null);
  };


  const handleRunTask = async () => {
    try {
      const res = await fetch('/api/export');
      const allTasksData = await res.json();
      
      await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allTasksData)
      });
      alert(t('buttons.run_task') + ' 成功' );
    } catch (e) {
      console.error("Failed to run task:", e);
      alert(t('buttons.run_task') + ' 失败' );
    }
  };

  const handleCopyTasks = async () => {
    try {
      const res = await fetch('/api/export');
      const data = await res.json();
      const text = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(text);
      alert(t('buttons.copy_tasks') + ' 成功' );
    } catch (e) {
      console.error('Failed to copy tasks:', e);
      alert(t('buttons.copy_tasks') + ' 失败' );
    }
  };

  const handlePasteTasks = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            processPasteText(text);
            return;
          }
        } catch (e) {
          console.warn('Clipboard read error, falling back to modal', e);
        }
      }
      setIsPasteModalOpen(true);
      setPasteText('');
    } catch (e) {
      setIsPasteModalOpen(true);
      setPasteText('');
    }
  };

  const processPasteText = async (text: string) => {
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        const file = new File([text], 'clipboard.json', { type: 'application/json' });
        if (tasks.length > 0) {
          setPendingPasteFile(file);
          setIsImportConfirmModalOpen(true);
        } else {
          await useTaskStore.getState().importTasks(file);
        }
        setIsPasteModalOpen(false);
      } else {
        alert('粘贴板内容格式不正确，期望是一个数组');
      }
    } catch (e) {
      alert('粘贴板内容非法的 JSON 数据');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aIsTop = a.id === 'T-1001' || a.name === '顶级任务';
    const bIsTop = b.id === 'T-1001' || b.name === '顶级任务';
    if (aIsTop && !bIsTop) return -1;
    if (!aIsTop && bIsTop) return 1;
    return 0;
  });

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
                        className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-primary/10 transition-colors flex items-center gap-2"
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

          <button 
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
            onClick={handleRunTask}
          >
            <Play size={18} />
            <span>{t('buttons.run_task')}</span>
          </button>

          <button 
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
            onClick={handleCopyTasks}
          >
            <Copy size={18} />
            <span>{t('buttons.copy_tasks')}</span>
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
            onClick={handlePasteTasks}
          >
            <ClipboardPaste size={18} />
            <span>{t('buttons.paste_tasks')}</span>
          </button>

          <input type="file" title={t('buttons.import', 'import')} className="hidden" ref={fileInputRef} accept=".json" onChange={handleFileChange} />
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
            onClick={handleImportClick}
          >
            <FileUp size={18} />
            <span>{t('buttons.import')}</span>
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
            onClick={() => {
              useTaskStore.getState().exportTasks();
            }}
          >
            <FileDown size={18} />
            <span>{t('buttons.export')}</span>
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
            onClick={() => {
              useTaskStore.getState().exportTasksAs();
            }}
          >
            <Save size={18} />
            <span>{t('buttons.save_as')}</span>
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
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" />
              <input 
                className="w-full pl-9 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm focus:ring-1 focus:ring-primary/30 outline-none relative z-10" 
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
              {isSearchDropdownOpen && searchQuery.trim() !== '' && sortedTasks.filter(task => 
                task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.type.toLowerCase().includes(searchQuery.toLowerCase())
              ).length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/20 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                  {sortedTasks.filter(task => 
                    task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.type.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(task => (
                    <div 
                      key={task.id}
                      className="px-4 py-2 text-sm hover:bg-primary/10 cursor-pointer text-on-surface truncate"
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
                  <th className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[25%]">{t('sidebar.id')}</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[50%]">{t('sidebar.task_name')}</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[25%]">{t('sidebar.type')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {sortedTasks.map((task) => (
                  <tr 
                    key={task.id}
                    onClick={() => navigateToTask(task.id)}
                    className={`hover:bg-primary/5 cursor-pointer transition-colors ${selectedTaskId === task.id ? 'bg-surface-container-lowest' : ''}`}
                  >
                    <td className={`px-4 py-4 text-sm font-mono truncate ${selectedTaskId === task.id ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                      {task.id}
                    </td>
                    <td className={`px-4 py-4 text-sm truncate ${selectedTaskId === task.id ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                      {task.name}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-[11px] font-bold rounded ${(task.id === 'T-1001' || task.name === '顶级任务') ? 'bg-blue-100 text-blue-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
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
          {selectedTask ? (
            selectedTask.type === '流程' ? (
              <ProcessTaskDetail 
                selectedTask={selectedTask}
                steps={currentSteps}
                notes={currentNotes}
                onUpdateNotes={(value) => setTaskNote(selectedTaskId, value)}
                onEditStep={handleEditStep}
                onContextMenu={handleContextMenu}
                onReorderSteps={(newSteps) => handleReorderSteps(selectedTaskId, newSteps)}
                onDeleteStep={(stepId) => handleDeleteStep(selectedTaskId, stepId)}
                onUpdateStep={(stepId, updates) => handleUpdateStep(selectedTaskId, stepId, updates)}
                onJumpToTask={handleJumpToTask}
              />
            ) : selectedTask.type === '定时' ? (
              <ScheduledTaskDetail 
                selectedTask={selectedTask} 
                tasks={tasks} 
                onSave={updateTask}
              />
            ) : (
              <TopLevelTaskDetail selectedTask={selectedTask} />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-on-surface-variant/50">
              {tasks.length === 0 ? 'Loading tasks...' : 'No task selected'}
            </div>
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
        onConfirm={(name) => handleCreateTask(name, newTaskType)}
        existingTasks={tasks}
        taskType={newTaskType}
      />

      <CreateStepModal 
        isOpen={isCreateStepModalOpen}
        onClose={() => setIsCreateStepModalOpen(false)}
        onConfirm={(step) => handleCreateStep(selectedTaskId, step)}
      />

      <CascadingContextMenu 
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        tasks={tasks}
        onSelectTask={(task) => handleAddTaskFromMenu(selectedTaskId, task, contextMenu.targetStepId)}
        onAddEmptyRow={() => handleAddEmptyRow(selectedTaskId)}
        onDeleteRow={() => {
          if (contextMenu.targetStepId) {
            handleDeleteStep(selectedTaskId, contextMenu.targetStepId);
          }
        }}
        hasTarget={!!contextMenu.targetStepId}
      />

      {isImportConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-2xl w-full max-w-sm border border-outline-variant/20 shadow-xl">
            <h3 className="text-xl font-bold text-on-surface mb-2">确认导入</h3>
            <p className="text-on-surface-variant font-medium mb-6">导入任务之后会覆盖当前所有任务，确定导入吗？</p>
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-medium transition-colors"
                onClick={cancelImport}
              >
                取消
              </button>
              <button 
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-px transition-all"
                onClick={confirmImport}
              >
                确定导入
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-2xl w-full max-w-lg border border-outline-variant/20 shadow-xl">
            <h3 className="text-xl font-bold text-on-surface mb-4">粘贴 JSON 导入</h3>
            <textarea
              className="w-full h-64 p-3 bg-surface-container text-on-surface rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm custom-scrollbar resize-none mb-6"
              placeholder="在此粘贴任务数据的 JSON..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-medium transition-colors"
                onClick={() => setIsPasteModalOpen(false)}
              >
                取消
              </button>
              <button 
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-px transition-all disabled:opacity-50"
                disabled={!pasteText.trim()}
                onClick={() => processPasteText(pasteText)}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
