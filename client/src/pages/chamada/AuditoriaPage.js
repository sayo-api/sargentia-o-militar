import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Chamada.css';

const TFM_FIELDS = [
  { key: 'blusa', label: 'Blusa' },
  { key: 'short', label: 'Short' },
  { key: 'meia',  label: 'Meia'  },
  { key: 'tenis', label: 'Tênis' },
];

const AUDIT_FIELDS = [
  { key: 'cabelo',  label: 'Cabelo',  icon: '💇' },
  { key: 'barba',   label: 'Barba',   icon: '🧔' },
  { key: 'cuturno', label: 'Cuturno', icon: '👞' },
];

function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Modal: Editar auditoria de um soldado ────────────────────────────────────
function SoldierAuditoriaModal({ item, onSave, onClose }) {
  const [data, setData] = useState(() => {
    const d = JSON.parse(JSON.stringify(item)); // deep clone
    // garantir estrutura
    ['cabelo','barba','cuturno'].forEach(f => { if (!d[f]) d[f] = { padrao: null, observacao: '' }; });
    if (!d.tfm) d.tfm = {};
    TFM_FIELDS.forEach(({ key }) => { if (!d.tfm[key]) d.tfm[key] = { padrao: null, observacao: '' }; });
    return d;
  });

  const u = item.user;

  const setField = (field, prop, val) => {
    setData(prev => ({
      ...prev,
      [field]: { ...prev[field], [prop]: val },
    }));
  };

  const setTfm = (field, prop, val) => {
    setData(prev => ({
      ...prev,
      tfm: { ...prev.tfm, [field]: { ...(prev.tfm[field] || {}), [prop]: val } },
    }));
  };

  const AuditRow = ({ field, label, icon, value, onChange }) => (
    <div className="au-audit-row">
      <div className="au-audit-row-label">{icon} {label}</div>
      <div className="au-audit-row-btns">
        <button
          className={`au-padrao-btn padrao ${value?.padrao === true ? 'active' : ''}`}
          onClick={() => onChange('padrao', value?.padrao === true ? null : true)}
        >✔ Padrão</button>
        <button
          className={`au-padrao-btn nao-padrao ${value?.padrao === false ? 'active' : ''}`}
          onClick={() => onChange('padrao', value?.padrao === false ? null : false)}
        >✘ Fora do Padrão</button>
      </div>
      {value?.padrao === false && (
        <input
          className="ch-input au-obs-input"
          placeholder="Observação (opcional)..."
          value={value?.observacao || ''}
          onChange={e => onChange('observacao', e.target.value)}
        />
      )}
    </div>
  );

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal au-modal" onClick={e => e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title">🔍 Auditoria</div>
            <div className="ch-modal-subtitle">{u?.rank} {u?.warName} — Nr. {u?.warNumber}</div>
          </div>
          <button className="ch-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ch-modal-body">
          <div className="au-section-title">Aparência / Uniforme</div>
          {AUDIT_FIELDS.map(({ key, label, icon }) => (
            <AuditRow
              key={key}
              field={key}
              label={label}
              icon={icon}
              value={data[key]}
              onChange={(prop, val) => setField(key, prop, val)}
            />
          ))}

          <div className="au-section-title" style={{ marginTop: 20 }}>TFM (Treino Físico Militar)</div>
          {TFM_FIELDS.map(({ key, label }) => (
            <AuditRow
              key={key}
              field={key}
              label={label}
              icon="👕"
              value={data.tfm?.[key]}
              onChange={(prop, val) => setTfm(key, prop, val)}
            />
          ))}
        </div>

        <div className="ch-modal-footer">
          <button className="ch-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="ch-btn-primary" onClick={() => onSave(data)}>✔ Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AuditoriaPage({ chamadaId: propChamadaId }) {
  const [chamadas,      setChamadas]      = useState([]);
  const [auditoria,     setAuditoria]     = useState(null);
  const [selectedChamada, setSelectedChamada] = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [editingItem,   setEditingItem]   = useState(null);
  const [search,        setSearch]        = useState('');

  // ── Carregar chamadas enviadas ────────────────────────────────────────────
  const fetchChamadas = useCallback(async () => {
    try {
      const res = await api.get('/chamada?limit=30');
      // mostra todas as chamadas, não apenas enviadas, para permitir criar auditoria
      setChamadas(res.data);
    } catch (err) {
      toast.error('Erro ao carregar chamadas.');
    }
  }, []);

  useEffect(() => { fetchChamadas(); }, [fetchChamadas]);

  // Se vier propChamadaId, auto-selecionar
  useEffect(() => {
    if (propChamadaId && chamadas.length) {
      const c = chamadas.find(c => c._id === propChamadaId);
      if (c) selectChamada(c);
    }
  }, [propChamadaId, chamadas]);

  const selectChamada = async (chamada) => {
    setSelectedChamada(chamada);
    setLoading(true);
    try {
      const res = await api.get(`/auditoria?chamadaId=${chamada._id}`);
      setAuditoria(res.data[0] || null);
    } catch (err) {
      toast.error('Erro ao carregar auditoria.');
    } finally {
      setLoading(false);
    }
  };

  // ── Criar nova auditoria para chamada ─────────────────────────────────────
  const criarAuditoria = async () => {
    if (!selectedChamada) return;
    setLoading(true);
    try {
      const res = await api.post('/auditoria', { chamadaId: selectedChamada._id });
      setAuditoria(res.data);
      toast.success('Auditoria iniciada!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar auditoria.');
    } finally {
      setLoading(false);
    }
  };

  // ── Salvar edição de um soldado ───────────────────────────────────────────
  const salvarItem = async (updatedItem) => {
    if (!auditoria) return;
    setSaving(true);
    try {
      const payload = {
        items: [{
          userId:  updatedItem.user._id,
          cabelo:  updatedItem.cabelo,
          barba:   updatedItem.barba,
          cuturno: updatedItem.cuturno,
          tfm:     updatedItem.tfm,
        }],
      };
      const res = await api.patch(`/auditoria/${auditoria._id}`, payload);
      setAuditoria(res.data);
      setEditingItem(null);
      toast.success('Auditoria salva!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar auditoria.');
    } finally {
      setSaving(false);
    }
  };

  const enviarAuditoria = async () => {
    if (!auditoria) return;
    try {
      const res = await api.post(`/auditoria/${auditoria._id}/enviar`);
      setAuditoria(res.data);
      toast.success('Auditoria finalizada!');
    } catch (err) {
      toast.error('Erro ao enviar auditoria.');
    }
  };

  const reabrirAuditoria = async () => {
    if (!auditoria) return;
    try {
      const res = await api.post(`/auditoria/${auditoria._id}/reabrir`);
      setAuditoria(res.data);
      toast.success('Auditoria reaberta!');
    } catch (err) {
      toast.error('Erro ao reabrir auditoria.');
    }
  };

  const isFinalizada = auditoria?.status === 'enviada';

  const filteredItems = auditoria?.items?.filter(i => {
    if (!search) return true;
    const u = i.user;
    return (
      u?.warName?.toLowerCase().includes(search.toLowerCase()) ||
      String(u?.warNumber).includes(search)
    );
  }) || [];

  function countProblems(item) {
    let n = 0;
    if (item.cabelo?.padrao  === false) n++;
    if (item.barba?.padrao   === false) n++;
    if (item.cuturno?.padrao === false) n++;
    TFM_FIELDS.forEach(({ key }) => { if (item.tfm?.[key]?.padrao === false) n++; });
    return n;
  }

  // ── Render: selecionar chamada ────────────────────────────────────────────
  if (!selectedChamada) {
    return (
      <div className="ch-page">
        <div className="ch-header">
          <h1 className="ch-title">🔍 Auditoria de Fardamento / TFM</h1>
        </div>
        <p className="ch-subtitle">Selecione uma chamada para registrar a auditoria:</p>
        <div className="ch-chamadas-list">
          {chamadas.map(c => {
            const presente = c.soldiers.filter(s => s.presente === true).length;
            return (
              <div key={c._id} className="ch-chamada-card" onClick={() => selectChamada(c)}>
                <div className="ch-chamada-card-left">
                  <span className="ch-chamada-date">{fmtDate(c.date)}</span>
                  <span className="ch-chamada-turno">
                    {({ geral:'Geral', manha:'Manhã', tarde:'Tarde', noite:'Noite' })[c.turno] || c.turno}
                  </span>
                  <span className={`ch-status-badge small ${c.status}`}>
                    {c.status === 'enviada' ? '✅ Enviada' : c.status === 'reaberta' ? '🔄 Reaberta' : '🟢 Aberta'}
                  </span>
                </div>
                <div className="ch-chamada-card-right">
                  <span className="ch-mini-stat green">{presente} presentes</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render: auditoria ─────────────────────────────────────────────────────
  return (
    <div className="ch-page">
      <div className="ch-header">
        <button className="ch-btn-ghost" onClick={() => { setSelectedChamada(null); setAuditoria(null); }}>
          ← Chamadas
        </button>
        <div>
          <h1 className="ch-title">🔍 Auditoria — {fmtDate(selectedChamada.date)}</h1>
          {auditoria && (
            <span className={`ch-status-badge ${auditoria.status}`}>
              {auditoria.status === 'enviada' ? '✅ Finalizada' : auditoria.status === 'reaberta' ? '🔄 Reaberta' : '🟢 Em andamento'}
            </span>
          )}
        </div>
      </div>

      {loading && <div className="ch-loading">Carregando...</div>}

      {!loading && !auditoria && (
        <div className="ch-empty">
          <p>Nenhuma auditoria para esta chamada ainda.</p>
          <button className="ch-btn-primary" onClick={criarAuditoria}>
            🔍 Iniciar Auditoria
          </button>
        </div>
      )}

      {!loading && auditoria && (
        <>
          <div className="ch-search-bar">
            <input
              className="ch-input"
              placeholder="🔍  Buscar por nome ou número..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="ch-soldiers-list">
            {filteredItems.map((item, idx) => {
              const u        = item.user;
              const problems = countProblems(item);
              const num      = String(u?.warNumber || '?').padStart(2, '0');
              return (
                <div key={u?._id || idx} className={`ch-soldier-row ${problems > 0 ? 'falta' : ''}`}>
                  <div className="ch-soldier-num">{num}</div>
                  <div className="ch-soldier-info">
                    <span className="ch-soldier-name">{u?.warName || '?'}</span>
                    {u?.rank && <span className="ch-soldier-rank">{u.rank}</span>}
                    {problems > 0 && (
                      <span className="ch-badge-atrasado" style={{ background: '#ef4444' }}>
                        ⚠ {problems} irregularidade(s)
                      </span>
                    )}
                    {problems === 0 && auditoria.items.find(i => i.user._id === u?._id) && (
                      <span className="ch-badge-ok">✔ Regular</span>
                    )}
                  </div>
                  <div className="ch-soldier-actions">
                    <button
                      className="ch-btn-detail"
                      onClick={() => setEditingItem(item)}
                      disabled={saving}
                    >
                      {isFinalizada ? '👁 Ver' : '✏ Auditar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ch-footer">
            {!isFinalizada ? (
              <button className="ch-btn-primary ch-btn-enviar" onClick={enviarAuditoria}>
                ✅ Finalizar Auditoria
              </button>
            ) : (
              <button className="ch-btn-warning ch-btn-enviar" onClick={reabrirAuditoria}>
                🔄 Reabrir Auditoria
              </button>
            )}
          </div>
        </>
      )}

      {editingItem && (
        <SoldierAuditoriaModal
          item={editingItem}
          onSave={salvarItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
