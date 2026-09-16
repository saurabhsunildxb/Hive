import React from 'react';

export default function TaskCard({ task, onSelect, onStatusChange }) {
  const priorityColors = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200/90',
    MEDIUM: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    HIGH: 'bg-amber-50 text-amber-800 border-amber-200/80',
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  const nextStatusMap = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'DONE',
    DONE: 'TODO',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
  const commentCount = task._count?.comments ?? (Array.isArray(task.comments) ? task.comments.length : null);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(task)}
      className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing group flex flex-col justify-between gap-2.5 select-none relative"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 group-hover:text-slate-400 transition-colors" title="Drag to reorder">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a1 1 0 100-2 1 1 0 000 2zM13 4a1 1 0 100-2 1 1 0 000 2zM7 10a1 1 0 100-2 1 1 0 000 2zM13 10a1 1 0 100-2 1 1 0 000 2zM7 16a1 1 0 100-2 1 1 0 000 2zM13 16a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
            </span>
            <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${priorityColors[task.priority] || ''}`}>
              {task.priority}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, nextStatusMap[task.status]);
            }}
            title={`Move to ${nextStatusMap[task.status]?.replace('_', ' ')}`}
            className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Move</span>
            <span>→</span>
          </button>
        </div>

        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 tracking-tight leading-snug">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
        )}
      </div>

      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate max-w-[60%]">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0 shadow-2xs border border-white">
            {task.assignee ? task.assignee.name.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="truncate text-slate-700 font-semibold text-[11px]">
            {task.assignee ? task.assignee.name : 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {commentCount !== null && commentCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-medium">
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>{commentCount}</span>
            </span>
          )}

          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                isOverdue
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200/60'
              }`}
            >
              <svg className={`w-3 h-3 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
