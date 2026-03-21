/**
 * AdminUsuariosPage.js  —  /admin/usuarios
 *
 * Gerenciamento completo do efetivo:
 *  • Listar militares com status de cada acesso
 *  • Criar / Editar / Excluir militar
 *  • Toggles de permissão visíveis no modal:
 *      ✔ Acesso ao Sistema de Chamada (hasChamadaAccess)
 *      ✔ Acesso ao Painel de Relatórios (hasRelatorioAccess)
 *
 * API utilizada (server/routes/permissoes.js):
 *   GET    /api/permissoes
 *   POST   /api/permissoes/usuario
 *   PUT    /api/permissoes/usuario/:id
 *   DELETE /api/permissoes/usuario/:id
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminRelatorios.css';

// ─── Postos / Graduações ──────────────────────────────────────────────────────
const RANKS = [
  'Cel','TC','Maj','Cap','1º Ten','2º Ten','Asp',
  'ST','1º Sgt','2º Sgt','3º Sgt','Cb','Sd 1ª Cl','Sd 2ª Cl','Sd EP',
];

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ children, color = 'gray' }) {
  const map = {
    green:  { bg: '#062e16', fg: '#3dba6a', border: '#1c6630' },
    red:    { bg: '#2a0d0a', fg: '#d94f3d', border: '#6b2820' },
    yellow: { bg: '#2a1603', fg: '#e8a420', border: '#6b4010' },
    blue:   { bg: '#0c1a3a', fg: '#4a90d4', border: '#1e3a5f' },
    purple: { bg: '#1e0e3a', fg: '#8a5fd4', border: '#4a2a8a' },
    gold:   { bg: '#1a1004', fg: '#c9a227', border: '#7a6118' },
    gray:   { bg: '#0f1a0d', fg: '#6a8a60', border: '#2d4a22' },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 2,
      fontSize: '.66rem', fontWeight: 800,
      background: c.bg, color: c.fg,
      border: `1px solid ${c.border}`,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// ─── Toggle Switch com label visível ─────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 54,
        height: 28,
        borderRadius: 28,
        border: `2px solid ${disabled ? '#3d6030' : checked ? '#3dba6a' : '#2d4a22'}`,
        background: disabled
          ? '#1e3a5f'
          : checked
          ? 'linear-gradient(135deg, #0a2a12, #1c6630)'
          : '#0f1a0d',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .2s',
        flexShrink: 0,
        boxShadow: checked && !disabled ? '0 0 10px rgba(61,186,106,0.35)' : 'none',
        outline: 'none',
        padding: 0,
      }}
      title={disabled ? 'Administradores têm acesso total' : checked ? 'Clique para revogar' : 'Clique para liberar'}
    >
      <span style={{
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: disabled ? '#4a90d4' : checked ? '#3dba6a' : '#6a8a60',
        boxShadow: checked && !disabled ? '0 0 8px rgba(61,186,106,0.6)' : '0 1px 4px rgba(0,0,0,0.5)',
        transform: `translateX(${checked || disabled ? 24 : 2}px)`,
        transition: 'transform .2s, background .2s',
      }} />
    </button>
  );
}

// ─── Bloco de permissão ───────────────────────────────────────────────────────
function PermissionBlock({ icon, title, description, checked, onChange, disabled, color }) {
  const activeColor = color === 'yellow'
    ? { border: '#6b4010', bg: 'rgba(232,164,32,0.06)', glow: 'rgba(232,164,32,0.15)' }
    : { border: '#1c6630', bg: 'rgba(61,186,106,0.06)', glow: 'rgba(61,186,106,0.15)' };

  const isOn = disabled || checked;

  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        background: isOn ? activeColor.bg : 'var(--ar-surf2)',
        border: `1px solid ${isOn ? activeColor.border : 'var(--ar-bord)'}`,
        borderLeft: `4px solid ${isOn ? (disabled ? '#4a90d4' : (color==='yellow'?'#e8a420':'#3dba6a')) : 'var(--ar-bord)'}`,
        borderRadius: 'var(--ar-radius)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all .18s',
        userSelect: 'none',
        boxShadow: isOn && !disabled ? `inset 0 0 20px ${activeColor.glow}` : 'none',
      }}
    >
      {/* Ícone */}
      <span style={{ fontSize: '1.6rem', flexShrink: 0, lineHeight: 1 }}>{icon}</span>

      {/* Texto */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 800, fontSize: '.92rem',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          color: isOn ? 'var(--ar-text)' : 'var(--ar-text2)',
          marginBottom: 3,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: '.7rem',
          color: 'var(--ar-muted)', lineHeight: 1.5,
        }}>
          {description}
        </div>
        {disabled && (
          <div style={{
            fontFamily: 'monospace', fontSize: '.65rem',
            color: '#4a90d4', marginTop: 4, letterSpacing: '0.04em',
          }}>
            ✔ Admin — acesso total automático
          </div>
        )}
      </div>

      {/* Status text + toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{
          fontFamily: 'monospace', fontSize: '.62rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: isOn
            ? (disabled ? '#4a90d4' : color==='yellow' ? '#e8a420' : '#3dba6a')
            : '#6a8a60',
        }}>
          {isOn ? (disabled ? 'ADMIN' : 'LIBERADO') : 'BLOQUEADO'}
        </span>
        <ToggleSwitch
          checked={isOn}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

// ─── Modal Criar / Editar Militar ─────────────────────────────────────────────
function SoldierModal({ user, onSave, onDelete, onClose }) {
  const isEdit = !!user;

  const [form, setForm] = useState({
    warName:            user?.warName            || '',
    warNumber:          user?.warNumber          || '',
    rank:               user?.rank               || '',
    role:               user?.role               || 'user',
    hasChamadaAccess:   user?.hasChamadaAccess   ?? false,
    hasRelatorioAccess: user?.hasRelatorioAccess ?? false,
    password:           '',
    confirmPassword:    '',
  });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isAdmin = form.role === 'admin';

  const handleSave = async () => {
    if (!form.warName.trim())       { toast.error('Nome de guerra obrigatório.'); return; }
    if (!form.warNumber)            { toast.error('Número de guerra obrigatório.'); return; }
    if (!form.rank)                 { toast.error('Selecione o posto/graduação.'); return; }
    if (!isEdit && !form.password)  { toast.error('Senha obrigatória para novo militar.'); return; }
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('As senhas não conferem.'); return;
    }

    setSaving(true);
    try {
      const payload = {
        warName:            form.warName.trim().toUpperCase(),
        warNumber:          Number(form.warNumber),
        rank:               form.rank,
        role:               form.role,
        hasChamadaAccess:   isAdmin ? true : form.hasChamadaAccess,
        hasRelatorioAccess: isAdmin ? true : form.hasRelatorioAccess,
      };
      if (form.password) payload.password = form.password;

      if (isEdit) {
        await api.put(`/permissoes/usuario/${user._id}`, payload);
        toast.success(`${payload.warName} atualizado!`);
      } else {
        await api.post('/permissoes/usuario', payload);
        toast.success(`${payload.warName} criado!`);
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar. Verifique os dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(
      `⚠️  Confirma a exclusão de ${user.warName}?\n\nEsta ação remove permanentemente o militar e todos os seus dados.`
    )) return;
    setDeleting(true);
    try {
      await api.delete(`/permissoes/usuario/${user._id}`);
      toast.success(`${user.warName} removido do sistema.`);
      onDelete();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao remover militar.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="ar-modal-overlay" onClick={onClose}>
      <div className="ar-modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="ar-modal-header">
          <div>
            <div className="ar-modal-title">
              <span>{isEdit ? '✏️' : '➕'}</span>
              {isEdit ? 'Editar Militar' : 'Novo Militar'}
            </div>
            {isEdit && (
              <div className="ar-modal-subtitle">
                Nr. {user.warNumber} · {user.rank} {user.warName}
              </div>
            )}
          </div>
          <button className="ar-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="ar-modal-body">

          {/* IDENTIFICAÇÃO */}
          <div className="ar-section-label">Identificação</div>

          <div className="ar-form-row">
            <div className="ar-form-group">
              <label className="ar-label">Nr. de Guerra *</label>
              <input
                className="ar-field"
                type="number" min="1"
                placeholder="Ex: 42"
                value={form.warNumber}
                onChange={e => set('warNumber', e.target.value)}
              />
            </div>
            <div className="ar-form-group">
              <label className="ar-label">Posto / Graduação *</label>
              <select
                className="ar-field ar-field-select"
                value={form.rank}
                onChange={e => set('rank', e.target.value)}
              >
                <option value="">— Selecionar —</option>
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="ar-form-group">
            <label className="ar-label">Nome de Guerra *</label>
            <input
              className="ar-field"
              placeholder="Ex: SILVA"
              value={form.warName}
              onChange={e => set('warName', e.target.value.toUpperCase())}
            />
          </div>

          <div className="ar-form-group">
            <label className="ar-label">Nível de Acesso</label>
            <select
              className="ar-field ar-field-select"
              value={form.role}
              onChange={e => set('role', e.target.value)}
            >
              <option value="user">Usuário Padrão</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* PERMISSÕES — destaque visual */}
          <div className="ar-section-label" style={{ marginTop: 6 }}>
            Permissões de Acesso ao Sistema
          </div>

          <PermissionBlock
            icon="📋"
            title="Sistema de Chamada"
            description="Marcar presença diária · Registrar auditoria de fardamento e TFM"
            checked={form.hasChamadaAccess}
            disabled={isAdmin}
            color="green"
            onChange={v => set('hasChamadaAccess', v)}
          />

          <PermissionBlock
            icon="📊"
            title="Painel de Relatórios"
            description="Visualizar chamadas enviadas · Histórico do efetivo · Relatórios gerais"
            checked={form.hasRelatorioAccess}
            disabled={isAdmin}
            color="yellow"
            onChange={v => set('hasRelatorioAccess', v)}
          />

          {/* SENHA */}
          <div className="ar-section-label" style={{ marginTop: 6 }}>
            {isEdit ? 'Alterar Senha (deixe em branco para manter)' : 'Credenciais de Acesso'}
          </div>

          <div className="ar-form-row">
            <div className="ar-form-group">
              <label className="ar-label">{isEdit ? 'Nova Senha' : 'Senha *'}</label>
              <input
                className="ar-field"
                type="password"
                placeholder={isEdit ? 'Em branco = sem alteração' : 'Mínimo 6 caracteres'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
            </div>
            <div className="ar-form-group">
              <label className="ar-label">Confirmar Senha</label>
              <input
                className="ar-field"
                type="password"
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="ar-modal-footer">
          {isEdit && (
            <button
              className="ar-btn-danger"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? '⏳ Excluindo...' : '🗑 Excluir Militar'}
            </button>
          )}
          <button className="ar-btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="ar-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '⏳ Salvando...' : isEdit ? '💾 Salvar Alterações' : '➕ Criar Militar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AdminUsuariosPage() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterAccess, setFilterAccess] = useState('all');
  const [editing,      setEditing]      = useState(null); // user obj | 'new' | null

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/permissoes');
      setUsers(res.data);
    } catch { toast.error('Erro ao carregar efetivo.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtros ──
  const filtered = users.filter(u => {
    const matchSearch =
      !search ||
      u.warName?.toLowerCase().includes(search.toLowerCase()) ||
      String(u.warNumber || '').includes(search) ||
      u.rank?.toLowerCase().includes(search.toLowerCase());

    const hasCh  = u.role === 'admin' || u.hasChamadaAccess;
    const hasRel = u.role === 'admin' || u.hasRelatorioAccess;
    const matchAccess =
      filterAccess === 'chamada'   ? hasCh  :
      filterAccess === 'relatorio' ? hasRel :
      filterAccess === 'sem'       ? (u.role !== 'admin' && !u.hasChamadaAccess && !u.hasRelatorioAccess) :
      true;

    return matchSearch && matchAccess;
  });

  const stats = {
    total:     users.length,
    chamada:   users.filter(u => u.role === 'admin' || u.hasChamadaAccess).length,
    relatorio: users.filter(u => u.role === 'admin' || u.hasRelatorioAccess).length,
    admins:    users.filter(u => u.role === 'admin').length,
  };

  const handleSaved   = () => { setEditing(null); load(); };
  const handleDeleted = () => { setEditing(null); load(); };

  return (
    <div className="ar-page">

      {/* ── Cabeçalho ── */}
      <div className="ar-page-header">
        <div className="ar-page-icon">👤</div>
        <div>
          <h1 className="ar-page-title">Gestão de Usuários</h1>
          <p className="ar-page-sub">SIM · Efetivo · Permissões de Acesso ao Sistema</p>
        </div>
      </div>

      {/* ── Cards resumo ── */}
      <div className="ar-summary-row" style={{ marginBottom: 20 }}>
        <div className="ar-summary-card ar-card--blue">
          <span className="ar-scard-num">{stats.total}</span>
          <span className="ar-scard-lbl">Total Efetivo</span>
        </div>
        <div className="ar-summary-card ar-card--green">
          <span className="ar-scard-num">{stats.chamada}</span>
          <span className="ar-scard-lbl">Acesso Chamada</span>
        </div>
        <div className="ar-summary-card ar-card--yellow">
          <span className="ar-scard-num">{stats.relatorio}</span>
          <span className="ar-scard-lbl">Acesso Relatório</span>
        </div>
        <div className="ar-summary-card ar-card--gold">
          <span className="ar-scard-num">{stats.admins}</span>
          <span className="ar-scard-lbl">Admins</span>
        </div>
      </div>

      {/* ── Filtros e botão novo ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <input
          className="ch-input"
          style={{ flex: 1, minWidth: 200 }}
          placeholder="🔍  Buscar por nome, número ou posto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="ar-field ar-field-select"
          style={{ maxWidth: 220, padding: '9px 34px 9px 12px', flexShrink: 0 }}
          value={filterAccess}
          onChange={e => setFilterAccess(e.target.value)}
        >
          <option value="all">🗂 Todos os militares</option>
          <option value="chamada">📋 Com acesso chamada</option>
          <option value="relatorio">📊 Com acesso relatório</option>
          <option value="sem">🚫 Sem acesso ao sistema</option>
        </select>
        <button
          className="ar-btn-new-soldier"
          onClick={() => setEditing('new')}
        >
          ➕ Novo Militar
        </button>
      </div>

      {/* ── Lista ── */}
      {loading && (
        <div style={{
          textAlign: 'center', color: 'var(--ar-muted)',
          padding: '40px 20px', fontFamily: 'monospace', fontSize: '.85rem',
        }}>
          ⏳ Carregando efetivo...
        </div>
      )}

      <div className="ar-soldiers-list">
        {filtered.map(u => {
          const hasCh  = u.role === 'admin' || u.hasChamadaAccess;
          const hasRel = u.role === 'admin' || u.hasRelatorioAccess;

          return (
            <div
              key={u._id}
              className="ar-soldier-row"
              style={{
                borderLeftColor:
                  u.role === 'admin' ? '#8a5fd4' :
                  (hasCh && hasRel)  ? '#3dba6a' :
                  (hasCh || hasRel)  ? '#e8a420' :
                  '#2d4a22',
              }}
            >
              {/* Número */}
              <span className="ar-row-nr">
                {String(u.warNumber || '?').padStart(2, '0')}
              </span>

              {/* Info */}
              <div className="ar-row-info">
                <div className="ar-row-name">
                  {u.warName}
                  {u.role === 'admin' && <Chip color="purple">ADMIN</Chip>}
                </div>
                <div className="ar-row-rank">{u.rank}</div>
              </div>

              {/* Chips de permissão */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                {/* Chamada */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: '.6rem',
                    color: 'var(--ar-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    📋 Chamada
                  </span>
                  {hasCh
                    ? <Chip color={u.role==='admin' ? 'purple' : 'green'}>
                        {u.role==='admin' ? '✔ Admin' : '✔ Liberado'}
                      </Chip>
                    : <Chip color="gray">✘ Bloqueado</Chip>}
                </div>
                {/* Relatório */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: '.6rem',
                    color: 'var(--ar-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    📊 Relatório
                  </span>
                  {hasRel
                    ? <Chip color={u.role==='admin' ? 'purple' : 'yellow'}>
                        {u.role==='admin' ? '✔ Admin' : '✔ Liberado'}
                      </Chip>
                    : <Chip color="gray">✘ Bloqueado</Chip>}
                </div>
              </div>

              {/* Botão editar */}
              <div className="ar-row-actions">
                <button
                  className="ar-btn-edit-soldier"
                  onClick={() => setEditing(u)}
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="ar-empty">
            {search || filterAccess !== 'all'
              ? 'Nenhum militar encontrado com os filtros aplicados.'
              : 'Nenhum militar cadastrado. Clique em ➕ Novo Militar para começar.'}
          </div>
        )}
      </div>

      {/* Rodapé com total */}
      {!loading && users.length > 0 && (
        <div style={{
          textAlign: 'center', marginTop: 16,
          fontFamily: 'monospace', fontSize: '.72rem', color: 'var(--ar-muted)',
        }}>
          Exibindo {filtered.length} de {users.length} militares
        </div>
      )}

      {/* Modal criar / editar */}
      {editing && (
        <SoldierModal
          user={editing === 'new' ? null : editing}
          onSave={handleSaved}
          onDelete={handleDeleted}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
