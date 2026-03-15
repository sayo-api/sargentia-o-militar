import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminPages.css';
import './responsive.css';

const EMPTY_FORM = { title: '', content: '', priority: 'normal', pinned: false };

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNotice, setEditNotice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices/all');
      setNotices(res.data);
    } catch { toast.error('Erro ao carregar avisos'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditNotice(null);
    setForm(EMPTY_FORM);
    setFiles([]);
    setShowModal(true);
  };

  const openEdit = (notice) => {
    setEditNotice(notice);
    setForm({ title: notice.title, content: notice.content, priority: notice.priority, pinned: notice.pinned });
    setFiles([]);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎬';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.match(/\.(xlsx|xls|csv)$/i)) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editNotice) {
        await api.put(`/notices/${editNotice._id}`, {
          title: form.title,
          content: form.content,
          priority: form.priority,
          pinned: form.pinned,
        });
        toast.success('Aviso atualizado');
      } else {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('content', form.content);
        formData.append('priority', form.priority);
        formData.append('pinned', form.pinned);
        files.forEach(f => formData.append('attachments', f));

        await api.post('/notices', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Aviso publicado com sucesso');
      }
      setShowModal(false);
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar aviso');
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (notice) => {
    try {
      await api.put(`/notices/${notice._id}`, { active: !notice.active });
      toast.success(notice.active ? 'Aviso desativado' : 'Aviso ativado');
      fetchNotices();
    } catch { toast.error('Erro ao atualizar aviso'); }
  };

  const handleTogglePin = async (notice) => {
    try {
      await api.put(`/notices/${notice._id}`, { pinned: !notice.pinned });
      toast.success(notice.pinned ? 'Aviso desafixado' : 'Aviso fixado');
      fetchNotices();
    } catch { toast.error('Erro ao fixar aviso'); }
  };

  const handleDelete = async (notice) => {
    if (!window.confirm(`Excluir o aviso "${notice.title}"?`)) return;
    try {
      await api.delete(`/notices/${notice._id}`);
      toast.success('Aviso excluído');
      fetchNotices();
    } catch { toast.error('Erro ao excluir aviso'); }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📋 <span>Gestão</span> de Avisos</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo Aviso</button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : notices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">Nenhum aviso criado</p>
          <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}>
            Criar primeiro aviso
          </button>
        </div>
      ) : (
        <div className="notice-admin-list">
          {notices.map(notice => (
            <div key={notice._id} className="notice-admin-card" style={{ opacity: notice.active ? 1 : 0.5 }}>
              <div className="notice-admin-body">
                <div className="notice-admin-meta">
                  <span className={`badge badge-${notice.priority}`}>{notice.priority}</span>
                  {notice.pinned && <span className="badge badge-info">📌 FIXADO</span>}
                  {!notice.active && <span className="badge" style={{ background: '#222', color: '#555', border: '1px solid #333' }}>INATIVO</span>}
                  {notice.attachments?.length > 0 && (
                    <span className="badge badge-normal">📎 {notice.attachments.length} anexo(s)</span>
                  )}
                </div>
                <p className="notice-admin-title">{notice.title}</p>
                <p className="notice-admin-excerpt">{notice.content}</p>
                <div className="notice-admin-footer">
                  Por: {notice.createdBy?.warName} ·{' '}
                  {format(new Date(notice.createdAt), "dd/MM/yyyy HH:mm")} ·{' '}
                  {notice.readBy?.length || 0} leitura(s)
                </div>
              </div>
              <div className="notice-admin-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(notice)} title="Editar">✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleTogglePin(notice)}
                  title={notice.pinned ? 'Desafixar' : 'Fixar'}>
                  {notice.pinned ? '📌' : '📍'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(notice)}
                  title={notice.active ? 'Desativar' : 'Ativar'}>
                  {notice.active ? '👁' : '🙈'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(notice)}
                  title="Excluir" style={{ color: 'var(--danger)' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editNotice ? 'Editar Aviso' : 'Novo Aviso'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => !saving && setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Título do Aviso</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: INSTRUÇÃO DE TIRO — ALTERAÇÃO DE HORÁRIO"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Conteúdo</label>
                <textarea
                  className="form-control"
                  placeholder="Escreva o conteúdo completo do aviso..."
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  required
                  style={{ minHeight: 140 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <select
                    className="form-control"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="importante">Importante</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fixar Aviso</label>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: 'var(--bg-elevated)',
                      border: `1px solid ${form.pinned ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                    onClick={() => setForm({ ...form, pinned: !form.pinned })}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 3,
                      background: form.pinned ? 'var(--accent)' : 'transparent',
                      border: `1px solid ${form.pinned ? 'var(--accent)' : 'var(--border-light)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', color: 'var(--bg-primary)',
                      flexShrink: 0,
                    }}>
                      {form.pinned && '✓'}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: form.pinned ? 'var(--accent-bright)' : 'var(--text-secondary)' }}>
                      {form.pinned ? '📌 Fixado' : 'Não fixado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* File upload — only when creating */}
              {!editNotice && (
                <div className="form-group">
                  <label className="form-label">Anexos (imagens, vídeos, GIFs, PDFs, planilhas)</label>
                  <div
                    className={`notice-upload-area ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-icon">⬆️</div>
                    <p className="upload-text">
                      Clique ou arraste arquivos aqui
                      <br />
                      <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                        Suportado: Imagens, Vídeos, GIFs, PDFs, Planilhas — até 50MB
                      </span>
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="file-preview-list">
                      {files.map((f, i) => (
                        <div key={i} className="file-preview-item">
                          <span>{getFileIcon(f)}</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.name}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {formatFileSize(f.size)}
                          </span>
                          <button type="button" className="file-remove-btn" onClick={() => removeFile(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editNotice && editNotice.attachments?.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Anexos existentes</label>
                  <div className="file-preview-list">
                    {editNotice.attachments.map((a, i) => (
                      <div key={i} className="file-preview-item">
                        <span>
                          {a.type === 'image' ? '🖼️' : a.type === 'video' ? '🎬' : a.type === 'pdf' ? '📄' : a.type === 'spreadsheet' ? '📊' : '📎'}
                        </span>
                        <a href={a.url} target="_blank" rel="noopener noreferrer"
                          style={{ flex: 1, color: 'var(--accent)', fontSize: '0.78rem', textDecoration: 'none' }}>
                          {a.name || 'Anexo'}
                        </a>
                        <span className="badge badge-normal" style={{ fontSize: '0.58rem' }}>{a.type}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Para alterar anexos, exclua e recrie o aviso.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => !saving && setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <><span className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</>
                  ) : editNotice ? 'Salvar Alterações' : 'Publicar Aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
