import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

const SoldierNav = [
  { path:'/dashboard', label:'Dashboard', icon:'⬛' },
  { path:'/avisos',    label:'Avisos',    icon:'📋' },
];

const AdminNav = [
  { section: 'COMANDO' },
  { path:'/admin',           label:'Painel',        icon:'⬛' },
  { path:'/admin/efetivo',   label:'Parte do Dia',  icon:'📋' },
  { path:'/admin/rotina',    label:'Rotina',        icon:'⏰' },
  { path:'/admin/ordens',    label:'Ordens do Dia', icon:'📌' },
  { section: 'PESSOAL' },
  { path:'/admin/usuarios',  label:'Militares',     icon:'🎖' },
  { path:'/admin/escalas',   label:'Escalas',       icon:'📅' },
  { path:'/admin/historico', label:'Histórico',     icon:'🗂' },
  { path:'/admin/relatorios',label:'Relatórios',    icon:'📈' },
  { section: 'DOCUMENTOS' },
  { path:'/admin/word',      label:'Editor Word',     icon:'✏️' },
  { path:'/admin/planilha',  label:'Editor Planilha', icon:'📊' },
  { path:'/admin/boletim',   label:'Boletim',         icon:'📄' },
  { path:'/admin/avisos',    label:'Avisos',        icon:'📢' },
];

const RANK_ABBR = {
  'Recruta':'REC','Soldado':'SD','Cabo':'CB','3º Sargento':'3SGT','2º Sargento':'2SGT',
  '1º Sargento':'1SGT','Subtenente':'ST','Aspirante a Oficial':'ASP','2º Tenente':'2TEN',
  '1º Tenente':'1TEN','Capitão':'CAP','Major':'MAJ','Tenente-Coronel':'TC','Coronel':'CEL',
  'General-de-Brigada':'GB','General-de-Divisão':'GD','General-de-Exército':'GEx','General do Exército':'GEx',
};

export default function Layout({ children, admin }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = (admin || user?.role === 'admin') ? AdminNav : SoldierNav;

  const handleLogout = () => { logout(); toast.success('Sessão encerrada'); navigate('/'); };

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-emblem">✦</div>
            <div className="logo-text">
              <span className="logo-main">SIM</span>
              <span className="logo-sub">Sargentiação Digital</span>
            </div>
          </div>
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
              <div key={i} style={{ padding:'14px 16px 4px', fontFamily:'var(--font-display)', fontSize:'0.52rem', color:'var(--text-muted)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                {item.section}
              </div>
            );
            return (
              <Link key={item.path} to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {location.pathname === item.path && <span className="nav-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>⏻</span><span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
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
