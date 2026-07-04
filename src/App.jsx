import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { api } from './api/client';
import { endpoints } from './api/endpoints';
import { useAuth } from './context/AuthContext';
import { navigate, useHashRoute } from './hooks/useHashRoute';
import { CoursePage } from './pages/CoursePage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { FeedPage } from './pages/FeedPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { PostFormPage } from './pages/PostFormPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';

function resolvePage(route) {
  const [section, id] = route.segments;

  if (route.path === '/' || route.path === '') {
    return <Redirect to="/home" />;
  }

  if (route.path === '/login') return <LoginPage />;
  if (route.path === '/register') return <RegisterPage />;
  if (route.path === '/home') return <HomePage />;
  if (route.path === '/records' || route.path === '/feed') return <FeedPage />;
  if (route.path === '/write') return <PostFormPage />;
  if (section === 'posts' && id) return <PostDetailPage postId={id} />;
  if (section === 'edit' && id) return <PostFormPage postId={id} />;
  if (route.path === '/courses') return <CoursePage />;
  if (route.path === '/notifications') return <NotificationsPage />;
  if (route.path === '/profile') return <ProfilePage />;
  if (route.path === '/admin/reports') return <AdminReportsPage />;

  return <Redirect to="/home" />;
}

function Redirect({ to }) {
  useEffect(() => {
    navigate(to);
  }, [to]);

  return null;
}

export function App() {
  const route = useHashRoute();
  const { isLoggedIn, authChecked } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const data = await api.get(endpoints.notifications.unreadCount);
      const nextCount = Number(data?.unreadCount || 0);
      setUnreadCount(nextCount);
      return nextCount;
    } catch {
      setUnreadCount(0);
      return 0;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!authChecked) return undefined;

    refreshUnread();

    if (!isLoggedIn) return undefined;

    const timer = window.setInterval(refreshUnread, 30000);
    return () => window.clearInterval(timer);
  }, [authChecked, isLoggedIn, refreshUnread]);

  const page = useMemo(() => {
    if (route.path === '/notifications') {
      return <NotificationsPage refreshUnread={refreshUnread} />;
    }

    return resolvePage(route);
  }, [refreshUnread, route]);

  return (
    <AppShell route={route} unreadCount={unreadCount}>
      {page}
    </AppShell>
  );
}
