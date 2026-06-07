import express from "express";
import {
    migrateLegacyData,
    readProjects,
    writeProjects,
    deleteProjectDir,
    generateProjectId,
    defaultDb,
    readDb,
    writeDb,
    buildDbFromTasks,
    mergeTasks,
    extractImportTasks,
    buildExportPayload,
} from "../services/dataService";

const router = express.Router();

// Run migration on startup
migrateLegacyData();

// Helper
const getProjectId = (req: express.Request): string => (req.query.projectId as string) || "";

// ─── Projects ───

router.get("/projects", (_req, res) => {
    res.json(readProjects());
});

router.post("/projects", (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "项目名称不能为空" });

    const project = { id: generateProjectId(), name: name.trim(), createdAt: new Date().toISOString() };
    const projects = readProjects();
    projects.push(project);
    writeProjects(projects);
    writeDb(project.id, defaultDb());

    res.json(project);
});

router.put("/projects/:id", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "项目名称不能为空" });

    const projects = readProjects();
    const project = projects.find((p: any) => p.id === id);
    if (!project) return res.status(404).json({ error: "项目不存在" });

    project.name = name.trim();
    writeProjects(projects);
    res.json(project);
});

router.delete("/projects/:id", (req, res) => {
    const { id } = req.params;
    const projects = readProjects().filter((p: any) => p.id !== id);
    writeProjects(projects);
    deleteProjectDir(id);
    res.json({ success: true });
});

router.post("/projects/import", (req, res) => {
    const { name, tasks: importedTasks } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "项目名称不能为空" });

    const project = { id: generateProjectId(), name: name.trim(), createdAt: new Date().toISOString() };
    const projects = readProjects();
    projects.push(project);
    writeProjects(projects);

    const db = Array.isArray(importedTasks) && importedTasks.length > 0 ? buildDbFromTasks(importedTasks) : defaultDb();
    writeDb(project.id, db);

    res.json(project);
});

// ─── Tasks ───

router.get("/tasks", (req, res) => {
    const db = readDb(getProjectId(req));
    res.json({ rootTaskId: db.rootTaskId || "", tasks: db.tasks });
});

router.post("/tasks", (req, res) => {
    const pid = getProjectId(req);
    const db = readDb(pid);
    db.tasks = [req.body, ...db.tasks];
    writeDb(pid, db);
    res.json(req.body);
});

router.get("/tasks/:id", (req, res) => {
    const db = readDb(getProjectId(req));
    const task = db.tasks.find((t: any) => t.id === req.params.id);
    task ? res.json(task) : res.status(404).json({ error: "任务不存在" });
});

router.put("/tasks/:id", (req, res) => {
    const db = readDb(getProjectId(req));
    const idx = db.tasks.findIndex((t: any) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "任务不存在" });
    db.tasks[idx] = { ...db.tasks[idx], ...req.body };
    writeDb(getProjectId(req), db);
    res.json(db.tasks[idx]);
});

router.delete("/tasks/:id", (req, res) => {
    const pid = getProjectId(req);
    const db = readDb(pid);
    db.tasks = db.tasks.filter((t: any) => t.id !== req.params.id);
    delete db.steps[req.params.id];
    delete db.notes[req.params.id];
    writeDb(pid, db);
    res.json({ success: true });
});

// ─── Steps ───

router.get("/tasks/:id/steps", (req, res) => {
    const db = readDb(getProjectId(req));
    res.json((db.steps && db.steps[req.params.id]) || []);
});

router.put("/tasks/:id/steps", (req, res) => {
    const pid = getProjectId(req);
    const db = readDb(pid);
    if (!db.steps) db.steps = {};
    db.steps[req.params.id] = req.body;
    writeDb(pid, db);
    res.json(db.steps[req.params.id]);
});

// ─── Notes ───

router.get("/tasks/:id/note", (req, res) => {
    const db = readDb(getProjectId(req));
    const note = db.notes?.[req.params.id];
    res.json({ taskId: req.params.id, note: note || "" });
});

router.put("/tasks/:id/note", (req, res) => {
    const pid = getProjectId(req);
    const db = readDb(pid);
    if (!db.notes) db.notes = {};
    db.notes[req.params.id] = req.body.note;
    writeDb(pid, db);
    res.json({ taskId: req.params.id, note: db.notes[req.params.id] });
});

// ─── Export / Import ───

router.get("/export", (req, res) => {
    const pid = getProjectId(req);
    const db = readDb(pid);
    const taskId = req.query.taskId as string | undefined;
    console.log("[GET /api/export] projectId:", pid, "taskId:", taskId);
    res.json(buildExportPayload(db, taskId));
});

router.post("/import", (req, res) => {
    const pid = getProjectId(req);
    const tasks = extractImportTasks(req.body);
    if (!tasks) return res.status(400).json({ error: "无效的导入数据" });

    const db = readDb(pid);
    mergeTasks(db, tasks);
    writeDb(pid, db);
    res.json({ merged: true });
});

// ─── Run ───

router.post("/run", (req, res) => {
    console.log("---------- RUN TASK ----------");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("------------------------------");
    res.json({ success: true, message: "Task data logged on server." });
});

export default router;
