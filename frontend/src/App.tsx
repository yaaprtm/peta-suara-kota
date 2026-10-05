import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { IconMap } from '@tabler/icons-react';
import { useAuthStore } from './stores/authStore';
import { LoadingSpinner } from './components/ui/Badges';

// Lazy-loaded pages
const MapPage = lazy(() => import('./pages/MapPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const LeaderboardPage = lazy(() => import('./pages/leaderboard/LeaderboardPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));

// ─── Route guards ─────────────────────────────────────────────────────────────

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children, roles,
}) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ─── Page loading fallback ────────────────────────────────────────────────────

const PageLoader: React.FC = () => (
  <div className="h-screen flex items-center justify-center bg-board-bg board-pattern">
    <div className="bg-paper-white border border-ink p-5 flex flex-col items-center gap-3 text-ink">
      <IconMap className="w-8 h-8 text-ink" stroke={1.5} />
      <LoadingSpinner size="md" />
      <p className="font-mono text-xs uppercase tracking-wider text-ink/80">Memuat Peta Suara Kota...</p>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#FAF6EE',
            color: '#2B2822',
            border: '1px solid #2B2822',
            borderRadius: '0px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            boxShadow: 'none',
          },
          success: {
            iconTheme: { primary: '#4A7A6E', secondary: '#FAF6EE' },
          },
          error: {
            iconTheme: { primary: '#B23327', secondary: '#FAF6EE' },
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Main map — public (but report form requires login) */}
          <Route path="/" element={<MapPage />} />

          {/* Protected: petugas + admin only */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['PETUGAS', 'ADMIN']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
