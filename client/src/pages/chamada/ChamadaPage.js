import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Chamada.css';

const TURNOS = [
  { id: 'geral', label: 'Geral' },
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' },
];

function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Modal: Detalhes / Atraso de soldado ─────────────────────────────────────
function SoldierDetailModal({ soldier, onSave, onClose }) {
  const [atrasado,       setAtrasado]       = useState(soldier.atrasado || false);
  const [horarioChegada, setHorarioChegada] = useState(soldier.horarioChegada || '');
  const [observacao,     setObservacao]     = useState(soldier.observacao || '');
  const u = soldier.user;

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal" onClick={e => e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title">Detalhes do Soldado</div>
            <div className="ch-modal-subtitle">
              {u?.rank} {u?.warName} — Nr. {u?.warNumber}
            </div>
          </div>
          <button className="ch-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ch-modal-body">
          <label className="ch-label">Status de presença</label>
          <div className="ch-presence-info">
            <span className={`ch-badge ${soldier.presente ? 'presente' : 'falta'}`}>
              {soldier.presente ? '✔ Presente' : '✘ Em Falta'}
            </span>
          </div>

          {soldier.presente && (
            <>
              <label className="ch-label" style={{ marginTop: 16 }}>
                <input type="checkbox" checked={atrasado} onChange={e => setAtrasado(e.target.checked)} />
                {' '}Marcou presença com atraso?
              </label>

              {atrasado && (
                <>
                  <label className="ch-label" style={{ marginTop: 12 }}>Horário de chegada</label>
                  <input
                    type="time"
                    className="ch-input"
                    value={horarioChegada}
                    onChange={e => setHorarioChegada(e.target.value)}
                  />
                </>
              )}
            </>
          )}

          <label className="ch-label" style={{ marginTop: 16 }}>Observação (opcional)</label>
          <textarea
            className="ch-input ch-textarea"
            rows={3}
            placeholder="Ex: Apresentou atestado, chegou com equipamento incorreto..."
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
        </div>

        <div className="ch-modal-footer">
          <button className="ch-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="ch-btn-primary" onClick={() => onSave({ atrasado, horarioChegada, observacao })}>
            ✔ Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ChamadaPage() {
  const [chamada,       setChamada]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [savingId,      setSavingId]      = useState(null);
  const [selectedDate,  setSelectedDate]  = useState(todayISO());
  const [selectedTurno, setSelectedTurno] = useState('geral');
  const [detailSoldier, setDetailSoldier] = useState(null);
  const [view,          setView]          = useState('lista'); // 'lista' | 'iniciar'
  const [chamadas,      setChamadas]      = useState([]);
  const [search,        setSearch]        = useState('');

  // ── Buscar chamadas recentes ──────────────────────────────────────────────
  const fetchChamadas = useCallback(async () => {
    try {
      const res = await api.get('/chamada?limit=20');
      setChamadas(res.data);
    } catch (err) {
      toast.error('Erro ao carregar chamadas.');
    }
  }, []);

  // ── Carregar chamada do dia/turno selecionado ─────────────────────────────
  const fetchChamadaDoDia = useCallback(async (date, turno) => {
    setLoading(true);
    try {
      const res = await api.get(`/chamada?date=${date}`);
      const found = res.data.find(c => c.turno === turno);
      setChamada(found || null);
    } catch (err) {
      toast.error('Erro ao carregar chamada.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChamadas();
  }, [fetchChamadas]);

  // ── Iniciar nova chamada ──────────────────────────────────────────────────
  const iniciarChamada = async () => {
    setLoading(true);
    try {
      const res = await api.post('/chamada', { date: selectedDate, turno: selectedTurno });
      setChamada(res.data);
      setView('lista');
      fetchChamadas();
      toast.success('Chamada iniciada!');
    } catch (err) {
      if (err.response?.status === 409) {
        setChamada(err.response.data.chamada);
        setView('lista');
        toast('Chamada já existe para este dia/turno.', { icon: 'ℹ️' });
      } else {
        toast.error('Erro ao iniciar chamada.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Marcar presença ───────────────────────────────────────────────────────
  const marcarPresenca = async (soldier, presente) => {
    if (!chamada) return;
    setSavingId(soldier.user._id);
    try {
      const res = await api.patch(`/chamada/${chamada._id}`, {
        soldiers: [{ userId: soldier.user._id, presente }],
      });
      setChamada(res.data);
    } catch (err) {
      toast.error('Erro ao atualizar presença.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Salvar detalhes (atraso / obs) ────────────────────────────────────────
  const salvarDetalhes = async ({ atrasado, horarioChegada, observacao }) => {
    if (!chamada || !detailSoldier) return;
    try {
      const res = await api.patch(`/chamada/${chamada._id}`, {
        soldiers: [{ userId: detailSoldier.user._id, atrasado, horarioChegada, observacao }],
      });
      setChamada(res.data);
      setDetailSoldier(null);
      toast.success('Atualizado!');
    } catch (err) {
      toast.error('Erro ao salvar detalhes.');
    }
  };

  // ── Enviar chamada ────────────────────────────────────────────────────────
  const enviarChamada = async () => {
    if (!chamada) return;
    const sem = chamada.soldiers.filter(s => s.presente === null).length;
    if (sem > 0 && !window.confirm(`${sem} soldado(s) ainda sem marcação. Enviar mesmo assim?`)) return;
    try {
      const res = await api.post(`/chamada/${chamada._id}/enviar`);
      setChamada(res.data);
      fetchChamadas();
      toast.success('Chamada enviada!');
    } catch (err) {
      toast.error('Erro ao enviar chamada.');
    }
  };

  // ── Reabrir chamada ───────────────────────────────────────────────────────
  const reabrirChamada = async () => {
    if (!chamada) return;
    try {
      const res = await api.post(`/chamada/${chamada._id}/reabrir`);
      setChamada(res.data);
      toast.success('Chamada reaberta!');
    } catch (err) {
      toast.error('Erro ao reabrir chamada.');
    }
  };

  // ── Filtrar soldados ──────────────────────────────────────────────────────
  const filteredSoldiers = chamada?.soldiers?.filter(s => {
    if (!search) return true;
    const u = s.user;
    return (
      u?.warName?.toLowerCase().includes(search.toLowerCase()) ||
      String(u?.warNumber).includes(search)
    );
  }) || [];

  const totalPresente = chamada?.soldiers?.filter(s => s.presente === true).length  || 0;
  const totalFalta    = chamada?.soldiers?.filter(s => s.presente === false).length || 0;
  const totalSem      = chamada?.soldiers?.filter(s => s.presente === null).length  || 0;
  const totalAtrasado = chamada?.soldiers?.filter(s => s.atrasado).length           || 0;

  const isFinalizada = chamada?.status === 'enviada';

  // ── Render: Iniciar nova chamada ──────────────────────────────────────────
  if (view === 'iniciar') {
    return (
      <div className="ch-page">
        <div className="ch-header">
          <button className="ch-btn-ghost" onClick={() => setView('lista')}>← Voltar</button>
          <h1 className="ch-title">🎖️ Nova Chamada</h1>
        </div>
        <div className="ch-iniciar-card">
          <label className="ch-label">Data</label>
          <input type="date" className="ch-input" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />

          <label className="ch-label" style={{ marginTop: 16 }}>Turno</label>
          <div className="ch-turno-grid">
            {TURNOS.map(t => (
              <button
                key={t.id}
                className={`ch-turno-btn ${selectedTurno === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTurno(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            className="ch-btn-primary ch-btn-full"
            style={{ marginTop: 24 }}
            disabled={loading}
            onClick={iniciarChamada}
          >
            {loading ? 'Iniciando...' : '▶ Iniciar Chamada'}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Chamada ativa ─────────────────────────────────────────────────
  if (chamada) {
    const turnoLabel = TURNOS.find(t => t.id === chamada.turno)?.label || chamada.turno;
    return (
      <div className="ch-page">
        {/* Header */}
        <div className="ch-header">
          <button className="ch-btn-ghost" onClick={() => { setChamada(null); fetchChamadas(); }}>
            ← Chamadas
          </button>
          <div>
            <h1 className="ch-title">
              📋 Chamada — {turnoLabel} · {fmtDate(chamada.date)}
            </h1>
            <span className={`ch-status-badge ${chamada.status}`}>
              {chamada.status === 'aberta' ? '🟢 Aberta' : chamada.status === 'enviada' ? '✅ Enviada' : '🔄 Reaberta'}
            </span>
          </div>
        </div>

        {/* Resumo */}
        <div className="ch-stats-row">
          <div className="ch-stat ch-stat--green">
            <span className="ch-stat-num">{totalPresente}</span>
            <span className="ch-stat-lbl">Presente</span>
          </div>
          <div className="ch-stat ch-stat--red">
            <span className="ch-stat-num">{totalFalta}</span>
            <span className="ch-stat-lbl">Falta</span>
          </div>
          <div className="ch-stat ch-stat--yellow">
            <span className="ch-stat-num">{totalAtrasado}</span>
            <span className="ch-stat-lbl">Atrasado</span>
          </div>
          <div className="ch-stat ch-stat--gray">
            <span className="ch-stat-num">{totalSem}</span>
            <span className="ch-stat-lbl">Sem marcação</span>
          </div>
        </div>

        {/* Busca */}
        <div className="ch-search-bar">
          <input
            className="ch-input"
            placeholder="🔍  Buscar por nome ou número..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Lista de soldados */}
        <div className="ch-soldiers-list">
          {filteredSoldiers.map((s, idx) => {
            const u = s.user;
            const isSaving = savingId === u?._id;
            const num = String(u?.warNumber || '?').padStart(2, '0');
            return (
              <div key={u?._id || idx} className={`ch-soldier-row ${s.presente === true ? 'presente' : s.presente === false ? 'falta' : ''}`}>
                <div className="ch-soldier-num">{num}</div>
                <div className="ch-soldier-info">
                  <span className="ch-soldier-name">{u?.warName || 'Desconhecido'}</span>
                  {u?.rank && <span className="ch-soldier-rank">{u.rank}</span>}
                  {s.atrasado && <span className="ch-badge-atrasado">⏱ Atrasado {s.horarioChegada ? `(${s.horarioChegada})` : ''}</span>}
                  {s.observacao && <span className="ch-soldier-obs" title={s.observacao}>💬</span>}
                </div>
                <div className="ch-soldier-actions">
                  {!isFinalizada && (
                    <>
                      <button
                        className={`ch-btn-presence presente ${s.presente === true ? 'active' : ''}`}
                        disabled={isSaving}
                        onClick={() => marcarPresenca(s, true)}
                        title="Presente"
                      >✔</button>
                      <button
                        className={`ch-btn-presence falta ${s.presente === false ? 'active' : ''}`}
                        disabled={isSaving}
                        onClick={() => marcarPresenca(s, false)}
                        title="Em Falta"
                      >✘</button>
                    </>
                  )}
                  <button
                    className="ch-btn-detail"
                    onClick={() => setDetailSoldier(s)}
                    title="Detalhes / Atraso"
                  >⋮</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé: Ações */}
        <div className="ch-footer">
          {!isFinalizada ? (
            <button className="ch-btn-primary ch-btn-enviar" onClick={enviarChamada}>
              ✅ Finalizar e Enviar Chamada
            </button>
          ) : (
            <button className="ch-btn-warning ch-btn-enviar" onClick={reabrirChamada}>
              🔄 Reabrir Chamada
            </button>
          )}
        </div>

        {/* Modal detalhe soldado */}
        {detailSoldier && (
          <SoldierDetailModal
            soldier={detailSoldier}
            onSave={salvarDetalhes}
            onClose={() => setDetailSoldier(null)}
          />
        )}
      </div>
    );
  }

  // ── Render: Listagem de chamadas ──────────────────────────────────────────
  return (
    <div className="ch-page">
      <div className="ch-header">
        <h1 className="ch-title">📋 Sistema de Chamada</h1>
        <button className="ch-btn-primary" onClick={() => setView('iniciar')}>
          ▶ Nova Chamada
        </button>
      </div>

      <div className="ch-chamadas-list">
        {chamadas.length === 0 && !loading && (
          <div className="ch-empty">
            <span>Nenhuma chamada registrada ainda.</span>
            <button className="ch-btn-primary" onClick={() => setView('iniciar')}>
              Iniciar primeira chamada
            </button>
          </div>
        )}
        {chamadas.map(c => {
          const turnoLabel = TURNOS.find(t => t.id === c.turno)?.label || c.turno;
          const presente   = c.soldiers.filter(s => s.presente === true).length;
          const falta      = c.soldiers.filter(s => s.presente === false).length;
          return (
            <div key={c._id} className="ch-chamada-card" onClick={() => setChamada(c)}>
              <div className="ch-chamada-card-left">
                <span className="ch-chamada-date">{fmtDate(c.date)}</span>
                <span className="ch-chamada-turno">{turnoLabel}</span>
                <span className={`ch-status-badge small ${c.status}`}>
                  {c.status === 'aberta' ? '🟢 Aberta' : c.status === 'enviada' ? '✅ Enviada' : '🔄 Reaberta'}
                </span>
              </div>
              <div className="ch-chamada-card-right">
                <span className="ch-mini-stat green">{presente} ✔</span>
                <span className="ch-mini-stat red">{falta} ✘</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
