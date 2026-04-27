import { useState } from 'react';
import { Task, TaskStep, TaskType } from '../types';
import { generateNextTaskId, generateNextStepId } from '../utils';

export function useTaskManagement(initialTasks: Task[], initialSteps: Record<string, TaskStep[]>) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskSteps, setTaskSteps] = useState<Record<string, TaskStep[]>>(initialSteps);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTasks[0]?.id || '');
  const [history, setHistory] = useState<string[]>([initialTasks[0]?.id || '']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];
  const currentSteps = selectedTaskId ? (taskSteps[selectedTaskId] || []) : [];

  const referencingTasks = tasks.filter(t => {
    const steps = taskSteps[t.id] || [];
    return steps.some(step => step.name === selectedTask?.name);
  });

  const navigateToTask = (taskId: string) => {
    if (!taskId || taskId === history[historyIndex]) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(taskId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSelectedTaskId(taskId);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setSelectedTaskId(history[prev]);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setSelectedTaskId(history[next]);
    }
  };

  const handleCreateTask = (name: string, type: TaskType) => {
    const newId = generateNextTaskId(tasks, type);
    const newTask: Task = { id: newId, name, type };
    setTasks([newTask, ...tasks]);
    navigateToTask(newId);
  };

  const handleCreateStep = (taskId: string, newStepData: Omit<TaskStep, 'id'>) => {
    const currentTaskSteps = taskSteps[taskId] || [];
    const newId = generateNextStepId(currentTaskSteps);
    const newStep: TaskStep = { id: newId, ...newStepData };
    setTaskSteps(prev => ({ ...prev, [taskId]: [...currentTaskSteps, newStep] }));
  };

  const handleDeleteStep = (taskId: string, stepId: string) => {
    setTaskSteps(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).filter(s => s.id !== stepId)
    }));
  };

  const handleUpdateStep = (taskId: string, stepId: string, updates: Partial<TaskStep>) => {
    let tasksUpdated = false;
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
          const newId = generateNextTaskId(prevTasks, newTaskType);
          const newTask: Task = { id: newId, name: updates.name as string, type: newTaskType };
          tasksUpdated = true;
          return [newTask, ...prevTasks];
        }
        return prevTasks;
      });
    }

    setTaskSteps(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(s => s.id === stepId ? { ...s, ...updates } : s)
    }));
    
    return tasksUpdated;
  };

  const handleReorderSteps = (taskId: string, newSteps: TaskStep[]) => {
    setTaskSteps(prev => ({ ...prev, [taskId]: newSteps }));
  };

  const handleAddEmptyRow = (taskId: string) => {
    const currentTaskSteps = taskSteps[taskId] || [];
    const newId = generateNextStepId(currentTaskSteps);
    const newStep: TaskStep = {
      id: newId, category: '-', name: '', successJump: '', failureJump: '', failureTip: '',
    };
    setTaskSteps(prev => ({ ...prev, [taskId]: [...currentTaskSteps, newStep] }));
  };

  const handleAddTaskFromMenu = (taskId: string, task: Task, targetStepId?: string) => {
    const currentTaskSteps = taskSteps[taskId] || [];
    if (targetStepId) {
      setTaskSteps(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || []).map(s => 
          s.id === targetStepId 
            ? { ...s, category: task.type, name: task.name, successJump: '', failureJump: '', failureTip: '' } 
            : s
        )
      }));
    } else {
      const newId = generateNextStepId(currentTaskSteps);
      const newStep: TaskStep = {
        id: newId, category: task.type, name: task.name, successJump: '', failureJump: '', failureTip: '',
      };
      setTaskSteps(prev => ({ ...prev, [taskId]: [...currentTaskSteps, newStep] }));
    }
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  return {
    tasks,
    taskSteps,
    selectedTaskId,
    selectedTask,
    currentSteps,
    history,
    historyIndex,
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
  };
}
