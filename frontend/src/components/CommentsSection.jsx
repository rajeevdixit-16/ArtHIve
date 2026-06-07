import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

const CommentsSection = ({ artworkId, initialComments = [] }) => {
  const { user } = useUser();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showReplies, setShowReplies] = useState({});
  const commentsPerPage = 10;

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [artworkId, currentPage]);

  const fetchComments = async () => {
    if (!artworkId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/comments/artwork/${artworkId}?page=${currentPage}&limit=${commentsPerPage}`);
      const data = await response.json();
      
      if (data.comments) {
        setComments(data.comments);
        if (data.pagination) {
          setTotalPages(data.pagination.pages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Post new comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          artworkId,
          clerkUserId: user.id,
          content: newComment.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      setNewComment('');
      fetchComments();
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId) => {
    if (!editingText.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          content: editingText.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      setEditingCommentId(null);
      setEditingText('');
      fetchComments();
    } catch (err) {
      setError(err.message || 'Failed to update comment');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clerkUserId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      fetchComments();
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
    }
  };

  const [likingComments, setLikingComments] = useState(new Set());

  // Like comment
  const handleLikeComment = async (commentId) => {
    if (!user) {
      setError('Please sign in to like comments');
      return;
    }

    setLikingComments(prev => new Set(prev).add(commentId));
    setError('');

    // Toggle locally using the likes array (always available from API)
    setComments(prev => prev.map(c =>
      c._id === commentId
        ? {
            ...c,
            likes: c.likes?.includes(user.id)
              ? c.likes.filter(id => id !== user.id)
              : [...(c.likes || []), user.id]
          }
        : c
    ));

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.id })
      });

      if (!response.ok) throw new Error('Failed to like comment');
    } catch (err) {
      // Rollback
      setComments(prev => prev.map(c =>
        c._id === commentId
          ? {
              ...c,
              likes: c.likes?.includes(user.id)
                ? c.likes.filter(id => id !== user.id)
                : [...(c.likes || []), user.id]
            }
          : c
      ));
      setError('Failed to like comment. Please try again.');
    } finally {
      setLikingComments(prev => { const next = new Set(prev); next.delete(commentId); return next; });
    }
  };

  // Flag comment
  const handleFlagComment = async (commentId) => {
    const reason = prompt('Why are you flagging this comment?');
    if (!reason) return;

    try {
      const response = await fetch(`/api/comments/${commentId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to flag comment');
      }

      setError('Comment flagged for review. Thank you!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to flag comment');
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-8">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>💬 Comments</span>
        <span className="text-sm bg-white/10 px-3 py-1 rounded-full text-gray-300">
          {comments.length}
        </span>
      </h3>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handlePostComment} className="mb-8 bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex gap-3 mb-4">
            <img
              src={user.imageUrl || '/default-avatar.png'}
              alt={user.username}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this artwork..."
                maxLength={1000}
                className="w-full bg-white/5 text-white placeholder-gray-400 rounded-lg p-3 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                rows="3"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {newComment.length} / 1000
                </span>
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                >
                  {loading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
          <p className="text-blue-300">
            <a href="/login" className="underline hover:text-blue-200">Sign in</a> to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all">
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={comment.authorImage || '/default-avatar.png'}
                    alt={comment.authorName}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">{comment.authorName}</p>
                    <p className="text-gray-400 text-xs">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
                
                {/* Edit/Delete Options */}
                {user?.id === comment.clerkUserId && (
                  <div className="flex gap-2">
                    {editingCommentId !== comment._id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditingText(comment.content);
                          }}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Comment Content */}
              {editingCommentId === comment._id ? (
                <div className="mb-3">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    maxLength={1000}
                    className="w-full bg-white/5 text-white rounded-lg p-2 border border-white/10 focus:border-purple-500 resize-none text-sm"
                    rows="3"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateComment(comment._id)}
                      className="px-3 py-1 bg-green-600/30 text-green-400 rounded text-xs font-semibold hover:bg-green-600/50 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="px-3 py-1 bg-gray-600/30 text-gray-400 rounded text-xs font-semibold hover:bg-gray-600/50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">
                  {comment.content}
                  {comment.isEdited && (
                    <span className="text-xs text-gray-500 ml-2">(edited)</span>
                  )}
                </p>
              )}

              {/* Comment Actions */}
              <div className="flex items-center gap-4 text-xs">
                <button
                  onClick={() => handleLikeComment(comment._id)}
                  disabled={likingComments.has(comment._id)}
                  className={`transition-colors flex items-center gap-1 disabled:opacity-50 ${
                    comment.likes?.includes(user?.id)
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  {likingComments.has(comment._id) ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : comment.likes?.includes(user?.id) ? (
                    '❤️'
                  ) : (
                    '🤍'
                  )}
                  <span>{comment.likes?.length || 0}</span>
                </button>
                {user?.id !== comment.clerkUserId && (
                  <button
                    onClick={() => handleFlagComment(comment._id)}
                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    🚩 Report
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-white/5 text-white rounded text-sm disabled:opacity-50 hover:bg-white/10 transition-all"
          >
            ← Prev
          </button>
          
          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-white/5 text-white rounded text-sm disabled:opacity-50 hover:bg-white/10 transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
