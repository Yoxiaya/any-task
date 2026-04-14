/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  LayoutTemplate
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

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [taskSteps, setTaskSteps] = useState<Record<string, TaskStep[]>>({});
  const [selectedTaskId, setSelectedTaskId] = useState('P-1001');
  const [isNewTaskMenuOpen, setIsNewTaskMenuOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<TaskStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateStepModalOpen, setIsCreateStepModalOpen] = useState(false);
  const [newTaskType, setNewTaskType] = useState<TaskType>('流程');
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
  });

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];
  const currentSteps = taskSteps[selectedTaskId] || [];

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
    setSelectedTaskId(newId);
  };

  const handleCreateStep = (newStepData: Omit<TaskStep, 'id'>) => {
    const currentTaskSteps = taskSteps[selectedTaskId] || [];
    const newId = (currentTaskSteps.length + 1).toString().padStart(2, '0');
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
    const newId = (currentTaskSteps.length + 1).toString().padStart(2, '0');
    const newStep: TaskStep = {
      id: newId,
      category: task.type === '顶级' ? 'TOP_LEVEL' : 'PROCESS',
      name: task.name,
      successJump: '',
      failureJump: '',
      failureTip: '',
    };
    setTaskSteps(prev => ({
      ...prev,
      [selectedTaskId]: [...currentTaskSteps, newStep]
    }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
    });
  };

  const currentNotes = taskNotes[selectedTaskId] || '';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Action Bar */}
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant/15 px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsNewTaskMenuOpen(!isNewTaskMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold shadow-sm hover:bg-primary-dim transition-colors"
            >
              <Plus size={18} />
              <span>新建任务</span>
              <ChevronDown size={14} />
            </button>
            
            <AnimatePresence>
              {isNewTaskMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsNewTaskMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl z-40 py-1"
                  >
                    <div className="py-1">
                      <button 
                        onClick={() => {
                          setNewTaskType('流程');
                          setIsCreateModalOpen(true);
                          setIsNewTaskMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <LayoutTemplate size={18} />
                        <span>流程任务</span>
                      </button>

                      <div className="relative group/sub">
                        <div className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer border-t border-outline-variant/10">
                          <div className="flex items-center gap-3">
                            <Layers size={18} />
                            <span>通用选项</span>
                          </div>
                          <ChevronRight size={14} />
                        </div>
                        
                        {/* Submenu */}
                        <div className="absolute left-full top-0 ml-0.5 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl py-1 hidden group-hover/sub:block">
                          <button 
                            onClick={() => {
                              setNewTaskType('定时');
                              setIsCreateModalOpen(true);
                              setIsNewTaskMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            <Clock size={18} />
                            <span>定时任务</span>
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors border-t border-outline-variant/10">
                            <CheckSquare size={18} />
                            <span>普通任务</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors">
            <FileUp size={18} />
            <span>导入任务</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors">
            <FileDown size={18} />
            <span>导出任务</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* User avatars removed */}
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
                任务目录
              </h2>
              <button className="text-primary hover:bg-primary/5 p-1 rounded transition-colors">
                <Filter size={18} />
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input 
                className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none" 
                placeholder="快速定位任务..." 
                type="text"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 bg-surface-container-high/90 backdrop-blur shadow-sm z-10">
                <tr>
                  <th className="px-2 py-3 w-8"></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-[25%]">ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-[50%]">任务名</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-[25%]">类型</th>
                </tr>
              </thead>
              <Reorder.Group 
                as="tbody" 
                axis="y" 
                values={tasks} 
                onReorder={setTasks}
                className="divide-y divide-outline-variant/10"
              >
                {tasks.map((task) => (
                  <Reorder.Item 
                    as="tr"
                    key={task.id}
                    value={task}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`hover:bg-primary/5 cursor-pointer transition-colors ${selectedTaskId === task.id ? 'bg-surface-container-lowest' : ''}`}
                  >
                    <td className="px-2 py-3.5 text-center">
                      <GripVertical size={18} className="text-outline-variant hover:text-primary cursor-grab active:cursor-grabbing transition-colors" />
                    </td>
                    <td className={`px-4 py-3.5 text-xs font-mono truncate ${selectedTaskId === task.id ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                      {task.id}
                    </td>
                    <td className={`px-4 py-3.5 text-xs truncate ${selectedTaskId === task.id ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                      {task.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${task.type === '顶级' ? 'bg-blue-100 text-blue-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {task.type}
                      </span>
                    </td>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </table>
          </div>
        </section>

        {/* Right Side: Dynamic Detail View */}
        {selectedTask.type === '流程' ? (
          <ProcessTaskDetail 
            selectedTask={selectedTask}
            steps={currentSteps}
            notes={currentNotes}
            onUpdateNotes={(value) => setTaskNotes(prev => ({ ...prev, [selectedTaskId]: value }))}
            onEditStep={handleEditStep}
            onContextMenu={handleContextMenu}
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
      </main>

      <EditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        step={editingStep}
        onSave={(updatedStep) => {
          setTaskSteps(prev => ({
            ...prev,
            [selectedTaskId]: (prev[selectedTaskId] || []).map(s => s.id === updatedStep.id ? updatedStep : s)
          }));
          setIsModalOpen(false);
        }}
      />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateTask}
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
      />
    </div>
  );
}
