# Any-Task API

基于 Express + TypeScript 构建的任务管理后端服务。

## 功能特性

- 获取任务列表
- 获取单个任务详情
- 获取任务子步骤
- 获取任务备注
- 导出完整任务数据

## 技术栈

- Node.js
- Express
- TypeScript
- JSON 文件存储

## 快速开始

### 安装依赖

```bash
npm install
```

### 编译项目

```bash
npm run build
```

### 启动服务

```bash
npm start
```

服务启动后访问: `http://localhost:3000`

### 开发模式

```bash
npm run dev
```

## 接口文档

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

### 1. GET /api/tasks

**功能**: 获取所有任务列表

**请求参数**: 无

**成功响应** (200 OK):

```json
[
	{
		"id": "T-1001",
		"name": "用户注册流程",
		"type": "顶级"
	},
	{
		"id": "P-1002",
		"name": "订单处理流程",
		"type": "流程"
	},
	{
		"id": "S-1003",
		"name": "每日数据同步",
		"type": "定时",
		"scheduledConfig": {
			"mode": "open",
			"cycle": 86400,
			"targetTaskId": "P-1004"
		}
	}
]
```

### 2. GET /api/tasks/:id

**功能**: 获取单个任务详情

**路径参数**:

| 参数名 | 类型   | 说明         |
| ------ | ------ | ------------ |
| id     | string | 任务唯一标识 |

**成功响应** (200 OK):

```json
{
	"id": "S-1003",
	"name": "每日数据同步",
	"type": "定时",
	"scheduledConfig": {
		"mode": "open",
		"cycle": 86400,
		"targetTaskId": "P-1004"
	}
}
```

**失败响应** (404 Not Found):

```json
{
	"error": "任务不存在"
}
```

### 3. GET /api/tasks/:id/steps

**功能**: 获取任务的子步骤列表

**路径参数**:

| 参数名 | 类型   | 说明         |
| ------ | ------ | ------------ |
| id     | string | 任务唯一标识 |

**成功响应** (200 OK):

```json
[
	{
		"id": "01",
		"_uid": "step-001",
		"category": "流程",
		"name": "验证订单信息",
		"successJump": "02",
		"failureJump": "end",
		"failureTip": "订单信息验证失败"
	},
	{
		"id": "02",
		"_uid": "step-002",
		"category": "流程",
		"name": "扣减库存",
		"successJump": "03",
		"failureJump": "01",
		"failureTip": "库存不足"
	}
]
```

### 4. GET /api/tasks/:id/note

**功能**: 获取任务备注

**路径参数**:

| 参数名 | 类型   | 说明         |
| ------ | ------ | ------------ |
| id     | string | 任务唯一标识 |

**成功响应** (200 OK):

```json
{
	"taskId": "P-1002",
	"note": "处理订单的完整流程"
}
```

### 5. GET /api/export

**功能**: 导出完整任务数据（包含步骤的嵌套结构）

**请求参数**: 无

**成功响应** (200 OK):

```json
[
	{
		"id": "T-1001",
		"name": "用户注册流程",
		"type": "顶级",
		"steps": []
	},
	{
		"id": "P-1002",
		"name": "订单处理流程",
		"type": "流程",
		"steps": [
			{
				"id": "01",
				"_uid": "step-001",
				"category": "流程",
				"name": "验证订单信息",
				"successJump": "02",
				"failureJump": "end",
				"failureTip": "订单信息验证失败"
			}
		]
	}
]
```

## 数据结构

### Task（任务）

| 字段名          | 类型            | 必填 | 说明         |
| --------------- | --------------- | ---- | ------------ |
| id              | string          | 是   | 任务唯一标识 |
| name            | string          | 是   | 任务名称     |
| type            | TaskType        | 是   | 任务类型     |
| scheduledConfig | ScheduledConfig | 否   | 定时配置     |

### TaskType（任务类型）

- **顶级**: 顶级入口任务
- **流程**: 包含子步骤的常规任务
- **定时**: 带有执行间隔规则的任务

### ScheduledConfig（定时配置）

| 字段名       | 类型                             | 必填 | 说明            |
| ------------ | -------------------------------- | ---- | --------------- |
| mode         | 'open' \| 'close' \| 'close_all' | 是   | 定时模式        |
| cycle        | number                           | 是   | 周期时间（秒）  |
| targetTaskId | string                           | 否   | 关联目标任务 ID |

### TaskStep（任务步骤）

| 字段名      | 类型   | 必填 | 说明         |
| ----------- | ------ | ---- | ------------ |
| id          | string | 是   | 步骤编号     |
| \_uid       | string | 否   | 前端唯一标识 |
| category    | string | 是   | 步骤分类     |
| name        | string | 是   | 步骤名称     |
| successJump | string | 是   | 成功跳转目标 |
| failureJump | string | 是   | 失败跳转目标 |
| failureTip  | string | 是   | 失败提示信息 |

## 项目结构

```
any-task-api/
├── src/
│   ├── index.ts          # 服务器入口
│   └── types/
│       └── index.ts      # 类型定义
├── data/
│   └── tasks.json        # 数据文件
├── dist/                 # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```
