import { create } from "zustand";

interface AppConfig {
    appName: string;
    tabTitle: string;
}

interface AppConfigStore {
    config: AppConfig;
}

const readEnvConfig = (): AppConfig => ({
    appName: import.meta.env.VITE_APP_NAME || "Any Task",
    tabTitle: import.meta.env.VITE_TAB_TITLE || "Any Task",
});

export const useAppConfigStore = create<AppConfigStore>(() => ({
    config: readEnvConfig(),
}));
