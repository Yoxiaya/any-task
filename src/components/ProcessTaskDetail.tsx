import React from 'react';
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, TaskStep } from '../types';

interface ProcessTaskDetailProps {
  selectedTask: Task;
  steps: TaskStep[];
  notes: string;
  onUpdateNotes: (notes: string) => void;
  onEditStep: (step: TaskStep) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function ProcessTaskDetail({
  selectedTask,
  steps,
  notes,
  onUpdateNotes,
  onEditStep,
  onContextMenu
}: ProcessTaskDetailProps) {
  return (
    <section className="flex-1 bg-background overflow-hidden p-8 flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Task Notes Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">任务备注</label>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-outline-variant font-medium">失去焦点自动保存</span>
          </div>
        </div>
        <textarea 
          key={selectedTask.id}
          className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium resize-none custom-scrollbar"
          placeholder="在此输入任务备注..."
          rows={3}
          defaultValue={notes}
          onBlur={(e) => onUpdateNotes(e.target.value)}
        />
      </div>

      <div 
        onContextMenu={onContextMenu}
        className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 flex flex-col flex-1"
      >
        <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-container-high border-b border-outline-variant/20">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[8%]">序号</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[12%]">任务类</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[25%]">任务名</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[12%]">成功跳转</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[12%]">失败跳转</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest w-[23%]">失败提示</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right w-[8%]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {steps.map((step) => (
                <tr key={step.id} className="shimmer-row group hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{step.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                      step.category === 'INIT_SYSTEM' ? 'bg-blue-100 text-blue-700' :
                      step.category === 'DB_CONN' ? 'bg-purple-100 text-purple-700' :
                      step.category === 'CACHE_WARM' ? 'bg-amber-100 text-amber-700' :
                      step.category === 'SEC_POL' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {step.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-on-surface">{step.name}</td>
                  <td className="px-6 py-4 text-sm text-tertiary font-medium">{step.successJump}</td>
                  <td className="px-6 py-4 text-sm text-error font-medium">{step.failureJump}</td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant italic">{step.failureTip}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onEditStep(step)}
                      className="text-outline-variant hover:text-primary transition-all"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/10 flex justify-between items-center shrink-0">
          <span className="text-xs text-on-surface-variant font-medium">共计 {steps.length} 条记录</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-lowest text-outline-variant transition-all">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-on-primary shadow-sm font-bold text-xs">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-lowest text-on-surface-variant font-medium text-xs">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-lowest text-outline-variant transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
