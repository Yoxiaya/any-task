# Any Task

基于 Express + Vite + React 的任务流程管理应用，支持多项目、多 Tab、数据导入导出。

## 技术栈

- **前端**: React 19 + Zustand + Tailwind CSS + Motion + i18next
- **后端**: Node.js + Express + tsx（热重载）
- **构建**: Vite + esbuild
- **数据**: 本地 JSON 文件存储

## 目录结构

```
├── src/
│   ├── web/                  # 前端
│   │   ├── components/       # 组件
│   │   ├── hooks/            # 自定义 hooks
│   │   ├── store/            # Zustand 状态管理
│   │   ├── locales/          # i18n 翻译（中/英）
│   │   ├── types.ts          # 类型定义
│   │   └── utils.ts          # 工具函数
│   └── node/
│       ├── server.ts         # Express 入口
│       ├── routes/           # 路由定义
│       └── services/         # 数据访问层
├── data/
│   ├── projects.json         # 项目元数据
│   └── projects/<id>/db.json # 各项目任务数据
├── app-config.json           # 应用配置（可提交 git）
└── example.md                # 导出数据格式示例
```

## 快速开始

```bash
npm install
npm run dev        # 启动开发模式 → http://localhost:3000
npm run build      # 生产构建
npm start          # 生产运行
npm run format     # Prettier 格式化
```

## 核心概念

### 任务类型 (`TaskType`)

```typescript
type TaskType = "流程" | "定时";
```

- **流程任务**: 包含子步骤（`TaskStep`）的常规任务
- **定时任务**: 具有定时配置（周期、目标）的特殊任务
- **根任务**: 项目入口任务，由 `db.rootTaskId` 标识，左侧列表置顶蓝色高亮

### 项目 (`Project`)

```typescript
interface Project {
    id: string;       // 自动生成，如 "proj-abc123"
    name: string;     // 项目名称
    createdAt: string; // 创建时间
}
```

每个项目有独立的 `data/projects/<id>/db.json`，包含 `rootTaskId`、`tasks`、`steps`、`notes`。

### 任务步骤 (`TaskStep`)

```typescript
interface TaskStep {
    id: string;        // 序号，如 "01"
    category: string;  // 引用的任务分类
    name: string;      // 引用的任务名
    successJump: string; // 成功跳转
    failureJump: string; // 失败跳转
    failureTip: string;  // 失败提示
}
```

## 导出数据格式 (`/api/export`)

```json
{
    "rootTaskId": "T-1001",
    "exportedAt": "2026-01-01T00:00:00.000Z",
    "tasks": [
        {
            "id": "T-1001",
            "name": "顶级任务",
            "type": "流程",
            "steps": [...],
            "note": ""
        }
    ]
}
```

导入兼容新旧两种格式（对象含 `tasks` 字段或裸数组），同名任务覆盖、不同名合并。

## 后端 API

所有接口路径前缀 `/api`，除 projects 和 config 外均需 `?projectId=` 参数。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/config` | 读取应用配置 |
| PUT | `/config` | 更新配置 `{ appName?, tabTitle? }` |
| GET | `/projects` | 列出所有项目 |
| POST | `/projects` | 创建项目 `{ name }` |
| PUT | `/projects/:id` | 重命名项目 `{ name }` |
| DELETE | `/projects/:id` | 删除项目及其数据 |
| POST | `/projects/import` | 导入项目 `{ name, tasks }` |
| GET | `/tasks` | 获取 `{ rootTaskId, tasks }` |
| POST | `/tasks` | 创建任务 |
| GET | `/tasks/:id` | 获取单个任务 |
| PUT | `/tasks/:id` | 更新任务 |
| DELETE | `/tasks/:id` | 删除任务 |
| GET | `/tasks/:id/steps` | 获取步骤列表 |
| PUT | `/tasks/:id/steps` | 更新步骤列表 |
| GET | `/tasks/:id/note` | 获取备注 |
| PUT | `/tasks/:id/note` | 更新备注 `{ note }` |
| GET | `/export` | 导出数据（可选 `?taskId=`） |
| POST | `/import` | 导入合并数据 |
| POST | `/run` | 日志输出任务数据 |

## 应用配置 (`app-config.json`)

```json
{
    "appName": "Any Task",
    "tabTitle": "Any Task"
}
```

- `appName`: 首页标题
- `tabTitle`: 浏览器标签页标题

## 功能概览

- **多项目管理**: 首页创建/导入项目，Tab 栏切换，刷新保持当前 Tab
- **任务目录**: 左侧搜索、筛选，根任务蓝色置顶
- **流程详情**: 步骤编辑、拖拽排序、右键菜单
- **定时任务**: 周期配置、关联目标
- **导入导出**: 自选目录、剪贴板复制、JSON 合并导入
- **国际化**: 中/英文切换
- **代码规范**: Prettier（4 缩进 / 120 行宽）
