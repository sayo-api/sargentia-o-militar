/**
 * AdminRelatoriosPage.js
 * Rota: /admin/relatorios
 *
 * 3 abas:
 *  1. 👥 Militares       — efetivo completo + toggle permissão chamada
 *  2. 📊 Relatório Geral — tabela de faltas/atrasos/irregularidades por soldado
 *  3. 📋 Chamadas        — histórico de chamadas + lista de presença + download Word
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import '../chamada/Chamada.css';
import './AdminRelatorios.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TURNO_MAP = { geral: 'Geral', manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

function fmtDate(d, opts = {}) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', ...opts,
  });
}

function Chip({ children, color = 'gray' }) {
  const colors = {
    green:  { bg: '#052e16', fg: '#4ade80' },
    red:    { bg: '#450a0a', fg: '#f87171' },
    yellow: { bg: '#451a03', fg: '#fde68a' },
    orange: { bg: '#431407', fg: '#fb923c' },
    blue:   { bg: '#0c1a3a', fg: '#60a5fa' },
    purple: { bg: '#2e1065', fg: '#c4b5fd' },
    gray:   { bg: '#1e293b', fg: '#94a3b8' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 99,
      fontSize: '.73rem', fontWeight: 700,
      background: c.bg, color: c.fg,
    }}>
      {children}
    </span>
  );
}

// ─── Modal: Histórico completo de um soldado ──────────────────────────────────
function SoldierHistoryModal({ user, onClose }) {
  const [tab,    setTab]    = useState('chamada');
  const [stats,  setStats]  = useState(null);
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
      finally   { setLoading(false); }
    })();
  }, [user._id]);

  const ch = stats?.chamada;
  const au = stats?.auditoria;

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal ar-history-modal" onClick={e => e.stopPropagation()}>

        <div className="ch-modal-header">
          <div>
            <div className="ch-modal-title">📊 Histórico Completo</div>
            <div className="ch-modal-subtitle">{user.rank} {user.warName} — Nr. {user.warNumber}</div>
          </div>
          <button className="ch-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="ss-tabs">
          <button className={`ss-tab ${tab === 'chamada'   ? 'active' : ''}`} onClick={() => setTab('chamada')}>
            📋 Chamadas
          </button>
          <button className={`ss-tab ${tab === 'auditoria' ? 'active' : ''}`} onClick={() => setTab('auditoria')}>
            🔍 Auditorias
          </button>
        </div>

        <div className="ch-modal-body">
          {loading && <div className="ch-loading">Carregando...</div>}

          {/* ── ABA: Chamadas ── */}
          {!loading && tab === 'chamada' && ch && (
            <>
              <div className="ar-mini-cards">
                {[
                  { l: 'Total Chamadas', v: ch.totalChamadas, c: 'blue',   i: '📋' },
                  { l: 'Presenças',      v: ch.presencas,     c: 'green',  i: '✔' },
                  { l: 'Faltas',         v: ch.faltas,        c: 'red',    i: '✘' },
                  { l: 'Atrasos',        v: ch.atrasos,       c: 'yellow', i: '⏱' },
                ].map(s => (
                  <div key={s.l} className="ar-mini-card" style={{ '--ar-border': `var(--ar-${s.c})` }}>
                    <span className="ar-mini-icon">{s.i}</span>
                    <span className="ar-mini-num">{s.v}</span>
                    <span className="ar-mini-lbl">{s.l}</span>
                  </div>
                ))}
              </div>

              <div className="ss-history-table-wrap">
                <table className="ss-table">
                  <thead>
                    <tr>
                      <th>Data</th><th>Turno</th><th>Presença</th>
                      <th>Atraso</th><th>Horário</th><th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ch.historico.map((h, i) => (
                      <tr key={i} className={h.presente === false ? 'row-falta' : h.atrasado ? 'row-atrasado' : ''}>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(h.date)}</td>
                        <td>{TURNO_MAP[h.turno] || h.turno}</td>
                        <td>
                          {h.presente === true  ? <Chip color="green">✔ Presente</Chip>  :
                           h.presente === false ? <Chip color="red">✘ Falta</Chip>       :
                           <Chip>—</Chip>}
                        </td>
                        <td>{h.atrasado ? <Chip color="yellow">⏱ Sim</Chip> : '—'}</td>
                        <td>{h.horarioChegada || '—'}</td>
                        <td className="ss-obs-cell" title={h.observacao}>{h.observacao || '—'}</td>
                      </tr>
                    ))}
                    {!ch.historico.length && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>Sem registros de chamada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ABA: Auditorias ── */}
          {!loading && tab === 'auditoria' && au && (
            <>
              <div className="ar-mini-cards">
                {[
                  { l: 'Auditorias',    v: au.totalAuditorias,   c: 'purple', i: '🔍' },
                  { l: 'Cabelo',        v: au.cabeloForaPadrao,  c: 'red',    i: '💇' },
                  { l: 'Barba',         v: au.barbaForaPadrao,   c: 'red',    i: '🧔' },
                  { l: 'Cuturno',       v: au.cuturnoForaPadrao, c: 'red',    i: '👞' },
                ].map(s => (
                  <div key={s.l} className="ar-mini-card" style={{ '--ar-border': `var(--ar-${s.c})` }}>
                    <span className="ar-mini-icon">{s.i}</span>
                    <span className="ar-mini-num">{s.v}</span>
                    <span className="ar-mini-lbl">{s.l}</span>
                  </div>
                ))}
              </div>
              <div className="ar-mini-cards" style={{ marginTop: 8 }}>
                {[
                  { l: 'TFM Blusa', v: au.tfm?.blusa  || 0, c: 'orange', i: '👕' },
                  { l: 'TFM Short', v: au.tfm?.short  || 0, c: 'orange', i: '🩳' },
                  { l: 'TFM Meia',  v: au.tfm?.meia   || 0, c: 'orange', i: '🧦' },
                  { l: 'TFM Tênis', v: au.tfm?.tenis  || 0, c: 'orange', i: '👟' },
                ].map(s => (
                  <div key={s.l} className="ar-mini-card" style={{ '--ar-border': `var(--ar-${s.c})` }}>
                    <span className="ar-mini-icon">{s.i}</span>
                    <span className="ar-mini-num">{s.v}</span>
                    <span className="ar-mini-lbl">{s.l}</span>
                  </div>
                ))}
              </div>

              <div className="ss-history-table-wrap" style={{ marginTop: 12 }}>
                <table className="ss-table">
                  <thead>
                    <tr>
                      <th>Data</th><th>Cabelo</th><th>Barba</th><th>Cuturno</th>
                      <th>Blusa</th><th>Short</th><th>Meia</th><th>Tênis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {au.historico.map((h, i) => {
                      const auCell = (val) => (
                        <td style={{ textAlign: 'center' }}>
                          {val?.padrao === false
                            ? <Chip color="red" title={val.observacao}>✘{val.observacao ? ' ⓘ' : ''}</Chip>
                            : val?.padrao === true
                            ? <Chip color="green">✔</Chip>
                            : <Chip>—</Chip>}
                        </td>
                      );
                      return (
                        <tr key={i}>
                          <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(h.date)}</td>
                          {auCell(h.cabelo)}{auCell(h.barba)}{auCell(h.cuturno)}
                          {auCell(h.tfm?.blusa)}{auCell(h.tfm?.short)}{auCell(h.tfm?.meia)}{auCell(h.tfm?.tenis)}
                        </tr>
                      );
                    })}
                    {!au.historico.length && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>Sem registros de auditoria.</td></tr>
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

// ─── ABA 1: Militares / Permissões ───────────────────────────────────────────
function TabMilitares() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [search,  setSearch]  = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/permissoes');
      setUsers(res.data);
    } catch { toast.error('Erro ao carregar militares.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (user) => {
    setSaving(user._id);
    try {
      const res = await api.patch(`/permissoes/${user._id}/chamada`, {
        hasChamadaAccess: !user.hasChamadaAccess,
      });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, ...res.data } : u));
      toast.success(`${user.warName}: acesso ${res.data.hasChamadaAccess ? 'LIBERADO ✔' : 'REMOVIDO ✘'}`);
    } catch { toast.error('Erro ao atualizar permissão.'); }
    finally  { setSaving(null); }
  };

  const filtered = users.filter(u =>
    !search ||
    u.warName?.toLowerCase().includes(search.toLowerCase()) ||
    String(u.warNumber || '').includes(search) ||
    u.rank?.toLowerCase().includes(search.toLowerCase())
  );

  const comAcesso = users.filter(u => u.role === 'admin' || u.hasChamadaAccess).length;

  return (
    <div className="ar-tab-body">
      {/* Resumo */}
      <div className="ar-summary-row">
        <div className="ar-summary-card ar-card--blue">
          <span className="ar-scard-num">{users.length}</span>
          <span className="ar-scard-lbl">Total Efetivo</span>
        </div>
        <div className="ar-summary-card ar-card--green">
          <span className="ar-scard-num">{comAcesso}</span>
          <span className="ar-scard-lbl">Com Acesso Chamada</span>
        </div>
        <div className="ar-summary-card ar-card--gray">
          <span className="ar-scard-num">{users.length - comAcesso}</span>
          <span className="ar-scard-lbl">Sem Acesso</span>
        </div>
      </div>

      {/* Busca */}
      <input
        className="ch-input ar-search"
        placeholder="🔍  Buscar por nome, número ou posto..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading && <div className="ch-loading">Carregando efetivo...</div>}

      <div className="ar-soldiers-list">
        {filtered.map(u => (
          <div key={u._id} className="ar-soldier-row"
            style={{ borderLeftColor: u.role === 'admin' ? '#7c3aed' : u.hasChamadaAccess ? '#22c55e' : '#334155' }}>

            {/* Nr */}
            <span className="ar-row-nr">{String(u.warNumber || '?').padStart(2, '0')}</span>

            {/* Info */}
            <div className="ar-row-info">
              <div className="ar-row-name">
                {u.warName}
                {u.role === 'admin' && <Chip color="purple">ADMIN</Chip>}
              </div>
              <div className="ar-row-rank">{u.rank}</div>
            </div>

            {/* Permissão */}
            <div className="ar-row-perms">
              <div className="ar-perm-label">Acesso Chamada</div>
              <div className="ar-perm-status">
                {u.role === 'admin'
                  ? <Chip color="purple">✔ Admin</Chip>
                  : u.hasChamadaAccess
                  ? <Chip color="green">✔ Liberado</Chip>
                  : <Chip color="gray">✘ Bloqueado</Chip>}
              </div>
            </div>

            {/* Ações */}
            <div className="ar-row-actions">
              {u.role !== 'admin' && (
                <button
                  disabled={saving === u._id}
                  onClick={() => toggle(u)}
                  className={`ar-btn-toggle ${u.hasChamadaAccess ? 'remove' : 'add'}`}
                >
                  {saving === u._id ? '...' : u.hasChamadaAccess ? '✘ Remover' : '✔ Liberar'}
                </button>
              )}
              <button className="ar-btn-history" onClick={() => setSelected(u)}>
                📊 Histórico
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="ar-empty">Nenhum militar encontrado.</div>
        )}
      </div>

      {selected && <SoldierHistoryModal user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── ABA 2: Relatório Geral ───────────────────────────────────────────────────
function TabRelatorio() {
  const [users,    setUsers]    = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('warNumber');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users?limit=500');
      const list = (res.data?.users || res.data || [])
        .sort((a, b) => (a.warNumber || 0) - (b.warNumber || 0));
      setUsers(list);

      const map = {};
      const BATCH = 10;
      for (let i = 0; i < list.length; i += BATCH) {
        await Promise.all(list.slice(i, i + BATCH).map(async u => {
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
        // update progressively
        setStatsMap({ ...map });
      }
    } catch { toast.error('Erro ao carregar dados.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const irr = (u) => {
    const au = statsMap[u._id]?.auditoria;
    return (au?.cabeloForaPadrao || 0) + (au?.barbaForaPadrao || 0) +
           (au?.cuturnoForaPadrao || 0) + Object.values(au?.tfm || {}).reduce((x, v) => x + v, 0);
  };

  const filtered = users.filter(u =>
    !search ||
    u.warName?.toLowerCase().includes(search.toLowerCase()) ||
    String(u.warNumber || '').includes(search) ||
    u.rank?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'faltas')        return (statsMap[b._id]?.chamada?.faltas    || 0) - (statsMap[a._id]?.chamada?.faltas    || 0);
    if (sortBy === 'atrasos')       return (statsMap[b._id]?.chamada?.atrasos   || 0) - (statsMap[a._id]?.chamada?.atrasos   || 0);
    if (sortBy === 'irregularidades') return irr(b) - irr(a);
    return (a.warNumber || 0) - (b.warNumber || 0);
  });

  const totais = users.reduce((acc, u) => {
    acc.faltas          += statsMap[u._id]?.chamada?.faltas    || 0;
    acc.atrasos         += statsMap[u._id]?.chamada?.atrasos   || 0;
    acc.irregularidades += irr(u);
    return acc;
  }, { faltas: 0, atrasos: 0, irregularidades: 0 });

  return (
    <div className="ar-tab-body">
      {/* Resumo */}
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

      {/* Filtros */}
      <div className="ar-filter-row">
        <input
          className="ch-input"
          placeholder="🔍  Buscar por nome, número ou posto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="ch-input ar-sort-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
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
            style={{ width: `${(Object.keys(statsMap).length / users.length) * 100}%` }} />
          <span className="ar-progress-txt">
            Carregando... {Object.keys(statsMap).length}/{users.length}
          </span>
        </div>
      )}

      {/* Tabela */}
      <div className="ss-table-wrap">
        <table className="ss-main-table">
          <thead>
            <tr>
              <th>Nr</th>
              <th>Nome de Guerra</th>
              <th>Posto</th>
              <th>✔ Pres.</th>
              <th>✘ Faltas</th>
              <th>⏱ Atrasos</th>
              <th>💇 Cabelo</th>
              <th>🧔 Barba</th>
              <th>👞 Cuturno</th>
              <th>👕 TFM</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(u => {
              const ch  = statsMap[u._id]?.chamada;
              const au  = statsMap[u._id]?.auditoria;
              const tfm = Object.values(au?.tfm || {}).reduce((x, v) => x + v, 0);
              const bad = (ch?.faltas || 0) > 0 || (ch?.atrasos || 0) > 0 ||
                          (au?.cabeloForaPadrao || 0) > 0 || (au?.barbaForaPadrao || 0) > 0 ||
                          (au?.cuturnoForaPadrao || 0) > 0 || tfm > 0;
              return (
                <tr key={u._id} className={bad ? 'row-problem' : ''}>
                  <td className="ss-nr-cell">{String(u.warNumber || '?').padStart(2, '0')}</td>
                  <td className="ss-name-cell">{u.warName}</td>
                  <td style={{ color: '#94a3b8', fontSize: '.82rem' }}>{u.rank || '—'}</td>
                  <td><Chip color={(ch?.presencas || 0) > 0 ? 'green' : 'gray'}>{ch?.presencas ?? '…'}</Chip></td>
                  <td><Chip color={(ch?.faltas    || 0) > 0 ? 'red'   : 'gray'}>{ch?.faltas    ?? '…'}</Chip></td>
                  <td><Chip color={(ch?.atrasos   || 0) > 0 ? 'yellow': 'gray'}>{ch?.atrasos   ?? '…'}</Chip></td>
                  <td><Chip color={(au?.cabeloForaPadrao  || 0) > 0 ? 'red' : 'gray'}>{au?.cabeloForaPadrao  ?? '…'}</Chip></td>
                  <td><Chip color={(au?.barbaForaPadrao   || 0) > 0 ? 'red' : 'gray'}>{au?.barbaForaPadrao   ?? '…'}</Chip></td>
                  <td><Chip color={(au?.cuturnoForaPadrao || 0) > 0 ? 'red' : 'gray'}>{au?.cuturnoForaPadrao ?? '…'}</Chip></td>
                  <td><Chip color={tfm > 0 ? 'orange' : 'gray'}>{tfm > 0 ? tfm : au ? '0' : '…'}</Chip></td>
                  <td>
                    <button className="ar-btn-history" onClick={() => setSelected(u)}>
                      📊
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && !loading && (
              <tr><td colSpan={11} className="ar-empty">Nenhum soldado encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <SoldierHistoryModal user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── ABA 3: Chamadas ─────────────────────────────────────────────────────────
function TabChamadas() {
  const [chamadas,    setChamadas]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState(null);
  const [exporting,   setExporting]   = useState(null);
  const [search,      setSearch]      = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/chamada?limit=100');
      setChamadas(res.data);
    } catch { toast.error('Erro ao carregar chamadas.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadDocx = async (chamada) => {
    const d   = new Date(chamada.date);
    const mon = d.getMonth() + 1;
    const yr  = d.getFullYear();
    setExporting(chamada._id);
    try {
      const res = await api.get(`/planilha/export/docx?month=${mon}&year=${yr}`, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));
      const a    = Object.assign(document.createElement('a'), {
        href: url,
        download: `escala-${String(mon).padStart(2,'0')}-${yr}.docx`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Documento Word baixado!');
    } catch { toast.error('Erro ao gerar Word.'); }
    finally  { setExporting(null); }
  };

  const filtered = chamadas.filter(c =>
    !search || fmtDate(c.date).includes(search) ||
    (TURNO_MAP[c.turno] || c.turno).toLowerCase().includes(search.toLowerCase())
  );

  // Resumo total
  const totalPresente  = chamadas.reduce((n, c) => n + c.soldiers.filter(s => s.presente === true).length, 0);
  const totalFalta     = chamadas.reduce((n, c) => n + c.soldiers.filter(s => s.presente === false).length, 0);
  const totalAtrasados = chamadas.reduce((n, c) => n + c.soldiers.filter(s => s.atrasado).length, 0);

  return (
    <div className="ar-tab-body">
      {/* Resumo */}
      <div className="ar-summary-row">
        <div className="ar-summary-card ar-card--blue">
          <span className="ar-scard-num">{chamadas.length}</span>
          <span className="ar-scard-lbl">Total Chamadas</span>
        </div>
        <div className="ar-summary-card ar-card--green">
          <span className="ar-scard-num">{totalPresente}</span>
          <span className="ar-scard-lbl">Presenças</span>
        </div>
        <div className="ar-summary-card ar-card--red">
          <span className="ar-scard-num">{totalFalta}</span>
          <span className="ar-scard-lbl">Faltas</span>
        </div>
        <div className="ar-summary-card ar-card--yellow">
          <span className="ar-scard-num">{totalAtrasados}</span>
          <span className="ar-scard-lbl">Atrasos</span>
        </div>
      </div>

      {/* Busca */}
      <input
        className="ch-input ar-search"
        placeholder="🔍  Buscar por data ou turno..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading && <div className="ch-loading">Carregando chamadas...</div>}
      {!loading && filtered.length === 0 && <div className="ar-empty">Nenhuma chamada encontrada.</div>}

      {/* Lista */}
      <div className="ar-chamada-list">
        {filtered.map(c => {
          const pres   = c.soldiers.filter(s => s.presente === true).length;
          const falt   = c.soldiers.filter(s => s.presente === false).length;
          const atrs   = c.soldiers.filter(s => s.atrasado).length;
          const semM   = c.soldiers.filter(s => s.presente === null).length;
          const isOpen = expanded === c._id;
          const isExp  = exporting === c._id;

          return (
            <div key={c._id} className="ar-chamada-card">
              {/* Header do card */}
              <div className="ar-chamada-header">
                <div className="ar-chamada-meta">
                  <span className="ar-chamada-date">
                    {fmtDate(c.date, { weekday: 'short' })}
                  </span>
                  <span className="ar-chamada-turno">{TURNO_MAP[c.turno] || c.turno}</span>
                  <Chip color={c.status === 'enviada' ? 'blue' : c.status === 'reaberta' ? 'yellow' : 'green'}>
                    {c.status === 'enviada' ? '✅ Enviada' : c.status === 'reaberta' ? '🔄 Reaberta' : '🟢 Aberta'}
                  </Chip>
                </div>

                <div className="ar-chamada-counts">
                  <span className="ar-count green">✔ {pres}</span>
                  <span className="ar-count red">✘ {falt}</span>
                  {atrs > 0 && <span className="ar-count yellow">⏱ {atrs}</span>}
                  {semM > 0 && <span className="ar-count gray">– {semM}</span>}
                </div>

                <div className="ar-chamada-actions">
                  <button
                    className="ar-btn-expand"
                    onClick={() => setExpanded(isOpen ? null : c._id)}
                  >
                    {isOpen ? '▲ Fechar' : '▼ Ver lista'}
                  </button>
                  <button
                    className="ar-btn-word"
                    disabled={isExp}
                    onClick={() => downloadDocx(c)}
                  >
                    {isExp ? '⏳...' : '📄 Word'}
                  </button>
                </div>
              </div>

              {/* Lista expandida de presença */}
              {isOpen && (
                <div className="ar-chamada-detail">
                  <div className="ar-detail-title">
                    Lista de Presença — {c.soldiers.length} militares
                  </div>
                  <div className="ar-presence-grid">
                    {c.soldiers.map((s, i) => {
                      const u = s.user;
                      return (
                        <div key={u?._id || i}
                          className={`ar-presence-item ${s.presente === true ? 'presente' : s.presente === false ? 'falta' : ''}`}>
                          <span className="ar-presence-nr">
                            {String(u?.warNumber || '?').padStart(2, '0')}
                          </span>
                          <span className="ar-presence-name">{u?.warName || '?'}</span>
                          <span className="ar-presence-status">
                            {s.presente === true
                              ? s.atrasado
                                ? <Chip color="yellow">⏱{s.horarioChegada ? ` ${s.horarioChegada}` : ''}</Chip>
                                : <Chip color="green">✔</Chip>
                              : s.presente === false
                              ? <Chip color="red">✘</Chip>
                              : <Chip>—</Chip>}
                          </span>
                          {s.observacao && (
                            <span title={s.observacao} style={{ color: '#60a5fa', fontSize: '.75rem', cursor: 'help' }}>💬</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {c.observacaoGeral && (
                    <div className="ar-obs-geral">💬 <em>{c.observacaoGeral}</em></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'militares',  label: '👥 Militares',       comp: TabMilitares  },
  { id: 'relatorio',  label: '📊 Relatório Geral',  comp: TabRelatorio  },
  { id: 'chamadas',   label: '📋 Chamadas',          comp: TabChamadas   },
];

export default function AdminRelatoriosPage() {
  const [tab, setTab] = useState('militares');
  const ActiveComp = TABS.find(t => t.id === tab)?.comp || TabMilitares;

  return (
    <div className="ar-page">
      {/* Cabeçalho */}
      <div className="ar-page-header">
        <div className="ar-page-icon">🎖️</div>
        <div>
          <h1 className="ar-page-title">Central de Relatórios</h1>
          <p className="ar-page-sub">Gerenciamento de efetivo, permissões e histórico de chamadas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="ar-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ar-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <ActiveComp />
    </div>
  );
}
