import { create } from "zustand";

interface AppConfig {
    appName: string;
    tabTitle: string;
}

interface AppConfigStore {
    config: AppConfig;
    loading: boolean;
    fetchConfig: () => Promise<void>;
    updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
}

export const useAppConfigStore = create<AppConfigStore>((set) => ({
    config: { appName: "Any Task", tabTitle: "Any Task" },
    loading: false,

    fetchConfig: async () => {
        set({ loading: true });
        try {
            const res = await fetch("/api/config");
            if (res.ok) {
                const data = await res.json();
                set({ config: data, loading: false });
            }
        } catch (e) {
            console.error("Failed to fetch config", e);
            set({ loading: false });
        }
    },

    updateConfig: async (updates: Partial<AppConfig>) => {
        try {
            const res = await fetch("/api/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const data = await res.json();
                set({ config: data });
            }
        } catch (e) {
            console.error("Failed to update config", e);
        }
    },
}));
