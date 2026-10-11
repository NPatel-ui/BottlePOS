import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CashierLayout from './layouts/CashierLayout';
import ManagerLayout from './layouts/ManagerLayout';
import POSPage from './pages/cashier/POSPage';
import DashboardPage from './pages/manager/DashboardPage';
import ShieldAlertsPage from './pages/manager/ShieldAlertsPage';
import AuditLogsPage from './pages/manager/AuditLogsPage';
import AdminAuthPage from './pages/manager/AdminAuthPage';
import InventoryPage from './pages/manager/InventoryPage';
import AnalyticsPage from './pages/manager/AnalyticsPage';
import StaffManagementPage from './pages/manager/StaffManagementPage';
import { useAuthStore } from './store/useAuthStore';
import DesktopOnlyGuard from './components/DesktopOnlyGuard';

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <DesktopOnlyGuard>
      <Routes>
        {/* Cashier Terminal — fullscreen, distraction-free */}
        <Route path="/pos" element={<CashierLayout />}>
          <Route index element={<POSPage />} />
        </Route>

        {/* Admin Auth */}
        <Route path="/admin" element={<AdminAuthPage />} />

        {/* Manager Portal — enterprise back-office */}
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><ManagerLayout /></AdminProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="shield" element={<ShieldAlertsPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </DesktopOnlyGuard>
  );
}

export default App;
