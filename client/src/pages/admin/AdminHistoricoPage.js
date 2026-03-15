import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import './AdminPages.css';
import './responsive.css';

const BRASAO_B64_H = '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';


export default function AdminHistoricoPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Erro ao carregar militares'))
      .finally(() => setLoadingUsers(false));
  }, []);

  const fetchHistory = useCallback(async (user) => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);

      const [histRes, rankRes] = await Promise.all([
        api.get(`/stats/history/${user._id}?${params}`),
        api.get('/stats/ranking?days=9999'),
      ]);
      setHistory(histRes.data);

      const myRank = rankRes.data.find(r => r.user._id === user._id);
      setStats(myRank || null);
    } catch {
      toast.error('Erro ao buscar histórico');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchHistory(user);
  };

  const filteredUsers = users.filter(u =>
    !search || (u.warName + u.rank + u.warNumber).toLowerCase().includes(search.toLowerCase())
  );


  const exportHistoricoExcel = async () => {
    if (!history.length) { toast.error('Selecione um militar com historico'); return; }
    try {
      const wb = new ExcelJS.Workbook(); wb.creator='SIM';
      const ws = wb.addWorksheet('Historico');
      ws.columns = [{width:12},{width:16},{width:20},{width:28},{width:14},{width:24}];
      ws.mergeCells('A1:F1'); const t=ws.getCell('A1');
      t.value=`HISTORICO DE SERVICOS - ${selectedUser?.warName||''}`;
      t.font={name:'Arial',size:12,bold:true,color:{argb:'FFFFFFFF'}};
      t.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1a2e12'}};
      t.alignment={horizontal:'center',vertical:'middle'}; ws.getRow(1).height=26;
      ws.mergeCells('A2:F2');
      ws.getCell('A2').value=`${selectedUser?.rank||''} | ${history.length} registros | Gerado: ${new Date().toLocaleString('pt-BR')}`;
      ws.getCell('A2').font={name:'Arial',size:9,italic:true}; ws.getCell('A2').alignment={horizontal:'center'}; ws.getRow(2).height=16;
      const hdr=ws.getRow(3); hdr.height=20;
      ['Data','Dia da Semana','Nome de Guerra','Nome Completo','Posto/Grad.','Funcao/Servico'].forEach((h,i)=>{
        const c=hdr.getCell(i+1); c.value=h; c.font={name:'Arial',size:9,bold:true,color:{argb:'FFFFFFFF'}};
        c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF2a4020'}};
        c.alignment={horizontal:'center',vertical:'middle'};
        c.border={bottom:{style:'medium',color:{argb:'FF6b7c5e'}},right:{style:'thin',color:{argb:'FF3a5a2a'}}};
      });
      const DIAS=['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'];
      history.forEach((h,i)=>{
        const r=ws.getRow(i+4); r.height=18;
        r.values=[format(new Date(h.date),'dd/MM/yyyy'),DIAS[new Date(h.date).getDay()],selectedUser?.warName||'--',selectedUser?.nomeCompleto||'--',selectedUser?.rank||'--',h.duty||'--'];
        const bg=i%2===0?'FFF4F2EA':'FFFFFFFF';
        const bd={top:{style:'hair',color:{argb:'FFCCCCCC'}},bottom:{style:'hair',color:{argb:'FFCCCCCC'}},left:{style:'thin',color:{argb:'FFCCCCCC'}},right:{style:'thin',color:{argb:'FFCCCCCC'}}};
        r.eachCell(cell=>{cell.font={name:'Arial',size:9};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}};cell.border=bd;cell.alignment={vertical:'middle'};});
      });
      const sRow=ws.getRow(history.length+4);
      ws.mergeCells(`A${history.length+4}:F${history.length+4}`);
      sRow.getCell(1).value=`Total: ${history.length} servicos | Ultimo: ${stats?.lastDate?format(new Date(stats.lastDate),'dd/MM/yyyy'):'--'}`;
      sRow.getCell(1).font={name:'Arial',size:9,bold:true}; sRow.getCell(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE8E4D0'}}; sRow.getCell(1).alignment={horizontal:'center'}; sRow.getCell(1).border={top:{style:'medium',color:{argb:'FF2a4020'}}}; sRow.height=20;
      ws.views=[{state:'frozen',ySplit:3}];
      const buf=await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`historico_${selectedUser?.warName||'militar'}_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Historico Excel exportado!');
    } catch(e){console.error(e);toast.error('Erro ao exportar');}
  };

  const exportHistoricoWord = async () => {
    if (!history.length || !selectedUser) { toast.error('Selecione um militar com historico'); return; }
    try {
      const bin=atob('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'); const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
      const mkB=(t,sz=20)=>new TextRun({text:t,bold:true,font:'Times New Roman',size:sz});
      const mkN=(t,sz=20)=>new TextRun({text:t,font:'Times New Roman',size:sz});
      const cb={style:BorderStyle.SINGLE,size:1,color:'CCCCCC'};
      const mkCell=(t,w,hd=false)=>new TableCell({width:{size:w,type:WidthType.DXA},borders:{top:cb,bottom:cb,left:cb,right:cb},margins:{top:60,bottom:60,left:100,right:100},children:[new Paragraph({children:[hd?mkB(t,17):mkN(t,17)],spacing:{after:0}})]});
      const A4p={page:{size:{width:11906,height:16838},margin:{top:1000,right:1000,bottom:1000,left:1000}}};
      const children=[
        new Paragraph({alignment:AlignmentType.CENTER,children:[new ImageRun({data:bytes,transformation:{width:65,height:65},type:'jpg'})],spacing:{after:80}}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[mkB('MINISTERIO DA DEFESA - EXERCITO BRASILEIRO',20)],spacing:{after:30}}),
        new Paragraph({alignment:AlignmentType.CENTER,border:{bottom:{style:BorderStyle.SINGLE,size:6,color:'2a4020',space:1}},children:[mkB('HISTORICO INDIVIDUAL DE SERVICOS',22)],spacing:{before:80,after:80}}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[mkN(`${selectedUser.rank} ${selectedUser.warName}`)],spacing:{after:40}}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[mkN(`Total: ${history.length} servicos | Gerado: ${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`)],spacing:{after:160}}),
      ];
      if(stats) {
        children.push(new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'444444',space:1}},spacing:{before:80,after:100},children:[mkB('RESUMO ESTATISTICO',20)]}));
        children.push(new Table({width:{size:8640,type:WidthType.DXA},columnWidths:[4320,4320],rows:[
          new TableRow({children:[mkCell('Total de Servicos',4320,true),mkCell(String(stats.total),4320)]}),
          new TableRow({children:[mkCell('Servicos (Ult. 30 dias)',4320,true),mkCell(String(stats.recent),4320)]}),
          new TableRow({children:[mkCell('Dias sem Servico',4320,true),mkCell(stats.daysSince===9999?'Nunca serviu':`${stats.daysSince} dias`,4320)]}),
          new TableRow({children:[mkCell('Ultimo Servico',4320,true),mkCell(stats.lastDate?format(new Date(stats.lastDate),'dd/MM/yyyy'):'Nunca',4320)]}),
        ]}));
        children.push(new Paragraph({children:[],spacing:{after:120}}));
      }
      children.push(new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'444444',space:1}},spacing:{before:80,after:100},children:[mkB(`HISTORICO DETALHADO (${history.length} servicos)`,20)]}));
      const DIAS=['Domingo','Segunda-Feira','Terca-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sabado'];
      const rows=[new TableRow({children:[mkCell('Data',1600,true),mkCell('Dia',2200,true),mkCell('Funcao/Servico',4840,true)]})];
      history.forEach(h=>rows.push(new TableRow({children:[mkCell(format(new Date(h.date),'dd/MM/yyyy'),1600),mkCell(DIAS[new Date(h.date).getDay()],2200),mkCell(h.duty||'Servico',4840)]})));
      children.push(new Table({width:{size:8640,type:WidthType.DXA},columnWidths:[1600,2200,4840],rows}));
      const doc=new Document({sections:[{properties:A4p,children}]});
      saveAs(await Packer.toBlob(doc),`historico_${selectedUser.warName}_${new Date().toISOString().slice(0,10)}.docx`);
      toast.success('Historico Word exportado!');
    } catch(e){console.error(e);toast.error('Erro ao exportar Word');}
  };

  const dutyColors = (duty) => {
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📅 <span>Histórico</span> de Serviços</h1>
        <span className="admin-date">Por Military Individual</span>
      </div>

      <div className="schedule-admin-layout" style={{ gap: 16 }}>
        {/* Soldier list */}
        <div>
          <div className="card" className="hist-list-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <h3 className="card-title">👥 Selecionar Militar</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                {users.filter(u => u.active).length} ativos
              </span>
            </div>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: '0.78rem' }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingUsers ? (
                <div className="loading-center"><div className="spinner" /></div>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <p className="empty-state-text">Nenhum militar encontrado</p>
                </div>
              ) : (
                filteredUsers.map(u => (
                  <div
                    key={u._id}
                    className={`soldier-select-item ${selectedUser?._id === u._id ? 'selected' : ''}`}
                    onClick={() => handleSelectUser(u)}
                    style={{ cursor: 'pointer', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', transition: 'all .15s' }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: selectedUser?._id === u._id ? 'var(--accent-dark)' : 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: '0.75rem',
                      color: 'var(--accent)', flexShrink: 0,
                    }}>
                      {u.warName?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--text-primary)', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.warName}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 1 }}>
                        {u.rank} · Nº {u.warNumber}
                      </div>
                    </div>
                    {!u.active && (
                      <span className="badge" style={{ background: '#333', color: '#666', fontSize: '0.45rem' }}>INATIVO</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* History panel */}
        <div style={{ flex: 1 }}>
          {!selectedUser ? (
            <div className="card" style={{ height: '100%' }}>
              <div className="empty-state" style={{ paddingTop: 80 }}>
                <div className="empty-state-icon">👈</div>
                <p className="empty-state-text">Selecione um militar para ver o histórico</p>
              </div>
            </div>
          ) : (
            <>
              {/* Soldier header */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--accent-dark)', border: '2px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--accent)',
                  }}>
                    {selectedUser.warName?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '0.08em' }}>
                      {selectedUser.warName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {selectedUser.rank} · Nº {selectedUser.warNumber}
                    </div>
                  </div>
                  {stats && (
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--accent)' }}>{stats.total}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--accent)' }}>{stats.recent}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>30 dias</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontFamily: 'var(--font-display)', fontSize: '1.6rem',
                          color: stats.daysSince > 14 ? '#e74c3c' : stats.daysSince > 7 ? '#e6a23c' : '#6b7c5e',
                        }}>
                          {stats.daysSince === 9999 ? '∞' : stats.daysSince}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dias sem serv.</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date filters */}
                <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">De</label>
                    <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Até</label>
                    <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => fetchHistory(selectedUser)}>Filtrar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setTimeout(() => fetchHistory(selectedUser), 50); }}>Limpar</button>
                <button className="btn btn-outline btn-sm" onClick={exportHistoricoExcel} disabled={!history.length}>📊 Excel</button>
                <button className="btn btn-outline btn-sm" onClick={exportHistoricoWord} disabled={!history.length}>📄 Word</button>
                </div>
              </div>

              {/* History list */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">📋 Serviços Realizados</h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {history.length} registro{history.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {loading ? (
                  <div className="loading-center" style={{ padding: 40 }}><div className="spinner" /></div>
                ) : history.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <p className="empty-state-text">Nenhum serviço encontrado para este período</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
                    {history.map((h, i) => (
                      <div key={h._id || i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px', borderBottom: '1px solid var(--border)',
                        transition: 'background .15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        {/* Day indicator */}
                        <div style={{
                          width: 44, height: 44, borderRadius: 6,
                          background: 'var(--bg-dark)', border: '1px solid var(--border)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--accent)', lineHeight: 1 }}>
                            {format(new Date(h.date), 'dd')}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {format(new Date(h.date), 'MMM', { locale: ptBR })}
                          </span>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: `${dutyColors(h.duty)}22`,
                              border: `1px solid ${dutyColors(h.duty)}88`,
                              color: dutyColors(h.duty),
                              fontFamily: 'var(--font-display)',
                              fontSize: '0.56rem',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                            }}>
                              {h.duty}
                            </span>
                          </div>
                          {h.notes && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>
                              {h.notes}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {format(new Date(h.date), "EEEE", { locale: ptBR })}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 1 }}>
                            {format(new Date(h.date), 'dd/MM/yyyy')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
