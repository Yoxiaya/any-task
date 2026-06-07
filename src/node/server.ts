import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import taskRoutes from "./routes/taskRoutes";

async function startServer() {
    const app = express();
    const PORT = 3030;

    app.use(express.json());

    // 使用独立的路由模块
    app.use("/api", taskRoutes);

    // 开发模式挂载 Vite 中间件
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: {
                middlewareMode: true,
                hmr: process.env.DISABLE_HMR === "true" ? false : { port: 0 },
            },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (_req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
