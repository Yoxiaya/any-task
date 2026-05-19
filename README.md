# Any-Task

基于 Express + Vite 构建的任务管理全栈（前端 React，后端 Node.js）应用。

## 目录结构

系统代码主要划分为前后端两部分：
- `src/web/` - 前端 React 相关的组件、页面、Hooks、Store 和类型定义等。
- `src/node/` - 后端 Node.js (Express) 服务相关代码。
- `data/` - 后端任务数据 JSON 存储目录。

## 数据结构与核心模型

本系统中的核心任务数据结构及相关数据类型基于 TypeScript 接口定义。

### 1. 任务 (Task)

`Task` 是系统中表示独立工作单元的基本结构。

```typescript
interface Task {
  id: string;          // 任务唯一标识，例如：'T-1001', 'P-1002'等
  name: string;        // 任务名称
  type: TaskType;      // 任务类型
  scheduledConfig?: {  // 定时配置项（通常在 type 为 '定时' 时存在）
    mode: 'open' | 'close' | 'close_all'; // 定时模式：开启(open)、关闭(close)、全部关闭(close_all)
    cycle: number;                        // 周期或延迟时间（单位：秒）
    targetTaskId?: string;                // 该定时任务所关联的目标任务 ID
  };
}
```

**任务类型 (TaskType)**:

目前支持三种类别任务，用字符串字面量联合类型表示：
```typescript
type TaskType = '顶级' | '流程' | '定时';
```

- **顶级任务**: 固定为业务链条的起点，默认置顶排列。
- **流程任务**: 包含明确拆分子步骤（`TaskStep`）的常规任务。
- **定时任务**: 附有生命周期设定、执行间隔触发规则的特殊任务。

### 2. 任务步骤/子项 (TaskStep)

左侧任务目录中的任务主要通过此结构来关联和体现它的子操作流程：

```typescript
interface TaskStep {
  id: string;          // 步骤的顺序 ID 标识，如 '01', '02'
  _uid?: string;       // 步骤在系统前端用于内部渲染和拖拽排序的唯一标识
  category: string;    // 该步骤所引用任务的分类/类型 ('流程', '定时', '逻辑'等)
  name: string;        // 该步骤引用的任务具体名称
  successJump: string; // 成功时跳转的目标步骤 ID 或者指令
  failureJump: string; // 失败时跳转的目标步骤 ID 或者指令
  failureTip: string;  // 失败时显示的提示信息文本
}
```

### 3. 完整的任务导出结构 (ExportData)

由于任务与步骤在后端数据或前端状态 `store` 中被拆分管理，在用户执行导出功能时会自动生成一棵嵌套的数据树：

```typescript
interface ExportedTask extends Task {
  steps: TaskStep[]; 
}
type ExportData = ExportedTask[];
```

---

## 快速开始

### 依赖与运行

```bash
# 安装依赖
npm install

# 仅编译接口类型
npm run lint

# 启动开发模式 (同时启动 前端vite 和 express 热重载)
npm run dev

# 编译生成生产代码 (产出在 dist/ 目录)
npm run build

# 生产环境运行
npm start
```

服务启动后访问: `http://localhost:3000`

---

## 后端 API 接口文档

### 基础路径

`http://localhost:3000/api`

### 接口列表

| HTTP方法 | 接口路径           | 功能描述                     |
| -------- | ------------------ | ---------------------------- |
| GET      | `/tasks`           | 获取所有任务列表             |
| GET      | `/tasks/:id`       | 获取单个任务详情             |
| GET      | `/tasks/:id/steps` | 获取任务的子步骤列表         |
| GET      | `/tasks/:id/note`  | 获取任务备注                 |
| GET      | `/export`          | 导出完整任务数据（嵌套结构） |

*(详细响应体结构对应上述定义的模型结构。)*
