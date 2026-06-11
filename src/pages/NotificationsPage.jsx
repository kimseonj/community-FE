import { useEffect, useState } from 'react';
import { CheckCheck, RefreshCcw } from 'lucide-react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { EmptyState } from '../components/EmptyState';
import { StatusMessage } from '../components/StatusMessage';
import { formatDate, getErrorMessage } from '../utils/format';

function normalizeNotificationList(data) {
  if (Array.isArray(data)) {
    return { notifications: data, nextCursor: null, hasNext: false };
  }

  return {
    notifications: data?.notifications || data?.content || [],
    nextCursor: data?.nextCursor || null,
    hasNext: Boolean(data?.hasNext),
  };
}

export function NotificationsPage({ refreshUnread }) {
  const { isLoggedIn, authChecked } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState('');

  const loadNotifications = async ({ append = false, cursor } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    setStatus('');

    try {
      const data = await api.get(endpoints.notifications.list({ cursor, size: 20 }));
      const list = normalizeNotificationList(data);
      setNotifications((prev) => (append ? [...prev, ...list.notifications] : list.notifications));
      setNextCursor(list.nextCursor);
      setHasNext(list.hasNext);
      await refreshUnread?.();
    } catch (error) {
      setStatus(getErrorMessage(error, '알림을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (authChecked && !isLoggedIn) {
      navigate('/login');
      return;
    }

    if (isLoggedIn) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, isLoggedIn]);

  const markRead = async (notificationId) => {
    try {
      await api.patch(endpoints.notifications.markRead(notificationId));
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)));
      await refreshUnread?.();
    } catch (error) {
      setStatus(getErrorMessage(error, '읽음 처리에 실패했습니다.'));
    }
  };

  const markAllRead = async () => {
    const unreadItems = notifications.filter((item) => !item.read);

    try {
      await Promise.all(unreadItems.map((item) => api.patch(endpoints.notifications.markRead(item.id))));
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      await refreshUnread?.();
    } catch (error) {
      setStatus(getErrorMessage(error, '전체 읽음 처리에 실패했습니다.'));
    }
  };

  return (
    <section className="page">
      <div className="page-title with-action">
        <div>
          <h1>알림</h1>
          <p>코스 제보로 생성된 인앱 알림을 확인합니다.</p>
        </div>
        <button className="icon-text-button" type="button" onClick={() => loadNotifications()}>
          <RefreshCcw size={18} aria-hidden="true" />
          새로고침
        </button>
      </div>

      <StatusMessage type="error">{status}</StatusMessage>

      {!loading && notifications.some((item) => !item.read) && (
        <button className="secondary-button" type="button" onClick={markAllRead}>
          <CheckCheck size={18} aria-hidden="true" />
          모두 읽음
        </button>
      )}

      {loading ? (
        <div className="list-skeleton" aria-label="알림 로딩 중">
          <span />
          <span />
          <span />
        </div>
      ) : status && notifications.length === 0 ? (
        <EmptyState title="알림을 표시할 수 없습니다" description="백엔드 연결 또는 API 응답을 확인해주세요." />
      ) : notifications.length === 0 ? (
        <EmptyState title="알림이 없습니다" description="구독한 코스에 제보가 등록되면 이곳에 표시됩니다." />
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article className={`notification-item ${notification.read ? 'read' : ''}`} key={notification.id}>
              <div className="notification-content">
                <div>
                  <strong>{notification.title}</strong>
                  {!notification.read && <span className="unread-marker">새 알림</span>}
                </div>
                <p>{notification.content}</p>
                <span>{formatDate(notification.createdAt)}</span>
              </div>
              {!notification.read && (
                <button className="secondary-button compact" type="button" onClick={() => markRead(notification.id)}>
                  읽음
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {hasNext && (
        <button
          className="secondary-button"
          type="button"
          disabled={loadingMore}
          onClick={() => loadNotifications({ append: true, cursor: nextCursor })}
        >
          {loadingMore ? '불러오는 중' : '더 보기'}
        </button>
      )}
    </section>
  );
}
