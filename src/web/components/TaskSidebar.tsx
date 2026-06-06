import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Filter, ListTodo } from "lucide-react";
import { Task } from "../types";

interface TaskSidebarProps {
    tasks: Task[];
    selectedTaskId: string;
    rootTaskId: string;
    onNavigateTo: (id: string) => void;
}

export default function TaskSidebar({ tasks, selectedTaskId, rootTaskId, onNavigateTo }: TaskSidebarProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.id === rootTaskId) return -1;
        if (b.id === rootTaskId) return 1;
        return 0;
    });

    const filtered = sortedTasks.filter(
        (task) =>
            task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.type.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <section className="w-[23%] min-w-[320px] bg-surface-container-low flex flex-col border-r border-outline-variant/15">
            <div className="p-6 shrink-0 border-b border-outline-variant/15">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                        <ListTodo size={18} className="text-primary" />
                        {t("sidebar.task_directory")}
                    </h2>
                    <button className="text-primary hover:bg-primary/5 p-1 rounded transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10"
                    />
                    <input
                        className="w-full pl-9 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm focus:ring-1 focus:ring-primary/30 outline-none relative z-10"
                        placeholder={t("sidebar.search_placeholder")}
                        type="text"
                        value={searchQuery}
                        onFocus={() => setIsDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                    />
                    {isDropdownOpen && searchQuery.trim() !== "" && filtered.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/20 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                            {filtered.map((task) => (
                                <div
                                    key={task.id}
                                    className="px-4 py-2 text-sm hover:bg-primary/10 cursor-pointer text-on-surface truncate"
                                    onClick={() => {
                                        setSearchQuery(task.name);
                                        onNavigateTo(task.id);
                                        setIsDropdownOpen(false);
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
                            <th className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[25%]">
                                {t("sidebar.id")}
                            </th>
                            <th className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[50%]">
                                {t("sidebar.task_name")}
                            </th>
                            <th className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[25%]">
                                {t("sidebar.type")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                        {sortedTasks.map((task) => (
                            <tr
                                key={task.id}
                                onClick={() => onNavigateTo(task.id)}
                                className={`hover:bg-primary/5 cursor-pointer transition-colors ${selectedTaskId === task.id ? "bg-surface-container-lowest" : ""}`}
                            >
                                <td
                                    className={`px-4 py-4 text-sm font-mono truncate ${selectedTaskId === task.id ? "text-primary font-bold" : "text-on-surface-variant"}`}
                                >
                                    {task.id}
                                </td>
                                <td
                                    className={`px-4 py-4 text-sm truncate ${selectedTaskId === task.id ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}
                                >
                                    {task.name}
                                </td>
                                <td className="px-4 py-4">
                                    <span
                                        className={`px-2 py-1 text-[11px] font-bold rounded ${task.id === rootTaskId ? "bg-blue-100 text-blue-700" : "bg-surface-container-high text-on-surface-variant"}`}
                                    >
                                        {task.type === "定时" ? t("task_type.scheduled") : t("task_type.process")}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
