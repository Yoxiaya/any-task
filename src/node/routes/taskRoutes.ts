import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Database path
const dbPath = path.join(process.cwd(), "data", "db.json");

// Helper to read DB
const readDb = () => {
    const defaultDb = {
        tasks: [{ id: "T-1001", name: "顶级任务", type: "流程" }],
        steps: { "T-1001": [] },
        notes: {},
    };
    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, "utf-8");
            if (!data.trim()) return defaultDb;
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error reading db.json:", e);
    }
    return defaultDb;
};

const writeDb = (db: any) => {
    try {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    } catch (e) {
        console.error("Error writing db.json:", e);
    }
};

// API Routes
router.get("/tasks", (_req, res) => {
    const db = readDb();
    res.json(db.tasks);
});

router.post("/tasks", (req, res) => {
    const db = readDb();
    const newTask = req.body;
    db.tasks = [newTask, ...db.tasks];
    writeDb(db);
    res.json(newTask);
});

router.put("/tasks/:id", (req, res) => {
    const db = readDb();
    const index = db.tasks.findIndex((t: any) => t.id === req.params.id);
    if (index !== -1) {
        db.tasks[index] = { ...db.tasks[index], ...req.body };
        writeDb(db);
        res.json(db.tasks[index]);
    } else {
        res.status(404).json({ error: "任务不存在" });
    }
});

router.delete("/tasks/:id", (req, res) => {
    const db = readDb();
    db.tasks = db.tasks.filter((t: any) => t.id !== req.params.id);
    delete db.steps[req.params.id];
    delete db.notes[req.params.id];
    writeDb(db);
    res.json({ success: true });
});

router.get("/tasks/:id", (req, res) => {
    const db = readDb();
    const task = db.tasks.find((t: any) => t.id === req.params.id);
    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ error: "任务不存在" });
    }
});

router.get("/tasks/:id/steps", (req, res) => {
    const db = readDb();
    const steps = (db.steps && db.steps[req.params.id]) || [];
    res.json(steps);
});

router.put("/tasks/:id/steps", (req, res) => {
    const db = readDb();
    if (!db.steps) db.steps = {};
    db.steps[req.params.id] = req.body;
    writeDb(db);
    res.json(db.steps[req.params.id]);
});

router.get("/tasks/:id/note", (req, res) => {
    const db = readDb();
    const note = db.notes && db.notes[req.params.id];
    if (note) {
        res.json({ taskId: req.params.id, note });
    } else {
        res.json({ taskId: req.params.id, note: "" }); // Return empty string if not found
    }
});

router.put("/tasks/:id/note", (req, res) => {
    const db = readDb();
    if (!db.notes) db.notes = {};
    db.notes[req.params.id] = req.body.note;
    writeDb(db);
    res.json({ taskId: req.params.id, note: db.notes[req.params.id] });
});

router.get("/export", (req, res) => {
    const db = readDb();
    const taskId = req.query.taskId as string | undefined;
    console.log("[GET /api/export] taskId:", taskId, "| db.tasks count:", db.tasks.length);

    let tasksToExport = db.tasks;
    if (taskId) {
        tasksToExport = db.tasks.filter((t: any) => t.id === taskId);
    }
    console.log("[GET /api/export] filtered count:", tasksToExport.length);

    const exportedTasks = tasksToExport.map((task: any) => ({
        ...task,
        steps: (db.steps && db.steps[task.id]) || [],
        note: (db.notes && db.notes[task.id]) || "",
    }));
    res.json(exportedTasks);
});

router.post("/import", (req, res) => {
    const importedTasks = req.body;

    if (!Array.isArray(importedTasks)) {
        return res.status(400).json({ error: "无效的导入数据" });
    }

    const newDb = {
        tasks: [] as any[],
        steps: {} as any,
        notes: {} as any,
    };

    importedTasks.forEach((importedTask: any) => {
        const taskMeta = { ...importedTask };
        const steps = taskMeta.steps || [];
        const note = taskMeta.note || "";
        delete taskMeta.steps;
        delete taskMeta.note;

        newDb.tasks.push(taskMeta);
        newDb.steps[taskMeta.id] = steps;
        newDb.notes[taskMeta.id] = note;
    });

    writeDb(newDb);
    res.json({ success: true });
});

router.post("/run", (req, res) => {
    console.log("---------- RUN TASK ----------");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("------------------------------");
    res.json({ success: true, message: "Task data logged on server." });
});

export default router;
