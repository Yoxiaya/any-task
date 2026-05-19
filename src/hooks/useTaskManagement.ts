import { useEffect } from 'react';
import { Task, TaskStep, TaskType } from '../types';
import { generateNextTaskId, generateNextStepId } from '../utils';
import { useTaskStore } from '../store/taskStore';

export function useTaskManagement() {
  const {
    tasks,
    taskSteps,
    selectedTaskId,
    history,
    historyIndex,
    fetchTasks,
    setTasks,
    setTaskSteps,
    navigateToTask: storeNavigateToTask,
    handleGoBack: storeHandleGoBack,
    handleGoForward: storeHandleGoForward,
  } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];
  const currentSteps = selectedTaskId ? (taskSteps[selectedTaskId] || []) : [];

  const referencingTasks = tasks.filter(t => {
    const steps = taskSteps[t.id] || [];
    return steps.some(step => step.name === selectedTask?.name);
  });

  const navigateToTask = storeNavigateToTask;
  const handleGoBack = storeHandleGoBack;
  const handleGoForward = storeHandleGoForward;

  const handleCreateTask = (name: string, type: TaskType) => {
    const newId = generateNextTaskId(tasks, type);
    const newTask: Task = { id: newId, name, type };
    setTasks([newTask, ...tasks]);
    navigateToTask(newId);
  };

  const handleCreateStep = (taskId: string, newStepData: Omit<TaskStep, 'id'>) => {
    const currentTaskSteps = taskSteps[taskId] || [];
    const newId = generateNextStepId(currentTaskSteps);
    const newStep: TaskStep = { id: newId, ...newStepData, _uid: Math.random().toString(36).substr(2, 9) };
    setTaskSteps(taskId, [...currentTaskSteps, newStep]);
  };

  const handleDeleteStep = (taskId: string, stepId: string) => {
    const currentStepsForTask = taskSteps[taskId] || [];
    setTaskSteps(taskId, currentStepsForTask.filter(s => s.id !== stepId));
  };

  const handleUpdateStep = (taskId: string, stepId: string, updates: Partial<TaskStep>) => {
    let tasksUpdated = false;
    let newTasks = [...tasks];
    if (updates.name && updates.name.trim() !== '') {
      const taskExists = newTasks.some(t => t.name === updates.name);
      if (!taskExists) {
        const step = (taskSteps[taskId] || []).find(s => s.id === stepId);
        const category = updates.category || (step?.category ?? '-');
        let newTaskType: TaskType = '流程';
        if (category === '顶级' || category === '流程' || category === '定时') {
          newTaskType = category as TaskType;
        }
        const newId = generateNextTaskId(newTasks, newTaskType);
        const newTask: Task = { id: newId, name: updates.name as string, type: newTaskType };
        tasksUpdated = true;
        newTasks = [newTask, ...newTasks];
        setTasks(newTasks);
      }
    }

    const currentStepsForTask = taskSteps[taskId] || [];
    setTaskSteps(taskId, currentStepsForTask.map(s => s.id === stepId ? { ...s, ...updates } : s));
    
    return tasksUpdated;
  };

  const handleReorderSteps = (taskId: string, newSteps: TaskStep[]) => {
    setTaskSteps(taskId, newSteps);
  };

  const handleAddEmptyRow = (taskId: string) => {
    const currentTaskSteps = taskSteps[taskId] || [];
    const newId = generateNextStepId(currentTaskSteps);
    const newStep: TaskStep = {
      id: newId, category: '-', name: '', successJump: '', failureJump: '', failureTip: '',
      _uid: Math.random().toString(36).substr(2, 9)
    };
    setTaskSteps(taskId, [...currentTaskSteps, newStep]);
  };

  const handleAddTaskFromMenu = (taskId: string, task: Task, targetStepId?: string) => {
    const currentTaskSteps = taskSteps[taskId] || [];
    if (targetStepId) {
      setTaskSteps(taskId, currentTaskSteps.map(s => 
        s.id === targetStepId 
          ? { ...s, category: task.type, name: task.name, successJump: '', failureJump: '', failureTip: '' } 
          : s
      ));
    } else {
      const newId = generateNextStepId(currentTaskSteps);
      const newStep: TaskStep = {
        id: newId, category: task.type, name: task.name, successJump: '', failureJump: '', failureTip: '',
        _uid: Math.random().toString(36).substr(2, 9)
      };
      setTaskSteps(taskId, [...currentTaskSteps, newStep]);
    }
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
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
