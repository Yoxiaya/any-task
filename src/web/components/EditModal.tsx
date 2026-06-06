import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { TaskStep } from "../types";

// Force file change to trigger GitHub sync update
interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: TaskStep | null;
    onSave: (step: TaskStep) => void;
}

export default function EditModal({ isOpen, onClose, step, onSave }: EditModalProps) {
    const [formData, setFormData] = useState<TaskStep | null>(null);
    const { t } = useTranslation();

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case "流程":
                return t("task_type.process");
            case "定时":
                return t("task_type.scheduled");
            case "-":
                return t("common.uncategorized");
            default:
                return category;
        }
    };

    useEffect(() => {
        if (step) {
            setFormData({
                ...step,
                successJump: step.successJump || "",
                failureJump: step.failureJump || "",
                failureTip: step.failureTip || "",
            });
        }
    }, [step]);

    if (!step || !formData) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="px-8 py-6 flex items-center justify-between">
                            <h2 className="text-xl font-extrabold font-headline text-on-surface tracking-tight">
                                {t("modal.edit_task_step")}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-8 pb-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                        {t("common.name")}
                                    </label>
                                    <div className="w-full px-4 py-3 bg-surface-container-low text-on-surface-variant rounded-lg font-medium text-sm">
                                        {formData.name}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                        {t("common.category")}
                                    </label>
                                    <div className="w-full px-4 py-3 bg-surface-container-low text-on-surface-variant rounded-lg font-medium text-sm">
                                        {getCategoryLabel(formData.category)}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                        {t("common.success_jump")}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.successJump}
                                        onChange={(e) => setFormData({ ...formData, successJump: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                        {t("common.failure_jump")}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.failureJump}
                                        onChange={(e) => setFormData({ ...formData, failureJump: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                    {t("common.failure_tip")}
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium resize-none"
                                    rows={3}
                                    value={formData.failureTip}
                                    onChange={(e) => setFormData({ ...formData, failureTip: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 text-sm font-bold text-secondary hover:bg-surface-container rounded-lg transition-colors"
                                >
                                    {t("buttons.cancel")}
                                </button>
                                <button
                                    onClick={() => onSave(formData)}
                                    className="px-8 py-2.5 text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-dim rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                >
                                    {t("buttons.save")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
