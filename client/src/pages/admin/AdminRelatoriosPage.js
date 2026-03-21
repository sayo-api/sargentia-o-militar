/**
 * AdminRelatoriosPage.js — /admin/relatorios e /relatorios (soldados com hasRelatorioAccess)
 * 3 abas: Chamadas do Dia | Efetivo Geral | Por Militar
 * Sincronia real com banco de dados · React Icons · Responsivo
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar, ChevronLeft, ChevronRight, Users, BarChart2,
  Search, Download, RefreshCw, ChevronDown, ChevronUp,
  Check, X, Clock, AlertTriangle, User, Activity,
} from 'lucide-react';

import '../chamada/Chamada.css';
import './AdminRelatorios.css';

const TURNO_MAP   = { geral:'Geral', manha:'Manhã', tarde:'Tarde', noite:'Noite' };
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// Converte datas do MongoDB (ISO UTC) para Date local corretamente,
// evitando o bug de fuso horário onde "2026-03-21T00:00:00.000Z" vira
// 20/03 no Brasil (UTC-3) ao usar new Date() diretamente.
function parseAsLocal(date) {
  if (!date) return new Date();
  if (typeof date === 'string') {
    const ymd = date.substring(0, 10).split('-').map(Number);
    return new Date(ymd[0], ymd[1] - 1, ymd[2]);
  }
  return date instanceof Date ? date : new Date(date);
}
function toLocalStr(date) {
  const d = parseAsLocal(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDate(d, opts={}) { return parseAsLocal(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',...opts}); }
function fmtFull(iso) {
  const [y,m,d] = iso.split('-').map(Number);
  const date = new Date(y,m-1,d);
  return `${DIAS_SEMANA[date.getDay()]}, ${String(d).padStart(2,'0')} ${MESES_ABREV[m-1]} ${y}`;
}
function addDays(iso, n) {
  const [y,m,d] = iso.split('-').map(Number);
  return toLocalStr(new Date(y,m-1,d+n));
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ children, color='gray' }) {
  const map = {
    green:  {bg:'#062e16',fg:'#3dba6a',bord:'#1c6630'},
    red:    {bg:'#2a0d0a',fg:'#d94f3d',bord:'#6b2820'},
    yellow: {bg:'#2a1603',fg:'#e8a420',bord:'#6b4010'},
    blue:   {bg:'#0c1a3a',fg:'#4a90d4',bord:'#1e3a5f'},
    purple: {bg:'#1e0e3a',fg:'#8a5fd4',bord:'#4a2a8a'},
    gold:   {bg:'#1a1004',fg:'#c9a227',bord:'#7a6118'},
    gray:   {bg:'#0f1a0d',fg:'#6a8a60',bord:'#2d4a22'},
  };
  const c = map[color]||map.gray;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 9px',borderRadius:2,fontSize:'.64rem',fontWeight:800,background:c.bg,color:c.fg,border:`1px solid ${c.bord}`,textTransform:'uppercase',letterSpacing:'.06em',whiteSpace:'nowrap'}}>
      {children}
    </span>
  );
}

// ─── Modal Histórico Soldado ──────────────────────────────────────────────────
function SoldierHistoryModal({ user, onClose }) {
  const [tab,setTab]     = useState('chamada');
  const [stats,setStats] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c,a] = await Promise.all([
          api.get(`/chamada/stats/soldado/${user._id}`),
          api.get(`/auditoria/stats/soldado/${user._id}`),
        ]);
        setStats({chamada:c.data, auditoria:a.data});
      } catch { toast.error('Erro ao carregar histórico.'); }
      finally { setLoading(false); }
    })();
  }, [user._id]);

  const ch = stats?.chamada;
  const au = stats?.auditoria;

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal ar-history-modal" onClick={e=>e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title"><User size={15}/> Histórico</div>
            <div className="ch-modal-subtitle">{user.rank} {user.warName} · Nr. {user.warNumber}</div>
          </div>
          <button className="ch-modal-close" onClick={onClose}><X size={15}/></button>
        </div>

        <div className="ss-tabs">
          <button className={`ss-tab ${tab==='chamada'?'active':''}`} onClick={()=>setTab('chamada')}><Activity size={13}/> Chamadas</button>
          <button className={`ss-tab ${tab==='auditoria'?'active':''}`} onClick={()=>setTab('auditoria')}><AlertTriangle size={13}/> Auditorias</button>
        </div>

        <div className="ch-modal-body">
          {loading && <div className="ch-loading">Carregando...</div>}

          {!loading && tab==='chamada' && ch && (
            <>
              <div className="ar-mini-cards">
                {[{l:'Total',v:ch.totalChamadas,c:'blue'},{l:'Presenças',v:ch.presencas,c:'green'},{l:'Faltas',v:ch.faltas,c:'red'},{l:'Atrasos',v:ch.atrasos,c:'yellow'}].map(s=>(
                  <div key={s.l} className="ar-mini-card">
                    <span className="ar-mini-num" style={{color:`var(--ar-${s.c})`}}>{s.v}</span>
                    <span className="ar-mini-lbl">{s.l}</span>
                  </div>
                ))}
              </div>
              <div className="ss-history-table-wrap">
                <table className="ss-table">
                  <thead><tr><th>Data</th><th>Turno</th><th>Presença</th><th>Atraso</th><th>Horário</th></tr></thead>
                  <tbody>
                    {ch.historico.map((h,i)=>(
                      <tr key={i} className={h.presente===false?'row-falta':h.atrasado?'row-atrasado':''}>
                        <td>{fmtDate(h.date)}</td>
                        <td>{TURNO_MAP[h.turno]||h.turno}</td>
                        <td>{h.presente===true?<Chip color="green"><Check size={10}/> Presente</Chip>:h.presente===false?<Chip color="red"><X size={10}/> Falta</Chip>:<Chip>—</Chip>}</td>
                        <td>{h.atrasado?<Chip color="yellow"><Clock size={10}/></Chip>:'—'}</td>
                        <td>{h.horarioChegada||'—'}</td>
                      </tr>
                    ))}
                    {!ch.historico.length && <tr><td colSpan={5} style={{textAlign:'center',color:'var(--ar-muted)',padding:20}}>Sem registros.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!loading && tab==='auditoria' && au && (
            <>
              <div className="ar-mini-cards">
                {[{l:'Auditorias',v:au.totalAuditorias,c:'purple'},{l:'Cabelo',v:au.cabeloForaPadrao,c:'red'},{l:'Barba',v:au.barbaForaPadrao,c:'red'},{l:'Cuturno',v:au.cuturnoForaPadrao,c:'red'}].map(s=>(
                  <div key={s.l} className="ar-mini-card">
                    <span className="ar-mini-num" style={{color:`var(--ar-${s.c})`}}>{s.v}</span>
                    <span className="ar-mini-lbl">{s.l}</span>
                  </div>
                ))}
              </div>
              {au.tfm && Object.keys(au.tfm).length > 0 && (
                <div className="ar-mini-cards" style={{marginTop:8}}>
                  {Object.entries(au.tfm).map(([k,v])=>(
                    <div key={k} className="ar-mini-card">
                      <span className="ar-mini-num" style={{color:'var(--ar-orange)'}}>{v||0}</span>
                      <span className="ar-mini-lbl">{k}</span>
                    </div>
                  ))}
                </div>
              )}
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

// ─── ABA 1: Chamadas do Dia ───────────────────────────────────────────────────
function TabDia() {
  const [date,      setDate]      = useState(todayStr);
  const [chamadas,  setChamadas]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [exporting, setExporting] = useState(null);
  const [expanded,  setExpanded]  = useState(null);

  const load = useCallback(async (d) => {
    setLoading(true); setChamadas([]);
    try {
      // busca chamadas do dia específico
      const res = await api.get(`/chamada?limit=500`);
      const all = Array.isArray(res.data) ? res.data : [];
      const dayData = all.filter(c => toLocalStr(c.date) === d)
        .sort((a,b) => {const o={manha:0,tarde:1,noite:2,geral:3}; return (o[a.turno]??9)-(o[b.turno]??9);});
      setChamadas(dayData);
    } catch { toast.error('Erro ao carregar chamadas.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const downloadDocx = async (c) => {
    const d = new Date(c.date);
    setExporting(c._id);
    try {
      const res = await api.get(`/planilha/export/docx?month=${d.getMonth()+1}&year=${d.getFullYear()}`,{responseType:'blob'});
      const url = URL.createObjectURL(new Blob([res.data],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
      const a = Object.assign(document.createElement('a'),{href:url,download:`escala-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}.docx`});
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('Word baixado!');
    } catch { toast.error('Erro ao gerar Word.'); }
    finally { setExporting(null); }
  };

  const totDia = chamadas.reduce((acc,c)=>{
    acc.pres += c.soldiers.filter(s=>s.presente===true).length;
    acc.falt += c.soldiers.filter(s=>s.presente===false).length;
    acc.atrs += c.soldiers.filter(s=>s.atrasado).length;
    return acc;
  },{pres:0,falt:0,atrs:0});

  return (
    <div className="ar-tab-body">
      {/* Navegador */}
      <div className="ar-date-nav">
        <button className="ar-date-btn" onClick={()=>setDate(addDays(date,-1))}><ChevronLeft size={18}/></button>
        <div className="ar-date-center">
          <div className="ar-date-full">{fmtFull(date)}</div>
          {date===todayStr() && <div className="ar-date-today">● HOJE</div>}
        </div>
        <input type="date" className="ar-date-input" value={date} max={todayStr()} onChange={e=>e.target.value&&setDate(e.target.value)}/>
        <button className="ar-date-btn" onClick={()=>setDate(addDays(date,1))} disabled={date===todayStr()}><ChevronRight size={18}/></button>
        {date!==todayStr() && <button className="ar-today-btn" onClick={()=>setDate(todayStr())}>Hoje</button>}
      </div>

      {/* Stats */}
      {!loading && chamadas.length > 0 && (
        <div className="ar-summary-row">
          {[{l:'Chamadas',v:chamadas.length,c:'blue'},{l:'Presenças',v:totDia.pres,c:'green'},{l:'Faltas',v:totDia.falt,c:'red'},{l:'Atrasos',v:totDia.atrs,c:'yellow'}].map(s=>(
            <div key={s.l} className={`ar-summary-card ar-card--${s.c}`}>
              <span className="ar-scard-num">{s.v}</span>
              <span className="ar-scard-lbl">{s.l}</span>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="ch-loading">Carregando chamadas de {fmtFull(date)}...</div>}

      {!loading && chamadas.length === 0 && (
        <div className="ch-empty">
          <Calendar size={32}/>
          <strong style={{color:'var(--ar-text2)',textTransform:'uppercase',letterSpacing:'.06em',fontSize:'.88rem'}}>Sem chamadas neste dia</strong>
          <span style={{fontSize:'.78rem',color:'var(--ar-muted)'}}>{fmtFull(date)}</span>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {chamadas.map(c => {
          const pres  = c.soldiers.filter(s=>s.presente===true).length;
          const falt  = c.soldiers.filter(s=>s.presente===false).length;
          const atrs  = c.soldiers.filter(s=>s.atrasado).length;
          const semM  = c.soldiers.filter(s=>s.presente===null).length;
          const taxa  = c.soldiers.length ? Math.round((pres/c.soldiers.length)*100) : 0;
          const open  = expanded===c._id;
          const isExp = exporting===c._id;
          return (
            <div key={c._id} className="ar-chamada-card">
              <div className="ar-chamada-header">
                <div className="ar-chamada-meta">
                  <span className="ar-chamada-turno-badge">{TURNO_MAP[c.turno]||c.turno}</span>
                  <Chip color={c.status==='enviada'?'blue':c.status==='reaberta'?'yellow':'green'}>
                    {c.status==='enviada'?<><Check size={9}/> Enviada</>:c.status==='reaberta'?<><RefreshCw size={9}/> Reaberta</>:<><AlertTriangle size={9}/> Aberta</>}
                  </Chip>
                  {c.createdBy && <span className="ar-chamada-author">por {c.createdBy.warName}</span>}
                </div>
                <div className="ar-chamada-counts">
                  <span className="ar-count green"><Check size={11}/> {pres}</span>
                  <span className="ar-count red"><X size={11}/> {falt}</span>
                  {atrs>0 && <span className="ar-count yellow"><Clock size={11}/> {atrs}</span>}
                  {semM>0 && <span className="ar-count gray">– {semM}</span>}
                  <span className="ar-taxa" style={{color:taxa>=90?'var(--ar-green)':taxa>=70?'var(--ar-yellow)':'var(--ar-red)'}}>{taxa}%</span>
                </div>
                <div className="ar-chamada-actions">
                  <button className="ar-btn-expand" onClick={()=>setExpanded(open?null:c._id)}>
                    {open?<ChevronUp size={14}/>:<ChevronDown size={14}/>} {open?'Fechar':'Ver lista'}
                  </button>
                  <button className="ar-btn-word" disabled={isExp} onClick={()=>downloadDocx(c)}>
                    {isExp?'⏳':<><Download size={13}/> Word</>}
                  </button>
                </div>
              </div>

              {open && (
                <div className="ar-chamada-detail">
                  <div className="ar-detail-title"><Users size={12}/> Lista de Presença — {c.soldiers.length} militares</div>
                  <div className="ar-presence-grid">
                    {c.soldiers.sort((a,b)=>(a.user?.warNumber||0)-(b.user?.warNumber||0)).map((s,i)=>{
                      const u=s.user;
                      return (
                        <div key={u?._id||i} className={`ar-presence-item ${s.presente===true?'presente':s.presente===false?'falta':''}`}>
                          <span className="ar-presence-nr">{String(u?.warNumber||'?').padStart(2,'0')}</span>
                          <span className="ar-presence-name">{u?.warName||'?'}</span>
                          <span className="ar-presence-status">
                            {s.presente===true ? s.atrasado ? <Chip color="yellow"><Clock size={9}/>{s.horarioChegada?` ${s.horarioChegada}`:''}</Chip> : <Chip color="green"><Check size={9}/></Chip> : s.presente===false ? <Chip color="red"><X size={9}/></Chip> : <Chip>—</Chip>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {c.observacaoGeral && <div className="ar-obs-geral">💬 {c.observacaoGeral}</div>}
                </div>
              )}
            </div>
          );
        })}
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
      const list = (res.data?.users||res.data||[]).sort((a,b)=>(a.warNumber||0)-(b.warNumber||0));
      setUsers(list);
      const map = {};
      const BATCH = 8;
      for (let i=0; i<list.length; i+=BATCH) {
        await Promise.all(list.slice(i,i+BATCH).map(async u => {
          try {
            const [c,a] = await Promise.all([api.get(`/chamada/stats/soldado/${u._id}`), api.get(`/auditoria/stats/soldado/${u._id}`)]);
            map[u._id] = {chamada:c.data, auditoria:a.data};
          } catch { map[u._id] = {chamada:null, auditoria:null}; }
        }));
        setStatsMap({...map});
      }
    } catch { toast.error('Erro ao carregar dados.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const irr = (u) => {
    const au = statsMap[u._id]?.auditoria;
    return (au?.cabeloForaPadrao||0)+(au?.barbaForaPadrao||0)+(au?.cuturnoForaPadrao||0)+Object.values(au?.tfm||{}).reduce((x,v)=>x+v,0);
  };

  const filtered = users.filter(u=>!search||u.warName?.toLowerCase().includes(search.toLowerCase())||String(u.warNumber||'').includes(search)||u.rank?.toLowerCase().includes(search.toLowerCase()));
  const sorted   = [...filtered].sort((a,b)=>{
    if(sortBy==='faltas') return (statsMap[b._id]?.chamada?.faltas||0)-(statsMap[a._id]?.chamada?.faltas||0);
    if(sortBy==='atrasos') return (statsMap[b._id]?.chamada?.atrasos||0)-(statsMap[a._id]?.chamada?.atrasos||0);
    if(sortBy==='irr') return irr(b)-irr(a);
    return (a.warNumber||0)-(b.warNumber||0);
  });

  const totais = users.reduce((acc,u)=>{ acc.faltas+=statsMap[u._id]?.chamada?.faltas||0; acc.atrasos+=statsMap[u._id]?.chamada?.atrasos||0; acc.irr+=irr(u); return acc; },{faltas:0,atrasos:0,irr:0});

  return (
    <div className="ar-tab-body">
      <div className="ar-summary-row">
        {[{l:'Efetivo',v:users.length,c:'blue'},{l:'Faltas',v:totais.faltas,c:'red'},{l:'Atrasos',v:totais.atrasos,c:'yellow'},{l:'Irregularidades',v:totais.irr,c:'orange'}].map(s=>(
          <div key={s.l} className={`ar-summary-card ar-card--${s.c}`}>
            <span className="ar-scard-num">{s.v}</span>
            <span className="ar-scard-lbl">{s.l}</span>
          </div>
        ))}
      </div>

      <div className="ar-filter-row">
        <div className="ar-search-wrap" style={{flex:1,position:'relative'}}>
          <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--ar-muted)'}}/>
          <input className="ch-input" style={{paddingLeft:36}} placeholder="Buscar por nome, número ou posto..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="ar-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="warNumber">Ordenar: Número</option>
          <option value="faltas">Mais Faltas</option>
          <option value="atrasos">Mais Atrasos</option>
          <option value="irr">Mais Irregularidades</option>
        </select>
      </div>

      {loading && Object.keys(statsMap).length===0 && <div className="ch-loading">Carregando efetivo...</div>}
      {loading && Object.keys(statsMap).length>0 && (
        <div className="ar-progress-bar">
          <div className="ar-progress-inner" style={{width:`${(Object.keys(statsMap).length/users.length)*100}%`}}/>
          <span className="ar-progress-txt">Carregando {Object.keys(statsMap).length}/{users.length}</span>
        </div>
      )}

      <div className="ar-table-wrap">
        <table className="ar-main-table">
          <thead>
            <tr>
              <th>Nr</th><th>Nome</th><th>Posto</th>
              <th><Check size={11}/></th><th><X size={11}/></th><th><Clock size={11}/></th>
              <th>💇</th><th>🧔</th><th>👞</th><th>TFM</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(u=>{
              const ch=statsMap[u._id]?.chamada; const au=statsMap[u._id]?.auditoria;
              const tfm=Object.values(au?.tfm||{}).reduce((x,v)=>x+v,0);
              const bad=(ch?.faltas||0)>0||(ch?.atrasos||0)>0||(au?.cabeloForaPadrao||0)>0||(au?.barbaForaPadrao||0)>0||(au?.cuturnoForaPadrao||0)>0||tfm>0;
              return (
                <tr key={u._id} className={bad?'row-problem':''}>
                  <td className="ar-nr-cell">{String(u.warNumber||'?').padStart(2,'0')}</td>
                  <td className="ar-name-cell">{u.warName}</td>
                  <td style={{color:'var(--ar-muted)',fontSize:'.78rem'}}>{u.rank||'—'}</td>
                  <td><Chip color={(ch?.presencas||0)>0?'green':'gray'}>{ch?.presencas??'…'}</Chip></td>
                  <td><Chip color={(ch?.faltas||0)>0?'red':'gray'}>{ch?.faltas??'…'}</Chip></td>
                  <td><Chip color={(ch?.atrasos||0)>0?'yellow':'gray'}>{ch?.atrasos??'…'}</Chip></td>
                  <td><Chip color={(au?.cabeloForaPadrao||0)>0?'red':'gray'}>{au?.cabeloForaPadrao??'…'}</Chip></td>
                  <td><Chip color={(au?.barbaForaPadrao||0)>0?'red':'gray'}>{au?.barbaForaPadrao??'…'}</Chip></td>
                  <td><Chip color={(au?.cuturnoForaPadrao||0)>0?'red':'gray'}>{au?.cuturnoForaPadrao??'…'}</Chip></td>
                  <td><Chip color={tfm>0?'yellow':'gray'}>{tfm>0?tfm:au?'0':'…'}</Chip></td>
                  <td><button className="ar-btn-history" onClick={()=>setSelected(u)}><BarChart2 size={13}/></button></td>
                </tr>
              );
            })}
            {!sorted.length && !loading && <tr><td colSpan={11} className="ar-empty">Nenhum soldado encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && <SoldierHistoryModal user={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

// ─── ABA 3: Por Militar ───────────────────────────────────────────────────────
function TabMilitar() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [selected,setSelected]= useState(null);

  useEffect(() => {
    (async()=>{
      try { const r=await api.get('/users?limit=500'); setUsers((r.data?.users||r.data||[]).sort((a,b)=>(a.warNumber||0)-(b.warNumber||0))); }
      catch { toast.error('Erro ao carregar efetivo.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = users.filter(u=>!search||u.warName?.toLowerCase().includes(search.toLowerCase())||String(u.warNumber||'').includes(search)||u.rank?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ar-tab-body">
      <div style={{position:'relative'}}>
        <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--ar-muted)'}}/>
        <input className="ch-input" style={{paddingLeft:36}} placeholder="Buscar militar por nome, número ou posto..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {loading && <div className="ch-loading">Carregando efetivo...</div>}
      <div className="ar-soldiers-list">
        {filtered.map(u=>(
          <div key={u._id} className="ar-soldier-row" onClick={()=>setSelected(u)} style={{cursor:'pointer'}}>
            <span className="ar-row-nr">{String(u.warNumber||'?').padStart(2,'0')}</span>
            <div className="ar-row-info">
              <div className="ar-row-name">{u.warName}</div>
              <div className="ar-row-rank">{u.rank}</div>
            </div>
            <div className="ar-row-actions">
              <button className="ar-btn-history" onClick={e=>{e.stopPropagation();setSelected(u);}}><BarChart2 size={14}/> Ver histórico</button>
            </div>
          </div>
        ))}
        {!loading && !filtered.length && <div className="ar-empty">Nenhum militar encontrado.</div>}
      </div>
      {selected && <SoldierHistoryModal user={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const TABS = [
  {id:'dia',     label:'Chamadas do Dia', icon:<Calendar size={14}/>,  comp:TabDia    },
  {id:'efetivo', label:'Efetivo Geral',   icon:<BarChart2 size={14}/>, comp:TabEfetivo},
  {id:'militar', label:'Por Militar',     icon:<User size={14}/>,      comp:TabMilitar},
];

export default function AdminRelatoriosPage() {
  const [tab, setTab] = useState('dia');
  const ActiveComp = TABS.find(t=>t.id===tab)?.comp || TabDia;

  return (
    <div className="ar-page">
      <div className="ar-page-header">
        <div className="ar-page-icon"><Activity size={24}/></div>
        <div>
          <h1 className="ar-page-title">Central de Relatórios</h1>
          <p className="ar-page-sub">SIM · Visualização de Chamadas · Somente Leitura</p>
        </div>
      </div>

      <div className="ar-tabs">
        {TABS.map(t=>(
          <button key={t.id} className={`ar-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <ActiveComp/>
    </div>
  );
}
