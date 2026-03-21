import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminPages.css';
import './AdminSchedule.css';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const DIAS_SEMANA_ABREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const DEFAULT_DUTIES = [
  { id: 'd1', name: 'Sgt do Dia',         abbreviation: 'SGT DIA', order: 0 },
  { id: 'd2', name: 'Cb Gda',             abbreviation: 'CB GDA',  order: 1 },
  { id: 'd3', name: 'Cb do Dia',          abbreviation: 'CB DIA',  order: 2 },
  { id: 'd4', name: 'Cb Hipismo',         abbreviation: 'CB HIP',  order: 3 },
  { id: 'd5', name: 'Plantão',            abbreviation: 'PLANT.',  order: 4 },
  { id: 'd6', name: 'Esf. Vet.',          abbreviation: 'ESF VET', order: 5 },
  { id: 'd7', name: 'Perm. Equoterapia',  abbreviation: 'EQT.',    order: 6 },
  { id: 'd8', name: 'Partão B',           abbreviation: 'PT B',    order: 7 },
  { id: 'd9', name: 'Pelotão de Higiene', abbreviation: 'PL HIG',  order: 8 },
];

// Estes são os status padrão do sistema (sempre presentes, não podem ser deletados)
const BUILT_IN_STATUS_KEYS = [
  'ativo','baixado','folga','ferias','hospitalar','desertor','luto','ausente','missao',
];

const DEFAULT_STATUS_COLORS = {
  ativo:      { label: 'Ativo / Serviço',       bgColor: '#16a34a', textColor: '#ffffff', builtIn: true },
  baixado:    { label: 'Baixado',               bgColor: '#dc2626', textColor: '#ffffff', builtIn: true },
  folga:      { label: 'Folga / Dispensa',      bgColor: '#d97706', textColor: '#ffffff', builtIn: true },
  ferias:     { label: 'Férias',                bgColor: '#2563eb', textColor: '#ffffff', builtIn: true },
  hospitalar: { label: 'Internação Hospitalar', bgColor: '#db2777', textColor: '#ffffff', builtIn: true },
  desertor:   { label: 'Desertor',              bgColor: '#1f2937', textColor: '#ffffff', builtIn: true },
  luto:       { label: 'Luto',                  bgColor: '#6b7280', textColor: '#ffffff', builtIn: true },
  ausente:    { label: 'Ausente s/ justif.',    bgColor: '#ea580c', textColor: '#ffffff', builtIn: true },
  missao:     { label: 'Missão Especial',       bgColor: '#7c3aed', textColor: '#ffffff', builtIn: true },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(month, year) { return new Date(year, month, 0).getDate(); }
function getDayOfWeek(d, m, y)   { return new Date(y, m - 1, d).getDay(); }
function makeCellKey(day, dutyId){ return `${day}-${dutyId}`; }
function genId() { return 'sc_' + Math.random().toString(36).slice(2, 9); }

// Normaliza o objeto statusColors vindo da API (pode ser Map serializado)
function normalizeStatusColors(raw) {
  if (!raw) return { ...DEFAULT_STATUS_COLORS };
  const entries = raw instanceof Map
    ? Array.from(raw.entries())
    : Object.entries(raw);
  const merged = { ...DEFAULT_STATUS_COLORS };
  entries.forEach(([k, v]) => {
    merged[k] = { ...v };
    if (BUILT_IN_STATUS_KEYS.includes(k)) merged[k].builtIn = true;
  });
  return merged;
}

// ─── Componente: Chip de status ───────────────────────────────────────────────

function StatusChip({ statusKey, statusColors, active, onClick, size = 'md' }) {
  const c = statusColors[statusKey] || DEFAULT_STATUS_COLORS[statusKey] || { bgColor: '#374151', textColor: '#fff', label: statusKey };
  return (
    <button
      className={`sc-status-btn sc-status-btn--${size} ${active ? 'active' : ''}`}
      style={{ '--sc-bg': c.bgColor, '--sc-text': c.textColor }}
      onClick={onClick}
      title={c.label}
    >
      {c.label}
    </button>
  );
}

// ─── Modal: Editar Célula Individual ─────────────────────────────────────────

function CellEditModal({ cell, duty, day, month, year, users, statusColors, onSave, onClear, onClose }) {
  const [userId,      setUserId]      = useState(cell?.user?._id || cell?.user || '');
  const [status,      setStatus]      = useState(cell?.status   || 'ativo');
  const [reason,      setReason]      = useState(cell?.reason   || '');
  const [notes,       setNotes]       = useState(cell?.notes    || '');
  const [customColor, setCustomColor] = useState(cell?.customColor || '');
  const [search,      setSearch]      = useState('');

  const dateLabel = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
  const weekDay   = DIAS_SEMANA_ABREV[getDayOfWeek(day, month, year)];
  const filtered  = users.filter(u =>
    !search ||
    u.warName?.toLowerCase().includes(search.toLowerCase()) ||
    u.warNumber?.toString().includes(search) ||
    u.rank?.toLowerCase().includes(search.toLowerCase())
  );

  const allStatuses = Object.entries(statusColors);

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal" onClick={e => e.stopPropagation()}>
        <div className="sc-modal-header">
          <div>
            <div className="sc-modal-title">✏️ Editar Célula</div>
            <div className="sc-modal-subtitle">{duty?.name} — {weekDay} {dateLabel}</div>
          </div>
          <button className="sc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sc-modal-body">
          <label className="sc-label">Soldado</label>
          <input className="sc-input" placeholder="Buscar por nome, Nr. ou posto..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="sc-soldier-list">
            <div className={`sc-soldier-item ${!userId ? 'selected' : ''}`} onClick={() => setUserId('')}>
              <span className="sc-badge-empty">–</span><span>Nenhum (vazio)</span>
            </div>
            {filtered.map(u => (
              <div key={u._id} className={`sc-soldier-item ${userId === u._id ? 'selected' : ''}`}
                onClick={() => setUserId(u._id)}>
                <span className="sc-badge-rank">{u.rank?.slice(0,3)}</span>
                <span className="sc-soldier-name">{u.warName}</span>
                <span className="sc-soldier-nr">Nr {u.warNumber}</span>
              </div>
            ))}
          </div>

          <label className="sc-label">Status</label>
          <div className="sc-status-grid">
            {allStatuses.map(([key, val]) => (
              <StatusChip key={key} statusKey={key} statusColors={statusColors}
                active={status === key} onClick={() => setStatus(key)} size="sm" />
            ))}
          </div>

          {status !== 'ativo' && (
            <>
              <label className="sc-label">Motivo / Diagnóstico</label>
              <input className="sc-input"
                placeholder="Ex: Dengue hemorrágica, Licença maternidade, Deserção..."
                value={reason} onChange={e => setReason(e.target.value)} />
            </>
          )}

          <label className="sc-label">Observações</label>
          <input className="sc-input" placeholder="Obs. adicionais..."
            value={notes} onChange={e => setNotes(e.target.value)} />

          <label className="sc-label">Cor personalizada (opcional)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={customColor || statusColors[status]?.bgColor || '#22c55e'}
              onChange={e => setCustomColor(e.target.value)}
              style={{ width: 40, height: 36, padding: 2, borderRadius: 4, border: '1px solid #374151', cursor: 'pointer' }} />
            {customColor && <button className="sc-btn-ghost" onClick={() => setCustomColor('')}>Usar padrão do status</button>}
          </div>
        </div>

        <div className="sc-modal-footer">
          {cell && <button className="sc-btn-danger" onClick={() => onClear(day, duty.id)}>🗑 Limpar</button>}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button className="sc-btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="sc-btn-primary"
              onClick={() => onSave({ day, dutyId: duty.id, user: userId||null, status, reason, notes, customColor, manualOverride: true })}>
              ✔ Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Aplicação em Lote (NOVO) ─────────────────────────────────────────

function RangeApplyModal({ totalDays, month, year, users, duties, cells, statusColors, onApply, onClose }) {
  const [soldierIds,  setSoldierIds]  = useState([]);
  const [dayFrom,     setDayFrom]     = useState(1);
  const [dayTo,       setDayTo]       = useState(Math.min(8, totalDays));
  const [status,      setStatus]      = useState('baixado');
  const [reason,      setReason]      = useState('');
  const [notes,       setNotes]       = useState('');
  const [customColor, setCustomColor] = useState('');
  const [targetDuties,setTargetDuties]= useState('assigned'); // 'assigned' | 'all' | string[] (specific ids)
  const [dutyScope,   setDutyScope]   = useState('assigned');
  const [search,      setSearch]      = useState('');

  const allStatuses = Object.entries(statusColors);

  const toggleSoldier = (id) =>
    setSoldierIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filteredUsers = users.filter(u =>
    !search ||
    u.warName?.toLowerCase().includes(search.toLowerCase()) ||
    u.warNumber?.toString().includes(search) ||
    u.rank?.toLowerCase().includes(search.toLowerCase())
  );

  // Preview: count cells that will be affected
  const preview = (() => {
    if (!soldierIds.length) return { count: 0, days: 0 };
    const days = Math.max(0, dayTo - dayFrom + 1);
    let count = 0;
    for (let d = dayFrom; d <= dayTo; d++) {
      duties.forEach(duty => {
        const cell = cells[makeCellKey(d, duty.id)];
        const cellUser = cell?.user?._id || cell?.user;
        if (dutyScope === 'all') {
          if (soldierIds.length === 0 || soldierIds.includes(cellUser) || !cell) count++;
        } else {
          // assigned: only cells where the soldier is already assigned
          if (cell && soldierIds.includes(cellUser)) count++;
        }
      });
    }
    return { count, days };
  })();

  const handleApply = () => {
    if (!soldierIds.length) { toast.error('Selecione ao menos 1 soldado'); return; }
    if (dayFrom > dayTo)    { toast.error('Dia inicial deve ser ≤ dia final'); return; }

    const updates = [];
    for (let d = dayFrom; d <= dayTo; d++) {
      duties.forEach(duty => {
        const key = makeCellKey(d, duty.id);
        const cell = cells[key];
        const cellUser = cell?.user?._id || cell?.user;
        const shouldUpdate = dutyScope === 'all'
          ? soldierIds.includes(cellUser)           // anywhere in range where soldier is assigned
          : (cell && soldierIds.includes(cellUser)); // only existing cells

        if (shouldUpdate) {
          updates.push({
            day: d,
            dutyId: duty.id,
            user: cellUser,
            status,
            reason,
            notes,
            customColor,
            manualOverride: true,
          });
        }
      });
    }

    onApply(updates, { dayFrom, dayTo, status, reason, soldierCount: soldierIds.length });
  };

  const sc = statusColors[status] || {};

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal sc-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="sc-modal-header">
          <div>
            <div className="sc-modal-title">⚡ Aplicação em Lote</div>
            <div className="sc-modal-subtitle">Aplique status para múltiplos dias de uma vez</div>
          </div>
          <button className="sc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sc-modal-body">

          {/* STEP 1: Soldado(s) */}
          <div className="sc-range-step">
            <div className="sc-range-step-label">
              <span className="sc-range-step-num">1</span>
              Selecionar soldado(s)
            </div>
            <input className="sc-input" placeholder="Buscar nome, Nr., posto..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="sc-soldier-list sc-soldier-list--compact">
              {filteredUsers.map(u => (
                <div key={u._id}
                  className={`sc-soldier-item ${soldierIds.includes(u._id) ? 'selected' : ''}`}
                  onClick={() => toggleSoldier(u._id)}>
                  <span className={`sc-check-box ${soldierIds.includes(u._id) ? 'checked' : ''}`}>
                    {soldierIds.includes(u._id) ? '✓' : ''}
                  </span>
                  <span className="sc-badge-rank">{u.rank?.slice(0,3)}</span>
                  <span className="sc-soldier-name">{u.warName}</span>
                  <span className="sc-soldier-nr">Nr {u.warNumber}</span>
                </div>
              ))}
            </div>
            {soldierIds.length > 0 && (
              <div className="sc-selected-hint">
                {soldierIds.length} soldado(s) selecionado(s)
                <button className="sc-link-btn" onClick={() => setSoldierIds([])}>limpar</button>
              </div>
            )}
          </div>

          {/* STEP 2: Período */}
          <div className="sc-range-step">
            <div className="sc-range-step-label">
              <span className="sc-range-step-num">2</span>
              Período
            </div>
            <div className="sc-range-period">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="sc-label">Dia inicial</label>
                <input type="number" min={1} max={totalDays} value={dayFrom}
                  onChange={e => setDayFrom(Math.min(totalDays, Math.max(1, +e.target.value || 1)))}
                  className="sc-input sc-input-day" />
              </div>
              <div className="sc-range-arrow">→</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="sc-label">Dia final</label>
                <input type="number" min={1} max={totalDays} value={dayTo}
                  onChange={e => setDayTo(Math.min(totalDays, Math.max(1, +e.target.value || 1)))}
                  className="sc-input sc-input-day" />
              </div>
              <div className="sc-range-info">
                <span>{Math.max(0, dayTo - dayFrom + 1)} dia(s)</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>
                  {MESES[month-1].slice(0,3)}/{year}
                </span>
              </div>
            </div>

            {/* Day range quick-select buttons */}
            <div className="sc-range-quick">
              {[[1,7,'1ª Sem.'],[8,14,'2ª Sem.'],[15,21,'3ª Sem.'],[22,totalDays,'4ª Sem.'],
                [1,totalDays,'Mês todo']].map(([f,t,label]) => (
                <button key={label} className={`sc-quick-btn ${dayFrom===f&&dayTo===t?'active':''}`}
                  onClick={() => { setDayFrom(f); setDayTo(Math.min(t, totalDays)); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: Escopo de funções */}
          <div className="sc-range-step">
            <div className="sc-range-step-label">
              <span className="sc-range-step-num">3</span>
              Aplicar onde?
            </div>
            <div className="sc-scope-options">
              <label className={`sc-scope-option ${dutyScope==='assigned'?'active':''}`}>
                <input type="radio" value="assigned" checked={dutyScope==='assigned'}
                  onChange={() => setDutyScope('assigned')} />
                <div>
                  <strong>Somente onde está escalado</strong>
                  <span>Atualiza células onde o soldado já está atribuído</span>
                </div>
              </label>
              <label className={`sc-scope-option ${dutyScope==='all'?'active':''}`}>
                <input type="radio" value="all" checked={dutyScope==='all'}
                  onChange={() => setDutyScope('all')} />
                <div>
                  <strong>Todos os dias do período</strong>
                  <span>Marca todos os dias independente da função</span>
                </div>
              </label>
            </div>
          </div>

          {/* STEP 4: Status */}
          <div className="sc-range-step">
            <div className="sc-range-step-label">
              <span className="sc-range-step-num">4</span>
              Status a aplicar
            </div>
            <div className="sc-status-grid sc-status-grid--wrap">
              {allStatuses.map(([key]) => (
                <StatusChip key={key} statusKey={key} statusColors={statusColors}
                  active={status === key} onClick={() => setStatus(key)} size="sm" />
              ))}
            </div>

            {status !== 'ativo' && (
              <>
                <label className="sc-label" style={{ marginTop: 12 }}>Motivo / Diagnóstico</label>
                <input className="sc-input"
                  placeholder="Ex: Dengue hemorrágica, Licença maternidade, Fratura no joelho..."
                  value={reason} onChange={e => setReason(e.target.value)} />
                <div className="sc-reason-suggestions">
                  {['Dengue hemorrágica','Licença maternidade','Licença paternidade',
                    'Cirurgia programada','Fratura óssea','Covid-19','Luto por familiar',
                    'Missão Operacional','Curso EsFCEx','Férias regulamentares',
                  ].map(r => (
                    <button key={r} className={`sc-tag ${reason===r?'active':''}`}
                      onClick={() => setReason(r)}>{r}</button>
                  ))}
                </div>
              </>
            )}

            <label className="sc-label" style={{ marginTop: 12 }}>Observações</label>
            <input className="sc-input" placeholder="Obs. adicionais..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {/* Preview banner */}
          <div className={`sc-range-preview ${preview.count > 0 ? 'has-data' : ''}`}
            style={{ '--preview-bg': sc.bgColor || '#374151', '--preview-text': sc.textColor || '#fff' }}>
            <div className="sc-range-preview-icon">⚡</div>
            <div>
              <div className="sc-range-preview-title">
                {preview.count > 0
                  ? `${preview.count} célula(s) serão atualizadas`
                  : 'Nenhuma célula encontrada com os filtros selecionados'}
              </div>
              {preview.count > 0 && (
                <div className="sc-range-preview-detail">
                  {soldierIds.length} soldado(s) · dias {dayFrom}–{dayTo} ·&nbsp;
                  <span style={{ fontWeight: 700, color: sc.bgColor }}>
                    {statusColors[status]?.label || status}
                  </span>
                  {reason && ` — "${reason}"`}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sc-modal-footer">
          <button className="sc-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="sc-btn-primary" onClick={handleApply} disabled={!soldierIds.length}>
            ⚡ Aplicar {preview.count > 0 ? `(${preview.count} células)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Configurações (com gestão completa de status) ────────────────────

function ConfigModal({ duties, statusColors, onSave, onClose }) {
  const [localDuties,  setLocalDuties]  = useState(JSON.parse(JSON.stringify(duties)));
  const [localColors,  setLocalColors]  = useState(JSON.parse(JSON.stringify(statusColors)));
  const [tab,          setTab]          = useState('status');
  const [editingKey,   setEditingKey]   = useState(null); // key being renamed inline

  // ── Status management ──────────────────────────────────────────────────────

  const addStatus = () => {
    const key = genId();
    setLocalColors(prev => ({
      ...prev,
      [key]: { label: 'Novo Status', bgColor: '#374151', textColor: '#ffffff', builtIn: false },
    }));
    setEditingKey(key);
  };

  const removeStatus = (key) => {
    if (BUILT_IN_STATUS_KEYS.includes(key)) return; // proteção
    setLocalColors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const updateStatus = (key, field, val) =>
    setLocalColors(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));

  // ── Duty management ────────────────────────────────────────────────────────

  const addDuty = () =>
    setLocalDuties(prev => [...prev, { id: genId(), name: '', abbreviation: '', order: prev.length }]);

  const removeDuty = (id) => setLocalDuties(prev => prev.filter(d => d.id !== id));

  const updateDuty = (id, field, val) =>
    setLocalDuties(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal sc-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="sc-modal-header">
          <div className="sc-modal-title">⚙️ Configurações da Escala</div>
          <button className="sc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sc-config-tabs">
          <button className={tab === 'status' ? 'active' : ''} onClick={() => setTab('status')}>
            🎨 Status & Cores
          </button>
          <button className={tab === 'duties' ? 'active' : ''} onClick={() => setTab('duties')}>
            📋 Funções / Postos
          </button>
        </div>

        <div className="sc-modal-body">

          {/* ── Tab: Status ── */}
          {tab === 'status' && (
            <div>
              <p className="sc-help-text">
                Renomeie, mude cores ou crie novos status. Tudo fica salvo no banco de dados.
                Os status em cinza escuro são padrão do sistema (não podem ser removidos, mas podem ser renomeados).
              </p>

              {Object.entries(localColors).map(([key, val]) => {
                const isBuiltIn = BUILT_IN_STATUS_KEYS.includes(key);
                return (
                  <div key={key} className="sc-status-edit-row">
                    {/* Color swatch preview */}
                    <div className="sc-status-swatch" style={{ background: val.bgColor, color: val.textColor }}>
                      {val.label || key}
                    </div>

                    {/* Label input */}
                    <input
                      className={`sc-input sc-input-flex ${editingKey === key ? 'sc-input-focus' : ''}`}
                      value={val.label || ''}
                      placeholder="Nome do status..."
                      onChange={e => updateStatus(key, 'label', e.target.value)}
                      onFocus={() => setEditingKey(key)}
                      onBlur={() => setEditingKey(null)}
                    />

                    {/* Color pickers */}
                    <div className="sc-color-pickers">
                      <div className="sc-color-picker-group">
                        <span className="sc-color-picker-label">Fundo</span>
                        <input type="color" value={val.bgColor || '#374151'}
                          onChange={e => updateStatus(key, 'bgColor', e.target.value)}
                          className="sc-color-input" />
                      </div>
                      <div className="sc-color-picker-group">
                        <span className="sc-color-picker-label">Texto</span>
                        <input type="color" value={val.textColor || '#ffffff'}
                          onChange={e => updateStatus(key, 'textColor', e.target.value)}
                          className="sc-color-input" />
                      </div>
                    </div>

                    {/* Delete (only for custom) */}
                    {!isBuiltIn
                      ? <button className="sc-btn-icon-danger" onClick={() => removeStatus(key)} title="Remover status">✕</button>
                      : <div className="sc-built-in-badge" title="Status padrão do sistema">🔒</div>
                    }
                  </div>
                );
              })}

              <button className="sc-btn-add" onClick={addStatus}>＋ Criar novo status personalizado</button>

              <div className="sc-config-note">
                💡 Dica: você pode criar status como "Licença Maternidade", "TDC", "Missão COTER", "COVID" etc.
                e eles ficam disponíveis para aplicar em lote ou célula a célula.
              </div>
            </div>
          )}

          {/* ── Tab: Funções ── */}
          {tab === 'duties' && (
            <div>
              <p className="sc-help-text">Defina as funções/postos que aparecem nas linhas da escala.</p>
              {localDuties.map((d, i) => (
                <div key={d.id} className="sc-duty-row">
                  <span className="sc-duty-num">{i + 1}</span>
                  <input className="sc-input sc-input-flex" placeholder="Nome da função"
                    value={d.name} onChange={e => updateDuty(d.id, 'name', e.target.value)} />
                  <input className="sc-input sc-input-abbrev" placeholder="Abrev."
                    value={d.abbreviation} onChange={e => updateDuty(d.id, 'abbreviation', e.target.value)} />
                  <button className="sc-btn-icon-danger" onClick={() => removeDuty(d.id)}>✕</button>
                </div>
              ))}
              <button className="sc-btn-add" onClick={addDuty}>＋ Adicionar Função</button>
            </div>
          )}
        </div>

        <div className="sc-modal-footer">
          <button className="sc-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="sc-btn-primary"
            onClick={() => onSave(localDuties.filter(d => d.name), localColors)}>
            💾 Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Ciclo ─────────────────────────────────────────────────────────────

function CycleModal({ cycleLength, cycleStartDay, duties, cycleTemplate, users, onApply, onClose }) {
  const [len,      setLen]      = useState(cycleLength   || 8);
  const [startDay, setStartDay] = useState(cycleStartDay || 1);
  const [template, setTemplate] = useState(() => {
    const map = {};
    (cycleTemplate || []).forEach(ct => {
      map[`${ct.dutyId}_${ct.cycleDay}`] = ct.user?._id || ct.user || '';
    });
    return map;
  });
  const [search, setSearch] = useState('');

  const setCell = (dutyId, cycleDay, userId) =>
    setTemplate(prev => ({ ...prev, [`${dutyId}_${cycleDay}`]: userId }));

  const handleApply = () => {
    const arr = [];
    Object.entries(template).forEach(([key, userId]) => {
      const parts = key.split('_');
      const cycleDay = parseInt(parts.pop());
      const dutyId   = parts.join('_');
      if (userId) arr.push({ dutyId, cycleDay, user: userId });
    });
    onApply(arr, len, startDay);
  };

  const filteredUsers = users.filter(u =>
    !search || u.warName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal sc-modal-xl" onClick={e => e.stopPropagation()}>
        <div className="sc-modal-header">
          <div>
            <div className="sc-modal-title">🔄 Configurar Ciclo de Escala</div>
            <div className="sc-modal-subtitle">Padrão de {len} dias — aplica ao mês inteiro automaticamente</div>
          </div>
          <button className="sc-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="sc-modal-body">
          <div className="sc-cycle-settings">
            <div className="sc-cycle-setting-item">
              <label className="sc-label">Duração do ciclo (dias)</label>
              <input type="number" min={1} max={31} value={len}
                onChange={e => setLen(Math.max(1,Math.min(31,parseInt(e.target.value)||8)))}
                className="sc-input sc-input-sm" />
            </div>
            <div className="sc-cycle-setting-item">
              <label className="sc-label">Dia inicial do ciclo</label>
              <input type="number" min={1} max={31} value={startDay}
                onChange={e => setStartDay(Math.max(1,Math.min(31,parseInt(e.target.value)||1)))}
                className="sc-input sc-input-sm" />
            </div>
            <div className="sc-cycle-setting-item">
              <label className="sc-label">Buscar soldado</label>
              <input className="sc-input sc-input-sm" placeholder="Nome..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="sc-cycle-help">
            <strong>Como funciona:</strong> Preencha quem faz cada função em cada dia do ciclo (D1 a D{len}).
            Ao aplicar, o mês inteiro será preenchido repetindo este padrão a partir do dia {startDay}.
            Célula preenchidas manualmente são preservadas.
          </div>
          <div className="sc-cycle-scroll">
            <table className="sc-cycle-table">
              <thead>
                <tr>
                  <th className="sc-cycle-th-duty">Função / Posto</th>
                  {Array.from({ length: len }, (_, i) => (
                    <th key={i+1} className="sc-cycle-th-day">D{i+1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {duties.map(duty => (
                  <tr key={duty.id}>
                    <td className="sc-cycle-td-duty">{duty.name}</td>
                    {Array.from({ length: len }, (_, i) => {
                      const cycleDay = i + 1;
                      const val = template[`${duty.id}_${cycleDay}`] || '';
                      return (
                        <td key={cycleDay} className="sc-cycle-td">
                          <select className="sc-cycle-select" value={val}
                            onChange={e => setCell(duty.id, cycleDay, e.target.value)}>
                            <option value="">—</option>
                            {filteredUsers.map(u => (
                              <option key={u._id} value={u._id}>{u.warName}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sc-modal-footer">
          <button className="sc-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="sc-btn-primary" onClick={handleApply}>✔ Aplicar Ciclo ao Mês</button>
        </div>
      </div>
    </div>
  );
}

// ─── Painel Baixados ──────────────────────────────────────────────────────────

function BaixadosPanel({ cells, duties, users, statusColors, onEditCell, month, year }) {
  const baixados = cells.filter(c => c.status && c.status !== 'ativo' && (c.user?._id || c.user));
  const grouped  = {};
  baixados.forEach(c => {
    const uid = c.user?._id || c.user;
    if (!uid) return;
    if (!grouped[uid]) grouped[uid] = { user: c.user, entries: [] };
    grouped[uid].entries.push(c);
  });

  if (!Object.keys(grouped).length) {
    return (
      <div className="sc-baixados-empty">
        <div style={{ fontSize: 40 }}>✅</div>
        <p>Nenhum militar baixado ou afastado em {MESES[month-1]}/{year}.</p>
      </div>
    );
  }

  return (
    <div className="sc-baixados-list">
      <div className="sc-section-title">
        Militares Baixados / Afastados — {MESES[month-1]}/{year}
        <span className="sc-badge-count">{Object.keys(grouped).length}</span>
      </div>
      {Object.values(grouped).map(({ user, entries }) => {
        const u = typeof user === 'object' ? user : users.find(x => x._id === user);
        const uniqueStatuses = [...new Set(entries.map(e => e.status))];
        const uniqueReasons  = [...new Set(entries.map(e => e.reason).filter(Boolean))];
        return (
          <div key={u?._id || user} className="sc-baixado-card">
            <div className="sc-baixado-card-header">
              <div className="sc-baixado-avatar">{u?.warName?.[0] || '?'}</div>
              <div>
                <div className="sc-baixado-name">{u?.rank} {u?.warName || 'Desconhecido'}</div>
                <div className="sc-baixado-nr">Nr {u?.warNumber} · {entries.length} dia(s)</div>
              </div>
              <div className="sc-baixado-statuses">
                {uniqueStatuses.map(s => {
                  const c = statusColors[s];
                  return (
                    <span key={s} className="sc-status-chip"
                      style={{ background: c?.bgColor, color: c?.textColor }}>
                      {c?.label || s}
                    </span>
                  );
                })}
              </div>
            </div>
            {uniqueReasons.length > 0 && (
              <div className="sc-baixado-reason">
                <strong>Motivo:</strong> {uniqueReasons.join('; ')}
              </div>
            )}
            <div className="sc-baixado-days">
              {entries.sort((a,b) => a.day - b.day).map(e => {
                const c = statusColors[e.status];
                const duty = duties.find(d => d.id === e.dutyId);
                return (
                  <span key={`${e.day}-${e.dutyId}`} className="sc-day-chip"
                    style={{ background: c?.bgColor+'22', color: c?.bgColor, border:`1px solid ${c?.bgColor}55` }}
                    title={`${duty?.name} — ${e.reason || e.status}`}
                    onClick={() => onEditCell(e.day, e.dutyId)}>
                    {String(e.day).padStart(2,'0')}/{String(month).padStart(2,'0')}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminSchedulePage() {
  const now = new Date();
  const [month,          setMonth]         = useState(now.getMonth() + 1);
  const [year,           setYear]          = useState(now.getFullYear());
  const [users,          setUsers]         = useState([]);
  const [planilhaId,     setPlanilhaId]    = useState(null);
  const [title,          setTitle]         = useState('');
  const [unit,           setUnit]          = useState('');
  const [duties,         setDuties]        = useState(DEFAULT_DUTIES);
  const [statusColors,   setStatusColors]  = useState(DEFAULT_STATUS_COLORS);
  const [cycleLength,    setCycleLength]   = useState(8);
  const [cycleStartDay,  setCycleStartDay] = useState(1);
  const [cycleTemplate,  setCycleTemplate] = useState([]);
  const [cells,          setCells]         = useState({});   // key:"day-dutyId" → cell
  const [activeTab,      setActiveTab]     = useState('planilha');
  const [cellModal,      setCellModal]     = useState(null); // {day, dutyId}
  const [showConfig,     setShowConfig]    = useState(false);
  const [showCycle,      setShowCycle]     = useState(false);
  const [showRangeApply, setShowRangeApply]= useState(false);
  const [saving,         setSaving]        = useState(false);
  const [loading,        setLoading]       = useState(true);

  // ── Aba Militares ─────────────────────────────────────────────────────────
  const [usersWithPerms, setUsersWithPerms] = useState([]);
  const [savingPerm,     setSavingPerm]     = useState(null);
  const [milSearch,      setMilSearch]      = useState('');
  const [selectedSoldier,setSelectedSoldier]= useState(null); // modal histórico
  const [soldierStats,   setSoldierStats]   = useState(null);
  const [soldierStatsTab,setSoldierStatsTab]= useState('chamada');

  // ── Aba Chamadas ──────────────────────────────────────────────────────────
  const [chamadas,          setChamadas]          = useState([]);
  const [chamadaSearch,     setChamadaSearch]     = useState('');
  const [chamadaLoading,    setChamadaLoading]    = useState(false);
  const [selectedChamada,   setSelectedChamada]   = useState(null); // ver detalhe
  const [exportingDocx,     setExportingDocx]     = useState(false);

  const totalDays = daysInMonth(month, year);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        api.get('/users'),
        api.get(`/planilha?month=${month}&year=${year}`),
      ]);
      setUsers(uRes.data?.users || uRes.data || []);

      const p = pRes.data;
      if (p) {
        setPlanilhaId(p._id);
        setTitle(p.title || '');
        setUnit(p.unit  || '');
        setDuties(p.duties?.length ? p.duties : DEFAULT_DUTIES);
        setCycleLength(p.cycleLength   || 8);
        setCycleStartDay(p.cycleStartDay || 1);
        setCycleTemplate(p.cycleTemplate || []);
        setStatusColors(normalizeStatusColors(p.statusColors));
        const cm = {};
        (p.cells || []).forEach(c => { cm[makeCellKey(c.day, c.dutyId)] = c; });
        setCells(cm);
      } else {
        setPlanilhaId(null);
        setTitle(`ESCALA DE SERVIÇO — ${MESES[month-1].toUpperCase()} ${year}`);
        setUnit(''); setDuties(DEFAULT_DUTIES); setStatusColors(DEFAULT_STATUS_COLORS);
        setCycleLength(8); setCycleStartDay(1); setCycleTemplate([]); setCells({});
      }
    } catch { toast.error('Erro ao carregar escala'); }
    finally  { setLoading(false); }
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      // Serialize statusColors as plain object (Map não serializa bem via axios)
      const sc = {};
      Object.entries(statusColors).forEach(([k, v]) => { sc[k] = v; });

      const payload = {
        month, year, title, unit,
        cycleLength, cycleStartDay,
        duties,
        statusColors: sc,
        cells: Object.values(cells).map(c => ({
          day: c.day, dutyId: c.dutyId,
          user: c.user?._id || c.user || null,
          status: c.status || 'ativo',
          reason: c.reason || '',
          notes: c.notes  || '',
          customColor: c.customColor || '',
          manualOverride: c.manualOverride || false,
        })),
        cycleTemplate: cycleTemplate.map(ct => ({
          dutyId: ct.dutyId, cycleDay: ct.cycleDay,
          user: ct.user?._id || ct.user || null,
        })),
      };
      const res = await api.post('/planilha', payload);
      const p   = res.data;
      setPlanilhaId(p._id);
      // Re-sync status colors from response
      setStatusColors(normalizeStatusColors(p.statusColors));
      const cm = {};
      (p.cells || []).forEach(c => { cm[makeCellKey(c.day, c.dutyId)] = c; });
      setCells(cm);
      toast.success('✅ Escala salva com sucesso!');
    } catch { toast.error('Erro ao salvar escala'); }
    finally  { setSaving(false); }
  };

  // ── Cell operations ───────────────────────────────────────────────────────

  const handleCellSave = (cellData) => {
    setCells(prev => ({ ...prev, [makeCellKey(cellData.day, cellData.dutyId)]: cellData }));
    setCellModal(null);
  };

  const handleCellClear = (day, dutyId) => {
    setCells(prev => { const n = { ...prev }; delete n[makeCellKey(day, dutyId)]; return n; });
    setCellModal(null);
  };

  // ── Range apply ───────────────────────────────────────────────────────────

  const handleRangeApply = (updates, summary) => {
    setCells(prev => {
      const next = { ...prev };
      updates.forEach(upd => { next[makeCellKey(upd.day, upd.dutyId)] = upd; });
      return next;
    });
    setShowRangeApply(false);
    toast.success(
      `✅ ${updates.length} células atualizadas — ${statusColors[summary.status]?.label || summary.status}` +
      (summary.reason ? ` (${summary.reason})` : '')
    );
  };

  // ── Config save ───────────────────────────────────────────────────────────

  const handleConfigSave = (newDuties, newColors) => {
    setDuties(newDuties.map((d,i) => ({ ...d, order: i })));
    setStatusColors(newColors);
    setShowConfig(false);
    toast.success('Configurações salvas — clique em 💾 Salvar Escala para persistir');
  };

  // ── Cycle apply ───────────────────────────────────────────────────────────

  const handleCycleApply = (template, len, startDay) => {
    setCycleTemplate(template);
    setCycleLength(len);
    setCycleStartDay(startDay);
    const newCells = {};
    for (let day = 1; day <= totalDays; day++) {
      const cycleDay = ((day - startDay) % len + len) % len + 1;
      duties.forEach(duty => {
        const ct = template.find(t => t.dutyId === duty.id && t.cycleDay === cycleDay);
        if (ct) {
          const key = makeCellKey(day, duty.id);
          if (!cells[key]?.manualOverride) {
            newCells[key] = { day, dutyId: duty.id, user: ct.user||null,
              status:'ativo', reason:'', notes:'', customColor:'', manualOverride:false };
          }
        }
      });
    }
    setCells(prev => {
      const merged = { ...newCells };
      Object.entries(prev).forEach(([k, v]) => { if (v.manualOverride) merged[k] = v; });
      return merged;
    });
    setShowCycle(false);
    toast.success(`✅ Ciclo de ${len} dias aplicado! Clique em 💾 Salvar para persistir.`);
  };

  // ── Nav ───────────────────────────────────────────────────────────────────

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  // ── Carregar usuários com permissões ──────────────────────────────────────
  const loadUsersWithPerms = useCallback(async () => {
    try {
      const res = await api.get('/permissoes');
      setUsersWithPerms(res.data);
    } catch { toast.error('Erro ao carregar militares.'); }
  }, []);

  useEffect(() => {
    if (activeTab === 'militares') loadUsersWithPerms();
    if (activeTab === 'chamadas')  loadChamadas();
  }, [activeTab]);

  const toggleChamadaAccess = async (user) => {
    setSavingPerm(user._id);
    try {
      const res = await api.patch(`/permissoes/${user._id}/chamada`, {
        hasChamadaAccess: !user.hasChamadaAccess,
      });
      setUsersWithPerms(prev => prev.map(u => u._id === user._id ? { ...u, ...res.data } : u));
      toast.success(`${user.warName}: acesso ${res.data.hasChamadaAccess ? 'LIBERADO ✔' : 'REMOVIDO ✘'}`);
    } catch { toast.error('Erro ao atualizar permissão.'); }
    finally { setSavingPerm(null); }
  };

  const openSoldierHistory = async (user) => {
    setSelectedSoldier(user);
    setSoldierStats(null);
    try {
      const [c, a] = await Promise.all([
        api.get(`/chamada/stats/soldado/${user._id}`),
        api.get(`/auditoria/stats/soldado/${user._id}`),
      ]);
      setSoldierStats({ chamada: c.data, auditoria: a.data });
    } catch { toast.error('Erro ao carregar histórico.'); }
  };

  // ── Chamadas ──────────────────────────────────────────────────────────────
  const loadChamadas = useCallback(async () => {
    setChamadaLoading(true);
    try {
      const res = await api.get('/chamada?limit=60');
      setChamadas(res.data);
    } catch { toast.error('Erro ao carregar chamadas.'); }
    finally { setChamadaLoading(false); }
  }, []);

  const exportChamadaDocx = async (chamada) => {
    setExportingDocx(chamada._id);
    try {
      const response = await api.get(
        `/planilha/export/docx?month=${new Date(chamada.date).getMonth()+1}&year=${new Date(chamada.date).getFullYear()}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const d    = new Date(chamada.date);
      a.href     = url;
      a.download = `escala-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Documento Word gerado!');
    } catch { toast.error('Erro ao gerar documento Word.'); }
    finally { setExportingDocx(null); }
  };

  const exportEscalaDocx = async () => {
    setExportingDocx('escala');
    try {
      const response = await api.get(
        `/planilha/export/docx?month=${month}&year=${year}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `escala-${String(month).padStart(2,'0')}-${year}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Escala exportada como Word!');
    } catch { toast.error('Erro ao exportar escala.'); }
    finally { setExportingDocx(null); }
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  const getCell  = (day, dutyId) => cells[makeCellKey(day, dutyId)];
  const baixadosCount = Object.values(cells).filter(c => c.status && c.status !== 'ativo' && (c.user?._id||c.user)).length;

  const getCellStyle = (cell) => {
    if (!cell) return {};
    if (cell.customColor) return { background: cell.customColor, color: '#fff' };
    const c = statusColors[cell.status || 'ativo'];
    return c ? { background: c.bgColor, color: c.textColor } : {};
  };

  const getUserShortName = (cell) => {
    if (!cell?.user) return '';
    const u = typeof cell.user === 'object' ? cell.user : users.find(x => x._id === cell.user);
    return u?.warName?.split(' ')[0] || '?';
  };

  const cellModalData = cellModal
    ? { cell: getCell(cellModal.day, cellModal.dutyId), duty: duties.find(d => d.id === cellModal.dutyId) }
    : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="sc-loading">
      <div className="sc-loading-spinner" />
      <p>Carregando escala...</p>
    </div>
  );

  return (
    <div className="sc-page">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sc-header">
        <div className="sc-header-top">
          <div className="sc-header-title-block">
            <div className="sc-header-icon">🎖️</div>
            <div>
              <input className="sc-title-input" value={title}
                onChange={e => setTitle(e.target.value)} placeholder="Título da escala..." />
              <input className="sc-unit-input" value={unit}
                onChange={e => setUnit(e.target.value)} placeholder="Unidade / Subunidade..." />
            </div>
          </div>

          <div className="sc-header-controls">
            <div className="sc-month-nav">
              <button className="sc-nav-btn" onClick={prevMonth}>‹</button>
              <div className="sc-month-label">
                <select value={month} onChange={e=>setMonth(+e.target.value)} className="sc-month-select">
                  {MESES.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <input type="number" min={2000} max={2100} value={year}
                  onChange={e=>setYear(+e.target.value||year)} className="sc-year-input" />
              </div>
              <button className="sc-nav-btn" onClick={nextMonth}>›</button>
            </div>

            <div className="sc-header-actions">
              <button className="sc-btn-outline" onClick={() => setShowConfig(true)}>⚙️ Config</button>
              <button className="sc-btn-outline" onClick={() => setShowCycle(true)}>🔄 Ciclo</button>
              <button className="sc-btn-range" onClick={() => setShowRangeApply(true)}>⚡ Em Lote</button>
              <button
                className="sc-btn-outline"
                style={{ color: '#60a5fa', borderColor: '#2563eb' }}
                disabled={exportingDocx === 'escala'}
                onClick={exportEscalaDocx}
                title="Baixar escala do mês como Word"
              >
                {exportingDocx === 'escala' ? '⏳...' : '📄 Word'}
              </button>
              <button className="sc-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sc-tabs">
          <button className={`sc-tab ${activeTab==='planilha'?'active':''}`} onClick={()=>setActiveTab('planilha')}>
            📋 Planilha
          </button>
          <button className={`sc-tab ${activeTab==='baixados'?'active':''}`} onClick={()=>setActiveTab('baixados')}>
            🔴 Baixados / Afastados
            {baixadosCount > 0 && <span className="sc-tab-badge">{baixadosCount}</span>}
          </button>
          <button className={`sc-tab ${activeTab==='legenda'?'active':''}`} onClick={()=>setActiveTab('legenda')}>
            🎨 Legenda
          </button>
        </div>
      </div>

      {/* ── Planilha ────────────────────────────────────────────────────────── */}
      {activeTab === 'planilha' && (
        <div className="sc-planilha-container">
          <div className="sc-grid-wrapper">
            <table className="sc-grid">
              <thead>
                <tr className="sc-row-days">
                  <th className="sc-th-function">
                    <div className="sc-th-function-inner">
                      <span>FUNÇÃO / POSTO</span>
                      <span className="sc-th-cycle-info">Ciclo {cycleLength}d</span>
                    </div>
                  </th>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const d = i + 1;
                    const dow = getDayOfWeek(d, month, year);
                    const isWE = dow===0||dow===6;
                    const isToday = d===now.getDate() && month===now.getMonth()+1 && year===now.getFullYear();
                    return (
                      <th key={d} className={`sc-th-day ${isWE?'weekend':''} ${isToday?'today':''}`}>
                        <div className="sc-day-num">{String(d).padStart(2,'0')}</div>
                        <div className="sc-day-dow">{DIAS_SEMANA_ABREV[dow]}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {duties.map((duty, di) => (
                  <tr key={duty.id} className={`sc-row-duty ${di%2===0?'even':'odd'}`}>
                    <td className="sc-td-function">
                      <div className="sc-function-name">{duty.name}</div>
                      {duty.abbreviation && <div className="sc-function-abbrev">{duty.abbreviation}</div>}
                    </td>
                    {Array.from({ length: totalDays }, (_, i) => {
                      const day  = i + 1;
                      const cell = getCell(day, duty.id);
                      const dow  = getDayOfWeek(day, month, year);
                      const isWE = dow===0||dow===6;
                      const isToday = day===now.getDate() && month===now.getMonth()+1 && year===now.getFullYear();
                      const label = getUserShortName(cell);
                      const cycleDay = ((day - cycleStartDay) % cycleLength + cycleLength) % cycleLength + 1;

                      return (
                        <td key={day}
                          className={`sc-td-cell ${isWE?'weekend':''} ${isToday?'today':''} ${cell?'filled':'empty'}`}
                          onClick={() => setCellModal({ day, dutyId: duty.id })}
                          title={cell?.reason ? `${label} — ${cell.reason}` : label}>
                          {cell?.user ? (
                            <div className="sc-cell-content" style={getCellStyle(cell)}>
                              <span className="sc-cell-name">{label}</span>
                              {cell.status && cell.status !== 'ativo' && (
                                <span className="sc-cell-status-dot"
                                  title={statusColors[cell.status]?.label || cell.status} />
                              )}
                            </div>
                          ) : (
                            <div className="sc-cell-empty">
                              <span className="sc-cell-cycle">{cycleDay}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick legend */}
          <div className="sc-quick-legend">
            {Object.entries(statusColors).map(([key, val]) => (
              <div key={key} className="sc-legend-item">
                <span className="sc-legend-dot" style={{ background: val.bgColor }} />
                <span className="sc-legend-label">{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Baixados ────────────────────────────────────────────────────────── */}
      {activeTab === 'baixados' && (
        <div className="sc-tab-content">
          <BaixadosPanel
            cells={Object.values(cells)} duties={duties} users={users}
            statusColors={statusColors} month={month} year={year}
            onEditCell={(day, dutyId) => { setCellModal({ day, dutyId }); setActiveTab('planilha'); }}
          />
        </div>
      )}



            {/* ── Legenda ─────────────────────────────────────────────────────────── */}
      {activeTab === 'legenda' && (
        <div className="sc-tab-content">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div className="sc-section-title" style={{ margin: 0 }}>Status & Cores</div>
            <button className="sc-btn-outline" onClick={() => setShowConfig(true)}>
              ⚙️ Editar status
            </button>
          </div>
          <div className="sc-legend-grid">
            {Object.entries(statusColors).map(([key, val]) => (
              <div key={key} className="sc-legend-card" style={{ borderLeft:`4px solid ${val.bgColor}` }}>
                <div className="sc-legend-swatch" style={{ background:val.bgColor, color:val.textColor }}>
                  {val.label}
                </div>
                <div className="sc-legend-key">{key}{!BUILT_IN_STATUS_KEYS.includes(key) && ' · personalizado'}</div>
              </div>
            ))}
          </div>

          <div className="sc-section-title" style={{ marginTop:32 }}>Funções / Postos</div>
          <div className="sc-duties-overview">
            {duties.map((d, i) => (
              <div key={d.id} className="sc-duty-overview-item">
                <span className="sc-duty-num">{i+1}</span>
                <span className="sc-duty-full-name">{d.name}</span>
                {d.abbreviation && <span className="sc-duty-abbrev-badge">{d.abbreviation}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modais ──────────────────────────────────────────────────────────── */}

      {cellModal && cellModalData && (
        <CellEditModal
          cell={cellModalData.cell} duty={cellModalData.duty}
          day={cellModal.day} month={month} year={year}
          users={users} statusColors={statusColors}
          onSave={handleCellSave} onClear={handleCellClear} onClose={() => setCellModal(null)}
        />
      )}

      {showRangeApply && (
        <RangeApplyModal
          totalDays={totalDays} month={month} year={year}
          users={users} duties={duties} cells={cells} statusColors={statusColors}
          onApply={handleRangeApply} onClose={() => setShowRangeApply(false)}
        />
      )}

      {showConfig && (
        <ConfigModal duties={duties} statusColors={statusColors}
          onSave={handleConfigSave} onClose={() => setShowConfig(false)} />
      )}

      {showCycle && (
        <CycleModal cycleLength={cycleLength} cycleStartDay={cycleStartDay}
          duties={duties} cycleTemplate={cycleTemplate} users={users}
          onApply={handleCycleApply} onClose={() => setShowCycle(false)} />
      )}
    </div>
  );
}
