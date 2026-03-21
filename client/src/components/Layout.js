import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutGrid, Users, Calendar, FileText, BarChart2,
  ClipboardList, Shield, BookOpen, Settings, LogOut,
  Menu, X, Clock, Edit3, Briefcase, Activity,
  Home, Bell,
} from 'lucide-react';

import './Layout.css';

const AdminNav = [
  { section:'COMANDO' },
  { path:'/admin',            label:'Painel',         icon:<LayoutGrid size={15}/> },
  { path:'/admin/efetivo',    label:'Parte do Dia',   icon:<Activity size={15}/> },
  { path:'/admin/rotina',     label:'Rotina',         icon:<Clock size={15}/> },
  { path:'/admin/ordens',     label:'Ordens do Dia',  icon:<Briefcase size={15}/> },
  { section:'PESSOAL' },
  { path:'/admin/usuarios',   label:'Militares',      icon:<Users size={15}/> },
  { path:'/admin/escalas',    label:'Escalas',        icon:<Calendar size={15}/> },
  { path:'/admin/historico',  label:'Histórico',      icon:<BookOpen size={15}/> },
  { path:'/admin/relatorios', label:'Relatórios',     icon:<BarChart2 size={15}/> },
  { section:'MÓDULOS' },
  { path:'/chamada',          label:'Chamada',        icon:<ClipboardList size={15}/> },
  { path:'/auditoria',        label:'Auditoria TFM',  icon:<Shield size={15}/> },
  { section:'DOCUMENTOS' },
  { path:'/admin/word',       label:'Editor Word',    icon:<Edit3 size={15}/> },
  { path:'/admin/planilha',   label:'Planilha',       icon:<FileText size={15}/> },
  { path:'/admin/boletim',    label:'Boletim',        icon:<FileText size={15}/> },
  { path:'/admin/avisos',     label:'Avisos',         icon:<Bell size={15}/> },
];

const BaseSoldierNav = [
  { section:'INÍCIO' },
  { path:'/dashboard', label:'Dashboard', icon:<Home size={15}/> },
  { path:'/avisos',    label:'Avisos',    icon:<Bell size={15}/> },
];

const RANK_ABBR = {
  'Recruta':'REC','Soldado':'SD','Cabo':'CB','3º Sargento':'3SGT','2º Sargento':'2SGT',
  '1º Sargento':'1SGT','Subtenente':'ST','Aspirante a Oficial':'ASP','2º Tenente':'2TEN',
  '1º Tenente':'1TEN','Capitão':'CAP','Major':'MAJ','Tenente-Coronel':'TC','Coronel':'CEL',
  'General-de-Brigada':'GB','General-de-Divisão':'GD','General-de-Exército':'GEx','General do Exército':'GEx',
};

export default function Layout({ children, admin }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = admin || user?.role === 'admin';

  const getSoldierNav = () => {
    const nav = [...BaseSoldierNav];
    if (user?.hasChamadaAccess || user?.role === 'admin') {
      nav.push({ section:'MÓDULOS' });
      nav.push({ path:'/chamada',    label:'Chamada',       icon:<ClipboardList size={15}/> });
      nav.push({ path:'/auditoria',  label:'Auditoria TFM', icon:<Shield size={15}/> });
    }
    if (user?.hasRelatorioAccess || user?.role === 'admin') {
      if (!nav.find(n => n.section === 'MÓDULOS')) nav.push({ section:'MÓDULOS' });
      nav.push({ path:'/relatorios', label:'Relatórios',    icon:<BarChart2 size={15}/> });
    }
    return nav;
  };

  const navItems = isAdmin ? AdminNav : getSoldierNav();
  const handleLogout = () => { logout(); toast.success('Sessão encerrada'); navigate('/'); };

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-emblem">⚔</div>
            <div className="logo-text">
              <span className="logo-main">SIM</span>
              <span className="logo-sub">Sargentiação Digital</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}><X size={18}/></button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.warName?.charAt(0) || 'U'}</div>
          <div className="user-info">
            <span className="user-rank">{RANK_ABBR[user?.rank] || user?.rank}</span>
            <span className="user-name">{user?.warName}</span>
            <span className="user-number">Nº {user?.warNumber}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (item.section) return (
              <div key={i} className="nav-section-label">{item.section}</div>
            );
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.includes('/admin/') && location.pathname.includes('/admin/') && item.path.split('/').length >= location.pathname.split('/').length);
            const exactActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`nav-item ${exactActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {exactActive && <span className="nav-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={15}/><span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20}/>
          </button>
          <div className="topbar-info">
            <span className="topbar-date">
              {new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </span>
          </div>
          <div className="topbar-user">
            <span className="topbar-rank">{user?.rank}</span>
            <span className="topbar-name">{user?.warName}</span>
          </div>
        </header>
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
