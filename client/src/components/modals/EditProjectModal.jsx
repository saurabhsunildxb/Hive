import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import api from '../../services/api';

export default function EditProjectModal({ isOpen, onClose, project, onUpdated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setError('');
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch(`/projects/${project.id}`, {
        name: name.trim(),
        description: description.trim() || null,
      });

      if (response.success && response.data?.project) {
        onUpdated(response.data.project);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to update project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} onClose={() => setError('')} />
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={loading}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50"
          />
        </div>
      </form>
    </Modal>
  );
}
