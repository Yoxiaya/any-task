import { create } from 'zustand';
import { Task, TaskStep, TaskType } from '../types';

interface TaskStore {
  tasks: Task[];
  taskSteps: Record<string, TaskStep[]>;
  taskNotes: Record<string, string>;
  selectedTaskId: string;
  history: string[];
  historyIndex: number;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchTaskSteps: (taskId: string) => Promise<void>;
  fetchTaskNote: (taskId: string) => Promise<void>;
  fetchDataForTask: (taskId: string) => Promise<void>;
  
  setSelectedTaskId: (id: string) => void;
  navigateToTask: (id: string) => void;
  handleGoBack: () => void;
  handleGoForward: () => void;
  exportTasks: () => Promise<void>;
  
  // Modifiers (in a real app these might also PATCH to server, but here we just update local state if it's not strictly required yet, or we don't since the API doc doesn't have POST/PUT endpoints)
  setTasks: (tasks: Task[]) => void;
  setTaskSteps: (taskId: string, steps: TaskStep[]) => void;
  setTaskNote: (taskId: string, note: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  taskSteps: {},
  taskNotes: {},
  selectedTaskId: '',
  history: [],
  historyIndex: 0,

  fetchTasks: async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      set({ tasks: data });
      
      const currentSelected = get().selectedTaskId;
      const taskExists = data.some((t: Task) => t.id === currentSelected);

      if (data.length > 0) {
        if (!currentSelected || !taskExists) {
          get().navigateToTask(data[0].id);
        }
      } else {
        set({ selectedTaskId: '' });
      }
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    }
  },

  fetchTaskSteps: async (taskId: string) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/steps`);
      const data = await res.json();
      set(state => ({
        taskSteps: { ...state.taskSteps, [taskId]: data }
      }));
    } catch (e) {
      console.error("Failed to fetch steps for", taskId, e);
    }
  },

  fetchTaskNote: async (taskId: string) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/note`);
      const data = await res.json();
      set(state => ({
        taskNotes: { ...state.taskNotes, [taskId]: data.note || '' }
      }));
    } catch (e) {
      console.error("Failed to fetch note for", taskId, e);
    }
  },

  fetchDataForTask: async (taskId: string) => {
    if (!taskId) return;
    await Promise.all([
      get().fetchTaskSteps(taskId),
      get().fetchTaskNote(taskId)
    ]);
  },

  setSelectedTaskId: (id: string) => {
    set({ selectedTaskId: id });
    get().fetchDataForTask(id);
  },

  navigateToTask: (taskId: string) => {
    const { history, historyIndex, selectedTaskId } = get();
    if (!taskId || taskId === history[historyIndex]) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(taskId);
    
    set({ 
      history: newHistory, 
      historyIndex: newHistory.length - 1,
      selectedTaskId: taskId 
    });
    get().fetchDataForTask(taskId);
  },

  handleGoBack: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      const taskId = history[prev];
      set({ historyIndex: prev, selectedTaskId: taskId });
      get().fetchDataForTask(taskId);
    }
  },

  handleGoForward: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      const taskId = history[next];
      set({ historyIndex: next, selectedTaskId: taskId });
      get().fetchDataForTask(taskId);
    }
  },

  exportTasks: async () => {
    try {
      const res = await fetch('/api/export');
      const data = await res.json();
      console.log('Export Tasks:', data);
    } catch (e) {
      console.error("Failed to fetch exported tasks", e);
    }
  },

  setTasks: (tasks) => set({ tasks }),
  
  setTaskSteps: (taskId, steps) => set(state => ({
    taskSteps: { ...state.taskSteps, [taskId]: steps }
  })),

  setTaskNote: (taskId, note) => set(state => ({
    taskNotes: { ...state.taskNotes, [taskId]: note }
  }))
}));
