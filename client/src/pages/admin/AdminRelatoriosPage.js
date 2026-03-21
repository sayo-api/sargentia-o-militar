/**
 * AdminRelatoriosPage.js  —  /admin/relatorios
 *
 * Painel de relatórios puro (somente leitura).
 * O admin visualiza:
 *  1. 📅 Chamadas do Dia — navegar dia a dia, ver todas as chamadas daquele dia
 *  2. 📊 Efetivo Geral   — tabela consolidada: faltas, atrasos, irregularidades
 *  3. 👤 Por Militar     — histórico completo de um soldado específico
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import '../chamada/Chamada.css';
import './AdminRelatorios.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TURNO_MAP  = { geral: 'Geral', manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MESES       = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function toLocalDateStr(date) {
  // retorna "YYYY-MM-DD" no fuso local
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function todayStr() { return toLocalDateStr(new Date()); }

function fmtDate(d, opts = {}) {
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', ...opts });
}

function fmtDateFull(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const date = new Date(y, m-1, d);
  const dow  = DIAS_SEMANA[date.getDay()];
  return `${dow}, ${String(d).padStart(2,'0')} ${MESES[m-1]} ${y}`;
}

function addDays(isoStr, n) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const date = new Date(y, m-1, d+n);
  return toLocalDateStr(date);
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ children, color = 'gray' }) {
  const map = {
    green:  { bg: '#062e16', fg: '#3dba6a' },
    red:    { bg: '#2a0d0a', fg: '#d94f3d' },
    yellow: { bg: '#2a1603', fg: '#e8a420' },
    orange: { bg: '#2a1108', fg: '#d9713a' },
    blue:   { bg: '#0c1a3a', fg: '#4a90d4' },
    purple: { bg: '#1e0e3a', fg: '#8a5fd4' },
    gold:   { bg: '#1a1004', fg: '#c9a227' },
    gray:   { bg: '#0f1a0d', fg: '#6a8a60' },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{
      display:'inline-block', padding:'2px 9px', borderRadius:2,
      fontSize:'.66rem', fontWeight:800,
      background:c.bg, color:c.fg,
      textTransform:'uppercase', letterSpacing:'0.06em',
      whiteSpace:'nowrap',
    }}>
      {children}
    </span>
  );
}

// ─── Navegador de Data ───────────────────────────────────────────────────────
function DateNav({ value, onChange }) {
  const isToday = value === todayStr();

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      background:'var(--ar-surf)',
      border:'1px solid var(--ar-bord)',
      borderLeft:'3px solid var(--ar-gold)',
      borderRadius:'var(--ar-radius)',
      padding:'10px 14px',
    }}>
      <button
        onClick={() => onChange(addDays(value, -1))}
        style={{
          background:'var(--ar-surf2)', border:'1px solid var(--ar-bord)',
          borderRadius:'var(--ar-radius)', color:'var(--ar-text)',
          padding:'6px 14px', cursor:'pointer', fontSize:'1rem', lineHeight:1,
          transition:'background .12s',
        }}
        title="Dia anterior"
      >‹</button>

      <div style={{ flex:1, textAlign:'center' }}>
        <div style={{
          fontFamily:'monospace', fontSize:'1rem', fontWeight:700,
          color:'var(--ar-gold)', letterSpacing:'0.04em',
        }}>
          {fmtDateFull(value)}
        </div>
        {isToday && (
          <div style={{ fontFamily:'monospace', fontSize:'.68rem', color:'var(--ar-tac)', marginTop:2, letterSpacing:'0.06em' }}>
            ● HOJE
          </div>
        )}
      </div>

      <button
        onClick={() => onChange(addDays(value, 1))}
        disabled={isToday}
        style={{
          background:'var(--ar-surf2)', border:'1px solid var(--ar-bord)',
          borderRadius:'var(--ar-radius)', color: isToday ? 'var(--ar-muted)' : 'var(--ar-text)',
          padding:'6px 14px', cursor: isToday ? 'default' : 'pointer',
          fontSize:'1rem', lineHeight:1, transition:'background .12s',
          opacity: isToday ? .4 : 1,
        }}
        title="Próximo dia"
      >›</button>

      {/* Seletor de data */}
      <input
        type="date"
        value={value}
        max={todayStr()}
        onChange={e => e.target.value && onChange(e.target.value)}
        style={{
          background:'var(--ar-surf2)', border:'1px solid var(--ar-bord)',
          borderRadius:'var(--ar-radius)', color:'var(--ar-text)',
          padding:'6px 10px', fontSize:'.8rem', cursor:'pointer',
          outline:'none', colorScheme:'dark',
        }}
        title="Selecionar data"
      />

      {!isToday && (
        <button
          onClick={() => onChange(todayStr())}
          style={{
            background:'var(--ar-surf3)', border:'1px solid var(--ar-bord2)',
            borderRadius:'var(--ar-radius)', color:'var(--ar-text2)',
            padding:'6px 12px', cursor:'pointer', fontSize:'.72rem',
            fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
            whiteSpace:'nowrap',
          }}
        >
          Hoje
        </button>
      )}
    </div>
  );
}

// ─── Card de uma chamada do dia ──────────────────────────────────────────────
function ChamadaCard({ chamada, onDownload, exporting }) {
  const [open, setOpen] = useState(false);

  const pres = chamada.soldiers.filter(s => s.presente === true).length;
  const falt = chamada.soldiers.filter(s => s.presente === false).length;
  const atrs = chamada.soldiers.filter(s => s.atrasado).length;
  const semM = chamada.soldiers.filter(s => s.presente === null).length;
  const isExp = exporting === chamada._id;

  const taxa = chamada.soldiers.length > 0
    ? Math.round((pres / chamada.soldiers.length) * 100)
    : null;

  return (
    <div style={{
      background:'var(--ar-surf)',
      border:'1px solid var(--ar-bord)',
      borderRadius:'var(--ar-radius)',
      overflow:'hidden',
      transition:'border-color .12s',
    }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'14px 18px', flexWrap:'wrap',
        borderBottom: open ? '1px solid var(--ar-bord)' : 'none',
        background: open ? 'var(--ar-surf2)' : 'transparent',
      }}>
        {/* Turno + status */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, flexWrap:'wrap' }}>
          <div style={{
            fontFamily:'monospace', fontSize:'1rem', fontWeight:700,
            color:'var(--ar-gold)', minWidth:70,
          }}>
            {TURNO_MAP[chamada.turno] || chamada.turno}
          </div>
          <Chip color={chamada.status==='enviada'?'blue':chamada.status==='reaberta'?'yellow':'green'}>
            {chamada.status==='enviada'?'✅ Enviada':chamada.status==='reaberta'?'🔄 Reaberta':'🟢 Aberta'}
          </Chip>
          {chamada.createdBy && (
            <span style={{ fontFamily:'monospace', fontSize:'.7rem', color:'var(--ar-muted)' }}>
              por {chamada.createdBy?.warName || '—'}
            </span>
          )}
        </div>

        {/* Contadores */}
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <span style={{ fontFamily:'monospace', fontSize:'.88rem', fontWeight:700, color:'var(--ar-green)' }}>✔ {pres}</span>
          <span style={{ fontFamily:'monospace', fontSize:'.88rem', fontWeight:700, color:'var(--ar-red)'   }}>✘ {falt}</span>
          {atrs > 0 && <span style={{ fontFamily:'monospace', fontSize:'.88rem', fontWeight:700, color:'var(--ar-yellow)' }}>⏱ {atrs}</span>}
          {semM > 0 && <span style={{ fontFamily:'monospace', fontSize:'.88rem', fontWeight:700, color:'var(--ar-muted)'  }}>– {semM}</span>}
          {taxa !== null && (
            <span style={{
              fontFamily:'monospace', fontSize:'.72rem',
              color: taxa >= 90 ? 'var(--ar-green)' : taxa >= 70 ? 'var(--ar-yellow)' : 'var(--ar-red)',
              background:'var(--ar-surf2)', border:'1px solid var(--ar-bord)',
              borderRadius:2, padding:'2px 8px',
            }}>
              {taxa}%
            </span>
          )}
        </div>

        {/* Ações */}
        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={() => setOpen(o => !o)}
            className="ar-btn-expand"
          >
            {open ? '▲ Fechar' : '▼ Ver lista'}
          </button>
          <button
            className="ar-btn-word"
            disabled={isExp}
            onClick={() => onDownload(chamada)}
          >
            {isExp ? '⏳...' : '📄 Word'}
          </button>
        </div>
      </div>

      {/* Lista expandida */}
      {open && (
        <div style={{ padding:'14px 18px', background:'var(--ar-bg)' }}>
          <div style={{
            fontFamily:'monospace', fontSize:'.68rem', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'.1em',
            color:'var(--ar-muted)', marginBottom:10,
          }}>
            Lista de Presença — {chamada.soldiers.length} militares
          </div>

          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',
            gap:4,
          }}>
            {chamada.soldiers
              .sort((a, b) => (a.user?.warNumber||0) - (b.user?.warNumber||0))
              .map((s, i) => {
                const u = s.user;
                return (
                  <div key={u?._id || i} style={{
                    display:'flex', alignItems:'center', gap:7,
                    padding:'5px 10px',
                    background:'var(--ar-surf)',
                    borderRadius:'var(--ar-radius)',
                    borderLeft:`3px solid ${s.presente===true?'var(--ar-green)':s.presente===false?'var(--ar-red)':'var(--ar-bord)'}`,
                    background: s.presente===true ? 'rgba(61,186,106,0.07)' : s.presente===false ? 'rgba(217,79,61,0.07)' : 'var(--ar-surf)',
                  }}>
                    <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--ar-muted)', fontSize:'.72rem', minWidth:22, textAlign:'right' }}>
                      {String(u?.warNumber||'?').padStart(2,'0')}
                    </span>
                    <span style={{ flex:1, fontWeight:700, fontSize:'.82rem', textTransform:'uppercase', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {u?.warName || '?'}
                    </span>
                    <span style={{ flexShrink:0 }}>
                      {s.presente===true
                        ? s.atrasado
                          ? <Chip color="yellow">⏱{s.horarioChegada ? ` ${s.horarioChegada}` : ''}</Chip>
                          : <Chip color="green">✔</Chip>
                        : s.presente===false
                        ? <Chip color="red">✘</Chip>
                        : <Chip>—</Chip>}
                    </span>
                    {s.observacao && (
                      <span title={s.observacao} style={{ color:'var(--ar-blue)', fontSize:'.72rem', cursor:'help' }}>💬</span>
                    )}
                  </div>
                );
              })}
          </div>

          {chamada.observacaoGeral && (
            <div style={{
              marginTop:10, fontSize:'.82rem', color:'var(--ar-muted)',
              background:'var(--ar-surf)', padding:'8px 12px',
              borderRadius:'var(--ar-radius)', borderLeft:'3px solid var(--ar-blue)',
            }}>
              💬 <em>{chamada.observacaoGeral}</em>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ABA 1: Chamadas do Dia ───────────────────────────────────────────────────
function TabDia() {
  const [date,       setDate]       = useState(todayStr);
  const [chamadas,   setChamadas]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [exporting,  setExporting]  = useState(null);
  const prevDate = useRef(null);

  const load = useCallback(async (d) => {
    setLoading(true);
    setChamadas([]);
    try {
      // Buscar chamadas de um dia específico
      const res = await api.get(`/chamada?date=${d}&limit=20`);
      // Filtrar pelo dia exato caso a API não suporte ?date=
      const all = Array.isArray(res.data) ? res.data : [];
      const dayMatches = all.filter(c => toLocalDateStr(c.date) === d);
      setChamadas(dayMatches.length > 0 ? dayMatches : all.filter(c => toLocalDateStr(c.date) === d));

      // Fallback: buscar tudo e filtrar localmente
      if (dayMatches.length === 0 && all.length === 20) {
        // pode haver mais — buscar com limite maior
        const res2 = await api.get(`/chamada?limit=500`);
        const all2 = Array.isArray(res2.data) ? res2.data : [];
        setChamadas(all2.filter(c => toLocalDateStr(c.date) === d));
      }
    } catch { toast.error('Erro ao carregar chamadas.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => {
    if (prevDate.current !== date) {
      prevDate.current = date;
      load(date);
    }
  }, [date, load]);

  // Initial load
  useEffect(() => { load(date); }, []); // eslint-disable-line

  const downloadDocx = async (chamada) => {
    const d   = new Date(chamada.date);
    const mon = d.getMonth()+1;
    const yr  = d.getFullYear();
    setExporting(chamada._id);
    try {
      const res = await api.get(
        `/planilha/export/docx?month=${mon}&year=${yr}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `escala-${String(mon).padStart(2,'0')}-${yr}.docx`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Documento Word baixado!');
    } catch { toast.error('Erro ao gerar Word.'); }
    finally  { setExporting(null); }
  };

  // Totais do dia
  const totDia = chamadas.reduce((acc, c) => {
    acc.total++;
    acc.pres += c.soldiers.filter(s => s.presente===true).length;
    acc.falt += c.soldiers.filter(s => s.presente===false).length;
    acc.atrs += c.soldiers.filter(s => s.atrasado).length;
    return acc;
  }, { total:0, pres:0, falt:0, atrs:0 });

  return (
    <div className="ar-tab-body">

      {/* Navegador de data */}
      <DateNav value={date} onChange={setDate} />

      {/* Resumo do dia */}
      {!loading && chamadas.length > 0 && (
        <div className="ar-summary-row">
          <div className="ar-summary-card ar-card--blue">
            <span className="ar-scard-num">{totDia.total}</span>
            <span className="ar-scard-lbl">Chamadas</span>
          </div>
          <div className="ar-summary-card ar-card--green">
            <span className="ar-scard-num">{totDia.pres}</span>
            <span className="ar-scard-lbl">Presenças</span>
          </div>
          <div className="ar-summary-card ar-card--red">
            <span className="ar-scard-num">{totDia.falt}</span>
            <span className="ar-scard-lbl">Faltas</span>
          </div>
          <div className="ar-summary-card ar-card--yellow">
            <span className="ar-scard-num">{totDia.atrs}</span>
            <span className="ar-scard-lbl">Atrasos</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign:'center', padding:'40px 20px',
          color:'var(--ar-muted)', fontFamily:'monospace', fontSize:'.85rem',
        }}>
          <div style={{ fontSize:'1.5rem', marginBottom:8 }}>⏳</div>
          Carregando chamadas de {fmtDateFull(date)}...
        </div>
      )}

      {/* Sem chamadas */}
      {!loading && chamadas.length === 0 && (
        <div style={{
          textAlign:'center', padding:'50px 20px',
          background:'var(--ar-surf)', border:'1px dashed var(--ar-bord)',
          borderRadius:'var(--ar-radius)',
        }}>
          <div style={{ fontSize:'2rem', marginBottom:10 }}>📭</div>
          <div style={{ fontWeight:700, fontSize:'.9rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ar-text2)', marginBottom:6 }}>
            Sem chamadas registradas
          </div>
          <div style={{ fontFamily:'monospace', fontSize:'.75rem', color:'var(--ar-muted)' }}>
            {fmtDateFull(date)}
          </div>
        </div>
      )}

      {/* Cards de chamadas */}
      {!loading && chamadas.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {chamadas
            .sort((a,b) => {
              const order = { manha:0, tarde:1, noite:2, geral:3 };
              return (order[a.turno]??9) - (order[b.turno]??9);
            })
            .map(c => (
              <ChamadaCard
                key={c._id}
                chamada={c}
                onDownload={downloadDocx}
                exporting={exporting}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal: Histórico completo de um soldado ──────────────────────────────────
function SoldierHistoryModal({ user, onClose }) {
  const [tab,     setTab]     = useState('chamada');
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, a] = await Promise.all([
          api.get(`/chamada/stats/soldado/${user._id}`),
          api.get(`/auditoria/stats/soldado/${user._id}`),
        ]);
        setStats({ chamada: c.data, auditoria: a.data });
      } catch { toast.error('Erro ao carregar histórico.'); }
      finally  { setLoading(false); }
    })();
  }, [user._id]);

  const ch = stats?.chamada;
  const au = stats?.auditoria;

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal ar-history-modal" onClick={e => e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title">📊 Histórico — {user.warName}</div>
            <div className="ch-modal-subtitle">{user.rank} · Nr. {user.warNumber}</div>
          </div>
          <button className="ch-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ss-tabs">
          <button className={`ss-tab ${tab==='chamada'   ?'active':''}`} onClick={()=>setTab('chamada')}>📋 Chamadas</button>
          <button className={`ss-tab ${tab==='auditoria' ?'active':''}`} onClick={()=>setTab('auditoria')}>🔍 Auditorias</button>
        </div>

        <div className="ch-modal-body">
          {loading && <div className="ch-loading">Carregando...</div>}

          {/* Chamadas */}
          {!loading && tab==='chamada' && ch && (
            <>
              <div className="ar-mini-cards">
                {[
                  {l:'Total',    v:ch.totalChamadas, c:'blue',  i:'📋'},
                  {l:'Presenças',v:ch.presencas,     c:'green', i:'✔' },
                  {l:'Faltas',   v:ch.faltas,        c:'red',   i:'✘' },
                  {l:'Atrasos',  v:ch.atrasos,       c:'yellow',i:'⏱'},
                ].map(s=>(
                  <div key={s.l} className="ar-mini-card" style={{'--ar-border':`var(--ar-${s.c})`}}>
                    <span className="ar-mini-icon">{s.i}</span>
                    <span className="ar-mini-num">{s.v}</span>
                    <span className="ar-mini-lbl">{s.l}</span>
                  </div>
                ))}
              </div>
              <div className="ss-history-table-wrap">
                <table className="ss-table">
                  <thead>
                    <tr><th>Data</th><th>Turno</th><th>Presença</th><th>Atraso</th><th>Horário</th><th>Observação</th></tr>
                  </thead>
                  <tbody>
                    {ch.historico.map((h,i)=>(
                      <tr key={i} className={h.presente===false?'row-falta':h.atrasado?'row-atrasado':''}>
                        <td>{fmtDate(h.date)}</td>
                        <td>{TURNO_MAP[h.turno]||h.turno}</td>
                        <td>
                          {h.presente===true  ? <Chip color="green">✔ Presente</Chip>  :
                           h.presente===false ? <Chip color="red">✘ Falta</Chip>       :
                           <Chip>—</Chip>}
                        </td>
                        <td>{h.atrasado?<Chip color="yellow">⏱</Chip>:'—'}</td>
                        <td>{h.horarioChegada||'—'}</td>
                        <td className="ss-obs-cell" title={h.observacao}>{h.observacao||'—'}</td>
                      </tr>
                    ))}
                    {!ch.historico.length && (
                      <tr><td colSpan={6} style={{textAlign:'center',color:'var(--ar-muted)',padding:20}}>Sem registros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Auditorias */}
          {!loading && tab==='auditoria' && au && (
            <>
              <div className="ar-mini-cards">
                {[
                  {l:'Auditorias',v:au.totalAuditorias,  c:'purple',i:'🔍'},
                  {l:'Cabelo',    v:au.cabeloForaPadrao, c:'red',   i:'💇'},
                  {l:'Barba',     v:au.barbaForaPadrao,  c:'red',   i:'🧔'},
                  {l:'Cuturno',   v:au.cuturnoForaPadrao,c:'red',   i:'👞'},
                ].map(s=>(
                  <div key={s.l} className="ar-mini-card" style={{'--ar-border':`var(--ar-${s.c})`}}>
                    <span className="ar-mini-icon">{s.i}</span>
                    <span className="ar-mini-num">{s.v}</span>
                    <span className="ar-mini-lbl">{s.l}</span>
                  </div>
                ))}
              </div>
              {au.tfm && Object.keys(au.tfm).length > 0 && (
                <div className="ar-mini-cards" style={{marginTop:8}}>
                  {Object.entries(au.tfm).map(([k,v])=>(
                    <div key={k} className="ar-mini-card" style={{'--ar-border':'var(--ar-orange)'}}>
                      <span className="ar-mini-icon">👕</span>
                      <span className="ar-mini-num">{v||0}</span>
                      <span className="ar-mini-lbl">TFM {k}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="ss-history-table-wrap" style={{marginTop:12}}>
                <table className="ss-table">
                  <thead>
                    <tr>
                      <th>Data</th><th>Cabelo</th><th>Barba</th><th>Cuturno</th>
                      {au.historico[0]?.tfm && Object.keys(au.historico[0].tfm).map(k=><th key={k}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {au.historico.map((h,i)=>{
                      const auCell = (val) => (
                        <td style={{textAlign:'center'}}>
                          {val?.padrao===false
                            ? <Chip color="red">✘</Chip>
                            : val?.padrao===true
                            ? <Chip color="green">✔</Chip>
                            : <Chip>—</Chip>}
                        </td>
                      );
                      return (
                        <tr key={i}>
                          <td>{fmtDate(h.date)}</td>
                          {auCell(h.cabelo)}{auCell(h.barba)}{auCell(h.cuturno)}
                          {h.tfm && Object.keys(h.tfm).map(k=><React.Fragment key={k}>{auCell(h.tfm[k])}</React.Fragment>)}
                        </tr>
                      );
                    })}
                    {!au.historico.length && (
                      <tr><td colSpan={10} style={{textAlign:'center',color:'var(--ar-muted)',padding:20}}>Sem registros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="ch-modal-footer">
          <button className="ch-btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── ABA 2: Efetivo Geral ─────────────────────────────────────────────────────
function TabEfetivo() {
  const [users,    setUsers]    = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('warNumber');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get('/users?limit=500');
      const list = (res.data?.users || res.data || [])
        .sort((a,b) => (a.warNumber||0)-(b.warNumber||0));
      setUsers(list);

      const map = {};
      const BATCH = 10;
      for (let i = 0; i < list.length; i += BATCH) {
        await Promise.all(list.slice(i, i+BATCH).map(async u => {
          try {
            const [c, a] = await Promise.all([
              api.get(`/chamada/stats/soldado/${u._id}`),
              api.get(`/auditoria/stats/soldado/${u._id}`),
            ]);
            map[u._id] = { chamada: c.data, auditoria: a.data };
          } catch {
            map[u._id] = { chamada: null, auditoria: null };
          }
        }));
        setStatsMap({...map});
      }
    } catch { toast.error('Erro ao carregar dados.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const irr = (u) => {
    const au = statsMap[u._id]?.auditoria;
    return (au?.cabeloForaPadrao||0) + (au?.barbaForaPadrao||0) +
           (au?.cuturnoForaPadrao||0) + Object.values(au?.tfm||{}).reduce((x,v)=>x+v, 0);
  };

  const filtered = users.filter(u =>
    !search ||
    u.warName?.toLowerCase().includes(search.toLowerCase()) ||
    String(u.warNumber||'').includes(search) ||
    u.rank?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a,b) => {
    if (sortBy==='faltas')         return (statsMap[b._id]?.chamada?.faltas  ||0)-(statsMap[a._id]?.chamada?.faltas  ||0);
    if (sortBy==='atrasos')        return (statsMap[b._id]?.chamada?.atrasos ||0)-(statsMap[a._id]?.chamada?.atrasos ||0);
    if (sortBy==='irregularidades')return irr(b)-irr(a);
    return (a.warNumber||0)-(b.warNumber||0);
  });

  const totais = users.reduce((acc,u) => {
    acc.faltas          += statsMap[u._id]?.chamada?.faltas  ||0;
    acc.atrasos         += statsMap[u._id]?.chamada?.atrasos ||0;
    acc.irregularidades += irr(u);
    return acc;
  }, {faltas:0, atrasos:0, irregularidades:0});

  return (
    <div className="ar-tab-body">
      <div className="ar-summary-row">
        <div className="ar-summary-card ar-card--blue">
          <span className="ar-scard-num">{users.length}</span>
          <span className="ar-scard-lbl">Efetivo</span>
        </div>
        <div className="ar-summary-card ar-card--red">
          <span className="ar-scard-num">{totais.faltas}</span>
          <span className="ar-scard-lbl">Faltas (total)</span>
        </div>
        <div className="ar-summary-card ar-card--yellow">
          <span className="ar-scard-num">{totais.atrasos}</span>
          <span className="ar-scard-lbl">Atrasos (total)</span>
        </div>
        <div className="ar-summary-card ar-card--orange">
          <span className="ar-scard-num">{totais.irregularidades}</span>
          <span className="ar-scard-lbl">Irregularidades</span>
        </div>
      </div>

      <div className="ar-filter-row">
        <input
          className="ch-input" style={{flex:1}}
          placeholder="🔍  Buscar por nome, número ou posto..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select
          className="ch-input ar-sort-sel" style={{maxWidth:230}}
          value={sortBy} onChange={e => setSortBy(e.target.value)}
        >
          <option value="warNumber">📋 Ordenar: Número</option>
          <option value="faltas">🔴 Mais Faltas</option>
          <option value="atrasos">⏱ Mais Atrasos</option>
          <option value="irregularidades">⚠ Mais Irregularidades</option>
        </select>
      </div>

      {loading && Object.keys(statsMap).length === 0 && (
        <div className="ch-loading">Carregando dados do efetivo...</div>
      )}
      {loading && Object.keys(statsMap).length > 0 && (
        <div className="ar-progress-bar">
          <div className="ar-progress-inner"
            style={{width:`${(Object.keys(statsMap).length/users.length)*100}%`}} />
          <span className="ar-progress-txt">
            Carregando... {Object.keys(statsMap).length}/{users.length}
          </span>
        </div>
      )}

      <div className="ss-table-wrap">
        <table className="ss-main-table">
          <thead>
            <tr>
              <th>Nr</th><th>Nome de Guerra</th><th>Posto</th>
              <th>✔ Pres.</th><th>✘ Faltas</th><th>⏱ Atrasos</th>
              <th>💇 Cab.</th><th>🧔 Barba</th><th>👞 Cut.</th><th>👕 TFM</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(u => {
              const ch  = statsMap[u._id]?.chamada;
              const au  = statsMap[u._id]?.auditoria;
              const tfm = Object.values(au?.tfm||{}).reduce((x,v)=>x+v,0);
              const bad = (ch?.faltas||0)>0 || (ch?.atrasos||0)>0 ||
                          (au?.cabeloForaPadrao||0)>0 || (au?.barbaForaPadrao||0)>0 ||
                          (au?.cuturnoForaPadrao||0)>0 || tfm>0;
              return (
                <tr key={u._id} className={bad?'row-problem':''}>
                  <td className="ss-nr-cell">{String(u.warNumber||'?').padStart(2,'0')}</td>
                  <td>{u.warName}</td>
                  <td style={{color:'var(--ar-muted)',fontSize:'.8rem'}}>{u.rank||'—'}</td>
                  <td><Chip color={(ch?.presencas||0)>0?'green':'gray'}>{ch?.presencas??'…'}</Chip></td>
                  <td><Chip color={(ch?.faltas   ||0)>0?'red'  :'gray'}>{ch?.faltas   ??'…'}</Chip></td>
                  <td><Chip color={(ch?.atrasos  ||0)>0?'yellow':'gray'}>{ch?.atrasos ??'…'}</Chip></td>
                  <td><Chip color={(au?.cabeloForaPadrao ||0)>0?'red':'gray'}>{au?.cabeloForaPadrao ??'…'}</Chip></td>
                  <td><Chip color={(au?.barbaForaPadrao  ||0)>0?'red':'gray'}>{au?.barbaForaPadrao  ??'…'}</Chip></td>
                  <td><Chip color={(au?.cuturnoForaPadrao||0)>0?'red':'gray'}>{au?.cuturnoForaPadrao??'…'}</Chip></td>
                  <td><Chip color={tfm>0?'orange':'gray'}>{tfm>0?tfm:au?'0':'…'}</Chip></td>
                  <td>
                    <button className="ar-btn-history" onClick={()=>setSelected(u)}>📊</button>
                  </td>
                </tr>
              );
            })}
            {sorted.length===0 && !loading && (
              <tr><td colSpan={11} className="ar-empty">Nenhum soldado encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <SoldierHistoryModal user={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}

// ─── ABA 3: Por Militar ───────────────────────────────────────────────────────
function TabPorMilitar() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/users?limit=500');
        setUsers((res.data?.users || res.data || []).sort((a,b)=>(a.warNumber||0)-(b.warNumber||0)));
      } catch { toast.error('Erro ao carregar efetivo.'); }
      finally  { setLoading(false); }
    })();
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.warName?.toLowerCase().includes(search.toLowerCase()) ||
    String(u.warNumber||'').includes(search) ||
    u.rank?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ar-tab-body">
      <input
        className="ch-input ar-search"
        placeholder="🔍  Buscar militar por nome, número ou posto..."
        value={search} onChange={e => setSearch(e.target.value)}
      />

      {loading && <div className="ch-loading">Carregando efetivo...</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {filtered.map(u => (
          <div
            key={u._id}
            style={{
              background:'var(--ar-surf)',
              border:'1px solid var(--ar-bord)',
              borderLeft:'4px solid var(--ar-bord2)',
              borderRadius:'var(--ar-radius)',
              padding:'11px 16px',
              display:'flex', alignItems:'center', gap:12,
              cursor:'pointer', transition:'background .1s',
            }}
            onClick={() => setSelected(u)}
            onMouseEnter={e => e.currentTarget.style.background='var(--ar-surf2)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--ar-surf)'}
          >
            <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--ar-muted)', fontSize:'.82rem', minWidth:30, textAlign:'right' }}>
              {String(u.warNumber||'?').padStart(2,'0')}
            </span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'.95rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>{u.warName}</div>
              <div style={{ fontFamily:'monospace', fontSize:'.72rem', color:'var(--ar-muted)', marginTop:2 }}>{u.rank}</div>
            </div>
            <span style={{
              background:'var(--ar-surf3)', color:'var(--ar-blue)',
              border:'1px solid #1e3a5f', borderRadius:'var(--ar-radius)',
              padding:'5px 12px', fontSize:'.73rem', fontWeight:700,
              letterSpacing:'0.05em', textTransform:'uppercase',
            }}>
              📊 Ver histórico
            </span>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="ar-empty">Nenhum militar encontrado.</div>
        )}
      </div>

      {selected && <SoldierHistoryModal user={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'dia',      label: '📅 Chamadas do Dia', comp: TabDia        },
  { id: 'efetivo',  label: '📊 Efetivo Geral',   comp: TabEfetivo    },
  { id: 'militar',  label: '👤 Por Militar',      comp: TabPorMilitar },
];

export default function AdminRelatoriosPage() {
  const [tab, setTab] = useState('dia');
  const ActiveComp = TABS.find(t=>t.id===tab)?.comp || TabDia;

  return (
    <div className="ar-page">
      <div className="ar-page-header">
        <div className="ar-page-icon">📊</div>
        <div>
          <h1 className="ar-page-title">Central de Relatórios</h1>
          <p className="ar-page-sub">SIM · Visualização de Chamadas · Somente Leitura</p>
        </div>
      </div>

      <div className="ar-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ar-tab ${tab===t.id?'active':''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ActiveComp />
    </div>
  );
}
