import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Chamada.css';

const TFM_LABELS = { blusa: 'Blusa', short: 'Short', meia: 'Meia', tenis: 'Tênis' };

function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Card de estatística ──────────────────────────────────────────────────────
function StatCard({ label, value, color = '#3b82f6', icon }) {
  return (
    <div className="ss-stat-card" style={{ '--ss-color': color }}>
      <span className="ss-stat-icon">{icon}</span>
      <span className="ss-stat-num">{value}</span>
      <span className="ss-stat-lbl">{label}</span>
    </div>
  );
}

// ─── Modal: Histórico completo de um soldado ──────────────────────────────────
function SoldierHistoryModal({ user, onClose }) {
  const [chamadaStats,  setChamadaStats]  = useState(null);
  const [auditoriaStats, setAuditoriaStats] = useState(null);
  const [tab, setTab] = useState('chamada'); // 'chamada' | 'auditoria'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [c, a] = await Promise.all([
          api.get(`/chamada/stats/soldado/${user._id}`),
          api.get(`/auditoria/stats/soldado/${user._id}`),
        ]);
        setChamadaStats(c.data);
        setAuditoriaStats(a.data);
      } catch (err) {
        toast.error('Erro ao carregar histórico.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user._id]);

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal ss-history-modal" onClick={e => e.stopPropagation()}>
        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title">📊 Histórico</div>
            <div className="ch-modal-subtitle">
              {user.rank} {user.warName} — Nr. {user.warNumber}
            </div>
          </div>
          <button className="ch-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ss-tabs">
          <button className={`ss-tab ${tab === 'chamada' ? 'active' : ''}`} onClick={() => setTab('chamada')}>
            📋 Chamadas
          </button>
          <button className={`ss-tab ${tab === 'auditoria' ? 'active' : ''}`} onClick={() => setTab('auditoria')}>
            🔍 Auditorias
          </button>
        </div>

        <div className="ch-modal-body">
          {loading && <div className="ch-loading">Carregando histórico...</div>}

          {!loading && tab === 'chamada' && chamadaStats && (
            <>
              <div className="ss-stats-mini-row">
                <StatCard label="Total Chamadas" value={chamadaStats.totalChamadas} icon="📋" color="#3b82f6" />
                <StatCard label="Presenças"       value={chamadaStats.presencas}    icon="✔"  color="#22c55e" />
                <StatCard label="Faltas"           value={chamadaStats.faltas}      icon="✘"  color="#ef4444" />
                <StatCard label="Atrasos"          value={chamadaStats.atrasos}     icon="⏱"  color="#f59e0b" />
              </div>

              <div className="ss-history-table-wrap">
                <table className="ss-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Turno</th>
                      <th>Presença</th>
                      <th>Atraso</th>
                      <th>Horário</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chamadaStats.historico.map((h, i) => (
                      <tr key={i} className={h.presente === false ? 'row-falta' : h.atrasado ? 'row-atrasado' : ''}>
                        <td>{fmtDate(h.date)}</td>
                        <td>{({ geral:'Geral',manha:'Manhã',tarde:'Tarde',noite:'Noite' })[h.turno] || h.turno}</td>
                        <td>
                          {h.presente === true  ? <span className="ss-badge green">✔ Presente</span>  :
                           h.presente === false ? <span className="ss-badge red">✘ Falta</span>     :
                           <span className="ss-badge gray">—</span>}
                        </td>
                        <td>{h.atrasado ? <span className="ss-badge yellow">⏱ Sim</span> : '—'}</td>
                        <td>{h.horarioChegada || '—'}</td>
                        <td className="ss-obs-cell">{h.observacao || '—'}</td>
                      </tr>
                    ))}
                    {chamadaStats.historico.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign:'center', color:'#9ca3af' }}>Sem registros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!loading && tab === 'auditoria' && auditoriaStats && (
            <>
              <div className="ss-stats-mini-row">
                <StatCard label="Total Auditorias"  value={auditoriaStats.totalAuditorias}  icon="🔍" color="#7c3aed" />
                <StatCard label="Cabelo Irregular"   value={auditoriaStats.cabeloForaPadrao} icon="💇" color="#ef4444" />
                <StatCard label="Barba Irregular"    value={auditoriaStats.barbaForaPadrao}  icon="🧔" color="#ef4444" />
                <StatCard label="Cuturno Irregular"  value={auditoriaStats.cuturnoForaPadrao}icon="👞" color="#ef4444" />
              </div>

              <div className="ss-tfm-row">
                {Object.entries(TFM_LABELS).map(([key, label]) => (
                  <StatCard key={key} label={`TFM: ${label}`} value={auditoriaStats.tfm?.[key] || 0}
                    icon="👕" color="#f97316" />
                ))}
              </div>

              <div className="ss-history-table-wrap">
                <table className="ss-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Cabelo</th>
                      <th>Barba</th>
                      <th>Cuturno</th>
                      <th>TFM Blusa</th>
                      <th>TFM Short</th>
                      <th>TFM Meia</th>
                      <th>TFM Tênis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoriaStats.historico.map((h, i) => {
                      const cell = (val, obs) =>
                        val?.padrao === false
                          ? <span className="ss-badge red" title={obs || ''}>✘{obs ? ' ⓘ' : ''}</span>
                          : val?.padrao === true
                          ? <span className="ss-badge green">✔</span>
                          : <span className="ss-badge gray">—</span>;
                      return (
                        <tr key={i}>
                          <td>{fmtDate(h.date)}</td>
                          <td>{cell(h.cabelo,  h.cabelo?.observacao)}</td>
                          <td>{cell(h.barba,   h.barba?.observacao)}</td>
                          <td>{cell(h.cuturno, h.cuturno?.observacao)}</td>
                          <td>{cell(h.tfm?.blusa,  h.tfm?.blusa?.observacao)}</td>
                          <td>{cell(h.tfm?.short,  h.tfm?.short?.observacao)}</td>
                          <td>{cell(h.tfm?.meia,   h.tfm?.meia?.observacao)}</td>
                          <td>{cell(h.tfm?.tenis,  h.tfm?.tenis?.observacao)}</td>
                        </tr>
                      );
                    })}
                    {auditoriaStats.historico.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign:'center', color:'#9ca3af' }}>Sem registros.</td></tr>
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function StatusSoldadosPage() {
  const [users,       setUsers]       = useState([]);
  const [statsMap,    setStatsMap]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [sortBy,      setSortBy]      = useState('warNumber'); // 'warNumber' | 'faltas' | 'atrasos' | 'irregularidades'

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users?limit=200');
      const userList = res.data?.users || res.data || [];
      setUsers(userList.sort((a, b) => (a.warNumber || 0) - (b.warNumber || 0)));

      // Carregar stats de cada usuário em paralelo (máximo 10 por vez)
      const BATCH = 10;
      const map = {};
      for (let i = 0; i < userList.length; i += BATCH) {
        const batch = userList.slice(i, i + BATCH);
        await Promise.all(batch.map(async u => {
          try {
            const [c, a] = await Promise.all([
              api.get(`/chamada/stats/soldado/${u._id}`),
              api.get(`/auditoria/stats/soldado/${u._id}`),
            ]);
            map[u._id] = { chamada: c.data, auditoria: a.data };
          } catch (e) {
            map[u._id] = { chamada: null, auditoria: null };
          }
        }));
      }
      setStatsMap(map);
    } catch (err) {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = users.filter(u => {
    if (!search) return true;
    return (
      u.warName?.toLowerCase().includes(search.toLowerCase()) ||
      String(u.warNumber).includes(search) ||
      u.rank?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const sa = statsMap[a._id];
    const sb = statsMap[b._id];
    if (sortBy === 'faltas') {
      return (sb?.chamada?.faltas || 0) - (sa?.chamada?.faltas || 0);
    }
    if (sortBy === 'atrasos') {
      return (sb?.chamada?.atrasos || 0) - (sa?.chamada?.atrasos || 0);
    }
    if (sortBy === 'irregularidades') {
      const ai = (sa?.auditoria?.cabeloForaPadrao || 0) + (sa?.auditoria?.barbaForaPadrao || 0) +
                 (sa?.auditoria?.cuturnoForaPadrao || 0) +
                 Object.values(sa?.auditoria?.tfm || {}).reduce((x, v) => x + v, 0);
      const bi = (sb?.auditoria?.cabeloForaPadrao || 0) + (sb?.auditoria?.barbaForaPadrao || 0) +
                 (sb?.auditoria?.cuturnoForaPadrao || 0) +
                 Object.values(sb?.auditoria?.tfm || {}).reduce((x, v) => x + v, 0);
      return bi - ai;
    }
    return (a.warNumber || 0) - (b.warNumber || 0);
  });

  // Totais gerais
  const totais = users.reduce((acc, u) => {
    const s = statsMap[u._id];
    acc.faltas    += s?.chamada?.faltas    || 0;
    acc.atrasos   += s?.chamada?.atrasos   || 0;
    const irr = (s?.auditoria?.cabeloForaPadrao || 0) + (s?.auditoria?.barbaForaPadrao || 0) +
                (s?.auditoria?.cuturnoForaPadrao || 0) +
                Object.values(s?.auditoria?.tfm || {}).reduce((x, v) => x + v, 0);
    acc.irregularidades += irr;
    return acc;
  }, { faltas: 0, atrasos: 0, irregularidades: 0 });

  return (
    <div className="ch-page">
      <div className="ch-header">
        <h1 className="ch-title">📊 Status dos Soldados</h1>
      </div>

      {/* Resumo geral */}
      <div className="ch-stats-row">
        <div className="ch-stat ch-stat--blue">
          <span className="ch-stat-num">{users.length}</span>
          <span className="ch-stat-lbl">Efetivo</span>
        </div>
        <div className="ch-stat ch-stat--red">
          <span className="ch-stat-num">{totais.faltas}</span>
          <span className="ch-stat-lbl">Faltas (total)</span>
        </div>
        <div className="ch-stat ch-stat--yellow">
          <span className="ch-stat-num">{totais.atrasos}</span>
          <span className="ch-stat-lbl">Atrasos (total)</span>
        </div>
        <div className="ch-stat ch-stat--orange">
          <span className="ch-stat-num">{totais.irregularidades}</span>
          <span className="ch-stat-lbl">Irregularidades</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="ch-search-bar ss-filter-row">
        <input
          className="ch-input"
          placeholder="🔍  Buscar por nome, número ou posto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="ch-input ss-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="warNumber">Ordenar: Número</option>
          <option value="faltas">Ordenar: Mais Faltas</option>
          <option value="atrasos">Ordenar: Mais Atrasos</option>
          <option value="irregularidades">Ordenar: Mais Irregularidades</option>
        </select>
      </div>

      {loading && <div className="ch-loading">Carregando dados de todos os soldados...</div>}

      {/* Tabela de soldados */}
      {!loading && (
        <div className="ss-table-wrap">
          <table className="ss-main-table">
            <thead>
              <tr>
                <th>Nr</th>
                <th>Nome de Guerra</th>
                <th>Posto</th>
                <th>Presenças</th>
                <th>Faltas</th>
                <th>Atrasos</th>
                <th>Cabelo</th>
                <th>Barba</th>
                <th>Cuturno</th>
                <th>TFM</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u, idx) => {
                const s   = statsMap[u._id];
                const ch  = s?.chamada;
                const au  = s?.auditoria;
                const tfmTotal = Object.values(au?.tfm || {}).reduce((x, v) => x + v, 0);
                const hasProblems = (ch?.faltas || 0) > 0 || (ch?.atrasos || 0) > 0 ||
                  (au?.cabeloForaPadrao || 0) > 0 || (au?.barbaForaPadrao || 0) > 0 ||
                  (au?.cuturnoForaPadrao || 0) > 0 || tfmTotal > 0;
                return (
                  <tr key={u._id} className={hasProblems ? 'row-problem' : ''}>
                    <td className="ss-nr-cell">{String(u.warNumber || '?').padStart(2,'0')}</td>
                    <td className="ss-name-cell">{u.warName}</td>
                    <td>{u.rank || '—'}</td>
                    <td>
                      <span className={`ss-badge ${(ch?.presencas || 0) > 0 ? 'green' : 'gray'}`}>
                        {ch?.presencas || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`ss-badge ${(ch?.faltas || 0) > 0 ? 'red' : 'gray'}`}>
                        {ch?.faltas || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`ss-badge ${(ch?.atrasos || 0) > 0 ? 'yellow' : 'gray'}`}>
                        {ch?.atrasos || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`ss-badge ${(au?.cabeloForaPadrao || 0) > 0 ? 'red' : 'gray'}`}>
                        {au?.cabeloForaPadrao || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`ss-badge ${(au?.barbaForaPadrao || 0) > 0 ? 'red' : 'gray'}`}>
                        {au?.barbaForaPadrao || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`ss-badge ${(au?.cuturnoForaPadrao || 0) > 0 ? 'red' : 'gray'}`}>
                        {au?.cuturnoForaPadrao || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`ss-badge ${tfmTotal > 0 ? 'orange' : 'gray'}`}>
                        {tfmTotal}
                      </span>
                    </td>
                    <td>
                      <button className="ch-btn-detail" onClick={() => setSelected(u)}>
                        📊 Histórico
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                    Nenhum soldado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <SoldierHistoryModal user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
