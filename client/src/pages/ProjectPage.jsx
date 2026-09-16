import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Button from '../components/ui/Button';

import KanbanBoard from '../components/kanban/KanbanBoard';

import EditProjectModal from '../components/modals/EditProjectModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import EditTaskModal from '../components/modals/EditTaskModal';
import TaskDetailModal from '../components/modals/TaskDetailModal';
import ConfirmModal from '../components/modals/ConfirmModal';

export default function ProjectPage() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    socket,
    joinProject,
    leaveProject,
  } = useSocket();

  const commentCallbacksRef = useRef({
    onCreated: null,
    onUpdated: null,
    onDeleted: null,
  });

  const [project, setProject] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);

  useEffect(() => {
    joinProject(projectId);

    return () => {
      leaveProject(projectId);
    };
  }, [projectId, joinProject, leaveProject]);

  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      if (newTask.projectId !== projectId) return;

      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) {
          return prev;
        }
        return [newTask, ...prev];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      if (updatedTask.projectId !== projectId) return;

      setTasks((prev) => {
        if (!prev.some((t) => t.id === updatedTask.id)) {
          return prev;
        }
        return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      });

      setSelectedTask((prev) => {
        if (prev?.id === updatedTask.id) {
          return updatedTask;
        }
        return prev;
      });
    };

    const handleTaskDeleted = ({ id, projectId: deletedProjectId }) => {
      if (deletedProjectId !== projectId) return;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      
      setSelectedTask((prev) => {
        if (prev?.id === id) return null;
        return prev;
      });

      setTaskToEdit((prev) => {
        if (prev?.id === id) return null;
        return prev;
      });
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    const handleCommentCreated = (newComment) => {
      if (commentCallbacksRef.current.onCreated) {
        commentCallbacksRef.current.onCreated(newComment);
      }
    };

    const handleCommentUpdated = (updatedComment) => {
      if (commentCallbacksRef.current.onUpdated) {
        commentCallbacksRef.current.onUpdated(updatedComment);
      }
    };

    const handleCommentDeleted = (deletedInfo) => {
      if (commentCallbacksRef.current.onDeleted) {
        commentCallbacksRef.current.onDeleted(deletedInfo);
      }
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);

      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:updated', handleCommentUpdated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [socket, projectId]);

  useEffect(() => {
    async function loadProjectData() {
      setLoading(true);
      setError('');

      try {
        const [
          projRes,
          wsRes,
          membersRes,
          tasksRes,
        ] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/workspaces/${workspaceId}`),
          api.get(`/workspaces/${workspaceId}/members`),
          api.get(`/projects/${projectId}/tasks`),
        ]);

        if (projRes.success && projRes.data?.project) {
          setProject(projRes.data.project);
        }

        if (wsRes.success && wsRes.data) {
          setWorkspace(wsRes.data.workspace);
          setUserRole(wsRes.data.role);
        }

        if (membersRes.success && Array.isArray(membersRes.data)) {
          setMembers(membersRes.data);
        }

        if (tasksRes.success && Array.isArray(tasksRes.data?.tasks)) {
          setTasks(tasksRes.data.tasks);
        }
      } catch (err) {
        console.error('[Project Load Error]', err.message);
        setError(err.message || 'Failed to load project.');
      } finally {
        setLoading(false);
      }
    }

    loadProjectData();
  }, [workspaceId, projectId]);

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(userRole);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, {
        status: newStatus,
      });

      if (response.success && response.data?.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? response.data.task : t))
        );

        if (selectedTask?.id === taskId) {
          setSelectedTask(response.data.task);
        }

        toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update task status.');
    }
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);

    try {
      const response = await api.delete(`/projects/${projectId}`);

      if (response.success) {
        toast.success('Project deleted successfully.');
        navigate(`/workspaces/${workspaceId}`, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete project.');
    } finally {
      setDeletingProject(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setDeletingTask(true);

    try {
      const response = await api.delete(`/tasks/${taskToDelete.id}`);

      if (response.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
        setTaskToDelete(null);
        toast.success('Task deleted successfully.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete task.');
    } finally {
      setDeletingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error || 'Project not found.'} />
        <Link to={`/workspaces/${workspaceId}`} className="text-sm text-indigo-600 hover:underline">
          ← Back to Workspace
        </Link>
      </div>
    );
  }

  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/workspaces" className="hover:text-indigo-600 transition-colors">
          Workspaces
        </Link>
        <span className="text-slate-300">/</span>
        <Link to={`/workspaces/${workspaceId}`} className="hover:text-indigo-600 transition-colors">
          {workspace?.name || 'Workspace'}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-bold">{project.name}</span>
      </nav>

      {/* Project Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{project.name}</h1>
            <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {tasks.length} total tasks
            </span>
          </div>

          {project.description && (
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">{project.description}</p>
          )}

          {/* Quick Task Status & Member Avatar Strip */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                {todoCount} Todo
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                {inProgressCount} In Progress
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {doneCount} Done
              </span>
            </div>

            {members.length > 0 && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                <span className="text-slate-400 font-semibold text-[11px] mr-1">Team:</span>
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      title={`${m.user?.name} (${m.role})`}
                      className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white shadow-2xs"
                    >
                      {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  ))}
                  {members.length > 5 && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowEditProject(true)}>
            Edit Project
          </Button>

          {isOwnerOrAdmin && (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteProject(true)}>
              Delete Project
            </Button>
          )}

          <Button variant="primary" size="sm" onClick={() => setShowCreateTask(true)}>
            <span className="font-bold">+</span>
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div>
        <KanbanBoard
          tasks={tasks}
          onSelectTask={(task) => setSelectedTask(task)}
          onStatusChange={handleStatusChange}
        />
      </div>

      <EditProjectModal
        isOpen={showEditProject}
        onClose={() => setShowEditProject(false)}
        project={project}
        onUpdated={(updatedProj) => {
          setProject(updatedProj);
          toast.success('Project details updated.');
        }}
      />

      <ConfirmModal
        isOpen={showDeleteProject}
        onClose={() => setShowDeleteProject(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? All tasks inside this project will be permanently removed.`}
        confirmText="Delete Project"
        isLoading={deletingProject}
      />

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={projectId}
        members={members}
        onCreated={(newTask) => {
          setTasks((prev) => (prev.some((task) => task.id === newTask.id) ? prev : [newTask, ...prev]));
          toast.success('Task created successfully.');
        }}
      />

      <TaskDetailModal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        userRole={userRole}
        onEdit={(t) => setTaskToEdit(t)}
        onDelete={(t) => setTaskToDelete(t)}
        onStatusChange={handleStatusChange}
        registerCommentCallbacks={(cbs) => {
          commentCallbacksRef.current = cbs;
        }}
      />

      <EditTaskModal
        isOpen={Boolean(taskToEdit)}
        onClose={() => setTaskToEdit(null)}
        task={taskToEdit}
        members={members}
        onUpdated={(updatedTask) => {
          setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
          if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }
          toast.success('Task updated successfully.');
        }}
      />

      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isLoading={deletingTask}
      />
    </div>
  );
}