import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './AdminPages.css';
import './responsive.css';

const RANKS = [
  'Recruta','Soldado','Cabo','3º Sargento','2º Sargento','1º Sargento','Subtenente',
  'Aspirante a Oficial','2º Tenente','1º Tenente','Capitão','Major',
  'Tenente-Coronel','Coronel','General-de-Brigada','General-de-Divisão','General-de-Exército','General do Exército',
];
const SITUACOES = ['Ativo','Licença Médica','Hospital','Missão','Férias','Descanso','Licença Especial','Inativo'];
const SIT_COLORS = {
  'Ativo':'#27ae60','Licença Médica':'#e67e22','Hospital':'#c0392b',
  'Missão':'#2980b9','Férias':'#8e44ad','Descanso':'#7f8c8d',
  'Licença Especial':'#d35400','Inativo':'#555',
};

const EMPTY = { warNumber:'',warName:'',nomeCompleto:'',rank:'Soldado',pelotao:'',companhia:'',funcao:'',situacao:'Ativo',telefone:'',observacoes:'' };

export default function AdminUsersPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [filterSit, setFilterSit] = useState('');
  const [filterPel, setFilterPel] = useState('');
  const [showDetail, setShowDetail] = useState(null);
  const [efetivo, setEfetivo]     = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { toast.error('Erro ao carregar militares'); }
    finally { setLoading(false); }
  }, []);

  const fetchEfetivo = useCallback(async () => {
    try {
      const res = await api.get('/users/efetivo');
      setEfetivo(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); fetchEfetivo(); }, [fetchUsers, fetchEfetivo]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser._id}`, form);
        toast.success('Militar atualizado');
      } else {
        await api.post('/users', form);
        toast.success('Militar cadastrado!');
      }
      setShowModal(false); fetchUsers(); fetchEfetivo();
    } catch (err) { toast.error(err.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const openCreate = () => { setEditUser(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ warNumber:u.warNumber, warName:u.warName, nomeCompleto:u.nomeCompleto||'', rank:u.rank, pelotao:u.pelotao||'', companhia:u.companhia||'', funcao:u.funcao||'', situacao:u.situacao||'Ativo', telefone:u.telefone||'', observacoes:u.observacoes||'' }); setShowModal(true); };
  const handleDelete = async (u) => {
    if (!window.confirm(`Remover ${u.warName}?`)) return;
    try { await api.delete(`/users/${u._id}`); fetchUsers(); fetchEfetivo(); toast.success('Removido'); }
    catch { toast.error('Erro ao remover'); }
  };
  const handleToggle = async (u) => {
    try { await api.put(`/users/${u._id}`, { active: !u.active }); fetchUsers(); }
    catch { toast.error('Erro'); }
  };

  const pelotoes = [...new Set(users.map(u => u.pelotao).filter(Boolean))];

  const filtered = users.filter(u => {
    if (filterSit && u.situacao !== filterSit) return false;
    if (filterPel && u.pelotao !== filterPel) return false;
    if (search) {
      const q = search.toLowerCase();
      return (u.warName||'').toLowerCase().includes(q) || (u.nomeCompleto||'').toLowerCase().includes(q) || (u.warNumber||'').includes(q);
    }
    return true;
  });

  const exportExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'SIM'; wb.created = new Date();
      const ws = wb.addWorksheet('Militares', { pageSetup: { paperSize: 9, orientation: 'landscape' } });
      ws.columns = [
        { key:'num', width:5 }, { key:'warNumber', width:12 }, { key:'warName', width:18 },
        { key:'nomeCompleto', width:28 }, { key:'rank', width:22 }, { key:'pelotao', width:12 },
        { key:'companhia', width:14 }, { key:'funcao', width:18 }, { key:'situacao', width:16 },
        { key:'telefone', width:14 }, { key:'observacoes', width:30 },
      ];
      ws.mergeCells('A1:K1');
      const t = ws.getCell('A1');
      t.value = 'SISTEMA INTERNO MILITAR — BANCO DE DADOS DE MILITARES';
      t.font = { name:'Arial', size:12, bold:true, color:{argb:'FFFFFFFF'} };
      t.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1a2e12'} };
      t.alignment = { horizontal:'center', vertical:'middle' };
      ws.getRow(1).height = 26;

      ws.mergeCells('A2:K2');
      ws.getCell('A2').value = `Emitido: ${new Date().toLocaleDateString('pt-BR', {weekday:'long',day:'numeric',month:'long',year:'numeric'})} | Total: ${users.length} | Ativos: ${efetivo?.ativos||0}`;
      ws.getCell('A2').font = { name:'Arial', size:9, italic:true }; ws.getCell('A2').alignment = { horizontal:'center' };
      ws.getRow(2).height = 16;

      const hdrs = ['#','Nº Guerra','Nome de Guerra','Nome Completo','Posto/Grad.','Pelotão','Companhia','Função','Situação','Telefone','Observações'];
      const hRow = ws.getRow(3); hRow.height = 20;
      hdrs.forEach((h,i) => {
        const c = hRow.getCell(i+1);
        c.value = h; c.font = { name:'Arial',size:9,bold:true,color:{argb:'FFFFFFFF'} };
        c.fill = { type:'pattern',pattern:'solid',fgColor:{argb:'FF2a4020'} };
        c.alignment = { horizontal:'center',vertical:'middle' };
        c.border = { bottom:{style:'medium',color:{argb:'FF6b7c5e'}}, right:{style:'thin',color:{argb:'FF3a5a2a'}} };
      });

      filtered.forEach((u,i) => {
        const row = ws.getRow(i+4);
        row.values = [i+1,u.warNumber,u.warName,u.nomeCompleto||'',u.rank,u.pelotao||'',u.companhia||'',u.funcao||'',u.situacao||'Ativo',u.telefone||'',u.observacoes||''];
        row.height = 18;
        const fill = { type:'pattern',pattern:'solid',fgColor:{argb: i%2===0 ? 'FFF4F2EA' : 'FFFFFFFF'} };
        const border = { top:{style:'hair',color:{argb:'FFCCCCCC'}},bottom:{style:'hair',color:{argb:'FFCCCCCC'}},left:{style:'thin',color:{argb:'FFCCCCCC'}},right:{style:'thin',color:{argb:'FFCCCCCC'}} };
        row.eachCell(cell => { cell.font={name:'Arial',size:9}; cell.fill=fill; cell.border=border; cell.alignment={vertical:'middle'}; });
        // Situação colorida
        const sitCell = row.getCell(9);
        const color = SIT_COLORS[u.situacao||'Ativo']||'#555';
        sitCell.font = { name:'Arial',size:9,bold:true,color:{argb:'FF'+color.replace('#','')} };
      });

      const tRow = ws.getRow(filtered.length+4);
      ws.mergeCells(`A${filtered.length+4}:K${filtered.length+4}`);
      tRow.getCell(1).value = `TOTAL: ${users.length}  |  ATIVOS: ${efetivo?.ativos||0}  |  AUSENTES: ${efetivo?.ausentes||0}`;
      tRow.getCell(1).font = { name:'Arial',size:9,bold:true }; tRow.getCell(1).fill = { type:'pattern',pattern:'solid',fgColor:{argb:'FFE8E4D0'} }; tRow.getCell(1).alignment={horizontal:'center'}; tRow.getCell(1).border={top:{style:'medium',color:{argb:'FF2a4020'}}}; tRow.height = 20;
      ws.views = [{state:'frozen',ySplit:3}];

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), `militares_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('✓ Planilha exportada!');
    } catch(err) { console.error(err); toast.error('Erro ao exportar'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">👥 <span>Banco de Dados</span> de Militares</h1>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={exportExcel}>📊 Excel</button>
          <button className="btn btn-primary" onClick={openCreate} id="btn-add-mil">+ Cadastrar Militar</button>
        </div>
      </div>

      {/* Efetivo cards */}
      {efetivo && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card"><div className="admin-stat-icon">🎖</div><div className="admin-stat-body"><span className="admin-stat-num">{efetivo.total}</span><span className="admin-stat-label">Total Cadastrados</span></div></div>
          <div className="admin-stat-card"><div className="admin-stat-icon">✅</div><div className="admin-stat-body"><span className="admin-stat-num" style={{color:'#27ae60'}}>{efetivo.ativos}</span><span className="admin-stat-label">Presentes / Ativos</span></div></div>
          <div className="admin-stat-card"><div className="admin-stat-icon">⚠</div><div className="admin-stat-body"><span className="admin-stat-num" style={{color:'#e67e22'}}>{efetivo.ausentes}</span><span className="admin-stat-label">Ausentes</span></div></div>
          <div className="admin-stat-card"><div className="admin-stat-icon">🏥</div><div className="admin-stat-body"><span className="admin-stat-num" style={{color:'#c0392b'}}>{(efetivo.breakdown||[]).find(b=>b._id==='Hospital')?.count||0}</span><span className="admin-stat-label">Hospital</span></div></div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'flex-end'}}>
        <input className="form-control" style={{flex:1,minWidth:200}} placeholder="🔍 Buscar por nome, nome de guerra ou número..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="form-control" style={{width:160}} value={filterSit} onChange={e=>setFilterSit(e.target.value)}>
          <option value="">Todas situações</option>
          {SITUACOES.map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="form-control" style={{width:140}} value={filterPel} onChange={e=>setFilterPel(e.target.value)}>
          <option value="">Todos pelotões</option>
          {pelotoes.map(p=><option key={p}>{p}</option>)}
        </select>
        {(search||filterSit||filterPel) && <button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setFilterSit('');setFilterPel('');}}>✕ Limpar</button>}
      </div>

      <div className="card" style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
        <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch', minWidth:0}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.78rem'}}>
            <thead>
              <tr>
                {['#','Nº','Nome de Guerra','Nome Completo','Posto/Grad.','Pelotão','Cia','Função','Situação','Status','Ações'].map(h=>(
                  <th key={h} style={{background:'var(--bg-dark)',fontFamily:'var(--font-display)',fontSize:'0.55rem',color:'var(--accent)',letterSpacing:'0.07em',textTransform:'uppercase',padding:'8px 10px',borderBottom:'1px solid var(--border)',textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={11}><div className="empty-state"><div className="empty-state-icon">👥</div><p className="empty-state-text">{users.length?'Nenhum resultado':'Nenhum militar cadastrado'}</p></div></td></tr>
              ) : filtered.map((u,i) => (
                <tr key={u._id} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>setShowDetail(u)} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{padding:'8px 10px',color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'0.65rem'}}>{String(i+1).padStart(3,'0')}</td>
                  <td style={{padding:'8px 10px',fontFamily:'var(--font-mono)',fontSize:'0.68rem',color:'var(--text-muted)'}}>{u.warNumber}</td>
                  <td style={{padding:'8px 10px'}}><strong style={{fontFamily:'var(--font-display)',letterSpacing:'0.05em',color:'var(--text-primary)'}}>{u.warName}</strong></td>
                  <td style={{padding:'8px 10px',color:'var(--text-secondary)',fontSize:'0.72rem'}}>{u.nomeCompleto||'—'}</td>
                  <td style={{padding:'8px 10px'}}><span className="soldier-rank-badge" style={{fontSize:'0.55rem'}}>{u.rank}</span></td>
                  <td style={{padding:'8px 10px',color:'var(--text-muted)',fontSize:'0.72rem'}}>{u.pelotao||'—'}</td>
                  <td style={{padding:'8px 10px',color:'var(--text-muted)',fontSize:'0.72rem'}}>{u.companhia||'—'}</td>
                  <td style={{padding:'8px 10px',color:'var(--text-muted)',fontSize:'0.72rem'}}>{u.funcao||'—'}</td>
                  <td style={{padding:'8px 10px'}}>
                    <span style={{display:'inline-block',padding:'2px 8px',borderRadius:12,fontSize:'0.55rem',fontFamily:'var(--font-display)',letterSpacing:'0.05em',fontWeight:700,background:(SIT_COLORS[u.situacao||'Ativo']||'#555')+'22',color:SIT_COLORS[u.situacao||'Ativo']||'#555',border:`1px solid ${(SIT_COLORS[u.situacao||'Ativo']||'#555')}66`}}>
                      {u.situacao||'Ativo'}
                    </span>
                  </td>
                  <td style={{padding:'8px 10px'}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:'0.58rem',color:u.active?'#27ae60':'#666'}}>
                      <span style={{width:7,height:7,borderRadius:'50%',background:u.active?'#27ae60':'#666',flexShrink:0}} />
                      {u.active?'Ativo':'Inativo'}
                    </span>
                  </td>
                  <td style={{padding:'8px 10px'}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-ghost btn-xs" onClick={()=>openEdit(u)} title="Editar">✏</button>
                      <button className="btn btn-ghost btn-xs" onClick={()=>handleToggle(u)} title={u.active?'Desativar':'Ativar'} style={{color:u.active?'#e67e22':'#27ae60'}}>{u.active?'⏸':'▶'}</button>
                      <button className="btn btn-danger btn-xs" onClick={()=>handleDelete(u)} title="Remover">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={()=>setShowDetail(null)}>
          <div className="modal-content" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{showDetail.warName}</div>
                <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:2}}>{showDetail.rank} · Nº {showDetail.warNumber}</div>
              </div>
              <button className="modal-close" onClick={()=>setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="rg-2" style={{marginBottom:14}}>
                {[
                  ['Nome Completo',showDetail.nomeCompleto||'—'],
                  ['Posto/Graduação',showDetail.rank],
                  ['Número de Guerra',showDetail.warNumber],
                  ['Pelotão',showDetail.pelotao||'—'],
                  ['Companhia',showDetail.companhia||'—'],
                  ['Função',showDetail.funcao||'—'],
                  ['Situação',showDetail.situacao||'Ativo'],
                  ['Telefone',showDetail.telefone||'—'],
                ].map(([lbl,val])=>(
                  <div key={lbl}>
                    <div style={{fontSize:'0.56rem',color:'var(--text-muted)',fontFamily:'var(--font-display)',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:3}}>{lbl}</div>
                    <div style={{fontSize:'0.82rem',color:'var(--text-primary)'}}>{val}</div>
                  </div>
                ))}
              </div>
              {showDetail.observacoes && (
                <div style={{marginTop:14,padding:12,background:'var(--bg-dark)',borderRadius:4,fontSize:'0.78rem',color:'var(--text-secondary)',fontStyle:'italic'}}>
                  {showDetail.observacoes}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowDetail(null)}>Fechar</button>
              <button className="btn btn-primary" onClick={()=>{openEdit(showDetail);setShowDetail(null);}}>✏ Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal-content" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editUser?'Editar Militar':'Cadastrar Militar'}</div>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="rg-2" style={{marginBottom:12}}>
                  <div className="form-group">
                    <label className="form-label">Nº de Guerra *</label>
                    <input className="form-control" value={form.warNumber} onChange={e=>f('warNumber',e.target.value)} required disabled={!!editUser} placeholder="Ex: 12345" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nome de Guerra *</label>
                    <input className="form-control" value={form.warName} onChange={e=>f('warName',e.target.value.toUpperCase())} required placeholder="Ex: SILVA" />
                  </div>
                </div>
                <div className="form-group" style={{marginBottom:12}}>
                  <label className="form-label">Nome Completo</label>
                  <input className="form-control" value={form.nomeCompleto} onChange={e=>f('nomeCompleto',e.target.value)} placeholder="Ex: João da Silva Pereira" />
                </div>
                <div className="rg-3" style={{marginBottom:12}}>
                  <div className="form-group">
                    <label className="form-label">Posto/Grad. *</label>
                    <select className="form-control" value={form.rank} onChange={e=>f('rank',e.target.value)} required>
                      {RANKS.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Situação</label>
                    <select className="form-control" value={form.situacao} onChange={e=>f('situacao',e.target.value)}>
                      {SITUACOES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Função</label>
                    <input className="form-control" value={form.funcao} onChange={e=>f('funcao',e.target.value)} placeholder="Ex: Sgt Hipismo" />
                  </div>
                </div>
                <div className="rg-3" style={{marginBottom:12}}>
                  <div className="form-group">
                    <label className="form-label">Pelotão</label>
                    <input className="form-control" value={form.pelotao} onChange={e=>f('pelotao',e.target.value)} placeholder="Ex: 1º Pel" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Companhia</label>
                    <input className="form-control" value={form.companhia} onChange={e=>f('companhia',e.target.value)} placeholder="Ex: 1ª Cia" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input className="form-control" value={form.telefone} onChange={e=>f('telefone',e.target.value)} placeholder="(61) 9xxxx-xxxx" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" value={form.observacoes} onChange={e=>f('observacoes',e.target.value)} rows={2} placeholder="Restrições, informações adicionais..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Salvando...':'💾 Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
