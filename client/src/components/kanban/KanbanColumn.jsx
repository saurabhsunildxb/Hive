import React from 'react';
import TaskCard from './TaskCard';

export default function KanbanColumn({
  title,
  status,
  tasks = [],
  color = 'bg-slate-100 text-slate-700',
  onSelectTask,
  onStatusChange,
}) {
  return (
    <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">{title}</h3>
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${color}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {tasks.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl bg-white/40">
            <p className="text-xs text-slate-400 font-medium">No tasks in {title.toLowerCase()}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
