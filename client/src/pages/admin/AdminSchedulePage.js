import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../context/AuthContext';
import Calendar from '../../components/Calendar';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import './AdminPages.css';
import './responsive.css';

const BRASAO_B64 = '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';

const DEFAULT_DUTIES = ['Sgt do Dia','Cb Gda','Cb do Dia','Cb Hipismo','Plantão','Esf Vet','Perm. Equoterapia','Partão B','Pelotão de Higiene'];

export default function AdminSchedulePage() {
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedSoldiers, setSelectedSoldiers] = useState([]);
  const [notes, setNotes] = useState('');
  const [dutyTypes, setDutyTypes] = useState({});
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState([]);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoWeekStart, setAutoWeekStart] = useState('');
  const [autoDuties, setAutoDuties] = useState(DEFAULT_DUTIES.slice(0,5));
  const [serviceStats, setServiceStats] = useState({});
  const [activeTab, setActiveTab] = useState('manual');

  const now = new Date();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, schedRes] = await Promise.all([
          api.get('/users'),
          api.get(`/schedules?month=${now.getMonth()+1}&year=${now.getFullYear()}`),
        ]);
        setUsers(usersRes.data);
        setSchedules(schedRes.data);
        // Get service stats
        try {
          const rankRes = await api.get('/stats/ranking?days=30');
          const map = {};
          rankRes.data.forEach(r => { map[r.user._id] = r.recent; });
          setServiceStats(map);
        } catch {}
      } catch { toast.error('Erro ao carregar dados'); }
      finally { setLoading(false); }
    };
    fetchData();
    // Default auto week = next Monday
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? 1 : 8 - day));
    setAutoWeekStart(format(d,'yyyy-MM-dd'));
  }, []); // eslint-disable-line

  const checkConflicts = useCallback((soldiers) => {
    const seen = {};
    const conf = [];
    soldiers.forEach(id => {
      if (seen[id]) conf.push(id);
      else seen[id] = true;
    });
    setConflicts(conf);
  }, []);

  const handleDayClick = (day, schedule) => {
    setSelectedDay(day);
    setSelectedSchedule(schedule || null);
    if (schedule) {
      const soldierIds = schedule.soldiers.map(s => s.user?._id || s.user);
      setSelectedSoldiers(soldierIds);
      const duties = {};
      schedule.soldiers.forEach(s => { duties[s.user?._id || s.user] = s.duty; });
      setDutyTypes(duties);
      setNotes(schedule.notes || '');
      checkConflicts(soldierIds);
    } else {
      setSelectedSoldiers([]); setDutyTypes({}); setNotes(''); setConflicts([]);
    }
  };

  const toggleSoldier = (userId) => {
    const newList = selectedSoldiers.includes(userId)
      ? selectedSoldiers.filter(id => id !== userId)
      : [...selectedSoldiers, userId];
    setSelectedSoldiers(newList);
    if (!dutyTypes[userId]) setDutyTypes(prev => ({ ...prev, [userId]: 'Serviço' }));
    checkConflicts(newList);
  };

  const handleSave = async () => {
    if (!selectedDay) { toast.error('Selecione um dia no calendário'); return; }
    if (conflicts.length > 0) {
      const ok = window.confirm('Existem militares duplicados na escala. Deseja salvar mesmo assim?');
      if (!ok) return;
    }
    setSaving(true);
    try {
      const soldiers = selectedSoldiers.map(id => ({ user: id, duty: dutyTypes[id] || 'Serviço' }));
      const res = await api.post('/schedules', { date: selectedDay.toISOString(), soldiers, notes });
      const dateStr = selectedDay.toDateString();
      setSchedules(prev => {
        const idx = prev.findIndex(s => new Date(s.date).toDateString() === dateStr);
        if (idx >= 0) { const u = [...prev]; u[idx] = res.data; return u; }
        return [...prev, res.data];
      });
      setSelectedSchedule(res.data);
      toast.success('Escala salva com sucesso');
    } catch { toast.error('Erro ao salvar escala'); }
    finally { setSaving(false); }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    if (!window.confirm('Remover esta escala?')) return;
    try {
      await api.delete(`/schedules/${selectedSchedule._id}`);
      const dateStr = selectedDay.toDateString();
      setSchedules(prev => prev.filter(s => new Date(s.date).toDateString() !== dateStr));
      setSelectedSchedule(null); setSelectedSoldiers([]); setNotes(''); setConflicts([]);
      toast.success('Escala removida');
    } catch { toast.error('Erro ao remover'); }
  };

  const handleAutoGenerate = async () => {
    if (!autoWeekStart) { toast.error('Selecione a semana'); return; }
    setGenerating(true);
    try {
      const res = await api.post('/stats/auto-generate', {
        weekStart: autoWeekStart,
        duties: autoDuties.filter(Boolean),
        includeSunday: false,
      });
      toast.success(`✓ ${res.data.count} dias gerados automaticamente!`);
      setShowAutoModal(false);
      // Reload schedules
      const schedRes = await api.get(`/schedules?month=${now.getMonth()+1}&year=${now.getFullYear()}`);
      setSchedules(schedRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao gerar escala');
    } finally { setGenerating(false); }
  };

  // ── Export Excel da Escala Semanal ──────────────────────────────────────────
  const exportEscalaExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      const now = new Date();
      const monday = addDays(startOfWeek(now, { weekStartsOn: 1 }), 0);
      const ws = wb.addWorksheet('Escala Semanal', { pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true } });

      // Title
      ws.mergeCells('A1:H1');
      ws.getCell('A1').value = 'ESCALA DE SERVIÇO SEMANAL';
      ws.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a2e12' } };
      ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 28;

      ws.mergeCells('A2:H2');
      ws.getCell('A2').value = `Semana de ${monday.toLocaleDateString('pt-BR')} a ${addDays(monday, 6).toLocaleDateString('pt-BR')} — Gerado em: ${now.toLocaleString('pt-BR')}`;
      ws.getCell('A2').font = { name: 'Arial', size: 9, italic: true };
      ws.getCell('A2').alignment = { horizontal: 'center' };
      ws.getRow(2).height = 16;

      // Headers
      const headers = ['Dia', 'Data', 'Militar', 'Posto/Grad.', 'Nº de Guerra', 'Nº', 'Tipo de Serviço', 'Observações'];
      const widths =  [16,    12,    20,         18,            14,             8,    22,                28];
      headers.forEach((h, i) => {
        const col = ws.getColumn(i + 1);
        col.width = widths[i];
        const cell = ws.getRow(3).getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2a4020' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF6b7c5e' } }, right: { style: 'thin', color: { argb: 'FF3a5a2a' } } };
      });
      ws.getRow(3).height = 20;

      const DAYS_PT = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];
      let rowIdx = 4;

      for (let d = 0; d < 7; d++) {
        const day = addDays(monday, d);
        const dayStr = day.toDateString();
        const sched = schedules.find(s => new Date(s.date).toDateString() === dayStr);
        const dayName = DAYS_PT[day.getDay()];
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const fillColor = isWeekend ? 'FFEEEEEE' : (d % 2 === 0 ? 'FFF4F2EA' : 'FFFFFFFF');

        if (sched && sched.soldiers.length > 0) {
          sched.soldiers.forEach((s, si) => {
            const row = ws.getRow(rowIdx++);
            row.values = [
              si === 0 ? dayName : '',
              si === 0 ? day.toLocaleDateString('pt-BR') : '',
              s.user?.warName || '—',
              s.user?.rank || '—',
              s.user?.warNumber || '—',
              si + 1,
              s.duty || 'Serviço',
              si === 0 ? (sched.notes || '') : '',
            ];
            row.eachCell(cell => {
              cell.font = { name: 'Arial', size: 9 };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
              cell.border = {
                top: { style: 'hair', color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              };
              cell.alignment = { vertical: 'middle', wrapText: false };
            });
            row.height = 18;
          });
        } else {
          const row = ws.getRow(rowIdx++);
          row.values = [dayName, day.toLocaleDateString('pt-BR'), '—', '', '', '', 'Sem escala', ''];
          row.eachCell(cell => {
            cell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF888888' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
            cell.border = { top: { style: 'hair', color: { argb: 'FFCCCCCC' } }, bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } } };
          });
          row.height = 18;
        }
      }

      ws.views = [{ state: 'frozen', ySplit: 3 }];
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `escala_${monday.toISOString().slice(0,10)}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('✓ Planilha da escala exportada!');
    } catch (err) { console.error(err); toast.error('Erro ao exportar Excel'); }
  };

  // ── Export Word da Escala (A4 para impressão) ─────────────────────────────
  const exportEscalaWord = async () => {
    try {
      const binary = atob(BRASAO_B64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const now = new Date();
      const monday = addDays(startOfWeek(now, { weekStartsOn: 1 }), 0);
      const DAYS_PT = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];
      const bold = (t, sz=20) => new TextRun({ text: t, bold: true, font: 'Times New Roman', size: sz });
      const norm = (t, sz=20) => new TextRun({ text: t, font: 'Times New Roman', size: sz });

      const children = [];

      // Brasão + cabeçalho
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: bytes, transformation: { width: 70, height: 70 }, type: 'jpg' })],
        spacing: { after: 60 },
      }));
      ['MINISTÉRIO DA DEFESA','EXÉRCITO BRASILEIRO','COMANDO MILITAR DO PLANALTO'].forEach(line => {
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [bold(line, 20)], spacing: { after: 30 } }));
      });
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2a4020', space: 1 } },
        children: [bold(`ESCALA DE SERVIÇO — ${monday.toLocaleDateString('pt-BR')} A ${addDays(monday,6).toLocaleDateString('pt-BR')}`, 22)],
        spacing: { before: 120, after: 160 },
      }));

      for (let d = 0; d < 7; d++) {
        const day = addDays(monday, d);
        const dayStr = day.toDateString();
        const sched = schedules.find(s => new Date(s.date).toDateString() === dayStr);
        const dayName = DAYS_PT[day.getDay()];

        children.push(new Paragraph({
          shading: { fill: 'E8E4D0', type: ShadingType.CLEAR },
          children: [bold(`${dayName.toUpperCase()} — ${day.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' }).toUpperCase()}`, 20)],
          spacing: { before: 160, after: 60 },
        }));

        const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
        const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

        if (sched && sched.soldiers.length > 0) {
          const rows = sched.soldiers.map(s => new TableRow({
            children: [
              new TableCell({
                width: { size: 3000, type: WidthType.DXA }, borders,
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({ children: [bold(s.duty || 'Serviço', 18)], spacing: { after: 0 } })],
              }),
              new TableCell({
                width: { size: 5640, type: WidthType.DXA }, borders,
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({ children: [norm(`${s.user?.rank || ''} ${s.user?.warName || '—'}`, 18)], spacing: { after: 0 } })],
              }),
            ],
          }));
          children.push(new Table({ width: { size: 8640, type: WidthType.DXA }, columnWidths: [3000, 5640], rows }));
        } else {
          children.push(new Paragraph({
            children: [new TextRun({ text: 'Sem escala definida para este dia.', italics: true, font: 'Times New Roman', size: 18, color: '888888' })],
            spacing: { after: 60 },
          }));
        }
        if (sched?.notes) {
          children.push(new Paragraph({ children: [norm(`Obs: ${sched.notes}`, 18)], spacing: { before: 40, after: 20 } }));
        }
      }

      const doc = new Document({
        sections: [{
          properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
          children,
        }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `escala_${monday.toISOString().slice(0,10)}.docx`);
      toast.success('✓ Word da escala gerado!');
    } catch (err) { console.error(err); toast.error('Erro ao gerar Word'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📅 <span>Gestão</span> de Escalas</h1>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span className="admin-date">{format(now,'MMMM yyyy',{locale:ptBR}).toUpperCase()}</span>
            <button className="btn btn-outline btn-sm" onClick={exportEscalaExcel}>📊 Excel</button>
            <button className="btn btn-outline btn-sm" onClick={exportEscalaWord}>📄 Word A4</button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAutoModal(true)}>
            ⚡ Geração Automática Inteligente
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:2,marginBottom:18,background:'var(--bg-dark)',border:'1px solid var(--border)',borderRadius:6,padding:3,width:'fit-content' }}>
        {[{id:'manual',label:'📅 Escala Manual'},{id:'semana',label:'📋 Visão Semanal'}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding:'6px 16px',borderRadius:4,border:'none',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:'0.6rem',letterSpacing:'0.07em',textTransform:'uppercase',transition:'all .15s',
              background:activeTab===t.id?'var(--accent)':'transparent',
              color:activeTab===t.id?'var(--bg-dark)':'var(--text-muted)',fontWeight:activeTab===t.id?700:'normal' }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'manual' && (
        <div className="schedule-admin-layout">
          <div>
            <Calendar schedules={schedules} onDayClick={handleDayClick} selectedDate={selectedDay} />
          </div>

          <div className="schedule-form-card">
            {!selectedDay ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <p className="empty-state-text">Selecione um dia no calendário</p>
              </div>
            ) : (
              <>
                <h3 className="schedule-form-title">
                  {format(selectedDay,"EEEE, dd 'de' MMMM",{locale:ptBR}).toUpperCase()}
                  {selectedSchedule && <span className="badge badge-success" style={{ marginLeft:8,fontSize:'0.6rem' }}>DEFINIDA</span>}
                </h3>

                {/* Conflict warning */}
                {conflicts.length > 0 && (
                  <div style={{ background:'rgba(231,76,60,.12)',border:'1px solid #c0392b',borderRadius:4,padding:'8px 12px',marginBottom:12,fontSize:'0.75rem',color:'#e74c3c' }}>
                    ⚠ <strong>Conflito detectado:</strong> {conflicts.map(id => {
                      const u = users.find(us => us._id === id);
                      return u ? u.warName : id;
                    }).join(', ')} aparecem mais de uma vez.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Selecionar Militares ({selectedSoldiers.length} selecionados)
                    <span style={{ marginLeft:8,fontSize:'0.62rem',color:'var(--text-muted)' }}>— ordenados por menos serviços recentes</span>
                  </label>
                  <div className="soldier-select-list">
                    {[...users.filter(u => u.active)].sort((a,b) => {
                      const as = serviceStats[a._id] || 0;
                      const bs = serviceStats[b._id] || 0;
                      return as - bs; // fewer services first
                    }).map(u => {
                      const isSelected = selectedSoldiers.includes(u._id);
                      const svcCount = serviceStats[u._id] || 0;
                      return (
                        <div key={u._id}
                          className={`soldier-select-item ${isSelected?'selected':''}`}
                          onClick={() => toggleSoldier(u._id)}
                        >
                          <div className="soldier-select-checkbox">{isSelected&&'✓'}</div>
                          <span className="soldier-rank-badge" style={{ fontSize:'0.58rem' }}>{u.rank.split(' ')[0]}</span>
                          <span className="admin-soldier-name" style={{ flex:1 }}>{u.warName}</span>
                          <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.58rem',color:svcCount===0?'#e6a23c':'var(--text-muted)' }}>
                            {svcCount} serv.
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedSoldiers.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Função/Tipo de Serviço por Militar</label>
                    {selectedSoldiers.map(id => {
                      const u = users.find(us => us._id === id);
                      const isConflict = conflicts.includes(id);
                      return u ? (
                        <div key={id} style={{ display:'flex',gap:8,marginBottom:6,alignItems:'center' }}>
                          <span style={{ flex:1,fontFamily:'var(--font-display)',fontSize:'0.72rem',letterSpacing:'0.05em',color:isConflict?'#e74c3c':'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            {isConflict && '⚠ '}{u.warName}
                          </span>
                          <input type="text" className="form-control"
                            style={{ maxWidth:160,padding:'6px 10px',fontSize:'0.78rem',borderColor:isConflict?'#c0392b':undefined }}
                            value={dutyTypes[id]||'Serviço'}
                            onChange={e => setDutyTypes(prev => ({...prev,[id]:e.target.value}))}
                            list="duty-suggestions"
                            placeholder="Tipo de serviço"
                          />
                        </div>
                      ) : null;
                    })}
                    <datalist id="duty-suggestions">
                      {DEFAULT_DUTIES.map((d,i) => <option key={i} value={d} />)}
                    </datalist>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observações sobre a escala..." style={{ minHeight:60 }} />
                </div>

                <div style={{ display:'flex',gap:8 }}>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
                    {saving ? <span className="spinner" style={{ width:16,height:16 }} /> : selectedSchedule?'Atualizar Escala':'Salvar Escala'}
                  </button>
                  {selectedSchedule && (
                    <button className="btn btn-danger btn-sm" onClick={handleDeleteSchedule} title="Remover">🗑</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'semana' && (
        <WeekView schedules={schedules} users={users} serviceStats={serviceStats} />
      )}

      {/* Auto-generate modal */}
      {showAutoModal && (
        <div className="modal-overlay" onClick={() => setShowAutoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:500 }}>
            <div className="modal-header">
              <h3 className="modal-title">⚡ Geração Automática Inteligente</h3>
              <button className="modal-close" onClick={() => setShowAutoModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background:'rgba(107,124,94,.12)',border:'1px solid var(--accent-dark)',borderRadius:4,padding:'10px 14px',marginBottom:14,fontSize:'0.76rem',color:'var(--text-secondary)',lineHeight:1.6 }}>
                ℹ O sistema distribui militares automaticamente priorizando:<br/>
                • Quem está há <strong>mais tempo sem serviço</strong><br/>
                • Evita escalar o mesmo militar em <strong>dias consecutivos</strong><br/>
                • Respeita o <strong>histórico de serviços</strong> para distribuição justa
              </div>
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">Semana a gerar (início — Segunda-feira)</label>
                <input type="date" className="form-control" value={autoWeekStart}
                  onChange={e => setAutoWeekStart(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Funções/Posições a preencher (uma por linha)
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft:8 }}
                    onClick={() => setAutoDuties(DEFAULT_DUTIES.slice(0,5))}>
                    Padrão
                  </button>
                </label>
                <textarea className="form-control"
                  value={autoDuties.join('\n')}
                  onChange={e => setAutoDuties(e.target.value.split('\n'))}
                  style={{ minHeight:120,fontFamily:'var(--font-mono)',fontSize:'0.75rem' }}
                  placeholder="Sgt do Dia&#10;Cb Gda&#10;Cb do Dia&#10;..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAutoModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAutoGenerate} disabled={generating}>
                {generating ? <><span className="spinner" style={{ width:14,height:14 }} /> Gerando...</> : '⚡ Gerar Escala Semanal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekView({ schedules, users, serviceStats }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const monday = addDays(startOfWeek(now, { weekStartsOn: 1 }), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const getScheduleForDay = (day) =>
    schedules.find(s => {
      const d = new Date(s.date);
      return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
    });

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(o => o-1)}>‹ Semana anterior</button>
        <span style={{ flex:1,textAlign:'center',fontFamily:'var(--font-display)',fontSize:'0.78rem',color:'var(--accent)',letterSpacing:'0.06em' }}>
          {format(monday,"dd/MM")} a {format(addDays(monday,6),"dd/MM/yyyy")}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(o => o+1)}>Próxima semana ›</button>
        <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(0)}>Hoje</button>
      </div>

      {days.map((day, di) => {
        const sched = getScheduleForDay(day);
        const isToday = day.toDateString() === now.toDateString();
        const isSunday = day.getDay() === 0;
        return (
          <div key={di} className="card" style={{ marginBottom:10,opacity:isSunday?0.6:1 }}>
            <div style={{
              padding:'10px 16px',borderBottom:'1px solid var(--border)',
              background:isToday?'rgba(107,124,94,.15)':'var(--bg-card)',
              display:'flex',alignItems:'center',justifyContent:'space-between',
              borderRadius:'var(--radius-md) var(--radius-md) 0 0',
            }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontFamily:'var(--font-display)',fontSize:'0.8rem',color:isToday?'var(--accent)':'var(--text-primary)',fontWeight:700,letterSpacing:'0.06em' }}>
                  {format(day,"EEEE",{locale:ptBR}).toUpperCase()}
                </span>
                {isToday && <span className="badge badge-success" style={{ fontSize:'0.48rem' }}>HOJE</span>}
                {isSunday && <span className="badge" style={{ background:'#333',color:'#666',fontSize:'0.48rem' }}>DOMINGO</span>}
              </div>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.65rem',color:'var(--text-muted)' }}>
                {format(day,'dd/MM/yyyy')}
              </span>
            </div>
            {sched ? (
              <div style={{ padding:'10px 0' }}>
                {sched.soldiers.map((s,i) => (
                  <div key={i} className="admin-soldier-row">
                    <span className="soldier-rank-badge" style={{ fontSize:'0.55rem' }}>{s.user?.rank?.split(' ')[0]||'SD'}</span>
                    <span className="admin-soldier-name">{s.user?.warName}</span>
                    <span className="admin-soldier-num">Nº {s.user?.warNumber}</span>
                    <span className="admin-soldier-duty">{s.duty}</span>
                    <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.58rem',color:'var(--text-muted)',marginLeft:'auto',paddingRight:14 }}>
                      {serviceStats[s.user?._id]||0} serv/30d
                    </span>
                  </div>
                ))}
                {sched.notes && <p className="admin-notes" style={{ margin:'6px 16px 0',fontSize:'0.7rem' }}>{sched.notes}</p>}
              </div>
            ) : (
              <div style={{ padding:'14px 16px',color:'var(--text-muted)',fontSize:'0.75rem',fontStyle:'italic' }}>
                Sem escala definida
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
