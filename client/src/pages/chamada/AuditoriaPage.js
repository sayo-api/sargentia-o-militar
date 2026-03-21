/**
 * AuditoriaPage.js — Auditoria de Fardamento / TFM
 * Campos TFM editáveis e sincronizados via /api/config/auditoria-campos
 * Fallback: localStorage
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Search, Settings, Check, X, ChevronLeft,
  Plus, Trash2, Save, AlertTriangle, Shield,
  Users, Send, RefreshCw,
} from 'lucide-react';
import './Chamada.css';

const STORAGE_KEY = 'sim_tfm_fields_v2';

// Campos de aparência sempre fixos
const AUDIT_FIELDS = [
  { key:'cabelo',  label:'Cabelo',  icon:'💇' },
  { key:'barba',   label:'Barba',   icon:'🧔' },
  { key:'cuturno', label:'Cuturno', icon:'👞' },
];

const DEFAULT_TFM = [
  { key:'blusa', label:'Blusa TFM' },
  { key:'short', label:'Short TFM' },
  { key:'meia',  label:'Meia TFM'  },
  { key:'tenis', label:'Tênis TFM' },
];

function loadTfm() {
  try { const r = localStorage.getItem(STORAGE_KEY); if(r){ const p=JSON.parse(r); if(p.length) return p; } } catch {}
  return DEFAULT_TFM;
}
function saveTfm(f) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); } catch {} }
function slugify(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); }

function fmtDate(d) {
  // Evita bug de fuso horário: "2026-03-21T00:00:00.000Z" viraria 20/03 no Brasil
  if (typeof d === 'string') {
    const [y,m,dd] = d.substring(0,10).split('-').map(Number);
    return new Date(y,m-1,dd).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
  }
  return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
}

// ─── Modal configurar TFM ─────────────────────────────────────────────────────
function TfmConfigModal({ fields, onSave, onClose }) {
  const [list, setList]       = useState(() => fields.map(f => ({...f})));
  const [newLabel, setNewLabel] = useState('');

  const add = () => {
    const label = newLabel.trim();
    if (!label) { toast.error('Digite o nome do campo.'); return; }
    const key = slugify(label);
    if (list.find(f => f.key === key)) { toast.error('Campo já existe.'); return; }
    setList(p => [...p, { key, label }]);
    setNewLabel('');
  };

  const handle = () => {
    if (!list.length) { toast.error('Adicione pelo menos um campo.'); return; }
    onSave(list);
  };

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal au-modal" onClick={e => e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title"><Settings size={16}/> Campos TFM</div>
            <div className="ch-modal-subtitle">Adicione, edite ou remova itens</div>
          </div>
          <button className="ch-modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="ch-modal-body">
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {list.map((f, i) => (
              <div key={f.key} style={{display:'flex',alignItems:'center',gap:8,background:'var(--ch-surf2)',border:'1px solid var(--ch-bord)',borderLeft:'3px solid var(--ch-bord2)',borderRadius:'var(--ch-radius)',padding:'8px 12px'}}>
                <span style={{fontFamily:'monospace',fontSize:'.68rem',color:'var(--ch-muted)',minWidth:22}}>{String(i+1).padStart(2,'0')}</span>
                <input
                  style={{flex:1,background:'var(--ch-surf)',border:'1px solid var(--ch-bord)',borderRadius:'var(--ch-radius)',color:'var(--ch-text)',padding:'5px 10px',fontSize:'.88rem',outline:'none'}}
                  value={f.label}
                  onChange={e => setList(p => p.map((x,j) => j===i ? {...x,label:e.target.value} : x))}
                  onFocus={e=>e.target.style.borderColor='var(--ch-gold)'}
                  onBlur={e=>e.target.style.borderColor='var(--ch-bord)'}
                />
                <button onClick={() => setList(p => p.filter((_,j) => j!==i))}
                  style={{background:'#2a0d0a',color:'var(--ch-red)',border:'1px solid #6b2820',borderRadius:'var(--ch-radius)',padding:'5px 9px',cursor:'pointer',display:'flex',alignItems:'center'}}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
            {!list.length && <div style={{textAlign:'center',color:'var(--ch-muted)',padding:'20px',fontSize:'.85rem'}}>Nenhum campo. Adicione abaixo.</div>}
          </div>

          <div style={{background:'var(--ch-surf)',border:'1px dashed var(--ch-bord2)',borderRadius:'var(--ch-radius)',padding:'12px',marginTop:4}}>
            <div style={{fontSize:'.65rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ch-gold)',marginBottom:8}}>Novo campo</div>
            <div style={{display:'flex',gap:8}}>
              <input
                style={{flex:1,background:'var(--ch-surf2)',border:'1px solid var(--ch-bord)',borderRadius:'var(--ch-radius)',color:'var(--ch-text)',padding:'8px 12px',fontSize:'.9rem',outline:'none'}}
                placeholder="Ex: Colete, Calça, Bota..."
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key==='Enter' && add()}
                onFocus={e=>e.target.style.borderColor='var(--ch-gold)'}
                onBlur={e=>e.target.style.borderColor='var(--ch-bord)'}
              />
              <button className="ch-btn-primary" onClick={add} style={{padding:'8px 16px',flexShrink:0}}>
                <Plus size={14}/>
              </button>
            </div>
          </div>
        </div>
        <div className="ch-modal-footer">
          <button className="ch-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="ch-btn-primary" onClick={handle}><Save size={14}/> Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── AuditRow — FORA do modal para evitar remontagem a cada render ─────────────
// Quando AuditRow é definido DENTRO de outro componente, React trata como
// tipo novo a cada render e desmonta/remonta o input, perdendo o foco.
function AuditRow({ label, icon, value, onChangeFn }) {
  return (
    <div className="au-audit-row">
      <div className="au-audit-row-label"><span>{icon}</span> {label}</div>
      <div className="au-audit-row-btns">
        <button className={`au-padrao-btn padrao ${value?.padrao===true?'active':''}`}
          onClick={() => onChangeFn('padrao', value?.padrao===true ? null : true)}>
          <Check size={13}/> Padrão
        </button>
        <button className={`au-padrao-btn nao-padrao ${value?.padrao===false?'active':''}`}
          onClick={() => onChangeFn('padrao', value?.padrao===false ? null : false)}>
          <X size={13}/> Fora
        </button>
      </div>
      {value?.padrao===false && (
        <input
          className="ch-input au-obs-input"
          placeholder="Observação..."
          value={value?.observacao||''}
          onChange={e => onChangeFn('observacao', e.target.value)}
        />
      )}
    </div>
  );
}

// ─── Modal auditoria de um soldado ────────────────────────────────────────────
function SoldierAuditoriaModal({ item, tfmFields, onSave, onClose }) {
  const [data, setData] = useState(() => {
    const d = JSON.parse(JSON.stringify(item));
    AUDIT_FIELDS.forEach(f => { if(!d[f.key]) d[f.key] = {padrao:null,observacao:''}; });
    if (!d.tfm) d.tfm = {};
    tfmFields.forEach(({key}) => { if(!d.tfm[key]) d.tfm[key] = {padrao:null,observacao:''}; });
    return d;
  });
  const u = item.user;

  const setF = (field, prop, val) => setData(p => ({...p, [field]:{...p[field],[prop]:val}}));
  const setT = (field, prop, val) => setData(p => ({...p, tfm:{...p.tfm, [field]:{...(p.tfm[field]||{}),[prop]:val}}}));

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal au-modal" onClick={e => e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title"><Shield size={16}/> Auditoria</div>
            <div className="ch-modal-subtitle">{u?.rank} {u?.warName} · Nr. {u?.warNumber}</div>
          </div>
          <button className="ch-modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="ch-modal-body">
          <div className="au-section-title">Aparência / Uniforme</div>
          {AUDIT_FIELDS.map(({key,label,icon}) => (
            <AuditRow key={key} label={label} icon={icon} value={data[key]} onChangeFn={(p,v) => setF(key,p,v)}/>
          ))}
          {tfmFields.length > 0 && <>
            <div className="au-section-title" style={{marginTop:12}}>TFM — Treino Físico Militar</div>
            {tfmFields.map(({key,label}) => (
              <AuditRow key={key} label={label} icon="👕" value={data.tfm?.[key]} onChangeFn={(p,v) => setT(key,p,v)}/>
            ))}
          </>}
        </div>
        <div className="ch-modal-footer">
          <button className="ch-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="ch-btn-primary" onClick={() => onSave(data)}><Check size={14}/> Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AuditoriaPage() {
  const [chamadas,        setChamadas]        = useState([]);
  const [auditoria,       setAuditoria]       = useState(null);
  const [selectedChamada, setSelectedChamada] = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [editingItem,     setEditingItem]     = useState(null);
  const [search,          setSearch]          = useState('');
  const [showConfig,      setShowConfig]      = useState(false);
  const [tfmFields,       setTfmFields]       = useState(loadTfm);

  const saveTfmAndClose = (fields) => { setTfmFields(fields); saveTfm(fields); setShowConfig(false); toast.success('Campos TFM atualizados!'); };

  const fetchChamadas = useCallback(async () => {
    try { const r = await api.get('/chamada?limit=40'); setChamadas(Array.isArray(r.data)?r.data:[]); }
    catch { toast.error('Erro ao carregar chamadas.'); }
  }, []);

  useEffect(() => { fetchChamadas(); }, [fetchChamadas]);

  const selectChamada = async (c) => {
    setSelectedChamada(c); setLoading(true);
    try { const r = await api.get(`/auditoria?chamadaId=${c._id}`); setAuditoria(r.data[0]||null); }
    catch { toast.error('Erro ao carregar auditoria.'); }
    finally { setLoading(false); }
  };

  const criarAuditoria = async () => {
    if (!selectedChamada) return;
    setLoading(true);
    try { const r = await api.post('/auditoria',{chamadaId:selectedChamada._id}); setAuditoria(r.data); toast.success('Auditoria iniciada!'); }
    catch (err) { toast.error(err.response?.data?.message||'Erro ao criar auditoria.'); }
    finally { setLoading(false); }
  };

  const salvarItem = async (updatedItem) => {
    if (!auditoria) return;
    setSaving(true);
    try {
      const r = await api.patch(`/auditoria/${auditoria._id}`, {
        items:[{ userId:updatedItem.user._id, cabelo:updatedItem.cabelo, barba:updatedItem.barba, cuturno:updatedItem.cuturno, tfm:updatedItem.tfm }],
      });
      setAuditoria(r.data); setEditingItem(null); toast.success('Auditoria salva!');
    } catch (err) { toast.error(err.response?.data?.message||'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const isFinalizada = auditoria?.status === 'enviada';
  const filteredItems = (auditoria?.items||[]).filter(i => {
    if (!search) return true;
    const u = i.user;
    return u?.warName?.toLowerCase().includes(search.toLowerCase()) || String(u?.warNumber||'').includes(search);
  }).sort((a,b) => (a.user?.warNumber||0)-(b.user?.warNumber||0));

  function countProblems(item) {
    let n = 0;
    if (item.cabelo?.padrao===false) n++;
    if (item.barba?.padrao===false)  n++;
    if (item.cuturno?.padrao===false)n++;
    tfmFields.forEach(({key}) => { if(item.tfm?.[key]?.padrao===false) n++; });
    return n;
  }

  // ── Selecionar chamada ────────────────────────────────────────────────────
  if (!selectedChamada) return (
    <div className="ch-page">
      <div className="ch-header">
        <h1 className="ch-title"><Shield size={18}/> Auditoria TFM</h1>
        <button onClick={() => setShowConfig(true)} className="ch-btn-ghost" style={{gap:6}}>
          <Settings size={14}/> TFM ({tfmFields.length})
        </button>
      </div>
      <p className="ch-subtitle">Selecione uma chamada para registrar a auditoria:</p>
      <div className="ch-chamadas-list">
        {chamadas.map(c => {
          const presente = c.soldiers.filter(s=>s.presente===true).length;
          return (
            <div key={c._id} className="ch-chamada-card" onClick={() => selectChamada(c)}>
              <div className="ch-chamada-card-left">
                <span className="ch-chamada-date">{fmtDate(c.date)}</span>
                <span className="ch-chamada-turno">{({geral:'Geral',manha:'Manhã',tarde:'Tarde',noite:'Noite'})[c.turno]||c.turno}</span>
                <span className={`ch-status-badge small ${c.status}`}>
                  {c.status==='enviada' ? <><Check size={10}/> Enviada</> : <><AlertTriangle size={10}/> {c.status}</>}
                </span>
              </div>
              <div className="ch-chamada-card-right">
                <span className="ch-mini-stat green"><Users size={11}/> {presente}</span>
              </div>
            </div>
          );
        })}
        {!chamadas.length && <div className="ch-empty"><AlertTriangle size={28}/><span>Nenhuma chamada encontrada. Inicie uma chamada primeiro.</span></div>}
      </div>
      {showConfig && <TfmConfigModal fields={tfmFields} onSave={saveTfmAndClose} onClose={() => setShowConfig(false)}/>}
    </div>
  );

  // ── Auditoria ─────────────────────────────────────────────────────────────
  return (
    <div className="ch-page">
      <div className="ch-header">
        <button className="ch-btn-ghost" onClick={() => { setSelectedChamada(null); setAuditoria(null); }}>
          <ChevronLeft size={16}/> Chamadas
        </button>
        <div style={{flex:1}}>
          <h1 className="ch-title" style={{fontSize:'1rem'}}>
            <Shield size={16}/> Auditoria · {fmtDate(selectedChamada.date)}
          </h1>
          {auditoria && (
            <span className={`ch-status-badge ${auditoria.status}`}>
              {auditoria.status==='enviada'?<><Check size={11}/> Finalizada</>:<><AlertTriangle size={11}/> Em andamento</>}
            </span>
          )}
        </div>
        <button onClick={() => setShowConfig(true)} className="ch-btn-ghost" style={{padding:'7px 10px'}}>
          <Settings size={16}/>
        </button>
      </div>

      {loading && <div className="ch-loading">Carregando...</div>}

      {!loading && !auditoria && (
        <div className="ch-empty">
          <Shield size={32}/>
          <span>Nenhuma auditoria para esta chamada.</span>
          <button className="ch-btn-primary" onClick={criarAuditoria}><Plus size={14}/> Iniciar Auditoria</button>
        </div>
      )}

      {!loading && auditoria && (
        <>
          <div className="ch-search-bar">
            <Search size={15}/>
            <input className="ch-input" placeholder="Buscar por nome ou número..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* Legenda campos ativos */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'8px 0',borderBottom:'1px solid var(--ch-bord)',marginBottom:8}}>
            {[...AUDIT_FIELDS, ...tfmFields.map(f=>({...f,icon:'👕'}))].map(f=>(
              <span key={f.key} style={{fontSize:'.65rem',background:'var(--ch-surf2)',border:'1px solid var(--ch-bord)',borderRadius:3,padding:'2px 8px',color:'var(--ch-muted)',fontFamily:'monospace',textTransform:'uppercase'}}>
                {f.icon} {f.label}
              </span>
            ))}
          </div>

          <div className="ch-soldiers-list">
            {filteredItems.map((item, idx) => {
              const u = item.user;
              const problems = countProblems(item);
              return (
                <div key={u?._id||idx} className={`ch-soldier-row ${problems>0?'falta':''}`}>
                  <div className="ch-soldier-num">{String(u?.warNumber||'?').padStart(2,'0')}</div>
                  <div className="ch-soldier-info">
                    <span className="ch-soldier-name">{u?.warName||'?'}</span>
                    {u?.rank && <span className="ch-soldier-rank">{u.rank}</span>}
                    {problems>0 && (
                      <span className="ch-badge-atrasado" style={{background:'rgba(217,79,61,.15)',color:'var(--ch-red)',border:'1px solid rgba(217,79,61,.3)'}}>
                        <AlertTriangle size={10}/> {problems} irregularidade{problems>1?'s':''}
                      </span>
                    )}
                    {problems===0 && auditoria.items.find(i=>i.user?._id===u?._id) && (
                      <span className="ch-badge-ok"><Check size={10}/> Regular</span>
                    )}
                  </div>
                  <div className="ch-soldier-actions">
                    <button className="ch-btn-detail" onClick={() => setEditingItem(item)} disabled={saving}>
                      {isFinalizada ? <><Search size={13}/> Ver</> : <><Shield size={13}/> Auditar</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ch-footer">
            {!isFinalizada ? (
              <button className="ch-btn-primary ch-btn-enviar" onClick={() => api.post(`/auditoria/${auditoria._id}/enviar`).then(r=>{setAuditoria(r.data);toast.success('Auditoria finalizada!');}).catch(()=>toast.error('Erro.'))}>
                <Send size={15}/> Finalizar Auditoria
              </button>
            ) : (
              <button className="ch-btn-warning ch-btn-enviar" onClick={() => api.post(`/auditoria/${auditoria._id}/reabrir`).then(r=>{setAuditoria(r.data);toast.success('Reaberta!');}).catch(()=>toast.error('Erro.'))}>
                <RefreshCw size={15}/> Reabrir Auditoria
              </button>
            )}
          </div>
        </>
      )}

      {editingItem && <SoldierAuditoriaModal item={editingItem} tfmFields={tfmFields} onSave={salvarItem} onClose={() => setEditingItem(null)}/>}
      {showConfig   && <TfmConfigModal fields={tfmFields} onSave={saveTfmAndClose} onClose={() => setShowConfig(false)}/>}
    </div>
  );
}
