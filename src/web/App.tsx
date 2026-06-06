import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TaskType, TaskStep } from "./types";
import EditModal from "./components/EditModal";
import CreateTaskModal from "./components/CreateTaskModal";
import CreateStepModal from "./components/CreateStepModal";
import CascadingContextMenu from "./components/CascadingContextMenu";
import HomePage from "./components/HomePage";
import TabBar from "./components/TabBar";
import AppHeader from "./components/AppHeader";
import TaskSidebar from "./components/TaskSidebar";
import TaskDetailView from "./components/TaskDetailView";
import ImportModals from "./components/ImportModals";
import { useTaskManagement } from "./hooks/useTaskManagement";
import { useTaskStore } from "./store/taskStore";
import { useProjectStore } from "./store/projectStore";
import { useAppConfigStore } from "./store/appConfigStore";

export default function App() {
    const { t } = useTranslation();
    const { activeProjectId, fetchProjects } = useProjectStore();
    const setProjectId = useTaskStore((s) => s.setProjectId);
    const { config, fetchConfig } = useAppConfigStore();

    useEffect(() => {
        fetchProjects();
        fetchConfig();
    }, [fetchProjects, fetchConfig]);

    useEffect(() => {
        document.title = config.tabTitle || "Any Task";
    }, [config.tabTitle]);

    useEffect(() => {
        if (activeProjectId) setProjectId(activeProjectId);
    }, [activeProjectId, setProjectId]);

    const {
        tasks,
        selectedTaskId,
        selectedTask,
        currentSteps,
        historyIndex,
        history,
        referencingTasks,
        navigateToTask,
        handleGoBack,
        handleGoForward,
        handleCreateTask,
        handleCreateStep,
        handleDeleteStep,
        handleUpdateStep,
        handleReorderSteps,
        handleAddEmptyRow,
        handleAddTaskFromMenu,
        updateTask,
    } = useTaskManagement();

    const [editingStep, setEditingStep] = useState<TaskStep | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateStepModalOpen, setIsCreateStepModalOpen] = useState(false);
    const [newTaskType, setNewTaskType] = useState<TaskType>("流程");
    const { taskNotes, rootTaskId, setTaskNote } = useTaskStore();

    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [pendingPasteFile, setPendingPasteFile] = useState<File | null>(null);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [pasteText, setPasteText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUpLevelOpen, setIsUpLevelOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        isOpen: boolean;
        targetStepId?: string;
    }>({ x: 0, y: 0, isOpen: false });

    const handleEditStep = (step: TaskStep) => {
        setEditingStep(step);
        setIsEditModalOpen(true);
    };

    const handleContextMenu = (e: React.MouseEvent, stepId?: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, isOpen: true, targetStepId: stepId });
    };

    const handleJumpToTask = (taskName: string) => {
        const targetTask = tasks.find((t) => t.name === taskName);
        if (targetTask) navigateToTask(targetTask.id);
    };

    const handleImportClick = () => {
        if (tasks.length > 0) {
            setIsImportConfirmOpen(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await useTaskStore.getState().importTasks(file);
            e.target.value = "";
        }
    };

    const confirmImport = async () => {
        setIsImportConfirmOpen(false);
        if (pendingPasteFile) {
            await useTaskStore.getState().importTasks(pendingPasteFile);
            setPendingPasteFile(null);
        } else {
            fileInputRef.current?.click();
        }
    };

    const cancelImport = () => {
        setIsImportConfirmOpen(false);
        setPendingPasteFile(null);
    };

    const handleRunTask = async () => {
        try {
            const { projectId, selectedTaskId: sid } = useTaskStore.getState();
            if (!sid) return alert("请先选择一个任务");
            const res = await fetch(`/api/export?${new URLSearchParams({ projectId, taskId: sid })}`);
            const taskData = await res.json();
            await fetch("/api/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(taskData),
            });
            alert(t("buttons.run_task") + " 成功");
        } catch (e) {
            console.error("Failed to run task:", e);
            alert(t("buttons.run_task") + " 失败");
        }
    };

    const handleCopyTasks = async () => {
        try {
            const { projectId, selectedTaskId: sid } = useTaskStore.getState();
            if (!sid) return alert("请先选择一个任务");
            const res = await fetch(`/api/export?${new URLSearchParams({ projectId, taskId: sid })}`);
            const data = await res.json();
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            alert(t("buttons.copy_tasks") + " 成功");
        } catch (e) {
            console.error("Failed to copy tasks:", e);
            alert(t("buttons.copy_tasks") + " 失败");
        }
    };

    const processPasteText = async (text: string, fallbackToModal = false) => {
        try {
            let cleanText = text.trim();
            const si = cleanText.indexOf("[");
            const ei = cleanText.lastIndexOf("]");
            if (si !== -1 && ei > si) cleanText = cleanText.substring(si, ei + 1);
            cleanText = cleanText.replace(/[\u200B-\u200D\uFEFF]/g, "");

            const json = JSON.parse(cleanText);
            if (!Array.isArray(json)) {
                if (fallbackToModal) {
                    setPasteText(text);
                    setIsPasteModalOpen(true);
                } else {
                    alert("粘贴板内容格式不正确，期望是一个数组");
                }
                return;
            }
            const file = new File([cleanText], "clipboard.json", { type: "application/json" });
            if (tasks.length > 0) {
                setPendingPasteFile(file);
                setIsImportConfirmOpen(true);
            } else {
                await useTaskStore.getState().importTasks(file);
            }
            setIsPasteModalOpen(false);
        } catch (e: any) {
            if (fallbackToModal) {
                setPasteText(text);
                setIsPasteModalOpen(true);
            } else {
                alert("粘贴板内容非法的 JSON 数据: " + (e?.message || ""));
            }
        }
    };

    const handlePasteTasks = async () => {
        try {
            if (navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                if (text) {
                    await processPasteText(text, true);
                    return;
                }
            }
        } catch {}
        setIsPasteModalOpen(true);
        setPasteText("");
    };

    const currentNotes = selectedTaskId ? taskNotes[selectedTaskId] || "" : "";

    if (!activeProjectId) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                <TabBar />
                <HomePage />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <TabBar />
            <AppHeader
                historyIndex={historyIndex}
                historyLength={history.length}
                referencingTasks={referencingTasks}
                isUpLevelOpen={isUpLevelOpen}
                setIsUpLevelOpen={setIsUpLevelOpen}
                onGoBack={handleGoBack}
                onGoForward={handleGoForward}
                onNavigateTo={navigateToTask}
                onRunTask={handleRunTask}
                onCopyTasks={handleCopyTasks}
                onPasteTasks={handlePasteTasks}
                onImportClick={handleImportClick}
                onAddTask={(type) => {
                    setNewTaskType(type);
                    setIsCreateModalOpen(true);
                }}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
            />

            <main className="flex-1 flex overflow-hidden">
                <TaskSidebar
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    rootTaskId={rootTaskId}
                    onNavigateTo={navigateToTask}
                />
                <TaskDetailView
                    selectedTask={selectedTask}
                    selectedTaskId={selectedTaskId}
                    steps={currentSteps}
                    notes={currentNotes}
                    tasks={tasks}
                    onUpdateNotes={(v) => setTaskNote(selectedTaskId, v)}
                    onEditStep={handleEditStep}
                    onContextMenu={handleContextMenu}
                    onReorderSteps={(ns) => handleReorderSteps(selectedTaskId, ns)}
                    onDeleteStep={(sid) => handleDeleteStep(selectedTaskId, sid)}
                    onUpdateStep={(sid, up) => handleUpdateStep(selectedTaskId, sid, up)}
                    onJumpToTask={handleJumpToTask}
                    onUpdateTask={updateTask}
                />
            </main>

            <EditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                step={editingStep}
                onSave={(s) => {
                    handleUpdateStep(selectedTaskId, s.id, s);
                    setIsEditModalOpen(false);
                }}
            />
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConfirm={(name) => handleCreateTask(name, newTaskType)}
                existingTasks={tasks}
                taskType={newTaskType}
            />
            <CreateStepModal
                isOpen={isCreateStepModalOpen}
                onClose={() => setIsCreateStepModalOpen(false)}
                onConfirm={(step) => handleCreateStep(selectedTaskId, step)}
            />
            <CascadingContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                isOpen={contextMenu.isOpen}
                onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
                tasks={tasks}
                onSelectTask={(task) => handleAddTaskFromMenu(selectedTaskId, task, contextMenu.targetStepId)}
                onAddEmptyRow={() => handleAddEmptyRow(selectedTaskId)}
                onDeleteRow={() => {
                    if (contextMenu.targetStepId) handleDeleteStep(selectedTaskId, contextMenu.targetStepId);
                }}
                hasTarget={!!contextMenu.targetStepId}
            />
            <ImportModals
                isConfirmOpen={isImportConfirmOpen}
                isPasteOpen={isPasteModalOpen}
                pasteText={pasteText}
                onPasteTextChange={setPasteText}
                onConfirmImport={confirmImport}
                onCancelConfirm={cancelImport}
                onPasteImport={() => processPasteText(pasteText)}
                onClosePaste={() => setIsPasteModalOpen(false)}
            />
        </div>
    );
}
