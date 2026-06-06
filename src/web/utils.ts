import { Task, TaskStep, TaskType } from "./types";

// Extract number from id like 'P-1001' -> 1001
export const extractIdNumber = (id: string, defaultVal: number): number => {
    const num = parseInt(id.split("-")[1], 10);
    return isNaN(num) ? defaultVal : num;
};

// Generate next id like 'P-1002'
export const generateNextTaskId = (tasks: Task[], type: TaskType, defaultStart: number = 2000): string => {
    const prefix = type === "定时" ? "S" : "P";
    const maxIdNum = tasks.reduce((max, t) => Math.max(max, extractIdNumber(t.id, defaultStart)), defaultStart);
    return `${prefix}-${maxIdNum + 1}`;
};

export const generateNextStepId = (steps: TaskStep[]): string => {
    const maxId = steps.reduce((max, step) => {
        const num = parseInt(step.id, 10);
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return (maxId + 1).toString().padStart(2, "0");
};

export const getCategoryLabel = (category: string, t: any) => {
    switch (category) {
        case "流程":
            return t("task_type.process");
        case "定时":
            return t("task_type.scheduled");
        case "-":
            return t("common.uncategorized");
        default:
            return category;
    }
};
