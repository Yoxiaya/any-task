import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Globe, HardDrive, Plus, Trash2 } from "lucide-react";
import { Task } from "../types";


interface CascadingContextMenuProps {
    x: number;
    y: number;
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    onSelectTask: (task: Task) => void;
    onAddEmptyRow: () => void;
    onDeleteRow?: () => void;
    hasTarget?: boolean;
}

export default function CascadingContextMenu({
    x,
    y,
    isOpen,
    onClose,
    tasks,
    onSelectTask,
    onAddEmptyRow,
    onDeleteRow,
    hasTarget,
}: CascadingContextMenuProps) {
    if (!isOpen) return null;

    // 按任务类型分组
    const groupedTasks = tasks.reduce(
        (acc, task) => {
            if (!acc[task.type]) acc[task.type] = [];
            acc[task.type].push(task);
            return acc;
        },
        {} as Record<string, Task[]>,
    );

    const taskTypes = Object.keys(groupedTasks);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[60]"
                        onClick={onClose}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            onClose();
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ left: x, top: y }}
                        className="fixed z-[70] w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl py-1 overflow-visible"
                    >
                        {/* 第一级：新增空白行 */}
                        <button
                            onClick={() => {
                                onAddEmptyRow();
                                onClose();
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>增加一行</span>
                        </button>

                        {hasTarget && onDeleteRow && (
                            <button
                                onClick={() => {
                                    onDeleteRow();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors cursor-pointer"
                            >
                                <Trash2 size={16} />
                                <span>删除此行</span>
                            </button>
                        )}

                        <div className="h-px bg-outline-variant/10 my-1" />

                        {/* 第一级：内部任务 */}
                        <div className="relative group/l1">
                            <div className="flex items-center justify-between px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <HardDrive size={16} />
                                    <span>内部任务</span>
                                </div>
                                <ChevronRight size={14} />
                            </div>

                            {/* 第二级：任务类型 */}
                            <div className="absolute left-full top-0 -ml-px w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl py-1 hidden group-hover/l1:block">
                                {/* 桥接区域：防止菜单意外关闭 */}
                                <div className="absolute top-0 -left-2 w-2 h-full" />
                                {taskTypes.map((type) => (
                                    <div key={type} className="relative group/l2">
                                        <div className="flex items-center justify-between px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer border-b border-outline-variant/5 last:border-0">
                                            <span>{type}任务</span>
                                            <ChevronRight size={14} />
                                        </div>

                                        {/* 第三级：该类型下的任务列表 */}
                                        <div className="absolute left-full top-0 -ml-px w-56 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl py-1 hidden group-hover/l2:block max-h-64 overflow-y-auto custom-scrollbar">
                                            {/* 桥接区域：防止菜单意外关闭 */}
                                            <div className="absolute top-0 -left-2 w-2 h-full" />
                                            {groupedTasks[type].map((task) => (
                                                <button
                                                    key={task.id}
                                                    onClick={() => {
                                                        onSelectTask(task);
                                                        onClose();
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors border-b border-outline-variant/5 last:border-0"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{task.name}</span>
                                                        <span className="text-[10px] text-outline-variant font-mono">
                                                            {task.id}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 第一级：外部任务 */}
                        <div className="px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer border-t border-outline-variant/10">
                            <div className="flex items-center gap-2">
                                <Globe size={16} />
                                <span>外部任务</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
