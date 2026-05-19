# Any-Task 任务数据结构文档

本文档描述了 Any-Task 系统中的核心任务数据结构及相关数据类型（基于 TypeScript 接口定义）。

## 1. 任务 (Task)

`Task` 是系统中表示独立工作单元的基本结构，可以是一个流程、一个定时任务或是唯一的顶级入口任务。

```typescript
interface Task {
  id: string;          // 任务唯一标识，例如：'T-1001', 'P-1002'等
  name: string;        // 任务名称
  type: TaskType;      // 任务类型（见下文）
  scheduledConfig?: {  // 定时配置项（通常在 type 为 '定时' 时存在）
    mode: 'open' | 'close' | 'close_all'; // 定时模式：开启(open)、关闭(close)、全部关闭(close_all)
    cycle: number;                        // 周期或延迟时间（单位：秒/毫秒等依据业务定）
    targetTaskId?: string;                // 该定时任务所关联的目标任务 ID
  };
}
```

### 1.1 任务类型 (TaskType)

系统目前支持三种类别任务，用字符串字面量联合类型表示：
```typescript
type TaskType = '顶级' | '流程' | '定时';
```

- **顶级任务 (Top level)**: 顶级入口任务。固定为业务链条的起点，默认置顶排列。
- **流程任务 (Process)**: 包含明确拆分子步骤（`TaskStep`）的常规任务。
- **定时任务 (Scheduled)**: 附有生命周期设定、执行间隔触发规则的特殊任务。

---

## 2. 任务步骤/子项 (TaskStep)

左侧任务目录中的任务主要通过此结构来关联和体现它的子操作流程（任务子项）：

```typescript
interface TaskStep {
  id: string;          // 步骤的顺序 ID 标识，一般是以 '01', '02' 填充格式的编号
  _uid?: string;       // 步骤在系统前端用于内部渲染和拖拽排序的唯一标识
  category: string;    // 该步骤所引用任务的分类/类型 ('流程', '定时', '逻辑'等)
  name: string;        // 该步骤引用的任务具体名称
  successJump: string; // 成功时跳转的目标步骤 ID 或者指令
  failureJump: string; // 失败时跳转的目标步骤 ID 或者指令
  failureTip: string;  // 失败时在应用或日志中显示的提示信息文本
}
```

---

## 3. 运行时的存储映射

在系统前端的 `hooks` (`useTaskManagement`) 和状态管理中，任务和子步骤是拆分存储的，便于分别修改：

```typescript
// 1. 基础任务列表
const tasks: Task[];

// 2. 任务-步骤隐式映射（taskId -> 其包含的下级步骤队列）
const taskSteps: Record<string, TaskStep[]>;

// 3. 任务备注列表（taskId -> 备注正文）
const taskNotes: Record<string, string>;
```

---

## 4. 完整的任务导出结构 (ExportData)

在用户执行应用级的数据导出功能时，上述拆分存储的数据由于具备 `taskId` 关系，会通过合并得到一个嵌套的结构树数据展示（控制台打印或 JSON 下载）：

```typescript
interface ExportedTask extends Task {
  // 当前任务内包含的一系列子任务/子步骤执行节点
  steps: TaskStep[]; 
}

// 导出时实际的数据类型
type ExportData = ExportedTask[];
```
