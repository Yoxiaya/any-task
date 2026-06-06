import React from "react";
import { Plus, X } from "lucide-react";
import { useProjectStore } from "../store/projectStore";

export default function TabBar() {
    const { projects, openTabIds, activeProjectId, openTab, closeTab, setActiveProject } = useProjectStore();

    if (openTabIds.length === 0 && activeProjectId === null) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-low border-b border-outline-variant/10 overflow-x-auto shrink-0">
            {openTabIds.map((id) => {
                const project = projects.find((p) => p.id === id);
                const isActive = id === activeProjectId;
                return (
                    <div
                        key={id}
                        onClick={() => openTab(id)}
                        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors shrink-0 select-none ${
                            isActive
                                ? "bg-surface-container-highest text-primary shadow-sm"
                                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                        }`}
                    >
                        <span className="truncate max-w-32">{project?.name || id}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeTab(id);
                            }}
                            className={`p-0.5 rounded-md transition-all ${
                                isActive
                                    ? "opacity-60 hover:opacity-100 hover:bg-surface-container"
                                    : "opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-surface-container-highest"
                            }`}
                        >
                            <X size={12} />
                        </button>
                    </div>
                );
            })}

            {/* Add new tab button */}
            <button
                onClick={() => setActiveProject(null)}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors shrink-0"
                title="新建项目"
            >
                <Plus size={18} />
            </button>
        </div>
    );
}
