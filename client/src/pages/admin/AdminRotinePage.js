import React, { useState, useEffect } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminPages.css';
import './responsive.css';

const TIPO_ICONS = {
  formatura: '🎖', alimentacao: '🍽', servico: '⚔',
  atividade: '📋', outro: '📌',
};
const TIPO_COLORS = {
  formatura: '#6b7c5e', alimentacao: '#8e44ad', servico: '#c0392b',
  atividade: '#2980b9', outro: '#7f8c8d',
};

export default function AdminRotinePage() {
  const [rotina, setRotina] = useState(null);
  const [itens, setItens]   = useState([]);
  const [nome, setNome]     = useState('Rotina Padrão');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [novoItem, setNovoItem] = useState({ hora: '', descricao: '', tipo: 'outro' });
  const now = new Date();

  useEffect(() => {
    api.get('/rotina/config')
      .then(r => { setRotina(r.data); setItens(r.data.itens || []); setNome(r.data.nome || 'Rotina Padrão'); })
      .catch(() => toast.error('Erro ao carregar rotina'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const sorted = [...itens].sort((a, b) => a.hora.localeCompare(b.hora));
      await api.put('/rotina/config', { itens: sorted, nome });
      setItens(sorted);
      toast.success('✓ Rotina salva com sucesso!');
    } catch { toast.error('Erro ao salvar rotina'); }
    finally { setSaving(false); }
  };

  const addItem = () => {
    if (!novoItem.hora || !novoItem.descricao) { toast.error('Preencha hora e descrição'); return; }
    setItens(p => [...p, { ...novoItem, ativo: true }]);
    setNovoItem({ hora: '', descricao: '', tipo: 'outro' });
  };

  const removeItem = (i) => setItens(p => p.filter((_, idx) => idx !== i));
  const toggleItem = (i) => setItens(p => p.map((it, idx) => idx === i ? { ...it, ativo: !it.ativo } : it));
  const editDesc = (i, v) => setItens(p => p.map((it, idx) => idx === i ? { ...it, descricao: v } : it));
  const editHora = (i, v) => setItens(p => p.map((it, idx) => idx === i ? { ...it, hora: v } : it));

  const sorted = [...itens].sort((a, b) => a.hora.localeCompare(b.hora));

  // Current item highlight
  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentIdx = sorted.reduce((acc, it, i) => it.hora <= nowStr ? i : acc, -1);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">⏰ <span>Rotina</span> do Dia</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="admin-date">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Salvando...' : '💾 Salvar Rotina'}
          </button>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gap: 20 }}>
        {/* Editor */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <h3 className="card-title">⚙ Editor de Rotina</h3>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Nome da Rotina</label>
                <input className="form-control" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Rotina Padrão CHDI" />
              </div>

              {/* Add new item */}
              <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>+ Adicionar Novo Item</div>
                <div className="rg-rotina">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Hora</label>
                    <input type="time" className="form-control" value={novoItem.hora} onChange={e => setNovoItem(p => ({ ...p, hora: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Descrição</label>
                    <input className="form-control" value={novoItem.descricao} onChange={e => setNovoItem(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Formatura na praça de armas" onKeyDown={e => e.key === 'Enter' && addItem()} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tipo</label>
                    <select className="form-control" value={novoItem.tipo} onChange={e => setNovoItem(p => ({ ...p, tipo: e.target.value }))}>
                      <option value="formatura">🎖 Formatura</option>
                      <option value="alimentacao">🍽 Alimentação</option>
                      <option value="servico">⚔ Serviço</option>
                      <option value="atividade">📋 Atividade</option>
                      <option value="outro">📌 Outro</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={addItem} style={{ marginBottom: 0, height: 38 }}>+ Add</button>
                </div>
              </div>

              {/* List to edit */}
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {sorted.map((it, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    marginBottom: 4, borderRadius: 4, opacity: it.ativo ? 1 : 0.45,
                    background: 'var(--bg-dark)', border: `1px solid ${TIPO_COLORS[it.tipo] || '#555'}33`,
                  }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{TIPO_ICONS[it.tipo]}</span>
                    <input type="time" className="form-control" value={it.hora}
                      onChange={e => editHora(itens.indexOf(it), e.target.value)}
                      style={{ width: 85, flexShrink: 0, fontSize: '0.78rem', padding: '4px 6px' }} />
                    <input className="form-control" value={it.descricao}
                      onChange={e => editDesc(itens.indexOf(it), e.target.value)}
                      style={{ flex: 1, fontSize: '0.78rem', padding: '4px 8px' }} />
                    <button onClick={() => toggleItem(itens.indexOf(it))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: it.ativo ? '#27ae60' : '#555', fontSize: '1rem', padding: '0 2px' }} title={it.ativo ? 'Desativar' : 'Ativar'}>
                      {it.ativo ? '✓' : '○'}
                    </button>
                    <button onClick={() => removeItem(itens.indexOf(it))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem', padding: '0 2px' }} title="Remover">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-header">
            <h3 className="card-title">🕐 Rotina do Dia — Visualização</h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent)' }}>
              Agora: {nowStr}
            </span>
          </div>
          <div style={{ padding: '0 0 14px' }}>
            {sorted.filter(it => it.ativo).map((it, i) => {
              const isCurrent = i === currentIdx;
              const isPast = it.hora < nowStr;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: isCurrent ? 'rgba(107,124,94,.15)' : 'transparent',
                  position: 'relative',
                }}>
                  {isCurrent && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)', borderRadius: '0 2px 2px 0' }} />
                  )}
                  <div style={{
                    width: 52, textAlign: 'center', flexShrink: 0,
                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                    color: isCurrent ? 'var(--accent-bright)' : isPast ? 'var(--text-muted)' : 'var(--text-secondary)',
                    fontWeight: isCurrent ? 700 : 'normal',
                  }}>
                    {it.hora}
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: TIPO_COLORS[it.tipo] + '22',
                    border: `1px solid ${TIPO_COLORS[it.tipo]}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem',
                  }}>
                    {TIPO_ICONS[it.tipo]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.8rem',
                      color: isCurrent ? 'var(--text-primary)' : isPast ? 'var(--text-muted)' : 'var(--text-secondary)',
                      fontWeight: isCurrent ? 600 : 'normal',
                      textDecoration: isPast && !isCurrent ? 'line-through' : 'none',
                    }}>
                      {it.descricao}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: TIPO_COLORS[it.tipo], marginTop: 1, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {it.tipo}
                    </div>
                  </div>
                  {isCurrent && (
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ background: 'var(--accent)', color: 'var(--bg-dark)', padding: '2px 8px', borderRadius: 12, fontSize: '0.52rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontWeight: 700 }}>AGORA</span>
                    </div>
                  )}
                </div>
              );
            })}
            {sorted.filter(it => it.ativo).length === 0 && (
              <div className="empty-state"><div className="empty-state-icon">⏰</div><p className="empty-state-text">Nenhum item na rotina</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
