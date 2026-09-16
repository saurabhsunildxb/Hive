import React, { useState } from 'react';
import TaskCard from './TaskCard';

export default function KanbanColumn({
  title,
  status,
  tasks = [],
  color = 'bg-slate-100 text-slate-700',
  onSelectTask,
  onStatusChange,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const statusDots = {
    TODO: 'bg-slate-400',
    IN_PROGRESS: 'bg-indigo-500',
    DONE: 'bg-emerald-500',
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onStatusChange) {
      onStatusChange(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col min-h-[550px] max-h-full shadow-2xs ${
        isDragOver
          ? 'bg-indigo-50/50 border-indigo-400 border-2 ring-4 ring-indigo-500/10 scale-[1.01]'
          : 'bg-slate-100/80 border-slate-200/90'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 mb-3.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${statusDots[status] || 'bg-slate-400'}`} />
          <h3 className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">{title}</h3>
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full border border-slate-200/80 ${color}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {tasks.length === 0 ? (
          <div
            className={`p-8 text-center border-2 border-dashed rounded-xl flex flex-col items-center justify-center min-h-[180px] transition-colors ${
              isDragOver ? 'border-indigo-400 bg-indigo-50/40 text-indigo-600' : 'border-slate-200/90 bg-white/50 text-slate-400'
            }`}
          >
            <p className="text-xs font-semibold">
              {isDragOver ? `Drop task here for ${title}` : `No tasks in ${title.toLowerCase()}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Drag task cards here to update status</p>
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
