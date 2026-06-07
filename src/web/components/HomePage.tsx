import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FolderPlus, Upload, MoreHorizontal, Trash2, PenLine, ExternalLink } from "lucide-react";
import { useProjectStore } from "../store/projectStore";
import { useAppConfigStore } from "../store/appConfigStore";

const getDefaultName = (existingNames: string[], base: string): string => {
    if (!existingNames.includes(base)) return base;
    let i = 1;
    while (existingNames.includes(`${base}_${i}`)) {
        i++;
    }
    return `${base}_${i}`;
};

export default function HomePage() {
    const { t } = useTranslation();
    const { projects, createProject, importProject, deleteProject, renameProject, openTab } = useProjectStore();
    const appName = useAppConfigStore((s) => s.config.appName);
    const [showCreate, setShowCreate] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [showImport, setShowImport] = useState(false);
    const [importName, setImportName] = useState("");
    const [importData, setImportData] = useState<any[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 右键菜单状态
    const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    // 重命名弹窗状态
    const [showRename, setShowRename] = useState(false);
    const [renameId, setRenameId] = useState("");
    const [renameName, setRenameName] = useState("");

    // 删除确认弹窗状态
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState("");

    // 点击外部区域关闭右键菜单
    useEffect(() => {
        if (!menuProjectId) return;
        const close = () => setMenuProjectId(null);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [menuProjectId]);

    const handleCreate = () => {
        const existingNames = projects.map((p) => p.name);
        const defaultName = getDefaultName(existingNames, t("project.default_name"));
        setProjectName(defaultName);
        setShowCreate(true);
    };

    const handleCreateConfirm = async () => {
        const name = projectName.trim() || t("project.default_name");
        await createProject(name);
        setShowCreate(false);
    };

    const handleImportClick = () => {
        setShowImport(false);
        setImportData(null);
        setImportName("");
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            // 兼容新格式（{rootTaskId, exportedAt, tasks}）和旧格式（纯数组）
            let tasks: any[];
            if (Array.isArray(data)) {
                tasks = data;
            } else if (data && Array.isArray(data.tasks)) {
                tasks = data.tasks;
            } else {
                tasks = [data];
            }
            setImportData(tasks);
            const firstName = tasks[0]?.name || file.name.replace(".json", "");
            setImportName(firstName);
            setShowImport(true);
        } catch (err) {
            alert("无法解析文件，请确认是有效的 JSON 文件。");
        }
        e.target.value = "";
    };

    const handleImportConfirm = async () => {
        const name = importName.trim() || t("project.default_name");
        await importProject(name, importData!);
        setShowImport(false);
        setImportData(null);
    };

    const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuProjectId(projectId);
        setMenuPos({ x: e.clientX, y: e.clientY });
    };

    const handleOpenProject = (id: string) => {
        openTab(id);
        setMenuProjectId(null);
    };

    const handleRenameClick = () => {
        const project = projects.find((p) => p.id === menuProjectId);
        if (project) {
            setRenameId(project.id);
            setRenameName(project.name);
            setShowRename(true);
        }
        setMenuProjectId(null);
    };

    const handleRenameConfirm = async () => {
        const name = renameName.trim();
        if (name) {
            await renameProject(renameId, name);
        }
        setShowRename(false);
    };

    const handleDeleteClick = () => {
        const project = projects.find((p) => p.id === menuProjectId);
        if (project) {
            setDeleteId(project.id);
            setShowDeleteConfirm(true);
        }
        setMenuProjectId(null);
    };

    const handleDeleteConfirm = async () => {
        await deleteProject(deleteId);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-surface-container-low">
            <div className="text-center w-full max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-headline font-bold text-primary mb-2">{appName}</h1>
                    <p className="text-on-surface-variant text-lg">{t("home.subtitle")}</p>
                </div>

                <div className="flex gap-8 justify-center items-start">
                    {/* 左侧：创建 / 导入按钮 */}
                    <div className="flex flex-col gap-2.5 shrink-0 pt-1">
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold shadow-md shadow-primary/15 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-px transition-all"
                        >
                            <FolderPlus size={18} />
                            {t("home.create_project")}
                        </button>

                        <button
                            onClick={handleImportClick}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-surface-container-high text-on-surface rounded-xl text-sm font-semibold border border-outline-variant/30 hover:bg-surface-container-highest hover:-translate-y-px transition-all"
                        >
                            <Upload size={18} />
                            {t("home.import_project")}
                        </button>
                    </div>

                    {/* 右侧：项目目录（始终可见，防止布局抖动） */}
                    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm w-72 overflow-hidden flex flex-col">
                        <div className="px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 bg-surface-container-low shrink-0">
                            {t("home.project_list")} ({projects.length})
                        </div>
                        <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 236 }}>
                            {projects.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-on-surface-variant/50 text-center">
                                    {t("home.empty_project_list")}
                                </div>
                            ) : (
                                projects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => handleOpenProject(project.id)}
                                        className="flex items-center justify-between px-4 py-2.5 hover:bg-primary/5 cursor-pointer transition-colors group"
                                    >
                                        <span className="text-sm text-on-surface truncate flex-1 text-left">
                                            {project.name}
                                        </span>
                                        <button
                                            onClick={(e) => handleContextMenu(e, project.id)}
                                            className="p-1 rounded-md text-on-surface-variant opacity-0 group-hover:opacity-100 hover:bg-surface-container-highest transition-all shrink-0"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 右键菜单 */}
                {menuProjectId && (
                    <div
                        className="fixed bg-surface-container-highest border border-outline-variant/20 rounded-xl shadow-xl py-1 z-50 overflow-hidden min-w-36"
                        style={{ left: menuPos.x - 8, top: menuPos.y - 8 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => handleOpenProject(menuProjectId)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-primary/10 transition-colors"
                        >
                            <ExternalLink size={14} />
                            {t("project.open")}
                        </button>
                        <button
                            onClick={handleRenameClick}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-primary/10 transition-colors"
                        >
                            <PenLine size={14} />
                            {t("project.rename")}
                        </button>
                        <div className="border-t border-outline-variant/10 my-1" />
                        <button
                            onClick={handleDeleteClick}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                        >
                            <Trash2 size={14} />
                            {t("project.delete")}
                        </button>
                    </div>
                )}

                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />

                {/* 创建项目弹窗 */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-surface p-6 rounded-2xl w-full max-w-sm border border-outline-variant/20 shadow-xl">
                            <h3 className="text-xl font-bold text-on-surface mb-4">{t("project.create_title")}</h3>
                            <input
                                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none mb-6"
                                placeholder={t("project.name_placeholder")}
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateConfirm();
                                }}
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-medium transition-colors"
                                    onClick={() => setShowCreate(false)}
                                >
                                    {t("buttons.cancel")}
                                </button>
                                <button
                                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                                    onClick={handleCreateConfirm}
                                >
                                    {t("buttons.confirm")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 导入确认弹窗 */}
                {showImport && importData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-surface p-6 rounded-2xl w-full max-w-sm border border-outline-variant/20 shadow-xl">
                            <h3 className="text-xl font-bold text-on-surface mb-2">{t("project.import_title")}</h3>
                            <p className="text-on-surface-variant text-sm mb-4">
                                {t("project.import_desc", { count: importData.length })}
                            </p>
                            <input
                                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none mb-6"
                                placeholder={t("project.name_placeholder")}
                                value={importName}
                                onChange={(e) => setImportName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleImportConfirm();
                                }}
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-medium transition-colors"
                                    onClick={() => setShowImport(false)}
                                >
                                    {t("buttons.cancel")}
                                </button>
                                <button
                                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                                    onClick={handleImportConfirm}
                                >
                                    {t("buttons.confirm")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 重命名弹窗 */}
                {showRename && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-surface p-6 rounded-2xl w-full max-w-sm border border-outline-variant/20 shadow-xl">
                            <h3 className="text-xl font-bold text-on-surface mb-4">{t("project.rename_title")}</h3>
                            <input
                                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none mb-6"
                                value={renameName}
                                onChange={(e) => setRenameName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameConfirm();
                                }}
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-medium transition-colors"
                                    onClick={() => setShowRename(false)}
                                >
                                    {t("buttons.cancel")}
                                </button>
                                <button
                                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                                    onClick={handleRenameConfirm}
                                >
                                    {t("buttons.confirm")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 删除确认弹窗 */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-surface p-6 rounded-2xl w-full max-w-sm border border-outline-variant/20 shadow-xl">
                            <h3 className="text-xl font-bold text-on-surface mb-2">{t("project.delete_title")}</h3>
                            <p className="text-on-surface-variant text-sm mb-6">
                                {t("project.delete_desc", {
                                    name: projects.find((p) => p.id === deleteId)?.name || "",
                                })}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-medium transition-colors"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    {t("buttons.cancel")}
                                </button>
                                <button
                                    className="px-4 py-2 bg-error text-white rounded-lg font-medium shadow-md shadow-error/20 hover:bg-error/90 transition-all"
                                    onClick={handleDeleteConfirm}
                                >
                                    {t("project.delete")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
