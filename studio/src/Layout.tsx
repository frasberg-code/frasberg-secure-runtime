import { Link, Navigate, Outlet } from 'react-router-dom';
import { useTheme } from './theme/ThemeContext';
import { clearToken, getToken } from './lib/session';

export default function Layout() {
  const { theme, setTheme } = useTheme();
  if (!getToken()) return <Navigate to="/login" replace />;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: 8 }}>
        <nav>
          <strong>Frasberg Studio</strong>
          {' | '}
          <Link to="/">Dashboard</Link>
          {' | '}
          <Link to="/assets">Assets</Link>
          {' | '}
          <Link to="/replay/demo-race">Replay</Link>
          {' | '}
          <Link to="/export/demo-race">Export</Link>
          {' | '}
          <Link to="/story/demo-race">Story</Link>
          {' | '}
          <Link to="/releases">Releases</Link>
        </nav>
        <div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Theme: {theme}</button>
          <button
            style={{ marginLeft: 8 }}
            onClick={() => {
              clearToken();
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}