import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './NoticeDetailPage.css';

export default function NoticeDetailPage() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/notices/${id}`)
      .then(res => setNotice(res.data))
      .catch(() => toast.error('Aviso não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const getAttachmentIcon = (type) => {
    const icons = { image: '🖼️', video: '🎬', pdf: '📄', spreadsheet: '📊', gif: '🎞️', document: '📝' };
    return icons[type] || '📎';
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!notice) return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <p className="empty-state-text">Aviso não encontrado</p>
        <Link to="/avisos" className="btn btn-outline" style={{ marginTop: 16 }}>Voltar</Link>
      </div>
    </div>
  );

  return (
    <div className="page-container fade-in">
      <div className="notice-detail-back">
        <Link to="/avisos" className="back-link">← Voltar aos Avisos</Link>
      </div>

      <div className="notice-detail">
        {notice.pinned && (
          <div className="notice-pinned-bar">📌 AVISO FIXADO — LEITURA OBRIGATÓRIA</div>
        )}

        <div className="notice-detail-header">
          <div className="notice-meta">
            <span className={`badge badge-${notice.priority}`}>{notice.priority}</span>
            <span className="notice-detail-date">
              {format(new Date(notice.createdAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
            </span>
          </div>
          <h1 className="notice-detail-title">{notice.title}</h1>
          <div className="notice-detail-author">
            Publicado por: <strong>{notice.createdBy?.rank} {notice.createdBy?.warName}</strong>
            · Lido por {notice.readBy?.length || 0} militar(es)
          </div>
        </div>

        <div className="notice-detail-content">
          {notice.content.split('\n').map((line, i) => (
            <p key={i}>{line || <br />}</p>
          ))}
        </div>

        {notice.attachments?.length > 0 && (
          <div className="notice-attachments-section">
            <h3 className="attachments-title">📎 Anexos ({notice.attachments.length})</h3>
            <div className="attachments-grid">
              {notice.attachments.map((att, i) => (
                <div key={i} className="attachment-item">
                  {att.type === 'image' || att.type === 'gif' ? (
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="attachment-image-link">
                      <img src={att.url} alt={att.name} className="attachment-image" />
                      <div className="attachment-overlay">
                        <span>🔍 Abrir</span>
                      </div>
                    </a>
                  ) : att.type === 'video' ? (
                    <div className="attachment-video">
                      <video controls src={att.url} style={{ width: '100%', borderRadius: 4 }} />
                    </div>
                  ) : (
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="attachment-file">
                      <span className="attachment-file-icon">{getAttachmentIcon(att.type)}</span>
                      <div className="attachment-file-info">
                        <span className="attachment-file-name">{att.name}</span>
                        <span className="attachment-file-type">{att.type?.toUpperCase()}</span>
                      </div>
                      <span className="attachment-download">↓ Baixar</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="notice-detail-footer">
          <Link to="/avisos" className="btn btn-outline">← Voltar</Link>
        </div>
      </div>
    </div>
  );
}
