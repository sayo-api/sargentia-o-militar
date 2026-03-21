import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ClipboardList, Plus, Check, X, Clock, Search,
  Send, RefreshCw, ChevronLeft, Users, Calendar,
  MoreVertical, Info, AlertCircle,
} from 'lucide-react';

import './Chamada.css';

const TURNOS = [
  { id:'geral', label:'Geral' },
  { id:'manha', label:'Manhã' },
  { id:'tarde', label:'Tarde' },
  { id:'noite', label:'Noite' },
];

function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Modal detalhes soldado ───────────────────────────────────────────────────
function SoldierDetailModal({ soldier, onSave, onClose }) {
  const [atrasado, setAtrasado]             = useState(soldier.atrasado || false);
  const [horarioChegada, setHorarioChegada] = useState(soldier.horarioChegada || '');
  const [observacao, setObservacao]         = useState(soldier.observacao || '');
  const u = soldier.user;

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal" onClick={e => e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title"><Info size={16}/> Detalhes</div>
            <div className="ch-modal-subtitle">{u?.rank} {u?.warName} · Nr. {u?.warNumber}</div>
          </div>
          <button className="ch-modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="ch-modal-body">
          <div className="ch-presence-info">
            <label className="ch-label">Status</label>
            <span className={`ch-badge ${soldier.presente ? 'presente' : 'falta'}`}>
              {soldier.presente ? <><Check size={12}/> Presente</> : <><X size={12}/> Em Falta</>}
            </span>
          </div>
          {soldier.presente && (
            <>
              <label className="ch-label" style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginTop:4}}>
                <input type="checkbox" checked={atrasado} onChange={e => setAtrasado(e.target.checked)}/>
                Marcou presença com atraso?
              </label>
              {atrasado && (
                <div>
                  <label className="ch-label">Horário de chegada</label>
                  <input type="time" className="ch-input" value={horarioChegada} onChange={e => setHorarioChegada(e.target.value)}/>
                </div>
              )}
            </>
          )}
          <div>
            <label className="ch-label">Observação</label>
            <textarea
              className="ch-input ch-textarea"
              rows={3}
              placeholder="Ex: Apresentou atestado, equipamento incorreto..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
            />
          </div>
        </div>
        <div className="ch-modal-footer">
          <button className="ch-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="ch-btn-primary" onClick={() => onSave({ atrasado, horarioChegada, observacao })}>
            <Check size={14}/> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ChamadaPage() {
  const [chamada,        setChamada]       = useState(null);
  const [loading,        setLoading]       = useState(false);
  const [savingId,       setSavingId]      = useState(null);
  const [selectedDate,   setSelectedDate]  = useState(todayISO());
  const [selectedTurno,  setSelectedTurno] = useState('geral');
  const [detailSoldier,  setDetailSoldier] = useState(null);
  const [view,           setView]          = useState('lista');
  const [chamadas,       setChamadas]      = useState([]);
  const [search,         setSearch]        = useState('');

  const fetchChamadas = useCallback(async () => {
    try {
      const res = await api.get('/chamada?limit=30');
      setChamadas(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error('Erro ao carregar chamadas.'); }
  }, []);

  useEffect(() => { fetchChamadas(); }, [fetchChamadas]);

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
        toast('Chamada já existe para este dia/turno — carregada.', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.message || 'Erro ao iniciar chamada.');
      }
    } finally { setLoading(false); }
  };

  const marcarPresenca = async (soldier, presente) => {
    if (!chamada) return;
    setSavingId(soldier.user._id);
    try {
      const res = await api.patch(`/chamada/${chamada._id}`, {
        soldiers: [{ userId: soldier.user._id, presente }],
      });
      setChamada(res.data);
    } catch { toast.error('Erro ao atualizar presença.'); }
    finally  { setSavingId(null); }
  };

  const salvarDetalhes = async ({ atrasado, horarioChegada, observacao }) => {
    if (!chamada || !detailSoldier) return;
    try {
      const res = await api.patch(`/chamada/${chamada._id}`, {
        soldiers: [{ userId: detailSoldier.user._id, atrasado, horarioChegada, observacao }],
      });
      setChamada(res.data);
      setDetailSoldier(null);
      toast.success('Atualizado!');
    } catch { toast.error('Erro ao salvar detalhes.'); }
  };

  const enviarChamada = async () => {
    if (!chamada) return;
    const sem = chamada.soldiers.filter(s => s.presente === null).length;
    if (sem > 0 && !window.confirm(`${sem} soldado(s) sem marcação. Enviar mesmo assim?`)) return;
    try {
      const res = await api.post(`/chamada/${chamada._id}/enviar`);
      setChamada(res.data);
      fetchChamadas();
      toast.success('Chamada enviada com sucesso!');
    } catch { toast.error('Erro ao enviar chamada.'); }
  };

  const reabrirChamada = async () => {
    if (!chamada) return;
    try {
      const res = await api.post(`/chamada/${chamada._id}/reabrir`);
      setChamada(res.data);
      toast.success('Chamada reaberta!');
    } catch { toast.error('Erro ao reabrir chamada.'); }
  };

  const filteredSoldiers = (chamada?.soldiers || []).filter(s => {
    if (!search) return true;
    const u = s.user;
    return u?.warName?.toLowerCase().includes(search.toLowerCase()) ||
           String(u?.warNumber || '').includes(search);
  }).sort((a, b) => (a.user?.warNumber || 0) - (b.user?.warNumber || 0));

  const totalPresente = chamada?.soldiers?.filter(s => s.presente === true).length  || 0;
  const totalFalta    = chamada?.soldiers?.filter(s => s.presente === false).length || 0;
  const totalSem      = chamada?.soldiers?.filter(s => s.presente === null).length  || 0;
  const totalAtrasado = chamada?.soldiers?.filter(s => s.atrasado).length           || 0;
  const isFinalizada  = chamada?.status === 'enviada';

  // ── View: Iniciar nova chamada ────────────────────────────────────────────
  if (view === 'iniciar') {
    return (
      <div className="ch-page">
        <div className="ch-header">
          <button className="ch-btn-ghost" onClick={() => setView('lista')}>
            <ChevronLeft size={16}/> Voltar
          </button>
          <h1 className="ch-title">⚔ Nova Chamada</h1>
        </div>

        <div className="ch-iniciar-card">
          <div>
            <label className="ch-label"><Calendar size={12}/> Data</label>
            <input type="date" className="ch-input" value={selectedDate}
              max={todayISO()} onChange={e => setSelectedDate(e.target.value)}/>
          </div>

          <div style={{marginTop:18}}>
            <label className="ch-label"><Clock size={12}/> Turno</label>
            <div className="ch-turno-grid">
              {TURNOS.map(t => (
                <button key={t.id}
                  className={`ch-turno-btn ${selectedTurno === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTurno(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button className="ch-btn-primary ch-btn-full" style={{marginTop:24}} disabled={loading} onClick={iniciarChamada}>
            {loading ? 'Iniciando...' : <><Plus size={15}/> Iniciar Chamada</>}
          </button>
        </div>
      </div>
    );
  }

  // ── View: Chamada ativa ───────────────────────────────────────────────────
  if (chamada) {
    const turnoLabel = TURNOS.find(t => t.id === chamada.turno)?.label || chamada.turno;
    return (
      <div className="ch-page">
        <div className="ch-header">
          <button className="ch-btn-ghost" onClick={() => { setChamada(null); fetchChamadas(); }}>
            <ChevronLeft size={16}/> Chamadas
          </button>
          <div style={{flex:1}}>
            <h1 className="ch-title" style={{fontSize:'1rem'}}>
              <ClipboardList size={16}/> {turnoLabel} · {fmtDate(chamada.date)}
            </h1>
            <span className={`ch-status-badge ${chamada.status}`}>
              {chamada.status === 'aberta'   ? <><AlertCircle size={11}/> Aberta</>   :
               chamada.status === 'enviada'  ? <><Check size={11}/> Enviada</>        :
               <><RefreshCw size={11}/> Reaberta</>}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="ch-stats-row">
          {[
            { label:'Presente',    value:totalPresente, cls:'--green'  },
            { label:'Falta',       value:totalFalta,    cls:'--red'    },
            { label:'Atrasado',    value:totalAtrasado, cls:'--yellow' },
            { label:'Sem marcação',value:totalSem,      cls:'--gray'   },
          ].map(s => (
            <div key={s.label} className={`ch-stat ch-stat${s.cls}`}>
              <span className="ch-stat-num">{s.value}</span>
              <span className="ch-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Busca */}
        <div className="ch-search-bar">
          <Search size={15}/>
          <input className="ch-input" placeholder="Buscar por nome ou número..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        {/* Soldados */}
        <div className="ch-soldiers-list">
          {filteredSoldiers.map((s, idx) => {
            const u = s.user;
            const isSaving = savingId === u?._id;
            return (
              <div key={u?._id || idx} className={`ch-soldier-row ${s.presente===true?'presente':s.presente===false?'falta':''}`}>
                <div className="ch-soldier-num">{String(u?.warNumber||'?').padStart(2,'0')}</div>
                <div className="ch-soldier-info">
                  <span className="ch-soldier-name">{u?.warName || '—'}</span>
                  <span className="ch-soldier-rank">{u?.rank}</span>
                  {s.atrasado && (
                    <span className="ch-badge-atrasado">
                      <Clock size={10}/> Atrasado{s.horarioChegada ? ` ${s.horarioChegada}` : ''}
                    </span>
                  )}
                </div>
                <div className="ch-soldier-actions">
                  {!isFinalizada && (
                    <>
                      <button className={`ch-btn-presence presente ${s.presente===true?'active':''}`}
                        disabled={isSaving} onClick={() => marcarPresenca(s, true)} title="Presente">
                        <Check size={16}/>
                      </button>
                      <button className={`ch-btn-presence falta ${s.presente===false?'active':''}`}
                        disabled={isSaving} onClick={() => marcarPresenca(s, false)} title="Falta">
                        <X size={16}/>
                      </button>
                    </>
                  )}
                  <button className="ch-btn-detail" onClick={() => setDetailSoldier(s)}>
                    <MoreVertical size={14}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="ch-footer">
          {!isFinalizada ? (
            <button className="ch-btn-primary ch-btn-enviar" onClick={enviarChamada}>
              <Send size={15}/> Finalizar e Enviar
            </button>
          ) : (
            <button className="ch-btn-warning ch-btn-enviar" onClick={reabrirChamada}>
              <RefreshCw size={15}/> Reabrir Chamada
            </button>
          )}
        </div>

        {detailSoldier && (
          <SoldierDetailModal soldier={detailSoldier} onSave={salvarDetalhes} onClose={() => setDetailSoldier(null)}/>
        )}
      </div>
    );
  }

  // ── View: Lista de chamadas ───────────────────────────────────────────────
  return (
    <div className="ch-page">
      <div className="ch-header">
        <h1 className="ch-title"><ClipboardList size={18}/> Sistema de Chamada</h1>
        <button className="ch-btn-primary" onClick={() => setView('iniciar')}>
          <Plus size={15}/> Nova Chamada
        </button>
      </div>

      {chamadas.length === 0 && (
        <div className="ch-empty">
          <Users size={32}/>
          <span>Nenhuma chamada registrada ainda.</span>
          <button className="ch-btn-primary" onClick={() => setView('iniciar')}>
            <Plus size={14}/> Iniciar primeira chamada
          </button>
        </div>
      )}

      <div className="ch-chamadas-list">
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
                  {c.status === 'enviada' ? <><Check size={10}/> Enviada</> :
                   c.status === 'reaberta'? <><RefreshCw size={10}/> Reaberta</> :
                   <><AlertCircle size={10}/> Aberta</>}
                </span>
              </div>
              <div className="ch-chamada-card-right">
                <span className="ch-mini-stat green"><Check size={11}/> {presente}</span>
                <span className="ch-mini-stat red"><X size={11}/> {falta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
