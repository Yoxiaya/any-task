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
  exportTasksAs: () => Promise<void>;
  importTasks: (file: File) => Promise<void>;
  
  // Modifiers 
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setTaskSteps: (taskId: string, steps: TaskStep[]) => Promise<void>;
  setTaskNote: (taskId: string, note: string) => Promise<void>;
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
      if (!res.ok) throw new Error('API Error');
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
      if (!res.ok) throw new Error('API Error');
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
      if (!res.ok) throw new Error('API Error');
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
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'any-task-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to fetch exported tasks", e);
    }
  },

  exportTasksAs: async () => {
    try {
      const res = await fetch('/api/export');
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: 'any-task-export.json',
            types: [{
              description: 'JSON File',
              accept: { 'application/json': ['.json'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error("Failed to save file using picker", err);
          }
          return;
        }
      }
      
      // Fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'any-task-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to fetch exported tasks", e);
    }
  },

  importTasks: async (file: File) => {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importedData)
      });
      if (!res.ok) throw new Error('API Error');
      
      await get().fetchTasks();
      const selectedId = get().selectedTaskId;
      if (selectedId) {
        await get().fetchDataForTask(selectedId);
      }
    } catch (e) {
      console.error("Failed to import tasks", e);
      alert("导入失败，请检查文件格式是否正确。");
    }
  },

  addTask: async (task) => {
    try {
      set(state => ({ tasks: [task, ...state.tasks] }));
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    } catch (e) {
      console.error("Failed to create task", e);
    }
  },

  updateTask: async (task) => {
    try {
      set(state => ({ tasks: state.tasks.map(t => t.id === task.id ? task : t) }));
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    } catch (e) {
      console.error("Failed to update task", e);
    }
  },

  deleteTask: async (taskId) => {
    try {
      set(state => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  },
  
  setTaskSteps: async (taskId, steps) => {
    try {
      set(state => ({
        taskSteps: { ...state.taskSteps, [taskId]: steps }
      }));
      await fetch(`/api/tasks/${taskId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(steps)
      });
    } catch (e) {
      console.error("Failed to fetch steps for", taskId, e);
    }
  },

  setTaskNote: async (taskId, note) => {
    try {
      set(state => ({
        taskNotes: { ...state.taskNotes, [taskId]: note }
      }));
      await fetch(`/api/tasks/${taskId}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
    } catch (e) {
      console.error("Failed to store note", e);
    }
  }
}));
