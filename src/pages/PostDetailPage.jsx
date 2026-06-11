import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageCircle, Pencil, ThumbsUp, Trash2 } from 'lucide-react';
import { api, resolveAssetUrl } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { EmptyState } from '../components/EmptyState';
import { StatusMessage } from '../components/StatusMessage';
import { formatCount, formatDate, getErrorMessage, postTypeLabels } from '../utils/format';

function normalizeComments(page) {
  if (Array.isArray(page)) return page;
  if (Array.isArray(page?.content)) return page.content;
  return [];
}

export function PostDetailPage({ postId }) {
  const { user, isLoggedIn } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [like, setLike] = useState({ likeStatus: false, likeCount: 0 });
  const [viewCount, setViewCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const isAuthor = useMemo(() => user?.id && post?.userId && String(user.id) === String(post.userId), [post?.userId, user?.id]);

  const loadDetail = async () => {
    setLoading(true);
    setStatus('');

    try {
      const [postData, likeData, statusData, commentPage] = await Promise.all([
        api.get(endpoints.posts.detail(postId)),
        api.get(endpoints.posts.like(postId)).catch(() => ({ likeStatus: false, likeCount: 0 })),
        api.get(endpoints.posts.statuses(postId)).catch(() => ({ viewCount: 0 })),
        api.get(endpoints.comments.list(postId)).catch(() => ({ content: [] })),
      ]);

      setPost(postData);
      setLike(likeData || { likeStatus: false, likeCount: 0 });
      setViewCount(statusData?.viewCount || 0);
      setComments(normalizeComments(commentPage));
    } catch (error) {
      setStatus(getErrorMessage(error, '게시글을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const toggleLike = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const nextLike = await api.post(endpoints.posts.like(postId));
      setLike(nextLike);
    } catch (error) {
      setStatus(getErrorMessage(error, '좋아요 처리에 실패했습니다.'));
    }
  };

  const createComment = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!commentText.trim()) return;

    try {
      await api.post(endpoints.comments.create(postId), { content: commentText.trim() });
      setCommentText('');
      const page = await api.get(endpoints.comments.list(postId));
      setComments(normalizeComments(page));
    } catch (error) {
      setStatus(getErrorMessage(error, '댓글 등록에 실패했습니다.'));
    }
  };

  const saveComment = async (commentId) => {
    if (!editingText.trim()) return;

    try {
      await api.patch(endpoints.comments.update(commentId), { content: editingText.trim() });
      setComments((prev) => prev.map((item) => (item.id === commentId ? { ...item, content: editingText.trim() } : item)));
      setEditingCommentId(null);
      setEditingText('');
    } catch (error) {
      setStatus(getErrorMessage(error, '댓글 수정에 실패했습니다.'));
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;

    try {
      await api.patch(endpoints.comments.deactivate(commentId));
      setComments((prev) =>
        prev.map((item) => (item.id === commentId ? { ...item, content: '삭제된 댓글입니다.', userId: null, nickname: null } : item)),
      );
    } catch (error) {
      setStatus(getErrorMessage(error, '댓글 삭제에 실패했습니다.'));
    }
  };

  const deletePost = async () => {
    if (!window.confirm('게시글을 삭제할까요?')) return;

    try {
      await api.patch(endpoints.posts.deactivate(postId));
      navigate('/feed');
    } catch (error) {
      setStatus(getErrorMessage(error, '게시글 삭제에 실패했습니다.'));
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="list-skeleton" aria-label="게시글 로딩 중">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="page">
        <EmptyState
          title="게시글을 찾을 수 없습니다"
          action={
            <button className="secondary-button" type="button" onClick={() => navigate('/feed')}>
              목록으로
            </button>
          }
        />
      </section>
    );
  }

  return (
    <section className="page detail-page">
      <button className="back-button" type="button" onClick={() => navigate('/feed')}>
        <ArrowLeft size={18} aria-hidden="true" />
        목록
      </button>

      <StatusMessage type="error">{status}</StatusMessage>

      <article className="post-detail">
        <div className="post-detail-meta">
          <span className={`type-chip ${post.postType || ''}`}>{postTypeLabels[post.postType] || post.postType || '기록'}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <h1>{post.title}</h1>
        <div className="author-row">
          <span className="avatar">{post.nickname?.slice(0, 1) || '?'}</span>
          <div>
            <strong>{post.nickname || '익명'}</strong>
            <span>조회 {formatCount(viewCount)}</span>
          </div>
        </div>

        {post.images?.length > 0 && (
          <div className="image-strip">
            {post.images.map((image) => (
              <img key={image.imageId || image.imageUrl} src={resolveAssetUrl(image.imageUrl)} alt="" loading="lazy" />
            ))}
          </div>
        )}

        <p className="post-content">{post.content}</p>

        <div className="detail-actions">
          <button className={`like-button ${like.likeStatus ? 'liked' : ''}`} type="button" onClick={toggleLike}>
            <ThumbsUp size={18} aria-hidden="true" />
            {formatCount(like.likeCount)}
          </button>
          <span>
            <MessageCircle size={18} aria-hidden="true" />
            {formatCount(comments.length)}
          </span>
        </div>

        {isAuthor && (
          <div className="owner-actions">
            <button className="secondary-button compact" type="button" onClick={() => navigate(`/edit/${postId}`)}>
              <Pencil size={16} aria-hidden="true" />
              수정
            </button>
            <button className="danger-button compact" type="button" onClick={deletePost}>
              <Trash2 size={16} aria-hidden="true" />
              삭제
            </button>
          </div>
        )}
      </article>

      <section className="comments-section">
        <h2>댓글</h2>
        <form className="comment-form" onSubmit={createComment}>
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            maxLength={500}
            placeholder={isLoggedIn ? '댓글을 입력하세요' : '로그인 후 댓글을 쓸 수 있습니다'}
            disabled={!isLoggedIn}
          />
          <button className="primary-button compact" type="submit" disabled={!isLoggedIn || !commentText.trim()}>
            등록
          </button>
        </form>

        {comments.length === 0 ? (
          <EmptyState title="댓글이 없습니다" />
        ) : (
          <div className="comment-list">
            {comments.map((comment) => {
              const commentAuthor = user?.id && comment.userId && String(user.id) === String(comment.userId);
              const editing = editingCommentId === comment.id;

              return (
                <div className="comment-item" key={comment.id}>
                  <div className="comment-header">
                    <strong>{comment.nickname || '알 수 없음'}</strong>
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>

                  {editing ? (
                    <div className="inline-edit">
                      <textarea value={editingText} onChange={(event) => setEditingText(event.target.value)} maxLength={500} />
                      <div>
                        <button className="primary-button compact" type="button" onClick={() => saveComment(comment.id)}>
                          저장
                        </button>
                        <button className="text-button compact" type="button" onClick={() => setEditingCommentId(null)}>
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{comment.content}</p>
                  )}

                  {commentAuthor && !editing && (
                    <div className="comment-actions">
                      <button
                        className="text-button compact"
                        type="button"
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingText(comment.content);
                        }}
                      >
                        수정
                      </button>
                      <button className="text-button compact danger-text" type="button" onClick={() => deleteComment(comment.id)}>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
