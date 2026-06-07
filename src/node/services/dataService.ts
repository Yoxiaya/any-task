import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─── 路径配置 ───

const dataDir = path.join(process.cwd(), "data");
const projectsMetaPath = path.join(dataDir, "projects.json");
const legacyDbPath = path.join(dataDir, "db.json");

const getProjectsDir = () => path.join(dataDir, "projects");
const getProjectDbPath = (projectId: string) => path.join(getProjectsDir(), projectId, "db.json");
const getProjectDir = (projectId: string) => path.join(getProjectsDir(), projectId);

// ─── JSON 读写工具 ───

const readJson = (filePath: string, fallback: any = null) => {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, "utf-8");
            if (!data.trim()) return fallback;
            return JSON.parse(data);
        }
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
    }
    return fallback;
};

const writeJson = (filePath: string, data: any) => {
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
        console.error(`Error writing ${filePath}:`, e);
    }
};

// ─── ID 生成 ───

export const generateProjectId = () => "proj-" + crypto.randomBytes(6).toString("hex");

// ─── 默认数据库结构 ───

export const defaultDb = () => ({
    rootTaskId: "T-1001",
    tasks: [{ id: "T-1001", name: "顶级任务", type: "流程" }],
    steps: { "T-1001": [] },
    notes: {},
});

// ─── 项目数据库读写 ───

export const readDb = (projectId: string) => {
    if (!projectId) return defaultDb();
    const dbPath = getProjectDbPath(projectId);
    if (!fs.existsSync(dbPath)) {
        const db = defaultDb();
        writeJson(dbPath, db);
        return db;
    }
    const db = readJson(dbPath, defaultDb());

    // 数据迁移：补全 rootTaskId + 将 "顶级" 类型转换为 "流程"
    let migrated = false;
    if (!db.rootTaskId) {
        const root = db.tasks?.find((t: any) => t.type === "顶级" || t.id === "T-1001");
        db.rootTaskId = root?.id || db.tasks?.[0]?.id || "";
        migrated = true;
    }
    if (db.tasks) {
        db.tasks.forEach((t: any) => {
            if (t.type === "顶级") {
                t.type = "流程";
                migrated = true;
            }
        });
    }
    if (db.steps) {
        Object.values(db.steps).forEach((steps: any) => {
            if (Array.isArray(steps)) {
                steps.forEach((s: any) => {
                    if (s.category === "顶级") {
                        s.category = "流程";
                        migrated = true;
                    }
                });
            }
        });
    }
    if (migrated) {
        writeJson(dbPath, db);
        console.log(`[Migration] Updated types in project: ${projectId}`);
    }
    return db;
};

export const writeDb = (projectId: string, db: any) => {
    if (!projectId) return;
    writeJson(getProjectDbPath(projectId), db);
};

// ─── 项目列表管理 ───

export const readProjects = (): any[] => readJson(projectsMetaPath, []);

export const writeProjects = (projects: any[]) => writeJson(projectsMetaPath, projects);

export const deleteProjectDir = (projectId: string) => {
    const dir = getProjectDir(projectId);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
};

// ─── 导入辅助函数 ───

export const buildDbFromTasks = (tasks: any[]) => {
    const db = { tasks: [] as any[], steps: {} as any, notes: {} as any };
    tasks.forEach((t: any) => {
        const meta = { ...t };
        const steps = meta.steps || [];
        const note = meta.note || "";
        delete meta.steps;
        delete meta.note;
        db.tasks.push(meta);
        db.steps[meta.id] = steps;
        db.notes[meta.id] = note;
    });
    return db;
};

export const mergeTasks = (db: any, importedTasks: any[]) => {
    const nameMap: Map<string, number> = new Map(db.tasks.map((t: any, i: number) => [t.name, i]));
    importedTasks.forEach((t: any) => {
        const meta = { ...t };
        const steps = meta.steps || [];
        const note = meta.note || "";
        delete meta.steps;
        delete meta.note;

        const idx = nameMap.get(meta.name);
        if (idx !== undefined) {
            meta.id = db.tasks[idx].id;
            db.tasks[idx] = meta;
        } else {
            db.tasks.push(meta);
        }
        db.steps[meta.id] = steps;
        db.notes[meta.id] = note;
    });
};

export const extractImportTasks = (body: any): any[] | null => {
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.tasks)) return body.tasks;
    return null;
};

export const buildExportPayload = (db: any, taskId?: string) => {
    let tasks = db.tasks;
    if (taskId) {
        // 递归收集选中的任务及其所有引用的子任务：
        //   1. 步骤名称 → 任务名称（流程步骤引用的子任务）
        //   2. scheduledConfig.targetTaskId → 任务 ID（定时任务引用的目标）
        const collectedIds = new Set<string>();

        const collectReferencedTasks = (tid: string) => {
            if (collectedIds.has(tid)) return;
            collectedIds.add(tid);

            // 收集步骤名称引用的任务
            const taskSteps: any[] = (db.steps && db.steps[tid]) || [];
            for (const step of taskSteps) {
                if (step.name) {
                    const refTask = tasks.find((t: any) => t.name === step.name && t.id !== tid);
                    if (refTask) {
                        collectReferencedTasks(refTask.id);
                    }
                }
            }

            // 收集定时任务 scheduledConfig.targetTaskId 引用的目标任务
            const currentTask = tasks.find((t: any) => t.id === tid);
            if (currentTask?.scheduledConfig?.targetTaskId) {
                const targetId = currentTask.scheduledConfig.targetTaskId;
                if (targetId && !collectedIds.has(targetId)) {
                    collectReferencedTasks(targetId);
                }
            }
        };

        collectReferencedTasks(taskId);
        tasks = tasks.filter((t: any) => collectedIds.has(t.id));
    }
    return {
        rootTaskId: db.rootTaskId || db.tasks[0]?.id || "",
        exportedAt: new Date().toISOString(),
        tasks: tasks.map((t: any) => ({
            ...t,
            steps: (db.steps && db.steps[t.id]) || [],
            note: (db.notes && db.notes[t.id]) || "",
        })),
    };
};

// ─── 数据迁移 ───

export const migrateLegacyData = () => {
    if (!fs.existsSync(legacyDbPath)) return;
    const legacyData = readJson(legacyDbPath);
    if (!legacyData?.tasks?.length) {
        try {
            fs.unlinkSync(legacyDbPath);
        } catch {}
        return;
    }
    const existing = readJson(projectsMetaPath, []);
    if (existing.length > 0) {
        try {
            fs.unlinkSync(legacyDbPath);
        } catch {}
        return;
    }
    const id = generateProjectId();
    writeJson(getProjectDbPath(id), legacyData);
    writeJson(projectsMetaPath, [{ id, name: "默认项目", createdAt: new Date().toISOString() }]);
    try {
        fs.unlinkSync(legacyDbPath);
    } catch {}
    console.log(`[Migration] Legacy db.json → project: ${id}`);
};
