import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import api from '../../services/api';

export default function CreateTaskModal({ isOpen, onClose, projectId, members = [], onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeId: assigneeId || undefined,
      });

      if (response.success && response.data?.task) {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setStatus('TODO');
        setDueDate('');
        setAssigneeId('');
        onCreated(response.data.task);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Create Task
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} onClose={() => setError('')} />

        <Input
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Implement JWT authentication"
          required
          disabled={loading}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details, requirements, or links..."
            rows={3}
            disabled={loading}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50"
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Due Date (Optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={loading}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Assignee (Optional)</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.user?.id}>
                  {m.user?.name} ({m.user?.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
