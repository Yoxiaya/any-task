import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, ChevronDown, ChevronRight, LayoutTemplate, Layers, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TaskType } from "../types";

// Force file change to trigger GitHub sync update
interface AddTaskMenuProps {
    onAddTask: (type: TaskType) => void;
}

export default function AddTaskMenu({ onAddTask }: AddTaskMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();

    const handleSelect = (type: TaskType) => {
        onAddTask(type);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold shadow-sm hover:bg-primary-dim transition-colors"
            >
                <Plus size={18} />
                <span>{t("buttons.new_task")}</span>
                <ChevronDown size={14} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute left-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl z-40 py-1"
                        >
                            <div className="py-1">
                                <button
                                    onClick={() => handleSelect("流程")}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                    <LayoutTemplate size={18} />
                                    <span>{t("modal.default_process_name")}</span>
                                </button>

                                <div className="relative group/sub">
                                    <div className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer border-t border-outline-variant/10">
                                        <div className="flex items-center gap-3">
                                            <Layers size={18} />
                                            <span>{t("buttons.common_options")}</span>
                                        </div>
                                        <ChevronRight size={14} />
                                    </div>

                                    {/* Submenu */}
                                    <div className="absolute left-full top-0 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl py-1 hidden group-hover/sub:block">
                                        {/* Bridge to prevent broken touch */}
                                        <div className="absolute -left-2 top-0 bottom-0 w-2 bg-transparent" />
                                        <button
                                            onClick={() => handleSelect("定时")}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-primary/5 hover:text-primary transition-colors"
                                        >
                                            <Clock size={18} />
                                            <span>{t("modal.default_scheduled_name")}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
