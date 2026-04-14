export type TaskType = '顶级' | '流程' | '定时';

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  scheduledConfig?: {
    mode: 'open' | 'close' | 'close_all';
    cycle: number;
    targetTaskId?: string;
  };
}

export interface TaskStep {
  id: string;
  category: string;
  name: string;
  successJump: string;
  failureJump: string;
  failureTip: string;
}
