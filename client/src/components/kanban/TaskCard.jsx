import React from 'react';

export default function TaskCard({ task, onSelect, onStatusChange }) {
  const priorityColors = {
    LOW: 'bg-blue-50 text-blue-700 border-blue-200',
    MEDIUM: 'bg-slate-100 text-slate-600 border-slate-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const nextStatusMap = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'DONE',
    DONE: 'TODO',
  };

  return (
    <div
      onClick={() => onSelect(task)}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between gap-3"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border tracking-wider ${priorityColors[task.priority] || ''}`}>
            {task.priority}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, nextStatusMap[task.status]);
            }}
            title={`Move to ${nextStatusMap[task.status]?.replace('_', ' ')}`}
            className="text-[11px] font-medium text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors"
          >
            Move →
          </button>
        </div>
        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate max-w-[60%]">
          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
            {task.assignee ? task.assignee.name.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="truncate text-slate-600 font-medium">
            {task.assignee ? task.assignee.name : 'Unassigned'}
          </span>
        </div>

        {task.dueDate && (
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
