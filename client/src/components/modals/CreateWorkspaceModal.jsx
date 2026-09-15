import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import api from '../../services/api';

export default function CreateWorkspaceModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Workspace name is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/workspaces', { name: name.trim() });
      if (response.success && response.data) {
        setName('');
        onCreated(response.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Workspace"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Create Workspace
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} onClose={() => setError('')} />
        <Input
          label="Workspace Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Corp Marketing"
          required
          disabled={loading}
          helpText="URL slug will be generated automatically."
        />
      </form>
    </Modal>
  );
}
