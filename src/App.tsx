import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import AdminLayout from './components/Layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LoginPage from './pages/Login';
import DepositPage from './pages/Deposit';
import WithdrawPage from './pages/Withdraw';
import HistoryPage from './pages/History';
import GatewayStatusPage from './pages/GatewayStatus';
import GamePortalPage from './pages/GamePortal';
import ProfilePage from './pages/Profile';
import AdminDashboard from './pages/Admin/Dashboard';
import TransactionReview from './pages/Admin/TransactionReview';
import AuditLogPage from './pages/Admin/AuditLogPage';
import UserManagement from './pages/Admin/UserManagement';
import './index.css';

function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#4f8ef7',
          colorBgContainer: '#182230',
          colorBgElevated: '#1e2d40',
          colorBgLayout: '#0f1923',
          colorBorder: 'rgba(255,255,255,0.08)',
          colorBorderSecondary: 'rgba(255,255,255,0.05)',
          colorText: '#e8edf5',
          colorTextSecondary: '#7a8fa6',
          colorTextTertiary: '#4a5f73',
          borderRadius: 8,
          borderRadiusLG: 12,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Layout: {
            siderBg: '#182230',
            headerBg: '#182230',
            bodyBg: '#0f1923',
            footerBg: '#182230',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(79,142,247,0.15)',
            darkItemSelectedColor: '#4f8ef7',
            darkItemColor: '#7a8fa6',
            darkItemHoverBg: '#1e2d40',
            darkItemHoverColor: '#e8edf5',
          },
          Button: {
            colorPrimary: '#4f8ef7',
            primaryShadow: 'none',
          },
          Table: {
            headerBg: '#1e2d40',
            rowHoverBg: '#1e2d40',
            borderColor: 'rgba(255,255,255,0.08)',
          },
          Dropdown: {
            colorBgElevated: '#1e2d40',
            colorText: '#e8edf5',
            colorTextSecondary: '#7a8fa6',
          },
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin CMS — role=admin only */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/"        element={<AdminDashboard />} />
                      <Route path="/withdraw" element={<TransactionReview txType="withdraw" />} />
                      <Route path="/deposit"  element={<TransactionReview txType="deposit" />} />
                      <Route path="/audit"    element={<AuditLogPage />} />
                      <Route path="/users"    element={<UserManagement />} />
                    </Routes>
                  </AdminLayout>
                </AdminRoute>
              }
            />

            {/* User portal */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="/"               element={<Navigate to="/deposit" replace />} />
                      <Route path="/deposit"        element={<DepositPage />} />
                      <Route path="/withdraw"       element={<WithdrawPage />} />
                      <Route path="/history"        element={<HistoryPage />} />
                      <Route path="/gateway-status" element={<GatewayStatusPage />} />
                      <Route path="/game-portal"    element={<GamePortalPage />} />
                      <Route path="/profile"        element={<ProfilePage />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
