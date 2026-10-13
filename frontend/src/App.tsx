import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { IconBuildingCommunity } from '@tabler/icons-react';
import { useAuthStore } from './stores/authStore';
import { LoadingSpinner } from './components/ui/Badges';
import { TestingBar } from './components/ui/TestingBar';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const LeaderboardPage = lazy(() => import('./pages/leaderboard/LeaderboardPage'));
const WargaDashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const PetugasDashboardPage = lazy(() => import('./pages/petugas/PetugasDashboardPage'));
const SuperadminDashboardPage = lazy(() => import('./pages/admin/SuperadminDashboardPage'));
const MasterDataPage = lazy(() => import('./pages/admin/MasterDataPage'));
const ReportDetailPage = lazy(() => import('./pages/reports/ReportDetailPage'));

// ─── Route guards ─────────────────────────────────────────────────────────────

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children, roles,
}) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  if (roles) {
    const userRole = user.role;
    // Allow SUPERADMIN anywhere ADMIN is allowed
    const hasRole = roles.includes(userRole) ||
      (roles.includes('ADMIN') && userRole === 'SUPERADMIN') ||
      (roles.includes('SUPERADMIN') && userRole === 'ADMIN');

    if (!hasRole) {
      // Redirect to their respective home
      if (userRole === 'PETUGAS') return <Navigate to="/petugas" replace />;
      if (userRole === 'SUPERADMIN' || userRole === 'ADMIN') return <Navigate to="/superadmin" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// ─── Page loading fallback ────────────────────────────────────────────────────

const PageLoader: React.FC = () => (
  <div className="h-screen flex items-center justify-center bg-slate-50">
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col items-center gap-3 text-slate-700">
      <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white">
        <IconBuildingCommunity className="w-6 h-6 text-orange" />
      </div>
      <LoadingSpinner size="md" />
      <p className="font-semibold text-xs tracking-wider text-navy uppercase">
        Peta Suara Kota Surabaya...
      </p>
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
            background: '#1E3A5F',
            color: '#FFFFFF',
            border: '1px solid #132640',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgba(16, 33, 58, 0.1)',
          },
          success: {
            iconTheme: { primary: '#F5A524', secondary: '#1E3A5F' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
          },
        }}
      />

      {/* Floating Testing & Quick Role Bar */}
      <TestingBar />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/peta" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Role: Warga (/dashboard) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['WARGA', 'PETUGAS', 'SUPERADMIN', 'ADMIN']}>
                <WargaDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Role: Petugas (/petugas) */}
          <Route
            path="/petugas"
            element={
              <ProtectedRoute roles={['PETUGAS', 'SUPERADMIN', 'ADMIN']}>
                <PetugasDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Role: Superadmin (/superadmin) */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                <SuperadminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Role: Superadmin Master Data (/superadmin/master) */}
          <Route
            path="/superadmin/master"
            element={
              <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                <MasterDataPage />
              </ProtectedRoute>
            }
          />

          {/* Detail Laporan (/laporan/:id) - Akses semua yang login */}
          <Route
            path="/laporan/:id"
            element={
              <ProtectedRoute>
                <ReportDetailPage />
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
