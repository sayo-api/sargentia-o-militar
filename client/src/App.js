import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterAdminPage from './pages/RegisterAdminPage';
import DashboardPage from './pages/DashboardPage';
import NoticesPage from './pages/NoticesPage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSchedulePage from './pages/admin/AdminSchedulePage';
import AdminNoticesPage from './pages/admin/AdminNoticesPage';
import AdminBoletimPage from './pages/admin/AdminBoletimPage';
import AdminRelatoriosPage from './pages/admin/AdminRelatoriosPage';
import AdminHistoricoPage from './pages/admin/AdminHistoricoPage';
import AdminRotinePage from './pages/admin/AdminRotinePage';
import AdminOrdensPage from './pages/admin/AdminOrdensPage';
import AdminEfetivoPage from './pages/admin/AdminEfetivoPage';
import AdminPlanilhaPage from './pages/admin/AdminPlanilhaPage';
import AdminWordPage from './pages/admin/AdminWordPage';
import Layout from './components/Layout';
import AIChatBubble from './components/AIChatBubble';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

function AppRoutes() {
  const AR = (el) => <AdminRoute><Layout admin>{el}</Layout></AdminRoute>;
  return (
    <Routes>
      <Route path="/"       element={<HomePage />} />
      <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/registrar-admin" element={<PublicRoute><RegisterAdminPage /></PublicRoute>} />

      <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
      <Route path="/avisos"    element={<PrivateRoute><Layout><NoticesPage /></Layout></PrivateRoute>} />
      <Route path="/avisos/:id" element={<PrivateRoute><Layout><NoticeDetailPage /></Layout></PrivateRoute>} />

      <Route path="/admin"                element={AR(<AdminDashboardPage />)} />
      <Route path="/admin/usuarios"       element={AR(<AdminUsersPage />)} />
      <Route path="/admin/escalas"        element={AR(<AdminSchedulePage />)} />
      <Route path="/admin/avisos"         element={AR(<AdminNoticesPage />)} />
      <Route path="/admin/boletim"        element={AR(<AdminBoletimPage />)} />
      <Route path="/admin/relatorios"     element={AR(<AdminRelatoriosPage />)} />
      <Route path="/admin/historico"      element={AR(<AdminHistoricoPage />)} />
      <Route path="/admin/rotina"         element={AR(<AdminRotinePage />)} />
      <Route path="/admin/ordens"         element={AR(<AdminOrdensPage />)} />
      <Route path="/admin/efetivo"        element={AR(<AdminEfetivoPage />)} />
      <Route path="/admin/planilha"       element={AR(<AdminPlanilhaPage />)} />
      <Route path="/admin/word"           element={AR(<AdminWordPage />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <AIChatBubble />
        <Toaster position="top-right" toastOptions={{
          style: { background:'#1e1e1e',color:'#e8e8e8',border:'1px solid #2a2a2a',fontFamily:"'Barlow',sans-serif",fontSize:'0.875rem' },
          success: { iconTheme:{ primary:'#6b7c5e',secondary:'#e8e8e8' } },
          error:   { iconTheme:{ primary:'#c0392b',secondary:'#e8e8e8' } },
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
