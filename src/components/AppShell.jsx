import {
  Bell,
  Bike,
  CircleUserRound,
  Home,
  LogOut,
  PenLine,
} from 'lucide-react';
import { navigate } from '../hooks/useHashRoute';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/feed', label: '홈', icon: Home },
  { path: '/courses', label: '코스 상태', icon: Bike },
  { path: '/profile', label: '내 정보', icon: CircleUserRound },
];

export function AppShell({ route, unreadCount, children }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showComposeButton = user && route.path !== '/write' && !route.path.startsWith('/edit');

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => navigate('/feed')}>
          <span className="brand-mark">
            <Bike size={20} aria-hidden="true" />
          </span>
          <span className="brand-copy">
            <strong>종주메이트</strong>
            <small>국토종주 커뮤니티</small>
          </span>
        </button>

        <div className="header-actions">
          {user ? (
            <>
              <button
                className="icon-button notification-button"
                type="button"
                aria-label="알림"
                onClick={() => navigate('/notifications')}
              >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
              <button className="icon-button" type="button" aria-label="로그아웃" onClick={handleLogout}>
                <LogOut size={20} aria-hidden="true" />
              </button>
            </>
          ) : (
            <button className="small-button" type="button" onClick={() => navigate('/login')}>
              로그인
            </button>
          )}
        </div>
      </header>

      <main className="app-main">{children}</main>

      {showComposeButton && (
        <button className="floating-compose" type="button" aria-label="종주 기록 작성" onClick={() => navigate('/write')}>
          <PenLine size={24} aria-hidden="true" />
        </button>
      )}

      <nav className="bottom-nav" aria-label="주요 메뉴">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = route.path === item.path || (item.path === '/feed' && route.path.startsWith('/posts/'));

          return (
            <button
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              type="button"
              key={item.path}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(item.path)}
            >
              {active && <span className="bottom-nav-active-indicator" aria-hidden="true" />}
              <span className="bottom-nav-icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
