import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

import CreateProjectModal from '../components/modals/CreateProjectModal';
import AddMemberModal from '../components/modals/AddMemberModal';
import ConfirmModal from '../components/modals/ConfirmModal';

export default function WorkspaceDetailsPage() {
  const { workspaceId } = useParams();
  const { toast } = useToast();

  const {
    joinWorkspace,
    leaveWorkspace,
  } = useSocket();

  const [workspace, setWorkspace] = useState(null);
  const [role, setRole] = useState('');
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('projects');

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const [projectsLoading, setProjectsLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [membersError, setMembersError] = useState('');

  useEffect(() => {
    joinWorkspace(workspaceId);

    return () => {
      leaveWorkspace(workspaceId);
    };
  }, [workspaceId, joinWorkspace, leaveWorkspace]);

  const fetchWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const wsRes = await api.get(`/workspaces/${workspaceId}`);

      if (wsRes.success && wsRes.data) {
        setWorkspace(wsRes.data.workspace);
        setRole(wsRes.data.role);
      }
    } catch (err) {
      console.error('[Workspace Load Error]', err.message);
      setError(err.message || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError('');

    try {
      const projectsRes = await api.get(`/workspaces/${workspaceId}/projects`);

      if (projectsRes.success && Array.isArray(projectsRes.data?.projects)) {
        setProjects(projectsRes.data.projects);
      }
    } catch (err) {
      console.error('[Projects Load Error]', err.message);
      setProjectsError(err.message || 'Failed to load projects.');
    } finally {
      setProjectsLoading(false);
    }
  }, [workspaceId]);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError('');

    try {
      const membersRes = await api.get(`/workspaces/${workspaceId}/members`);

      if (membersRes.success && Array.isArray(membersRes.data)) {
        setMembers(membersRes.data);
      }
    } catch (err) {
      console.error('[Members Load Error]', err.message);
      setMembersError(err.message || 'Failed to load workspace members.');
    } finally {
      setMembersLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
    fetchProjects();
    fetchMembers();
  }, [fetchWorkspace, fetchProjects, fetchMembers]);

  const isOwner = role === 'OWNER';
  const isAdminOrOwner = ['OWNER', 'ADMIN'].includes(role);

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const response = await api.patch(
        `/workspaces/${workspaceId}/members/${targetUserId}`,
        { role: newRole }
      );

      if (response.success && response.data?.membership) {
        setMembers((prev) =>
          prev.map((m) =>
            m.user?.id === targetUserId ? { ...m, role: newRole } : m
          )
        );
        toast.success('Member role updated.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemoving(true);

    try {
      const response = await api.delete(
        `/workspaces/${workspaceId}/members/${memberToRemove.user?.id}`
      );

      if (response.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
        toast.success('Member removed from workspace.');
        setMemberToRemove(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove member.');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error || 'Workspace not found.'} />
        <Link to="/workspaces" className="text-xs font-semibold text-indigo-600 hover:underline">
          ← Back to Workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-xl shadow-xs border border-indigo-400/20">
            {workspace.name.charAt(0).toUpperCase()}
          </span>

          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {workspace.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              slug: {workspace.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            Role: {role}
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer relative flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Projects</span>
            <span className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full ${activeTab === 'projects' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
              {projects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer relative flex items-center gap-2 ${
              activeTab === 'members'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Members</span>
            <span className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full ${activeTab === 'members' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
              {members.length}
            </span>
          </button>
        </div>

        <div className="pb-2.5">
          {activeTab === 'projects' && (
            <Button variant="primary" size="sm" onClick={() => setShowCreateProject(true)}>
              + Create Project
            </Button>
          )}

          {activeTab === 'members' && isAdminOrOwner && (
            <Button variant="primary" size="sm" onClick={() => setShowAddMember(true)}>
              + Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Projects Tab Content */}
      {activeTab === 'projects' && (
        <div>
          {projectsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : projectsError ? (
            <div className="space-y-3">
              <ErrorMessage message={projectsError} />
              <Button variant="secondary" size="sm" onClick={fetchProjects}>
                Retry Loading Projects
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects in this workspace"
              description="Create a project to start managing tasks and collaborating with your team."
              action={
                <Button variant="primary" size="sm" onClick={() => setShowCreateProject(true)}>
                  Create First Project
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <Link
                  key={proj.id}
                  to={`/workspaces/${workspaceId}/projects/${proj.id}`}
                  className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate tracking-tight mb-1">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-8 leading-relaxed">
                      {proj.description || <span className="italic text-slate-400">No description provided.</span>}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Created {new Date(proj.createdAt).toLocaleDateString()}</span>
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
      )}

      {/* Members Tab Content */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {membersLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : membersError ? (
            <div className="p-5 space-y-3">
              <ErrorMessage message={membersError} />
              <Button variant="secondary" size="sm" onClick={fetchMembers}>
                Retry Loading Members
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Joined</th>
                    {isAdminOrOwner && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {members.map((m) => {
                    const canChangeRole = isOwner && m.role !== 'OWNER';
                    const canRemove = (isOwner && m.role !== 'OWNER') || (role === 'ADMIN' && m.role === 'MEMBER');

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-[11px] shrink-0 shadow-2xs">
                            {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span>{m.user?.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{m.user?.email}</td>
                        <td className="py-3 px-4">
                          {canChangeRole ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.user?.id, e.target.value)}
                              className="text-[11px] font-semibold py-1 px-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none cursor-pointer"
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                                m.role === 'OWNER'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : m.role === 'ADMIN'
                                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                              }`}
                            >
                              {m.role}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(m.joinedAt || m.createdAt).toLocaleDateString()}
                        </td>
                        {isAdminOrOwner && (
                          <td className="py-3 px-4 text-right">
                            {canRemove && (
                              <button
                                onClick={() => setMemberToRemove(m)}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        workspaceId={workspaceId}
        onCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          toast.success('Project created successfully!');
        }}
      />

      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        workspaceId={workspaceId}
        onAdded={(newMem) => {
          setMembers((prev) => [...prev, newMem]);
          toast.success('Member added to workspace!');
        }}
      />

      <ConfirmModal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Workspace Member"
        message={`Are you sure you want to remove ${memberToRemove?.user?.name} (${memberToRemove?.user?.email}) from this workspace?`}
        confirmText="Remove Member"
        isLoading={removing}
      />
    </div>
  );
}