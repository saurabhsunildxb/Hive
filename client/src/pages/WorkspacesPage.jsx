import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';
import { useToast } from '../context/ToastContext';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await api.get('/workspaces');
      if (response.success && Array.isArray(response.data)) {
        setWorkspaces(response.data);
      }
    } catch (err) {
      console.error('[Workspaces Fetch Error]', err.message);
      toast.error(err.message || 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Workspaces</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your collaborative workspaces and team memberships.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <span className="text-sm font-bold">+</span>
          <span>Create Workspace</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            title="No workspaces found"
            description="You do not belong to any workspace currently. Create your first workspace to start organizing projects."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                Create Workspace
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((item) => (
              <Link
                key={item.workspace.id}
                to={`/workspaces/${item.workspace.id}`}
                className="p-4.5 bg-white border border-slate-200/90 rounded-xl hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-transform">
                      {item.workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                      {item.role}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-0.5 truncate tracking-tight">
                    {item.workspace.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono truncate">slug: {item.workspace.slug}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Joined {new Date(item.joinedAt).toLocaleDateString()}</span>
                  <span className="font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Open</span>
                    <span>→</span>
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
          toast.success('Workspace created successfully!');
        }}
      />
    </div>
  );
}
