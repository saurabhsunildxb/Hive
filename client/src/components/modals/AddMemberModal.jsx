import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import api from '../../services/api';

export default function AddMemberModal({ isOpen, onClose, workspaceId, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/workspaces/${workspaceId}/members`, {
        email: email.trim(),
        role,
      });

      if (response.success && response.data?.membership) {
        setEmail('');
        setRole('MEMBER');
        onAdded(response.data.membership);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Workspace Member"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Add Member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} onClose={() => setError('')} />
        <Input
          label="User Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          required
          disabled={loading}
          helpText="User must already have an account on Hive."
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Workspace Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2 text-sm bg-white text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            <option value="MEMBER">MEMBER (Can view/edit tasks & projects)</option>
            <option value="ADMIN">ADMIN (Can manage projects & add/remove members)</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}
