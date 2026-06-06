import React from "react";
import { useTranslation } from "react-i18next";
import { Task, TaskStep } from "../types";
import ProcessTaskDetail from "./ProcessTaskDetail";
import ScheduledTaskDetail from "./ScheduledTaskDetail";
import TopLevelTaskDetail from "./TopLevelTaskDetail";

interface TaskDetailViewProps {
    selectedTask: Task | undefined;
    selectedTaskId: string;
    steps: TaskStep[];
    notes: string;
    tasks: Task[];
    onUpdateNotes: (value: string) => void;
    onEditStep: (step: TaskStep) => void;
    onContextMenu: (e: React.MouseEvent, stepId?: string) => void;
    onReorderSteps: (newSteps: TaskStep[]) => void;
    onDeleteStep: (stepId: string) => void;
    onUpdateStep: (stepId: string, updates: Partial<TaskStep>) => void;
    onJumpToTask: (taskName: string) => void;
    onUpdateTask: (task: Task) => void;
}

export default function TaskDetailView({
    selectedTask,
    selectedTaskId,
    steps,
    notes,
    tasks,
    onUpdateNotes,
    onEditStep,
    onContextMenu,
    onReorderSteps,
    onDeleteStep,
    onUpdateStep,
    onJumpToTask,
    onUpdateTask,
}: TaskDetailViewProps) {
    const { t } = useTranslation();

    return (
        <div key={selectedTaskId} className="flex-1 flex overflow-hidden">
            {selectedTask ? (
                selectedTask.type === "流程" ? (
                    <ProcessTaskDetail
                        selectedTask={selectedTask}
                        steps={steps}
                        notes={notes}
                        onUpdateNotes={onUpdateNotes}
                        onEditStep={onEditStep}
                        onContextMenu={onContextMenu}
                        onReorderSteps={(newSteps) => onReorderSteps(newSteps)}
                        onDeleteStep={(stepId) => onDeleteStep(stepId)}
                        onUpdateStep={(stepId, updates) => onUpdateStep(stepId, updates)}
                        onJumpToTask={onJumpToTask}
                    />
                ) : selectedTask.type === "定时" ? (
                    <ScheduledTaskDetail selectedTask={selectedTask} tasks={tasks} onSave={onUpdateTask} />
                ) : (
                    <TopLevelTaskDetail selectedTask={selectedTask} />
                )
            ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-on-surface-variant/50">
                    {tasks.length === 0 ? "Loading tasks..." : t("sidebar.search_placeholder") || "No task selected"}
                </div>
            )}
        </div>
    );
}
