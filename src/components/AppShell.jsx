import {
  Bell,
  Bike,
  CircleUserRound,
  Home,
  LogOut,
  PenLine,
  Route,
} from 'lucide-react';
import { navigate } from '../hooks/useHashRoute';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/feed', label: '피드', icon: Home },
  { path: '/write', label: '작성', icon: PenLine },
  { path: '/courses', label: '코스', icon: Route },
  { path: '/notifications', label: '알림', icon: Bell },
  { path: '/profile', label: '내 정보', icon: CircleUserRound },
];

export function AppShell({ route, unreadCount, children }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => navigate('/feed')}>
          <Bike size={22} aria-hidden="true" />
          <span>Community</span>
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

      <nav className="bottom-nav" aria-label="주요 메뉴">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = route.path === item.path || (item.path === '/feed' && route.path.startsWith('/posts/'));

          return (
            <button
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              type="button"
              key={item.path}
              onClick={() => navigate(item.path)}
            >
              <span className="bottom-nav-icon">
                <Icon size={20} aria-hidden="true" />
                {item.path === '/notifications' && unreadCount > 0 && <span className="nav-dot" />}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
