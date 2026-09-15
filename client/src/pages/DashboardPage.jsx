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
  const [assignedTasksCount, setAssignedTasksCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await api.get('/workspaces');
        if (response.success && Array.isArray(response.data)) {
          const wsList = response.data;
          setWorkspaces(wsList);
          setLoading(false);

          // Calculate Active Projects and Assigned Tasks
          let totalProjects = 0;
          let totalAssignedTasks = 0;

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
                          totalAssignedTasks += assigned.length;
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
          setAssignedTasksCount(totalAssignedTasks);
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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-indigo-200 text-sm sm:text-base max-w-2xl">
          Here is an overview of your real-time collaborative workspaces and projects in Hive.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Your Workspaces</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '-' : workspaces.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Projects</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{statsLoading ? '-' : activeProjectsCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Assigned Tasks</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{statsLoading ? '-' : assignedTasksCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Workspaces Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Your Workspaces</h2>
          <Link
            to="/workspaces"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : workspaces.length === 0 ? (
            <EmptyState
              title="No workspaces joined yet"
              description="You are not a member of any workspace. Join or create a workspace to get started."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((item) => (
                <Link
                  key={item.workspace.id}
                  to={`/workspaces/${item.workspace.id}`}
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {item.workspace.name}
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                        {item.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate">slug: {item.workspace.slug}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                    <span>Joined {new Date(item.joinedAt).toLocaleDateString()}</span>
                    <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
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
