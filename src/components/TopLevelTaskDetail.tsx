import React from 'react';
import { Task } from '../types';
import { Activity, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

interface TopLevelTaskDetailProps {
  selectedTask: Task;
}

export default function TopLevelTaskDetail({ selectedTask }: TopLevelTaskDetailProps) {
  return (
    <section className="flex-1 bg-background overflow-hidden p-8 flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
          {selectedTask.name} <span className="text-primary text-lg ml-2">#{selectedTask.id}</span>
        </h1>
        <p className="text-on-surface-variant max-w-2xl">
          这是顶级任务的概览视图。顶级任务通常用于定义系统架构的核心组件或全局策略。
          您可以在此处查看该任务的健康状态、安全合规性以及执行效率。
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {[
          { label: '系统健康度', value: '98.2%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '安全合规性', value: 'A+', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '平均响应', value: '124ms', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '资源占用', value: '14.5%', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col gap-4">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</div>
              <div className="text-2xl font-black text-on-surface">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-on-surface">架构概览</h3>
        <div className="flex-1 border-2 border-dashed border-outline-variant/20 rounded-xl flex items-center justify-center text-on-surface-variant italic text-sm">
          [ 架构拓扑图占位符 ]
        </div>
      </div>
    </section>
  );
}
