import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─── Paths ───

const dataDir = path.join(process.cwd(), "data");
const projectsMetaPath = path.join(dataDir, "projects.json");
const legacyDbPath = path.join(dataDir, "db.json");
const configPath = path.join(process.cwd(), "app-config.json");

const getProjectsDir = () => path.join(dataDir, "projects");
const getProjectDbPath = (projectId: string) => path.join(getProjectsDir(), projectId, "db.json");
const getProjectDir = (projectId: string) => path.join(getProjectsDir(), projectId);

// ─── JSON helpers ───

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

// ─── ID generation ───

export const generateProjectId = () => "proj-" + crypto.randomBytes(6).toString("hex");

// ─── Default DB ───

export const defaultDb = () => ({
    rootTaskId: "T-1001",
    tasks: [{ id: "T-1001", name: "顶级任务", type: "流程" }],
    steps: { "T-1001": [] },
    notes: {},
});

// ─── Project DB ───

export const readDb = (projectId: string) => {
    if (!projectId) return defaultDb();
    const dbPath = getProjectDbPath(projectId);
    if (!fs.existsSync(dbPath)) {
        const db = defaultDb();
        writeJson(dbPath, db);
        return db;
    }
    const db = readJson(dbPath, defaultDb());

    // Migration: ensure rootTaskId + convert "顶级" → "流程"
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

// ─── Projects list ───

export const readProjects = (): any[] => readJson(projectsMetaPath, []);

export const writeProjects = (projects: any[]) => writeJson(projectsMetaPath, projects);

export const deleteProjectDir = (projectId: string) => {
    const dir = getProjectDir(projectId);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
};

// ─── Import helpers ───

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
    if (taskId) tasks = tasks.filter((t: any) => t.id === taskId);
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

// ─── Config ───

const defaultConfig = { appName: "Any Task", tabTitle: "Any Task" };

export const readAppConfig = () => readJson(configPath, defaultConfig);
export const writeAppConfig = (config: any) => writeJson(configPath, config);

// ─── Migration ───

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
