import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  userRole,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  if (!task) return null;

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(userRole);

  const priorityColors = {
    LOW: 'bg-blue-50 text-blue-700 border-blue-200',
    MEDIUM: 'bg-slate-100 text-slate-700 border-slate-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const statusColors = {
    TODO: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700',
    DONE: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {isOwnerOrAdmin && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(task);
                }}
              >
                Delete Task
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              Edit Task
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Title & Badges */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusColors[task.status] || ''}`}>
              {task.status?.replace('_', ' ')}
            </span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${priorityColors[task.priority] || ''}`}>
              {task.priority} PRIORITY
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Description</h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3.5 rounded-lg border border-slate-200 min-h-[4rem]">
            {task.description || <span className="italic text-slate-400">No description provided.</span>}
          </p>
        </div>

        {/* Quick Status Action */}
        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-700">Quick Move:</span>
          <div className="flex items-center gap-1.5">
            {['TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
              <button
                key={s}
                disabled={task.status === s}
                onClick={() => onStatusChange(task.id, s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  task.status === s
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-slate-500 font-medium">Assignee:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {task.assignee ? `${task.assignee.name} (${task.assignee.email})` : <span className="italic text-slate-400">Unassigned</span>}
            </p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Creator:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {task.creator ? `${task.creator.name} (${task.creator.email})` : 'System'}
            </p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Due Date:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Created / Updated:</span>
            <p className="text-slate-600 mt-0.5">
              {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
