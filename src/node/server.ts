import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database path
  const dbPath = path.join(process.cwd(), 'data', 'db.json');

  // Helper to read DB
  const readDb = () => {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
    return { tasks: [], steps: {}, notes: {} };
  };

  const writeDb = (db: any) => {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  };

  // API Routes
  app.get('/api/tasks', (req, res) => {
    const db = readDb();
    res.json(db.tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const db = readDb();
    const newTask = req.body;
    db.tasks = [newTask, ...db.tasks];
    writeDb(db);
    res.json(newTask);
  });

  app.put('/api/tasks/:id', (req, res) => {
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

  app.delete('/api/tasks/:id', (req, res) => {
    const db = readDb();
    db.tasks = db.tasks.filter((t: any) => t.id !== req.params.id);
    delete db.steps[req.params.id];
    delete db.notes[req.params.id];
    writeDb(db);
    res.json({ success: true });
  });

  app.get('/api/tasks/:id', (req, res) => {
    const db = readDb();
    const task = db.tasks.find((t: any) => t.id === req.params.id);
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: "任务不存在" });
    }
  });

  app.get('/api/tasks/:id/steps', (req, res) => {
    const db = readDb();
    const steps = (db.steps && db.steps[req.params.id]) || [];
    res.json(steps);
  });

  app.put('/api/tasks/:id/steps', (req, res) => {
    const db = readDb();
    if (!db.steps) db.steps = {};
    db.steps[req.params.id] = req.body;
    writeDb(db);
    res.json(db.steps[req.params.id]);
  });

  app.get('/api/tasks/:id/note', (req, res) => {
    const db = readDb();
    const note = db.notes && db.notes[req.params.id];
    if (note) {
      res.json({ taskId: req.params.id, note });
    } else {
      res.json({ taskId: req.params.id, note: "" }); // Return empty string if not found
    }
  });

  app.put('/api/tasks/:id/note', (req, res) => {
    const db = readDb();
    if (!db.notes) db.notes = {};
    db.notes[req.params.id] = req.body.note;
    writeDb(db);
    res.json({ taskId: req.params.id, note: db.notes[req.params.id] });
  });

  app.get('/api/export', (req, res) => {
    const db = readDb();
    const exportedTasks = db.tasks.map((task: any) => ({
      ...task,
      steps: (db.steps && db.steps[task.id]) || []
    }));
    res.json(exportedTasks);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
