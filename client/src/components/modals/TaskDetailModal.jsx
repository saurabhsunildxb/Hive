import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import ConfirmModal from './ConfirmModal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
        onCreated: (newComment) => {
          if (newComment.taskId !== task?.id) return;
          setComments((prev) =>
            prev.some((c) => c.id === newComment.id) ? prev : [...prev, newComment]
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
        { content: newComment }
      );

      if (res.success && res.data?.comment) {
        const newCommentData = res.data.comment;

        setComments((prev) =>
          prev.some((comment) => comment.id === newCommentData.id)
            ? prev
            : [...prev, newCommentData]
        );

        setNewComment('');
      }
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (e) => {
    e.preventDefault();
    if (!editContent.trim() || !editingCommentId) return;

    setIsEditing(true);
    try {
      const res = await api.patch(`/comments/${editingCommentId}`, { content: editContent });
      if (res.success && res.data?.comment) {
        setComments((prev) =>
          prev.map((c) => (c.id === editingCommentId ? res.data.comment : c))
        );
        setEditingCommentId(null);
        setEditContent('');
      }
    } catch (err) {
      alert(err.message || 'Failed to update comment');
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
      }
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    } finally {
      setIsDeletingComment(false);
    }
  };

  if (!task) return null;

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(userRole);

  const priorityColors = {
    LOW: 'bg-blue-50 text-blue-700 border-blue-200',
    MEDIUM: 'bg-slate-100 text-slate-700 border-slate-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const statusColors = {
    TODO: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700',
    DONE: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Task Details"
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
        <div className="space-y-6">
          {/* Title & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusColors[task.status] || ''}`}>
                {task.status?.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${priorityColors[task.priority] || ''}`}>
                {task.priority} PRIORITY
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Description</h4>
            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3.5 rounded-lg border border-slate-200 min-h-16">
              {task.description || <span className="italic text-slate-400">No description provided.</span>}
            </p>
          </div>

          {/* Quick Status Action */}
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-700">Quick Move:</span>
            <div className="flex items-center gap-1.5">
              {['TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
                <button
                  key={s}
                  disabled={task.status === s}
                  onClick={() => onStatusChange(task.id, s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    task.status === s
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-500 font-medium">Assignee:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {task.assignee ? `${task.assignee.name} (${task.assignee.email})` : <span className="italic text-slate-400">Unassigned</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Creator:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {task.creator ? `${task.creator.name} (${task.creator.email})` : 'System'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Due Date:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Created / Updated:</span>
              <p className="text-slate-600 mt-0.5">
                {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-4">Comments</h4>
            
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : commentsError ? (
              <ErrorMessage message={commentsError} />
            ) : (
              <div className="space-y-4 mb-4 max-h-75 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-slate-800">
                          {comment.user?.name || 'Unknown User'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">
                            {new Date(comment.createdAt).toLocaleString()}
                            {comment.createdAt !== comment.updatedAt && ' (edited)'}
                          </span>
                          
                          {/* Edit / Delete actions */}
                          {editingCommentId !== comment.id && (
                            <div className="flex gap-1">
                              {comment.userId === user?.id && (
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditContent(comment.content);
                                  }}
                                  className="text-[10px] text-indigo-600 hover:underline"
                                >
                                  Edit
                                </button>
                              )}
                              {(comment.userId === user?.id || isOwnerOrAdmin) && (
                                <button
                                  onClick={() => setCommentToDelete(comment)}
                                  className="text-[10px] text-red-600 hover:underline ml-1"
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
                            className="w-full text-sm p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            rows="2"
                            required
                          />
                          <div className="flex justify-end gap-2 mt-2">
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
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-sm p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
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
