import React from "react";
import { useTranslation } from "react-i18next";
import {
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    Play,
    Copy,
    ClipboardPaste,
    FileUp,
    FileDown,
    Save,
    Globe,
    ChevronDown,
} from "lucide-react";
import { TaskType } from "../types";
import AddTaskMenu from "./AddTaskMenu";
import { useTaskStore } from "../store/taskStore";

interface AppHeaderProps {
    historyIndex: number;
    historyLength: number;
    referencingTasks: { id: string; name: string }[];
    isUpLevelOpen: boolean;
    setIsUpLevelOpen: (v: boolean) => void;
    onGoBack: () => void;
    onGoForward: () => void;
    onNavigateTo: (id: string) => void;
    onRunTask: () => void;
    onCopyTasks: () => void;
    onPasteTasks: () => void;
    onImportClick: () => void;
    onAddTask: (type: TaskType) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AppHeader({
    historyIndex,
    historyLength,
    referencingTasks,
    isUpLevelOpen,
    setIsUpLevelOpen,
    onGoBack,
    onGoForward,
    onNavigateTo,
    onRunTask,
    onCopyTasks,
    onPasteTasks,
    onImportClick,
    onAddTask,
    fileInputRef,
    onFileChange,
}: AppHeaderProps) {
    const { t, i18n } = useTranslation();

    return (
        <header className="w-full bg-surface-container-lowest border-b border-outline-variant/15 px-6 py-3 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 mr-2 pr-4 border-r border-outline-variant/20">
                    <button
                        onClick={onGoBack}
                        disabled={historyIndex <= 0}
                        className={`p-1.5 rounded-md transition-colors ${historyIndex <= 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-surface-container-high text-on-surface"}`}
                        title={t("common.go_back", "回退")}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={onGoForward}
                        disabled={historyIndex >= historyLength - 1}
                        className={`p-1.5 rounded-md transition-colors ${historyIndex >= historyLength - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-surface-container-high text-on-surface"}`}
                        title={t("common.go_forward", "前进")}
                    >
                        <ChevronRight size={18} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setIsUpLevelOpen(!isUpLevelOpen)}
                            onBlur={() => setTimeout(() => setIsUpLevelOpen(false), 200)}
                            disabled={referencingTasks.length === 0}
                            className={`p-1.5 rounded-md transition-colors ml-1 flex items-center gap-1 ${referencingTasks.length === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-surface-container-high text-on-surface"}`}
                            title={t("common.up_level", "上一级")}
                        >
                            <ArrowUp size={16} />
                        </button>

                        {isUpLevelOpen && referencingTasks.length > 0 && (
                            <div
                                className="absolute top-full left-0 mt-1 bg-surface-container-highest border border-outline-variant/20 rounded-lg shadow-xl py-1 z-50 overflow-hidden"
                                style={{ minWidth: 260, maxWidth: 360 }}
                            >
                                <div className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 bg-surface-container-highest">
                                    {t("common.referenced_tasks", "引用的任务")}
                                </div>
                                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                    {referencingTasks.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => onNavigateTo(t.id)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-primary/10 transition-colors flex items-center gap-2"
                                        >
                                            <span className="font-mono text-primary font-bold shrink-0">{t.id}</span>
                                            <span className="truncate">{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <AddTaskMenu onAddTask={onAddTask} />

                <button
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
                    onClick={onRunTask}
                >
                    <Play size={18} />
                    <span>{t("buttons.run_task")}</span>
                </button>

                <button
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
                    onClick={onCopyTasks}
                >
                    <Copy size={18} />
                    <span>{t("buttons.copy_tasks")}</span>
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
                    onClick={onPasteTasks}
                >
                    <ClipboardPaste size={18} />
                    <span>{t("buttons.paste_tasks")}</span>
                </button>

                <input
                    type="file"
                    title={t("buttons.import", "import")}
                    className="hidden"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={onFileChange}
                />
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
                    onClick={onImportClick}
                >
                    <FileUp size={18} />
                    <span>{t("buttons.import")}</span>
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
                    onClick={() => useTaskStore.getState().exportTasks()}
                >
                    <FileDown size={18} />
                    <span>{t("buttons.export")}</span>
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
                    onClick={() => useTaskStore.getState().exportTasksAs()}
                >
                    <Save size={18} />
                    <span>{t("buttons.save_as")}</span>
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors">
                        <Globe size={16} />
                        <span>{i18n.language === "zh" ? "中文" : "English"}</span>
                        <ChevronDown size={14} className="opacity-50" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-surface-container-lowest border border-outline-variant/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                        <button
                            onClick={() => i18n.changeLanguage("zh")}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${i18n.language === "zh" ? "text-primary font-bold bg-primary/5" : "text-on-surface"}`}
                        >
                            中文
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage("en")}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${i18n.language === "en" ? "text-primary font-bold bg-primary/5" : "text-on-surface"}`}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
