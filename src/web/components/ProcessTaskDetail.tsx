import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Edit3, Save, CheckCircle2 } from "lucide-react";
import { Task, TaskStep } from "../types";
import { Reorder, motion } from "motion/react";
import { getCategoryLabel } from "../utils";


interface ProcessTaskDetailProps {
    selectedTask: Task;
    steps: TaskStep[];
    notes: string;
    onUpdateNotes: (notes: string) => void;
    onEditStep: (step: TaskStep) => void;
    onContextMenu: (e: React.MouseEvent, stepId?: string) => void;
    onReorderSteps: (newSteps: TaskStep[]) => void;
    onDeleteStep: (stepId: string) => void;
    onUpdateStep: (stepId: string, updates: Partial<TaskStep>) => void;
    onJumpToTask: (taskName: string) => void;
}

export default function ProcessTaskDetail({
    selectedTask,
    steps,
    notes,
    onUpdateNotes,
    onEditStep: _onEditStep,
    onContextMenu,
    onReorderSteps,
    onDeleteStep,
    onUpdateStep,
    onJumpToTask,
}: ProcessTaskDetailProps) {
    const deleteZoneRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLTableSectionElement>(null);
    const originalStepsRef = useRef<TaskStep[]>([]);
    const isShiftPressed = useRef(false);
    const draggingStepIdRef = useRef<string | null>(null);
    const isShiftDragRef = useRef(false);
    const targetIndexRef = useRef<number>(-1);
    const [targetIndex, setTargetIndex] = useState<number>(-1);
    const [previewSteps, setPreviewSteps] = useState<TaskStep[] | null>(null);
    const [isShiftDrag, setIsShiftDrag] = useState(false);
    const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

    const { t } = useTranslation();

    const displaySteps = previewSteps || steps;

    const activeRowIndex = selectedStepId ? displaySteps.findIndex((s) => s.id === selectedStepId) : -1;

    const handleRowClick = (index: number) => {
        // 点击静态列时从概念上选中该行
        const clickedStep = displaySteps[index];
        if (clickedStep) {
            setSelectedStepId(clickedStep.id === selectedStepId ? null : clickedStep.id);
        }
    };

    const handleNameEditComplete = (
        e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>,
        step: TaskStep,
    ) => {
        const newName = e.currentTarget.value;
        if (newName && newName !== step.name) {
            onUpdateStep(step.id, { name: newName });
        }
        setIsEditingName(false);
    };

    // 辅助函数：将内容重新映射到固定槽位（ID、successJump、failureJump、failureTip）
    const applyFixedSlots = (newContentOrder: TaskStep[], baseSlots: TaskStep[]): TaskStep[] => {
        return newContentOrder.map((content, idx) => ({
            ...baseSlots[idx], // 保留物理槽位的 ID、successJump 等字段
            category: content.category,
            name: content.name,
            _uid: content._uid,
        }));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Shift") isShiftPressed.current = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Shift") isShiftPressed.current = false;
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // 任务切换时重置选中状态和预览
    useEffect(() => {
        setSelectedStepId(null);
        setIsEditingName(false);
        setPreviewSteps(null);
        setTargetIndex(-1);
        setIsShiftDrag(false);
    }, [selectedTask.id]);

    useEffect(() => {
        if (saveStatus === "saved") {
            const timer = setTimeout(() => setSaveStatus("idle"), 2000);
            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    const handleSave = () => {
        setSaveStatus("saving");
        console.log(steps);
        // 模拟 API 调用
        setTimeout(() => {
            setSaveStatus("saved");
            setSelectedStepId(null);
            setIsEditingName(false);
        }, 600);
    };

    const handleDragStart = (event: any, id: string, index: number) => {
        originalStepsRef.current = [...steps];
        draggingStepIdRef.current = id;

        let isShift = isShiftPressed.current;
        if (event && "shiftKey" in event) {
            isShift = event.shiftKey;
            isShiftPressed.current = isShift;
        }

        setIsShiftDrag(isShift);
        isShiftDragRef.current = isShift;

        if (isShift) {
            setTargetIndex(index);
            targetIndexRef.current = index;
            setPreviewSteps(null); // Shift 拖拽时保持项目视觉上静止
        } else {
            setPreviewSteps([...steps]);
            setTargetIndex(-1);
            targetIndexRef.current = -1;
        }
    };

    const handleReorder = (newSteps: TaskStep[]) => {
        if (!isShiftDrag) {
            setPreviewSteps(newSteps);
        }
    };

    const handleDragEnd = (event: any, info: any, stepId: string) => {
        setIsOverDeleteZone(false);
        const wasShift = isShiftDragRef.current;
        const finalTargetIndex = targetIndexRef.current;
        const currentPreviewSteps = previewSteps;
        const originalSteps = originalStepsRef.current;

        draggingStepIdRef.current = null;
        isShiftDragRef.current = false;
        setPreviewSteps(null);
        setTargetIndex(-1);
        targetIndexRef.current = -1;
        setIsShiftDrag(false);

        if (!deleteZoneRef.current) return;

        const rect = deleteZoneRef.current.getBoundingClientRect();
        const { x, y } = info.point;

        const isInsideDeleteZone = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        if (isInsideDeleteZone) {
            onDeleteStep(stepId);
            return;
        }

        // 处理修饰键
        const isCtrl = event.ctrlKey || event.metaKey;

        if (wasShift) {
            const oldIndex = originalSteps.findIndex((s) => s.id === stepId);
            const newIndex = finalTargetIndex;

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const finalSteps = [...originalSteps];
                const stepOld = originalSteps[oldIndex];
                const stepNew = originalSteps[newIndex];

                // 核心修复：仅交换身份字段（Category、Name）
                // 保留槽位字段（id、successJump、failureJump、failureTip）在其原始物理索引位置
                finalSteps[oldIndex] = {
                    ...stepOld,
                    category: stepNew.category,
                    name: stepNew.name,
                    _uid: stepNew._uid,
                };
                finalSteps[newIndex] = {
                    ...stepNew,
                    category: stepOld.category,
                    name: stepOld.name,
                    _uid: stepOld._uid,
                };

                onReorderSteps(finalSteps);
                return;
            }
            return;
        }

        if (isCtrl) {
            // 重新排序后的列表（整个项）
            const reorderedItems = currentPreviewSteps || steps;
            const newIndex = reorderedItems.findIndex((s) => s.id === stepId);
            const oldIndex = originalSteps.findIndex((s) => s.id === stepId);

            if (newIndex !== -1 && oldIndex !== -1) {
                const maxId = originalSteps.reduce((max, step) => {
                    const num = parseInt(step.id, 10);
                    return isNaN(num) ? max : Math.max(max, num);
                }, 0);
                const newId = (maxId + 1).toString().padStart(2, "0");
                const sourceData = originalSteps[oldIndex];
                const copy = { ...sourceData, id: newId, _uid: Math.random().toString(36).substr(2, 9) };

                // 1. 先重新排序现有步骤的内容
                const contentOrder = reorderedItems.map((item) => ({ ...item }));

                // 2. 将副本插入 contentOrder
                contentOrder.splice(newIndex, 0, copy);

                // 3. 为标准重排+复制维护槽位：
                // 这比较棘手，因为我们新增了一个步骤。
                // 通常复制会添加新行，因此获得新槽位。
                // 我们需要确保现有行的 successJump 等保留在旧索引位置。
                // 实际上如果添加一行，下面的槽位会移位。
                // 为简化"槽位固定"逻辑，最合理的解释是：
                // 重排会重新映射类别/名称，添加步骤在末尾新增槽位。
                // 如果在索引 3 处插入步骤，第 3 行会变成第 4 行。
                // 假设插入的标准行为：新项获得自己的数据。

                onReorderSteps(contentOrder); // 复制时直接移动项，因为这是结构变更
                return;
            }
        }

        // 标准重排
        if (currentPreviewSteps) {
            // 应用槽位固定：类别和名称随重排移动，
            // 但 ID、跳转和提示保持分配给索引。
            const finalSteps = applyFixedSlots(currentPreviewSteps, originalSteps);
            onReorderSteps(finalSteps);
        }
    };

    const handleDrag = (event: any, info: any) => {
        // 1. 动态检测 Shift 键状态，处理拖拽中途按键的情况
        let currentShift = isShiftPressed.current;
        if (event && "shiftKey" in event) {
            currentShift = event.shiftKey;
            isShiftPressed.current = currentShift;
        }

        // 处理拖拽过程中的 Shift 状态切换
        if (currentShift !== isShiftDragRef.current) {
            isShiftDragRef.current = currentShift;
            setIsShiftDrag(currentShift);
            if (currentShift) {
                setPreviewSteps(null);
            } else {
                setPreviewSteps([...originalStepsRef.current]);
            }
        }

        const clientX = event?.clientX ?? event?.touches?.[0]?.clientX ?? info.point.x;
        const clientY = event?.clientY ?? event?.touches?.[0]?.clientY ?? info.point.y - window.scrollY;

        if (deleteZoneRef.current) {
            const rect = deleteZoneRef.current.getBoundingClientRect();
            const isInside =
                clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
            if (isInside !== isOverDeleteZone) {
                setIsOverDeleteZone(isInside);
            }
        }

        if (isShiftDragRef.current) {
            // 使用 document.elementsFromPoint 完美处理元素重叠
            const elementsAtPoint = document.elementsFromPoint(clientX, clientY);

            for (const el of elementsAtPoint) {
                const stepRow = el.closest("[data-step-id]");
                if (stepRow) {
                    const id = stepRow.getAttribute("data-step-id");
                    if (id && id !== draggingStepIdRef.current) {
                        const foundIndex = parseInt(stepRow.getAttribute("data-target-index") || "-1", 10);
                        if (foundIndex !== -1) {
                            setTargetIndex((prev) => {
                                if (prev !== foundIndex) {
                                    targetIndexRef.current = foundIndex;
                                    return foundIndex;
                                }
                                return prev;
                            });
                        }
                        break; // 找到最顶层目标行
                    }
                }
            }
        }
    };

    return (
        <section className="flex-1 bg-background overflow-hidden p-8 flex flex-col gap-6 animate-in fade-in duration-500">
            {/* 任务备注区域 */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("process.task_notes")}
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-outline-variant font-medium">{t("process.auto_save_tip")}</span>
                    </div>
                </div>
                <textarea
                    key={`notes-${selectedTask.id}-${notes || ""}`}
                    className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-[15px] font-medium resize-none custom-scrollbar"
                    placeholder={t("process.notes_placeholder")}
                    rows={3}
                    defaultValue={notes}
                    onBlur={(e) => onUpdateNotes(e.target.value)}
                />
            </div>

            {/* 头部操作按钮 */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsEditingName(true)}
                    disabled={!selectedStepId}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[15px] font-bold transition-all ${
                        selectedStepId
                            ? "bg-primary text-on-primary shadow-md hover:bg-primary-dim active:scale-95"
                            : "bg-surface-container-high text-outline-variant cursor-not-allowed opacity-50"
                    }`}
                >
                    <Edit3 size={16} />
                    <span>{t("process.edit_name")}</span>
                </button>

                <button
                    onClick={handleSave}
                    disabled={saveStatus !== "idle"}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[15px] font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:scale-100 ${
                        saveStatus === "saved"
                            ? "bg-emerald-500 text-white"
                            : "bg-secondary text-on-secondary hover:bg-secondary/90"
                    }`}
                >
                    {saveStatus === "saving" ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                            <Save size={16} />
                        </motion.div>
                    ) : saveStatus === "saved" ? (
                        <CheckCircle2 size={16} />
                    ) : (
                        <Save size={16} />
                    )}
                    <span>
                        {saveStatus === "saving"
                            ? t("process.saving")
                            : saveStatus === "saved"
                              ? t("process.saved")
                              : t("process.save_data")}
                    </span>
                </button>

                {/* 拖拽删除区域 */}
                <div
                    ref={deleteZoneRef}
                    className={`h-12 flex-1 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all duration-300 ${
                        isOverDeleteZone
                            ? "bg-error/10 border-error text-error scale-[1.01] shadow-lg"
                            : "bg-surface-container-low border-outline-variant/30 text-outline-variant"
                    }`}
                >
                    <Trash2 size={18} className={isOverDeleteZone ? "animate-bounce" : ""} />
                    <span className="text-[15px] font-bold tracking-wide">
                        {isOverDeleteZone ? t("process.release_to_delete") : t("process.drag_to_delete")}
                    </span>
                </div>
            </div>

            <div
                onContextMenu={onContextMenu}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 flex flex-col flex-1"
            >
                <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1 relative">
                    <div className="flex flex-row w-full min-w-[900px]">
                        {/* 第1列：序号（静态） */}
                        <div className="flex flex-col w-[8%] shrink-0 relative">
                            <div className="h-16 flex items-center px-6 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                                {t("common.step_id")}
                            </div>
                            {steps.map((step, index) => {
                                const isSelected = index === activeRowIndex;
                                let rowBgClass = "transition-colors duration-200 ";
                                if (isSelected) {
                                    rowBgClass += "!bg-blue-100/80 ";
                                } else if (isShiftDrag && index === targetIndex) {
                                    rowBgClass += "!bg-amber-100";
                                } else {
                                    rowBgClass += "hover:bg-primary/5 ";
                                }

                                return (
                                    <div
                                        key={`id-${step.id}`}
                                        className={`h-[72px] flex items-center px-6 border-b border-outline-variant/5 text-[15px] font-medium text-on-surface-variant ${rowBgClass}`}
                                        onClick={() => handleRowClick(index)}
                                    >
                                        {(index + 1).toString().padStart(2, "0")}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 第2列：任务类/任务名（通过 Reorder.Group 拖拽排序） */}
                        <div className="flex flex-col w-[40%] shrink-0 border-x border-outline-variant/10 relative">
                            <div className="h-16 flex items-center px-4 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                                {t("process.task_category_name")}
                            </div>
                            <Reorder.Group
                                ref={containerRef}
                                axis="y"
                                values={displaySteps}
                                onReorder={handleReorder}
                                className="flex flex-col w-full"
                            >
                                {displaySteps.map((step, index) => {
                                    const isSelected = selectedStepId === step.id;
                                    const isTarget =
                                        isShiftDrag && index === targetIndex && step.id !== draggingStepIdRef.current;

                                    let rowBgClass = "transition-colors duration-200 ";
                                    if (isSelected) {
                                        rowBgClass += "!bg-blue-100/80 ";
                                    } else if (isTarget) {
                                        rowBgClass +=
                                            "!bg-amber-100 !outline !outline-2 !outline-amber-400 !z-10 relative ";
                                    } else {
                                        rowBgClass += "hover:bg-primary/5 ";
                                    }

                                    return (
                                        <Reorder.Item
                                            key={step._uid || step.id}
                                            value={step}
                                            data-step-id={step.id}
                                            data-target-index={index}
                                            onDragStart={(e) => handleDragStart(e, step.id, index)}
                                            onDragEnd={(e, info) => handleDragEnd(e, info, step.id)}
                                            onDrag={handleDrag}
                                            onClick={() =>
                                                setSelectedStepId(step.id === selectedStepId ? null : step.id)
                                            }
                                            onDoubleClick={() => step.name && onJumpToTask(step.name)}
                                            onContextMenu={(e) => {
                                                e.stopPropagation();
                                                onContextMenu(e, step.id);
                                            }}
                                            className={`h-[72px] group relative z-0 cursor-pointer flex items-center px-4 border-b border-outline-variant/5 ${isSelected ? "z-10" : ""} ${rowBgClass}`}
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                {isEditingName && isSelected ? (
                                                    <div className="flex items-center gap-1.5 w-full">
                                                        <span className="text-[15px] font-semibold text-on-surface whitespace-nowrap shrink-0">
                                                            {getCategoryLabel(step.category, t)} /
                                                        </span>
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            defaultValue={step.name}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onBlur={(e) => handleNameEditComplete(e, step)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleNameEditComplete(e, step);
                                                            }}
                                                            className="flex-1 bg-surface-container-lowest border-2 border-primary rounded-lg px-3 py-1.5 text-[15px] font-bold outline-none shadow-lg animate-in zoom-in-95 duration-200"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-[15px] font-semibold text-on-surface flex min-w-0">
                                                        <span className="shrink-0">
                                                            {getCategoryLabel(step.category, t)}
                                                        </span>
                                                        <span className="text-outline-variant font-normal">/</span>
                                                        <span className="truncate">
                                                            {step.name || (
                                                                <span className="text-outline-variant font-normal italic">
                                                                    {t("common.unnamed_step")}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </Reorder.Item>
                                    );
                                })}
                            </Reorder.Group>
                        </div>

                        {/* 第3列：成功跳转（静态） */}
                        <div className="flex flex-col w-[12%] shrink-0 relative">
                            <div className="h-16 flex items-center px-6 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                                {t("common.success_jump")}
                            </div>
                            {steps.map((step, index) => {
                                const isSelected = index === activeRowIndex;
                                let rowBgClass = "transition-colors duration-200 ";
                                if (isSelected) {
                                    rowBgClass += "!bg-blue-100/80 ";
                                } else if (isShiftDrag && index === targetIndex) {
                                    rowBgClass += "!bg-amber-100";
                                } else {
                                    rowBgClass += "hover:bg-primary/5 ";
                                }

                                return (
                                    <div
                                        key={`sj-${step.id}`}
                                        className={`h-[72px] flex items-center px-6 border-b border-outline-variant/5 ${rowBgClass}`}
                                        onClick={() => handleRowClick(index)}
                                    >
                                        <input
                                            key={`input-sj-${step.id}-${step.successJump || ""}`}
                                            type="text"
                                            defaultValue={step.successJump}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={(e) => onUpdateStep(step.id, { successJump: e.target.value })}
                                            className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-lg px-3 py-2 text-[15px] text-tertiary font-medium outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* 第4列：失败跳转（静态） */}
                        <div className="flex flex-col w-[12%] shrink-0 relative">
                            <div className="h-16 flex items-center px-6 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                                {t("common.failure_jump")}
                            </div>
                            {steps.map((step, index) => {
                                const isSelected = index === activeRowIndex;
                                let rowBgClass = "transition-colors duration-200 ";
                                if (isSelected) {
                                    rowBgClass += "!bg-blue-100/80 ";
                                } else if (isShiftDrag && index === targetIndex) {
                                    rowBgClass += "!bg-amber-100";
                                } else {
                                    rowBgClass += "hover:bg-primary/5 ";
                                }

                                return (
                                    <div
                                        key={`fj-${step.id}`}
                                        className={`h-[72px] flex items-center px-6 border-b border-outline-variant/5 ${rowBgClass}`}
                                        onClick={() => handleRowClick(index)}
                                    >
                                        <input
                                            key={`input-fj-${step.id}-${step.failureJump || ""}`}
                                            type="text"
                                            defaultValue={step.failureJump}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={(e) => onUpdateStep(step.id, { failureJump: e.target.value })}
                                            className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-error/50 focus:ring-2 focus:ring-error/10 rounded-lg px-3 py-2 text-[15px] text-error font-medium outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* 第5列：失败提示（静态） */}
                        <div className="flex flex-col w-[28%] shrink-0 relative">
                            <div className="h-16 flex items-center px-6 bg-surface-container-high border-b border-outline-variant/20 sticky top-0 z-20 text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
                                {t("common.failure_tip")}
                            </div>
                            {steps.map((step, index) => {
                                const isSelected = index === activeRowIndex;
                                let rowBgClass = "transition-colors duration-200 ";
                                if (isSelected) {
                                    rowBgClass += "!bg-blue-100/80 ";
                                } else if (isShiftDrag && index === targetIndex) {
                                    rowBgClass += "!bg-amber-100";
                                } else {
                                    rowBgClass += "hover:bg-primary/5 ";
                                }

                                return (
                                    <div
                                        key={`tip-${step.id}`}
                                        className={`h-[72px] flex items-center px-6 border-b border-outline-variant/5 ${rowBgClass}`}
                                        onClick={() => handleRowClick(index)}
                                    >
                                        <input
                                            key={`input-tip-${step.id}-${step.failureTip || ""}`}
                                            type="text"
                                            defaultValue={step.failureTip}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={(e) => onUpdateStep(step.id, { failureTip: e.target.value })}
                                            className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-lg px-3 py-2 text-sm text-on-surface-variant italic outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
