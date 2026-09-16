import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('ALL');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await api.get('/workspaces');
        if (response.success && Array.isArray(response.data)) {
          const wsList = response.data;
          setWorkspaces(wsList);
          setLoading(false);

          let totalProjects = 0;
          const userAssignedList = [];

          await Promise.all(
            wsList.map(async (item) => {
              try {
                const projectsRes = await api.get(`/workspaces/${item.workspace.id}/projects`);
                if (projectsRes.success && Array.isArray(projectsRes.data?.projects)) {
                  const projects = projectsRes.data.projects;
                  totalProjects += projects.length;

                  await Promise.all(
                    projects.map(async (proj) => {
                      try {
                        const tasksRes = await api.get(`/projects/${proj.id}/tasks`);
                        if (tasksRes.success && Array.isArray(tasksRes.data?.tasks)) {
                          const assigned = tasksRes.data.tasks.filter(
                            (task) => task.assigneeId === user?.id || task.assignee?.id === user?.id
                          );

                          assigned.forEach((t) => {
                            userAssignedList.push({
                              ...t,
                              workspaceId: item.workspace.id,
                              workspaceName: item.workspace.name,
                              projectId: proj.id,
                              projectName: proj.name,
                            });
                          });
                        }
                      } catch (tErr) {
                        console.error(`[Dashboard Task Count Error for project ${proj.id}]`, tErr.message);
                      }
                    })
                  );
                }
              } catch (pErr) {
                console.error(`[Dashboard Project Count Error for workspace ${item.workspace.id}]`, pErr.message);
              }
            })
          );

          setActiveProjectsCount(totalProjects);
          userAssignedList.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
          });
          setAssignedTasks(userAssignedList);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[Dashboard Fetch Error]', err.message);
        setLoading(false);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const statusPills = {
    TODO: 'bg-slate-100 text-slate-700 border-slate-200/90',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  };

  const priorityColors = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200/90',
    MEDIUM: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    HIGH: 'bg-amber-50 text-amber-800 border-amber-200/80',
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  const filteredTasks = assignedTasks.filter((t) => {
    if (taskFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (taskFilter === 'TODO') return t.status === 'TODO';
    if (taskFilter === 'DONE') return t.status === 'DONE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Compact Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-5 sm:p-6 text-white shadow-2xs border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'User'} 👋
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Real-time workspace overview, assigned tasks, and active projects across your organization.
          </p>
        </div>

        <Link
          to="/workspaces"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shrink-0 cursor-pointer shadow-2xs"
        >
          <span>Explore Workspaces</span>
          <span>→</span>
        </Link>
      </div>

      {/* SaaS Metric Widgets (3-up Compact) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Workspaces</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {loading ? <span className="text-slate-300">...</span> : workspaces.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Projects</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {statsLoading ? <span className="text-slate-300">...</span> : activeProjectsCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">My Tasks</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {statsLoading ? <span className="text-slate-300">...</span> : assignedTasks.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* "My Work" Task Section (Asana / Linear style dense layout) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">My Assigned Work</h2>
            <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {filteredTasks.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'IN_PROGRESS', 'TODO', 'DONE'].map((f) => (
              <button
                key={f}
                onClick={() => setTaskFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  taskFilter === f
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {f === 'ALL' ? 'All Tasks' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {statsLoading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner size="sm" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/30">
              <p className="text-xs text-slate-500 font-medium">No tasks found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                    <th className="py-2.5 px-4">Task</th>
                    <th className="py-2.5 px-4">Project / Workspace</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                          <Link
                            to={`/workspaces/${task.workspaceId}/projects/${task.projectId}`}
                            className="hover:text-indigo-600 transition-colors line-clamp-1"
                          >
                            {task.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="font-medium text-slate-800">{task.projectName}</span>
                          <span className="text-slate-400 text-[11px] ml-1 font-mono">({task.workspaceName})</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${priorityColors[task.priority] || ''}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${statusPills[task.status] || ''}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {task.dueDate ? (
                            <span className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              {isOverdue && <span className="ml-1 text-[10px] uppercase text-rose-600">(Overdue)</span>}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">No due date</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/workspaces/${task.workspaceId}/projects/${task.projectId}`}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Workspaces Summary Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Your Workspaces</h2>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-200/70 text-slate-700">
              {workspaces.length}
            </span>
          </div>
          <Link
            to="/workspaces"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
          >
            <span>View all</span>
            <span>→</span>
          </Link>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : workspaces.length === 0 ? (
            <EmptyState
              title="No workspaces joined yet"
              description="You are not a member of any workspace. Join or create a workspace to get started."
              action={
                <Link
                  to="/workspaces"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                >
                  Create First Workspace
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((item) => (
                <Link
                  key={item.workspace.id}
                  to={`/workspaces/${item.workspace.id}`}
                  className="p-4 bg-white border border-slate-200/90 rounded-xl hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold flex items-center justify-center text-base shadow-2xs group-hover:scale-105 transition-transform">
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

                  <div className="mt-4 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span>Joined {new Date(item.joinedAt).toLocaleDateString()}</span>
                    <span className="font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Open →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
