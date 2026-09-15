import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await api.get('/workspaces');
      if (response.success && Array.isArray(response.data)) {
        setWorkspaces(response.data);
      }
    } catch (err) {
      console.error('[Workspaces Fetch Error]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspaces</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your collaborative workspaces and workspace memberships.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Create Workspace
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            title="No workspaces found"
            description="You do not belong to any workspace currently."
            action={
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Workspace
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((item) => (
              <Link
                key={item.workspace.id}
                to={`/workspaces/${item.workspace.id}`}
                className="p-5 border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-base">
                      {item.workspace.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                      {item.role}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                    {item.workspace.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">slug: {item.workspace.slug}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Joined {new Date(item.joinedAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Open Workspace →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          fetchWorkspaces();
        }}
      />
    </div>
  );
}
