/**
 * AuditoriaPage.js
 * Auditoria de Fardamento / TFM com campos TFM totalmente configuráveis.
 * Os campos TFM são salvos em localStorage e podem ser adicionados/editados/removidos.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Chamada.css';

// ─── Campos de aparência (fixos) ──────────────────────────────────────────────
const AUDIT_FIELDS = [
  { key: 'cabelo',  label: 'Cabelo',  icon: '💇' },
  { key: 'barba',   label: 'Barba',   icon: '🧔' },
  { key: 'cuturno', label: 'Cuturno', icon: '👞' },
];

// ─── Campos TFM padrão ────────────────────────────────────────────────────────
const DEFAULT_TFM_FIELDS = [
  { key: 'blusa', label: 'Blusa TFM' },
  { key: 'short', label: 'Short TFM' },
  { key: 'meia',  label: 'Meia TFM'  },
  { key: 'tenis', label: 'Tênis TFM' },
];

const TFM_STORAGE_KEY = 'sim_tfm_fields';

function loadTfmFields() {
  try {
    const raw = localStorage.getItem(TFM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TFM_FIELDS;
}

function saveTfmFields(fields) {
  try { localStorage.setItem(TFM_STORAGE_KEY, JSON.stringify(fields)); } catch {}
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// ─── Modal: Configurar Campos TFM ─────────────────────────────────────────────
function TfmConfigModal({ fields, onSave, onClose }) {
  const [list, setList] = useState(() => fields.map(f => ({...f})));
  const [newLabel, setNewLabel] = useState('');

  const add = () => {
    const label = newLabel.trim();
    if (!label) { toast.error('Digite o nome do campo.'); return; }
    const key = slugify(label);
    if (list.find(f => f.key === key)) { toast.error('Campo com este nome já existe.'); return; }
    setList(prev => [...prev, { key, label }]);
    setNewLabel('');
  };

  const remove = (key) => {
    setList(prev => prev.filter(f => f.key !== key));
  };

  const updateLabel = (key, label) => {
    setList(prev => prev.map(f => f.key === key ? { ...f, label } : f));
  };

  const handleSave = () => {
    if (list.length === 0) { toast.error('Adicione pelo menos um campo TFM.'); return; }
    onSave(list);
    toast.success('Campos TFM atualizados!');
  };

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal au-modal" style={{maxWidth:460}} onClick={e => e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title">⚙️ Configurar Campos TFM</div>
            <div className="ch-modal-subtitle">Adicione, edite ou remova itens de verificação</div>
          </div>
          <button className="ch-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ch-modal-body">
          <p style={{color:'#6a8a60',fontSize:'.82rem',margin:'0 0 14px',lineHeight:1.5}}>
            Estes campos aparecerão em todas as auditorias. Edite os rótulos ou exclua itens que não se aplicam à sua unidade.
          </p>

          {/* Lista existente */}
          <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
            {list.map((f, i) => (
              <div key={f.key} style={{
                display:'flex', alignItems:'center', gap:8,
                background:'#162413', border:'1px solid #2d4a22',
                borderLeft:'3px solid #4a7a35',
                borderRadius:4, padding:'8px 12px',
              }}>
                <span style={{
                  fontFamily:'monospace', fontSize:'.7rem',
                  color:'#6a8a60', minWidth:60, flexShrink:0,
                  textTransform:'uppercase', letterSpacing:'0.04em',
                }}>
                  {String(i+1).padStart(2,'0')} ·
                </span>
                <input
                  style={{
                    flex:1, background:'#0f1a0d', border:'1px solid #2d4a22',
                    borderRadius:4, color:'#d8e8d0', padding:'5px 10px',
                    fontSize:'.88rem', outline:'none',
                  }}
                  value={f.label}
                  onChange={e => updateLabel(f.key, e.target.value)}
                  onFocus={e => e.target.style.borderColor='#c9a227'}
                  onBlur={e => e.target.style.borderColor='#2d4a22'}
                />
                <button
                  onClick={() => remove(f.key)}
                  title="Remover campo"
                  style={{
                    background:'#2a0d0a', color:'#d94f3d',
                    border:'1px solid #6b2820', borderRadius:4,
                    padding:'4px 10px', cursor:'pointer',
                    fontSize:'.78rem', fontWeight:700, flexShrink:0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {list.length === 0 && (
              <div style={{textAlign:'center',color:'#6a8a60',padding:'20px',fontSize:'.85rem'}}>
                Nenhum campo. Adicione um abaixo.
              </div>
            )}
          </div>

          {/* Adicionar novo */}
          <div style={{
            background:'#0f1a0d', border:'1px dashed #3d6030',
            borderRadius:4, padding:'12px',
          }}>
            <div style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#c9a227',marginBottom:8}}>
              + Novo Campo
            </div>
            <div style={{display:'flex',gap:8}}>
              <input
                style={{
                  flex:1, background:'#162413', border:'1px solid #2d4a22',
                  borderRadius:4, color:'#d8e8d0', padding:'8px 12px',
                  fontSize:'.9rem', outline:'none',
                }}
                placeholder="Ex: Colete, Calça, Bota..."
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key==='Enter' && add()}
                onFocus={e => e.target.style.borderColor='#c9a227'}
                onBlur={e => e.target.style.borderColor='#2d4a22'}
              />
              <button
                onClick={add}
                style={{
                  background:'linear-gradient(135deg,#1a3a10,#0e2508)',
                  color:'#c9a227', border:'1px solid #7a6118',
                  borderRadius:4, padding:'8px 16px',
                  fontSize:'.8rem', fontWeight:800,
                  letterSpacing:'0.06em', textTransform:'uppercase',
                  cursor:'pointer', whiteSpace:'nowrap',
                }}
              >
                ➕ Adicionar
              </button>
            </div>
          </div>
        </div>

        <div className="ch-modal-footer">
          <button className="ch-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="ch-btn-primary" onClick={handleSave}>💾 Salvar Campos</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Editar auditoria de um soldado ────────────────────────────────────
function SoldierAuditoriaModal({ item, tfmFields, onSave, onClose }) {
  const [data, setData] = useState(() => {
    const d = JSON.parse(JSON.stringify(item));
    AUDIT_FIELDS.forEach(f => { if (!d[f.key]) d[f.key] = { padrao: null, observacao: '' }; });
    if (!d.tfm) d.tfm = {};
    tfmFields.forEach(({key}) => { if (!d.tfm[key]) d.tfm[key] = { padrao: null, observacao: '' }; });
    return d;
  });

  const u = item.user;

  const setField = (field, prop, val) =>
    setData(prev => ({...prev, [field]: {...prev[field], [prop]: val}}));

  const setTfm = (field, prop, val) =>
    setData(prev => ({
      ...prev,
      tfm: {...prev.tfm, [field]: {...(prev.tfm[field]||{}), [prop]: val}},
    }));

  const AuditRow = ({ label, icon, value, onChange }) => (
    <div className="au-audit-row">
      <div className="au-audit-row-label">{icon} {label}</div>
      <div className="au-audit-row-btns">
        <button
          className={`au-padrao-btn padrao ${value?.padrao===true?'active':''}`}
          onClick={() => onChange('padrao', value?.padrao===true ? null : true)}
        >✔ Padrão</button>
        <button
          className={`au-padrao-btn nao-padrao ${value?.padrao===false?'active':''}`}
          onClick={() => onChange('padrao', value?.padrao===false ? null : false)}
        >✘ Fora</button>
      </div>
      {value?.padrao===false && (
        <input
          className="ch-input au-obs-input"
          placeholder="Observação (opcional)..."
          value={value?.observacao||''}
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
          {AUDIT_FIELDS.map(({key, label, icon}) => (
            <AuditRow
              key={key}
              label={label} icon={icon}
              value={data[key]}
              onChange={(prop, val) => setField(key, prop, val)}
            />
          ))}

          {tfmFields.length > 0 && (
            <>
              <div className="au-section-title" style={{marginTop:20}}>
                TFM — Treino Físico Militar
              </div>
              {tfmFields.map(({key, label}) => (
                <AuditRow
                  key={key}
                  label={label} icon="👕"
                  value={data.tfm?.[key]}
                  onChange={(prop, val) => setTfm(key, prop, val)}
                />
              ))}
            </>
          )}
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
  const [chamadas,        setChamadas]        = useState([]);
  const [auditoria,       setAuditoria]       = useState(null);
  const [selectedChamada, setSelectedChamada] = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [editingItem,     setEditingItem]     = useState(null);
  const [search,          setSearch]          = useState('');
  const [showTfmConfig,   setShowTfmConfig]   = useState(false);
  const [tfmFields,       setTfmFields]       = useState(loadTfmFields);

  const saveTfm = (fields) => {
    setTfmFields(fields);
    saveTfmFields(fields);
    setShowTfmConfig(false);
  };

  const fetchChamadas = useCallback(async () => {
    try {
      const res = await api.get('/chamada?limit=30');
      setChamadas(res.data);
    } catch { toast.error('Erro ao carregar chamadas.'); }
  }, []);

  useEffect(() => { fetchChamadas(); }, [fetchChamadas]);

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
    } catch { toast.error('Erro ao carregar auditoria.'); }
    finally  { setLoading(false); }
  };

  const criarAuditoria = async () => {
    if (!selectedChamada) return;
    setLoading(true);
    try {
      const res = await api.post('/auditoria', { chamadaId: selectedChamada._id });
      setAuditoria(res.data);
      toast.success('Auditoria iniciada!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar auditoria.');
    } finally { setLoading(false); }
  };

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
    } finally { setSaving(false); }
  };

  const enviarAuditoria = async () => {
    if (!auditoria) return;
    try {
      const res = await api.post(`/auditoria/${auditoria._id}/enviar`);
      setAuditoria(res.data);
      toast.success('Auditoria finalizada!');
    } catch { toast.error('Erro ao enviar auditoria.'); }
  };

  const reabrirAuditoria = async () => {
    if (!auditoria) return;
    try {
      const res = await api.post(`/auditoria/${auditoria._id}/reabrir`);
      setAuditoria(res.data);
      toast.success('Auditoria reaberta!');
    } catch { toast.error('Erro ao reabrir auditoria.'); }
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
    tfmFields.forEach(({key}) => { if (item.tfm?.[key]?.padrao === false) n++; });
    return n;
  }

  // ── Render: selecionar chamada ──
  if (!selectedChamada) {
    return (
      <div className="ch-page">
        <div className="ch-header">
          <h1 className="ch-title">🔍 Auditoria de Fardamento / TFM</h1>
          <button
            onClick={() => setShowTfmConfig(true)}
            style={{
              background:'linear-gradient(135deg,#1a3a10,#0e2508)',
              color:'#c9a227', border:'1px solid #7a6118',
              borderRadius:4, padding:'8px 14px',
              fontSize:'.75rem', fontWeight:800,
              letterSpacing:'0.08em', textTransform:'uppercase',
              cursor:'pointer',
            }}
          >
            ⚙️ Campos TFM ({tfmFields.length})
          </button>
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
                    {({geral:'Geral',manha:'Manhã',tarde:'Tarde',noite:'Noite'})[c.turno]||c.turno}
                  </span>
                  <span className={`ch-status-badge small ${c.status}`}>
                    {c.status==='enviada'?'✅ Enviada':c.status==='reaberta'?'🔄 Reaberta':'🟢 Aberta'}
                  </span>
                </div>
                <div className="ch-chamada-card-right">
                  <span className="ch-mini-stat green">{presente} presentes</span>
                </div>
              </div>
            );
          })}
        </div>

        {showTfmConfig && (
          <TfmConfigModal
            fields={tfmFields}
            onSave={saveTfm}
            onClose={() => setShowTfmConfig(false)}
          />
        )}
      </div>
    );
  }

  // ── Render: auditoria ──
  return (
    <div className="ch-page">
      <div className="ch-header">
        <button className="ch-btn-ghost" onClick={() => { setSelectedChamada(null); setAuditoria(null); }}>
          ← Chamadas
        </button>
        <div style={{display:'flex',alignItems:'center',gap:12,flex:1,flexWrap:'wrap'}}>
          <div>
            <h1 className="ch-title">🔍 Auditoria — {fmtDate(selectedChamada.date)}</h1>
            {auditoria && (
              <span className={`ch-status-badge ${auditoria.status}`}>
                {auditoria.status==='enviada'?'✅ Finalizada':auditoria.status==='reaberta'?'🔄 Reaberta':'🟢 Em andamento'}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowTfmConfig(true)}
          title="Configurar campos TFM"
          style={{
            background:'#0f1a0d', color:'#c9a227',
            border:'1px solid #7a6118', borderRadius:4,
            padding:'7px 14px', fontSize:'.75rem', fontWeight:800,
            letterSpacing:'0.06em', textTransform:'uppercase',
            cursor:'pointer', flexShrink:0,
          }}
        >
          ⚙️ TFM
        </button>
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

          {/* Legenda TFM em uso */}
          <div style={{
            display:'flex',gap:8,flexWrap:'wrap',
            padding:'8px 0',borderBottom:'1px solid #2d4a22',marginBottom:8,
          }}>
            {[...AUDIT_FIELDS, ...tfmFields.map(f=>({...f,icon:'👕'}))].map(f=>(
              <span key={f.key} style={{
                fontSize:'.7rem', background:'#162413',
                border:'1px solid #2d4a22', borderRadius:3,
                padding:'2px 9px', color:'#6a8a60',
                fontFamily:'monospace', textTransform:'uppercase',
              }}>
                {f.icon||'•'} {f.label}
              </span>
            ))}
          </div>

          <div className="ch-soldiers-list">
            {filteredItems.map((item, idx) => {
              const u        = item.user;
              const problems = countProblems(item);
              const num      = String(u?.warNumber||'?').padStart(2,'0');
              return (
                <div key={u?._id||idx} className={`ch-soldier-row ${problems>0?'falta':''}`}>
                  <div className="ch-soldier-num">{num}</div>
                  <div className="ch-soldier-info">
                    <span className="ch-soldier-name">{u?.warName||'?'}</span>
                    {u?.rank && <span className="ch-soldier-rank">{u.rank}</span>}
                    {problems>0 && (
                      <span className="ch-badge-atrasado" style={{background:'#d94f3d'}}>
                        ⚠ {problems} irregularidade{problems>1?'s':''}
                      </span>
                    )}
                    {problems===0 && auditoria.items.find(i=>i.user._id===u?._id) && (
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
          tfmFields={tfmFields}
          onSave={salvarItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {showTfmConfig && (
        <TfmConfigModal
          fields={tfmFields}
          onSave={saveTfm}
          onClose={() => setShowTfmConfig(false)}
        />
      )}
    </div>
  );
}
