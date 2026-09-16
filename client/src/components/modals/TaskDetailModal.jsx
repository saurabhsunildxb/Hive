import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import ConfirmModal from './ConfirmModal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  userRole,
  onEdit,
  onDelete,
  onStatusChange,
  registerCommentCallbacks,
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState('');

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  useEffect(() => {
    if (!isOpen || !task) {
      setComments([]);
      setNewComment('');
      setEditingCommentId(null);
      setCommentToDelete(null);
      return;
    }

    async function loadComments() {
      setLoadingComments(true);
      setCommentsError('');
      try {
        const res = await api.get(`/tasks/${task.id}/comments`);
        if (res.success && res.data?.comments) {
          setComments(res.data.comments);
        }
      } catch (err) {
        setCommentsError(err.message || 'Failed to load comments');
      } finally {
        setLoadingComments(false);
      }
    }

    loadComments();
  }, [isOpen, task]);

  useEffect(() => {
    if (registerCommentCallbacks) {
      registerCommentCallbacks({
        onCreated: (newCommentData) => {
          if (newCommentData.taskId !== task?.id) return;
          setComments((prev) =>
            prev.some((c) => c.id === newCommentData.id) ? prev : [...prev, newCommentData]
          );
        },
        onUpdated: (updatedComment) => {
          if (updatedComment.taskId !== task?.id) return;
          setComments((prev) =>
            prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
          );
        },
        onDeleted: (deletedInfo) => {
          if (deletedInfo.taskId !== task?.id) return;
          setComments((prev) => prev.filter((c) => c.id !== deletedInfo.id));
        },
      });

      return () => {
        registerCommentCallbacks({
          onCreated: null,
          onUpdated: null,
          onDeleted: null,
        });
      };
    }
  }, [task, registerCommentCallbacks]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await api.post(
        `/tasks/${task.id}/comments`,
        { content: newComment.trim() }
      );

      if (res.success && res.data?.comment) {
        const newCommentData = res.data.comment;

        setComments((prev) =>
          prev.some((comment) => comment.id === newCommentData.id)
            ? prev
            : [...prev, newCommentData]
        );

        setNewComment('');
        toast.success('Comment added');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (e) => {
    e.preventDefault();
    if (!editContent.trim() || !editingCommentId) return;

    setIsEditing(true);
    try {
      const res = await api.patch(`/comments/${editingCommentId}`, { content: editContent.trim() });
      if (res.success && res.data?.comment) {
        setComments((prev) =>
          prev.map((c) => (c.id === editingCommentId ? res.data.comment : c))
        );
        setEditingCommentId(null);
        setEditContent('');
        toast.success('Comment updated');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update comment');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    setIsDeletingComment(true);
    try {
      const res = await api.delete(`/comments/${commentToDelete.id}`);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
        setCommentToDelete(null);
        toast.success('Comment deleted');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete comment');
    } finally {
      setIsDeletingComment(false);
    }
  };

  if (!task) return null;

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(userRole);

  const priorityColors = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200/90',
    MEDIUM: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    HIGH: 'bg-amber-50 text-amber-800 border-amber-200/80',
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  const statusColors = {
    TODO: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Issue Detail"
        className="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {isOwnerOrAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onDelete(task);
                  }}
                >
                  Delete Task
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
              >
                Edit Task
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Header Badges & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${statusColors[task.status] || ''}`}>
                {task.status?.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${priorityColors[task.priority] || ''}`}>
                {task.priority} PRIORITY
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">{task.title}</h2>
          </div>

          {/* Quick Status Action */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status:</span>
            <div className="flex items-center gap-1.5">
              {['TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
                <button
                  key={s}
                  disabled={task.status === s}
                  onClick={() => onStatusChange(task.id, s)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    task.status === s
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</h4>
            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap bg-slate-50/60 p-3.5 rounded-lg border border-slate-200/80 min-h-16 leading-relaxed">
              {task.description || <span className="italic text-slate-400">No description provided.</span>}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
            <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Assignee</span>
              <p className="font-bold text-slate-800 mt-0.5 text-xs truncate">
                {task.assignee ? `${task.assignee.name} (${task.assignee.email})` : <span className="italic text-slate-400 font-normal">Unassigned</span>}
              </p>
            </div>
            <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Creator</span>
              <p className="font-bold text-slate-800 mt-0.5 text-xs truncate">
                {task.creator ? `${task.creator.name} (${task.creator.email})` : 'System'}
              </p>
            </div>
            <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Due Date</span>
              <p className="font-bold text-slate-800 mt-0.5 text-xs">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : <span className="italic text-slate-400 font-normal">No due date</span>}
              </p>
            </div>
            <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Created</span>
              <p className="font-bold text-slate-800 mt-0.5 text-xs">
                {new Date(task.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Comments</span>
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-slate-100 text-slate-700">
                  {comments.length}
                </span>
              </h4>
            </div>
            
            {loadingComments ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="sm" />
              </div>
            ) : commentsError ? (
              <ErrorMessage message={commentsError} />
            ) : (
              <div className="space-y-3 mb-3 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="p-5 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    <p className="text-xs text-slate-500 font-medium">No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-[9px] shrink-0">
                            {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            {comment.user?.name || 'Unknown User'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(comment.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            {comment.createdAt !== comment.updatedAt && ' (edited)'}
                          </span>
                          
                          {editingCommentId !== comment.id && (
                            <div className="flex items-center gap-1.5 ml-1">
                              {comment.userId === user?.id && (
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditContent(comment.content);
                                  }}
                                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}
                              {(comment.userId === user?.id || isOwnerOrAdmin) && (
                                <button
                                  onClick={() => setCommentToDelete(comment)}
                                  className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {editingCommentId === comment.id ? (
                        <form onSubmit={handleUpdateComment} className="mt-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                            rows="2"
                            required
                          />
                          <div className="flex justify-end gap-1.5 mt-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditContent('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" variant="primary" size="sm" isLoading={isEditing}>
                              Save
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-7">{comment.content}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-xs p-2 border border-slate-300/80 rounded-md shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                required
              />
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Comment
              </Button>
            </form>
          </div>
        </div>
      </Modal>

      {/* Delete Comment Confirm */}
      <ConfirmModal
        isOpen={Boolean(commentToDelete)}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete Comment"
        isLoading={isDeletingComment}
      />
    </>
  );
}
