import { create } from "zustand";
import { Project } from "../types";

const STORAGE_KEY = "any-task-tabs";

const loadTabs = (): { openTabIds: string[]; activeProjectId: string | null } => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const { openTabIds = [], activeProjectId = null } = JSON.parse(raw);
            return { openTabIds, activeProjectId };
        }
    } catch {}
    return { openTabIds: [], activeProjectId: null };
};

const saveTabs = (openTabIds: string[], activeProjectId: string | null) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ openTabIds, activeProjectId }));
    } catch {}
};

interface ProjectStore {
    projects: Project[];
    openTabIds: string[];
    activeProjectId: string | null;
    loading: boolean;

    fetchProjects: () => Promise<void>;
    createProject: (name: string) => Promise<Project>;
    importProject: (name: string, importedTasks: any[]) => Promise<Project>;
    deleteProject: (id: string) => Promise<void>;
    renameProject: (id: string, name: string) => Promise<void>;
    openTab: (id: string) => void;
    closeTab: (id: string) => void;
    setActiveProject: (id: string | null) => void;
}

const saved = loadTabs();

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    openTabIds: saved.openTabIds,
    activeProjectId: saved.activeProjectId,
    loading: false,

    fetchProjects: async () => {
        set({ loading: true });
        try {
            const res = await fetch("/api/projects");
            if (!res.ok) throw new Error("API Error");
            const data: Project[] = await res.json();
            const projectIds = new Set(data.map((p) => p.id));

            // Clean up tabs that no longer exist
            const { openTabIds, activeProjectId } = get();
            const validTabs = openTabIds.filter((id) => projectIds.has(id));
            const validActive = activeProjectId && projectIds.has(activeProjectId) ? activeProjectId : null;

            set({
                projects: data,
                loading: false,
                openTabIds: validTabs,
                activeProjectId: validActive ?? (validTabs.length > 0 ? validTabs[0] : null),
            });

            // Persist cleaned state
            const state = get();
            saveTabs(state.openTabIds, state.activeProjectId);
        } catch (e) {
            console.error("Failed to fetch projects", e);
            set({ loading: false });
        }
    },

    createProject: async (name: string) => {
        const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error("API Error");
        const project: Project = await res.json();

        set((state) => ({
            projects: [...state.projects, project],
        }));
        get().openTab(project.id);
        return project;
    },

    importProject: async (name: string, importedTasks: any[]) => {
        const res = await fetch("/api/projects/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, tasks: importedTasks }),
        });
        if (!res.ok) throw new Error("API Error");
        const project: Project = await res.json();

        set((state) => ({
            projects: [...state.projects, project],
        }));
        get().openTab(project.id);
        return project;
    },

    deleteProject: async (id: string) => {
        try {
            await fetch(`/api/projects/${id}`, { method: "DELETE" });
            set((state) => ({
                projects: state.projects.filter((p) => p.id !== id),
            }));
            const { openTabIds } = get();
            if (openTabIds.includes(id)) {
                get().closeTab(id);
            }
        } catch (e) {
            console.error("Failed to delete project", e);
        }
    },

    renameProject: async (id: string, name: string) => {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const updated = await res.json();
                set((state) => ({
                    projects: state.projects.map((p) => (p.id === id ? { ...p, name: updated.name } : p)),
                }));
            }
        } catch (e) {
            console.error("Failed to rename project", e);
        }
    },

    openTab: (id: string) => {
        set((state) => {
            const openTabIds = state.openTabIds.includes(id) ? state.openTabIds : [...state.openTabIds, id];
            return { openTabIds, activeProjectId: id };
        });
        const state = get();
        saveTabs(state.openTabIds, state.activeProjectId);
    },

    closeTab: (id: string) => {
        set((state) => {
            const idx = state.openTabIds.indexOf(id);
            const newTabs = state.openTabIds.filter((t) => t !== id);

            let newActive = state.activeProjectId;
            if (state.activeProjectId === id) {
                if (newTabs.length === 0) {
                    newActive = null;
                } else {
                    const newIdx = Math.min(idx, newTabs.length - 1);
                    newActive = newTabs[newIdx];
                }
            }

            return { openTabIds: newTabs, activeProjectId: newActive };
        });
        const state = get();
        saveTabs(state.openTabIds, state.activeProjectId);
    },

    setActiveProject: (id: string | null) => {
        set({ activeProjectId: id });
        saveTabs(get().openTabIds, id);
    },
}));
