import React from 'react';
import KanbanColumn from './KanbanColumn';

export default function KanbanBoard({ tasks = [], onSelectTask, onStatusChange }) {
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      <KanbanColumn
        title="Todo"
        status="TODO"
        tasks={todoTasks}
        color="bg-slate-200 text-slate-700"
        onSelectTask={onSelectTask}
        onStatusChange={onStatusChange}
      />

      <KanbanColumn
        title="In Progress"
        status="IN_PROGRESS"
        tasks={inProgressTasks}
        color="bg-indigo-100 text-indigo-700"
        onSelectTask={onSelectTask}
        onStatusChange={onStatusChange}
      />

      <KanbanColumn
        title="Done"
        status="DONE"
        tasks={doneTasks}
        color="bg-emerald-100 text-emerald-700"
        onSelectTask={onSelectTask}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
