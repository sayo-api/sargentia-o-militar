import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminPages.css';
import './responsive.css';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get('/stats/dashboard');
        setData(res.data);
      } catch {
        try {
          const [usersRes, schedulesRes, noticesRes] = await Promise.all([
            api.get('/users'),
            api.get(`/schedules?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
            api.get('/notices/all'),
          ]);
          const today = schedulesRes.data.find(s => {
            const d = new Date(s.date);
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
          });
          setData({
            totalUsers: usersRes.data.length, activeUsers: usersRes.data.filter(u => u.active).length,
            totalSchedules: schedulesRes.data.length, todaySchedule: today || null,
            ranking: [], waitingList: [], conflicts: [], consecutiveWarnings: [],
          });
        } catch { toast.error('Erro ao carregar painel'); }
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []); // eslint-disable-line

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return null;

  const totalConflicts = (data.conflicts?.length || 0) + (data.consecutiveWarnings?.length || 0);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">⬛ <span>Painel</span> de Comando</h1>
        <span className="admin-date">{format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()}</span>
      </div>

      {totalConflicts > 0 && (
        <div style={{ background:'rgba(231,76,60,.15)',border:'1px solid #c0392b',borderRadius:6,padding:'12px 16px',marginBottom:18,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,color:'#e74c3c',fontSize:'0.8rem' }}>
            <span style={{ fontSize:'1.1rem' }}>⚠</span>
            <strong>{data.conflicts?.length || 0} conflito(s) de serviço detectado(s)</strong>
            {(data.consecutiveWarnings?.length||0) > 0 && (
              <span style={{ color:'#e6a23c' }}>+ {data.consecutiveWarnings.length} aviso(s) dias consecutivos</span>
            )}
          </div>
          <Link to="/admin/relatorios" className="btn btn-sm" style={{ background:'rgba(231,76,60,.2)',border:'1px solid #c0392b',color:'#e74c3c',fontSize:'0.6rem' }}>
            Ver conflitos →
          </Link>
        </div>
      )}

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-body">
            <span className="admin-stat-num">{data.activeUsers ?? data.totalUsers}</span>
            <span className="admin-stat-label">Militares Ativos</span>
          </div>
          <Link to="/admin/usuarios" className="admin-stat-link">Gerenciar →</Link>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📅</div>
          <div className="admin-stat-body">
            <span className="admin-stat-num">{data.totalSchedules}</span>
            <span className="admin-stat-label">Total de Escalas</span>
          </div>
          <Link to="/admin/escalas" className="admin-stat-link">Gerenciar →</Link>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">⚠</div>
          <div className="admin-stat-body">
            <span className="admin-stat-num" style={{ color:totalConflicts>0?'#e74c3c':undefined }}>{totalConflicts}</span>
            <span className="admin-stat-label">Conflitos Ativos</span>
          </div>
          <Link to="/admin/relatorios" className="admin-stat-link">Ver →</Link>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">⏳</div>
          <div className="admin-stat-body">
            <span className="admin-stat-num" style={{ color:(data.waitingList||[]).filter(w=>w.daysSince>14).length>0?'#e6a23c':undefined }}>
              {(data.waitingList||[]).filter(w=>w.daysSince>14).length}
            </span>
            <span className="admin-stat-label">Sem serviço +14d</span>
          </div>
          <Link to="/admin/relatorios" className="admin-stat-link">Ver →</Link>
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginBottom:20 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚔ Escala de Hoje</h3>
            <span className="topbar-date">{format(now,"dd/MM/yyyy",{locale:ptBR})}</span>
          </div>
          {data.todaySchedule ? (
            <div>
              {data.todaySchedule.notes && <p className="admin-notes">{data.todaySchedule.notes}</p>}
              <div className="admin-soldiers-table">
                {data.todaySchedule.soldiers.map((s,i) => (
                  <div key={i} className="admin-soldier-row">
                    <span className="soldier-rank-badge">{s.user?.rank?.split(' ')[0]||'SD'}</span>
                    <span className="admin-soldier-name">{s.user?.warName}</span>
                    <span className="admin-soldier-num">Nº {s.user?.warNumber}</span>
                    <span className="admin-soldier-duty">{s.duty}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="empty-state-text">Nenhuma escala para hoje</p>
              <Link to="/admin/escalas" className="btn btn-outline btn-sm" style={{ marginTop:12 }}>Criar escala</Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏆 Ranking — Últimos 30 dias</h3>
            <Link to="/admin/relatorios" className="btn btn-ghost btn-sm">Completo →</Link>
          </div>
          {(data.ranking||[]).length===0 ? (
            <div className="empty-state"><div className="empty-state-icon">📊</div><p className="empty-state-text">Sem dados ainda</p></div>
          ) : (
            <div style={{ padding:'12px 16px' }}>
              {(data.ranking||[]).slice(0,6).map((r,i) => {
                const max = data.ranking[0]?.count||1;
                return (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:9 }}>
                    <span style={{ width:22,fontFamily:'var(--font-display)',fontSize:'0.82rem',color:i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-muted)',fontWeight:700,flexShrink:0 }}>
                      {i+1}°
                    </span>
                    <span style={{ fontFamily:'var(--font-display)',fontSize:'0.72rem',color:'var(--text-primary)',letterSpacing:'0.05em',width:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:0 }}>
                      {r.user?.warName||'—'}
                    </span>
                    <div style={{ flex:1,height:10,background:'var(--bg-dark)',borderRadius:2,overflow:'hidden' }}>
                      <div style={{ width:`${Math.round(r.count/max*100)}%`,height:'100%',background:'linear-gradient(90deg,var(--accent-dark),var(--accent))',borderRadius:2,minWidth:r.count>0?4:0 }} />
                    </div>
                    <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.62rem',color:'var(--text-muted)',width:20,textAlign:'right',flexShrink:0 }}>{r.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🕐 Sem Serviço Há Mais Tempo</h3>
            <Link to="/admin/relatorios" className="btn btn-ghost btn-sm">Ver todos →</Link>
          </div>
          {(data.waitingList||[]).length===0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><p className="empty-state-text">Todos escalados recentemente</p></div>
          ) : (
            <div>
              {(data.waitingList||[]).slice(0,6).map((w,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 16px',borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:'0.75rem',color:'var(--text-primary)',letterSpacing:'0.05em' }}>{w.user?.warName}</div>
                    <div style={{ fontSize:'0.62rem',color:'var(--text-muted)',marginTop:1 }}>{w.user?.rank} · Nº {w.user?.warNumber}</div>
                    <div style={{ fontSize:'0.6rem',color:'var(--text-muted)',marginTop:1 }}>Último: {w.lastDate?format(new Date(w.lastDate),'dd/MM/yyyy'):'Nunca'}</div>
                  </div>
                  <span className={`badge ${w.daysSince>21?'badge-danger':w.daysSince>14?'badge-warning':'badge-success'}`}>
                    {w.daysSince===9999?'Nunca':`${w.daysSince}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">⚡ Ações Rápidas</h3></div>
          <div className="rg-4" style={{padding:16}}>
            {[
              {icon:'👤',label:'Novo Militar',to:'/admin/usuarios'},
              {icon:'📅',label:'Definir Escala',to:'/admin/escalas'},
              {icon:'⚡',label:'Gerar Auto.',to:'/admin/escalas'},
              {icon:'📄',label:'Novo Boletim',to:'/admin/boletim'},
              {icon:'📈',label:'Relatórios',to:'/admin/relatorios'},
              {icon:'🗂',label:'Histórico',to:'/admin/historico'},
            ].map((a,i) => (
              <Link key={i} to={a.to} className="quick-action-btn">
                <span className="qa-icon">{a.icon}</span>
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
