import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import HomePage          from './pages/HomePage';
import LoginPage         from './pages/LoginPage';
import RegisterAdminPage from './pages/RegisterAdminPage';
import DashboardPage     from './pages/DashboardPage';
import NoticesPage       from './pages/NoticesPage';
import NoticeDetailPage  from './pages/NoticeDetailPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage     from './pages/admin/AdminUsersPage';
import AdminSchedulePage  from './pages/admin/AdminSchedulePage';
import AdminNoticesPage   from './pages/admin/AdminNoticesPage';
import AdminBoletimPage   from './pages/admin/AdminBoletimPage';
import AdminRelatoriosPage from './pages/admin/AdminRelatoriosPage';
import AdminHistoricoPage from './pages/admin/AdminHistoricoPage';
import AdminRotinePage    from './pages/admin/AdminRotinePage';
import AdminOrdensPage    from './pages/admin/AdminOrdensPage';
import AdminEfetivoPage   from './pages/admin/AdminEfetivoPage';
import AdminPlanilhaPage  from './pages/admin/AdminPlanilhaPage';
import AdminWordPage      from './pages/admin/AdminWordPage';

import ChamadaPage   from './pages/chamada/ChamadaPage';
import AuditoriaPage from './pages/chamada/AuditoriaPage';

import Layout       from './components/Layout';
import AIChatBubble from './components/AIChatBubble';

// ─── Guards ──────────────────────────────────────────────────────────────────
function Spinner() {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="spinner"/></div>;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  return user ? children : <Navigate to="/login" replace/>;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace/>;
  return children;
}

// Acesso à chamada: admin OU hasChamadaAccess = true
function ChamadaRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== 'admin' && !user.hasChamadaAccess) return <Navigate to="/dashboard" replace/>;
  return children;
}

// Acesso ao relatório: admin OU hasRelatorioAccess = true (SOMENTE se liberado explicitamente)
function RelatorioRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== 'admin' && !user.hasRelatorioAccess) return <Navigate to="/dashboard" replace/>;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace/>;
}

// ─── AppRoutes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const AR = (el) => <AdminRoute><Layout admin>{el}</Layout></AdminRoute>;
  const PR = (el) => <PrivateRoute><Layout>{el}</Layout></PrivateRoute>;
  const CR = (el) => <ChamadaRoute><Layout>{el}</Layout></ChamadaRoute>;
  const RR = (el) => <RelatorioRoute><Layout>{el}</Layout></RelatorioRoute>;

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/"       element={<HomePage/>}/>
      <Route path="/login"  element={<PublicRoute><LoginPage/></PublicRoute>}/>
      <Route path="/registrar-admin" element={<PublicRoute><RegisterAdminPage/></PublicRoute>}/>

      {/* Soldado padrão */}
      <Route path="/dashboard"  element={PR(<DashboardPage/>)}/>
      <Route path="/avisos"     element={PR(<NoticesPage/>)}/>
      <Route path="/avisos/:id" element={PR(<NoticeDetailPage/>)}/>

      {/* Módulo de Chamada — precisa de hasChamadaAccess */}
      <Route path="/chamada"   element={CR(<ChamadaPage/>)}/>
      <Route path="/auditoria" element={CR(<AuditoriaPage/>)}/>

      {/* Módulo de Relatórios — precisa de hasRelatorioAccess */}
      <Route path="/relatorios" element={RR(<AdminRelatoriosPage/>)}/>

      {/* Admin */}
      <Route path="/admin"                element={AR(<AdminDashboardPage/>)}/>
      <Route path="/admin/usuarios"       element={AR(<AdminUsersPage/>)}/>
      <Route path="/admin/escalas"        element={AR(<AdminSchedulePage/>)}/>
      <Route path="/admin/avisos"         element={AR(<AdminNoticesPage/>)}/>
      <Route path="/admin/boletim"        element={AR(<AdminBoletimPage/>)}/>
      <Route path="/admin/relatorios"     element={AR(<AdminRelatoriosPage/>)}/>
      <Route path="/admin/historico"      element={AR(<AdminHistoricoPage/>)}/>
      <Route path="/admin/rotina"         element={AR(<AdminRotinePage/>)}/>
      <Route path="/admin/ordens"         element={AR(<AdminOrdensPage/>)}/>
      <Route path="/admin/efetivo"        element={AR(<AdminEfetivoPage/>)}/>
      <Route path="/admin/planilha"       element={AR(<AdminPlanilhaPage/>)}/>
      <Route path="/admin/word"           element={AR(<AdminWordPage/>)}/>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
        <AIChatBubble/>
        <Toaster position="top-right" toastOptions={{
          style:{background:'#1e1e1e',color:'#e8e8e8',border:'1px solid #2a2a2a',fontFamily:"'Barlow',sans-serif",fontSize:'0.875rem'},
          success:{iconTheme:{primary:'#6b7c5e',secondary:'#e8e8e8'}},
          error:  {iconTheme:{primary:'#c0392b',secondary:'#e8e8e8'}},
        }}/>
      </BrowserRouter>
    </AuthProvider>
  );
}
