import { useEffect, useMemo, useState } from 'react';
import { Award, Camera, Eye, MapPinned, MessageCircle, PenLine, Route, ThumbsUp, Trophy } from 'lucide-react';
import { api, resolveAssetUrl } from '../api/client';
import { endpoints } from '../api/endpoints';
import { navigate } from '../hooks/useHashRoute';
import { EmptyState } from '../components/EmptyState';
import { StatusMessage } from '../components/StatusMessage';
import { formatCount, formatDate, getErrorMessage, postTypeLabels } from '../utils/format';

const filters = [
  { id: 'latest', label: '최신' },
  { id: 'top10', label: 'Top 10' },
  { id: 'daily', label: '일간' },
  { id: 'weekly', label: '주간' },
];

function readPostTypeCount(data) {
  if (typeof data === 'number') return data;
  return Number(data?.postTypeCount ?? data?.count ?? data?.totalCount ?? 0);
}

export function FeedPage() {
  const [activeFilter, setActiveFilter] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [homeStats, setHomeStats] = useState({ completed: null, inProgress: null });
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const requestParams = useMemo(() => {
    if (activeFilter === 'daily' || activeFilter === 'weekly') {
      return { period: activeFilter, size: 10 };
    }
    return { size: 10 };
  }, [activeFilter]);

  const loadPosts = async ({ append = false, cursor } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');

    try {
      const data =
        activeFilter === 'top10'
          ? await api.get(endpoints.posts.top10)
          : await api.get(endpoints.posts.list({ ...requestParams, cursor }));

      const nextPosts = data?.posts || data || [];
      setPosts((prev) => (append ? [...prev, ...nextPosts] : nextPosts));
      setNextCursor(data?.nextCursor || null);
      setHasNext(Boolean(data?.hasNext));
    } catch (requestError) {
      setError(getErrorMessage(requestError, '게시글을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    let ignore = false;

    const loadHomeStats = async () => {
      const [completedResult, inProgressResult] = await Promise.allSettled([
        api.get(endpoints.posts.typeCount('completed')),
        api.get(endpoints.posts.typeCount('in_progress')),
      ]);

      if (ignore) return;

      setHomeStats({
        completed: completedResult.status === 'fulfilled' ? readPostTypeCount(completedResult.value) : null,
        inProgress: inProgressResult.status === 'fulfilled' ? readPostTypeCount(inProgressResult.value) : null,
      });
    };

    loadHomeStats();

    return () => {
      ignore = true;
    };
  }, []);

  const storyStats = useMemo(() => {
    const imageCount = posts.filter((post) => post.postImageUrl).length;

    return [
      {
        label: '완료 기록',
        value: homeStats.completed == null ? '-' : formatCount(homeStats.completed),
        icon: Award,
      },
      {
        label: '진행 중',
        value: homeStats.inProgress == null ? '-' : formatCount(homeStats.inProgress),
        icon: Route,
      },
      {
        label: '최근 사진',
        value: imageCount > 0 ? formatCount(imageCount) : '-',
        icon: Camera,
      },
      {
        label: '인증센터',
        value: '86',
        icon: MapPinned,
      },
    ];
  }, [homeStats.completed, homeStats.inProgress, posts]);

  return (
    <section className="page feed-page">
      <section className="home-brief" aria-labelledby="home-title">
        <div className="home-brief-copy">
          <span className="eyebrow">Jongju Mate</span>
          <h1 id="home-title">함께 달리는 국토종주 기록</h1>
          <p>완주 인증, 준비 여정, 코스 제보를 한곳에서 확인하세요.</p>
          <div className="home-actions">
            <button className="primary-button compact" type="button" onClick={() => navigate('/write')}>
              <PenLine size={17} aria-hidden="true" />
              기록하기
            </button>
            <button className="secondary-button compact" type="button" onClick={() => navigate('/courses')}>
              <Route size={17} aria-hidden="true" />
              코스 보기
            </button>
          </div>
        </div>
      </section>

      <div className="home-metrics" aria-label="종주 현황">
        {storyStats.map((item) => {
          const Icon = item.icon;

          return (
            <div className="home-metric" key={item.label}>
              <Icon size={18} aria-hidden="true" />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      <div className="page-title with-action feed-section-title">
        <div>
          <h2>최근 종주 이야기</h2>
          <p>준비 중인 기록과 완료한 기록을 함께 봅니다.</p>
        </div>
      </div>

      <div className="segmented-control" role="tablist" aria-label="게시글 필터">
        {filters.map((filter) => (
          <button
            type="button"
            key={filter.id}
            className={activeFilter === filter.id ? 'active' : ''}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.id === 'top10' && <Trophy size={15} aria-hidden="true" />}
            {filter.label}
          </button>
        ))}
      </div>

      <StatusMessage type="error">{error}</StatusMessage>

      {loading ? (
        <div className="list-skeleton" aria-label="게시글 로딩 중">
          <span />
          <span />
          <span />
        </div>
      ) : error && posts.length === 0 ? (
        <EmptyState title="게시글을 표시할 수 없습니다" description="백엔드 연결 또는 API 응답을 확인해주세요." />
      ) : posts.length === 0 ? (
        <EmptyState
          title="아직 게시글이 없습니다"
          description="첫 종주 기록을 남겨보세요."
          action={
            <button className="primary-button compact" type="button" onClick={() => navigate('/write')}>
              작성하기
            </button>
          }
        />
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <button className="post-card" type="button" key={post.id} onClick={() => navigate(`/posts/${post.id}`)}>
              <div className="post-card-body">
                <div className="post-card-top">
                  <span className={`type-chip ${post.postType || ''}`}>{postTypeLabels[post.postType] || post.postType || '기록'}</span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                <h2>{post.title}</h2>
                <p className="post-card-author">
                  <span className="mini-avatar">{post.nickname?.slice(0, 1) || '?'}</span>
                  <span>{post.nickname || '익명'}</span>
                </p>
                <div className="metric-row">
                  <span>
                    <ThumbsUp size={15} aria-hidden="true" />
                    {formatCount(post.likeCount)}
                  </span>
                  <span>
                    <MessageCircle size={15} aria-hidden="true" />
                    {formatCount(post.commentCount)}
                  </span>
                  <span>
                    <Eye size={15} aria-hidden="true" />
                    {formatCount(post.viewCount)}
                  </span>
                </div>
              </div>
              {post.postImageUrl && (
                <img className="post-card-image" src={resolveAssetUrl(post.postImageUrl)} alt="" loading="lazy" />
              )}
            </button>
          ))}
        </div>
      )}

      {hasNext && activeFilter !== 'top10' && (
        <button
          className="secondary-button"
          type="button"
          disabled={loadingMore}
          onClick={() => loadPosts({ append: true, cursor: nextCursor })}
        >
          {loadingMore ? '불러오는 중' : '더 보기'}
        </button>
      )}
    </section>
  );
}
