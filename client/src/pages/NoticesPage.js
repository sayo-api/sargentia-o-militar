import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './NoticesPage.css';

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch {
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? notices : notices.filter(n => n.priority === filter);

  const isRead = (notice) => notice.readBy?.some(u => (u._id || u) === user?._id);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📋 <span>Quadro</span> de Avisos</h1>
        <div className="filter-tabs">
          {['all', 'normal', 'importante', 'urgente'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''} filter-tab--${f}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">Nenhum aviso encontrado</p>
        </div>
      ) : (
        <div className="notices-grid">
          {filtered.map(notice => (
            <Link key={notice._id} to={`/avisos/${notice._id}`} className="notice-card">
              {notice.pinned && (
                <div className="notice-pin-bar">📌 AVISO FIXADO</div>
              )}
              <div className="notice-card-header">
                <div className="notice-badges">
                  <span className={`badge badge-${notice.priority}`}>
                    {notice.priority}
                  </span>
                  {!isRead(notice) && (
                    <span className="notice-unread-dot" title="Não lido" />
                  )}
                </div>
                <span className="notice-date">
                  {format(new Date(notice.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>

              <h3 className="notice-title">{notice.title}</h3>

              <p className="notice-excerpt">
                {notice.content.length > 120 ? notice.content.slice(0, 120) + '...' : notice.content}
              </p>

              <div className="notice-card-footer">
                <span className="notice-author">
                  {notice.createdBy?.rank} {notice.createdBy?.warName}
                </span>
                {notice.attachments?.length > 0 && (
                  <span className="notice-attachments">
                    📎 {notice.attachments.length} anexo(s)
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
