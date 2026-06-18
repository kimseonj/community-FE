import { useEffect, useMemo, useState } from 'react';
import {
  Bike,
  ChevronRight,
  MapPinned,
  PenLine,
  Route,
  ShieldCheck,
  Trophy,
  UserRound,
} from 'lucide-react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';
import { navigate } from '../hooks/useHashRoute';
import { EmptyState } from '../components/EmptyState';
import { StatusMessage } from '../components/StatusMessage';
import { courseStatusLabels, formatCount, formatDate, getErrorMessage, postTypeLabels } from '../utils/format';

function readPostTypeCount(data) {
  if (typeof data === 'number') return data;
  return Number(data?.postTypeCount ?? data?.count ?? data?.totalCount ?? 0);
}

export function HomePage() {
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ completed: null, inProgress: null });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadHome = async () => {
      setLoading(true);
      setStatus('');

      const [postResult, completedResult, inProgressResult, courseResult] = await Promise.allSettled([
        api.get(endpoints.posts.list({ size: 2 })),
        api.get(endpoints.posts.typeCount('completed')),
        api.get(endpoints.posts.typeCount('in_progress')),
        api.get(endpoints.courses.list),
      ]);

      if (ignore) return;

      if (postResult.status === 'fulfilled') {
        const nextPosts = postResult.value?.posts || postResult.value || [];
        setPosts(nextPosts.slice(0, 2));
      }

      if (courseResult.status === 'fulfilled') {
        setCourses(courseResult.value || []);
      }

      setStats({
        completed: completedResult.status === 'fulfilled' ? readPostTypeCount(completedResult.value) : null,
        inProgress: inProgressResult.status === 'fulfilled' ? readPostTypeCount(inProgressResult.value) : null,
      });

      if (postResult.status === 'rejected' && courseResult.status === 'rejected') {
        setStatus(getErrorMessage(postResult.reason, '홈 정보를 불러오지 못했습니다.'));
      }

      setLoading(false);
    };

    loadHome();

    return () => {
      ignore = true;
    };
  }, []);

  const dashboard = useMemo(() => {
    const completed = stats.completed ?? 0;
    const inProgress = stats.inProgress ?? 0;
    const total = completed + inProgress;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      inProgress,
      progress,
      title: inProgress > 0 ? '진행 중인 종주가 있어요' : '다음 종주를 준비해볼까요?',
      description:
        total > 0
          ? `완료 ${formatCount(completed)}개, 진행 중 ${formatCount(inProgress)}개 기록이 쌓였어요.`
          : '첫 기록을 남기면 진행 현황이 이곳에 표시됩니다.',
    };
  }, [stats.completed, stats.inProgress]);

  const courseSummary = useMemo(() => {
    const cautionCount = courses.filter((course) => course.currentStatus && course.currentStatus !== 'NORMAL').length;
    return {
      cautionCount,
      normalCount: Math.max(courses.length - cautionCount, 0),
      preview: courses.slice(0, 2),
    };
  }, [courses]);

  const quickActions = [
    { label: '기록하기', description: '오늘의 여정', icon: PenLine, path: '/write' },
    { label: '코스보기', description: '상태 확인', icon: MapPinned, path: '/courses' },
    { label: '내 기록', description: '전체 피드', icon: Trophy, path: '/records' },
  ];

  return (
    <section className="page home-page">
      <section className="home-dashboard-card" aria-labelledby="home-dashboard-title">
        <div className="home-dashboard-copy">
          <span className="eyebrow">Jongju Mate</span>
          <h1 id="home-dashboard-title">{dashboard.title}</h1>
          <p>{dashboard.description}</p>
        </div>
        <div className="home-progress" aria-label={`완료 기록 비율 ${dashboard.progress}%`}>
          <div className="home-progress-top">
            <span>완료 기록 비율</span>
            <strong>{dashboard.progress}%</strong>
          </div>
          <div className="home-progress-track">
            <span style={{ width: `${dashboard.progress}%` }} />
          </div>
          <div className="home-progress-stats">
            <span>
              <ShieldCheck size={15} aria-hidden="true" />
              완료 {formatCount(dashboard.completed)}
            </span>
            <span>
              <Route size={15} aria-hidden="true" />
              진행 {formatCount(dashboard.inProgress)}
            </span>
          </div>
        </div>
      </section>

      <div className="home-quick-actions" aria-label="빠른 실행">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <button className="home-quick-action" type="button" key={action.label} onClick={() => navigate(action.path)}>
              <span>
                <Icon size={20} aria-hidden="true" />
              </span>
              <strong>{action.label}</strong>
              <small>{action.description}</small>
            </button>
          );
        })}
      </div>

      <StatusMessage type="error">{status}</StatusMessage>

      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <h2>코스 상태</h2>
            <p>
              정상 {formatCount(courseSummary.normalCount)} · 주의 {formatCount(courseSummary.cautionCount)}
            </p>
          </div>
          <button className="text-button compact" type="button" onClick={() => navigate('/courses')}>
            전체보기
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="home-status-card is-loading" />
        ) : courseSummary.preview.length === 0 ? (
          <EmptyState title="코스 상태가 없습니다" description="코스 정보가 준비되면 이곳에 표시됩니다." />
        ) : (
          <div className="home-course-preview">
            {courseSummary.preview.map((course) => (
              <button className="home-status-card" type="button" key={course.id} onClick={() => navigate('/courses')}>
                <span className={`status-chip ${course.currentStatus}`}>
                  {courseStatusLabels[course.currentStatus] || course.currentStatus || '상태 없음'}
                </span>
                <strong>{course.name}</strong>
                <small>최근 업데이트 {formatDate(course.updatedAt || course.createdAt) || '정보 없음'}</small>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <h2>최근 기록</h2>
            <p>새로 올라온 종주 이야기를 확인하세요.</p>
          </div>
          <button className="text-button compact" type="button" onClick={() => navigate('/records')}>
            전체보기
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="list-skeleton" aria-label="최근 기록 로딩 중">
            <span />
            <span />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="최근 기록이 없습니다"
            description="첫 종주 기록을 남겨보세요."
            action={
              <button className="primary-button compact" type="button" onClick={() => navigate('/write')}>
                기록하기
              </button>
            }
          />
        ) : (
          <div className="home-record-list">
            {posts.map((post) => (
              <button className="home-record-card" type="button" key={post.id} onClick={() => navigate(`/posts/${post.id}`)}>
                <div>
                  <span className={`type-chip ${post.postType || ''}`}>
                    {postTypeLabels[post.postType] || post.postType || '기록'}
                  </span>
                  <strong>{post.title}</strong>
                  <small>{formatDate(post.createdAt)}</small>
                </div>
                <span className="home-record-author">
                  <UserRound size={15} aria-hidden="true" />
                  {post.nickname || '익명'}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
