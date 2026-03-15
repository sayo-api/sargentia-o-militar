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

const BRASAO_B64 = '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';

// Excel helpers
const xlTitle = (ws, title, subtitle, cols) => {
  const colLetter = String.fromCharCode(64 + cols);
  ws.mergeCells('A1:'+colLetter+'1');
  const t = ws.getCell('A1');
  t.value = title; t.font = { name:'Arial', size:12, bold:true, color:{argb:'FFFFFFFF'} };
  t.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1a2e12'} };
  t.alignment = { horizontal:'center', vertical:'middle' }; ws.getRow(1).height = 26;
  ws.mergeCells('A2:'+colLetter+'2');
  ws.getCell('A2').value = subtitle; ws.getCell('A2').font = { name:'Arial', size:9, italic:true };
  ws.getCell('A2').alignment = { horizontal:'center' }; ws.getRow(2).height = 16;
};
const xlHdr = (ws, hdrs) => {
  const r = ws.getRow(3); r.height = 20;
  hdrs.forEach((h,i) => { const c = r.getCell(i+1); c.value=h; c.font={name:'Arial',size:9,bold:true,color:{argb:'FFFFFFFF'}}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF2a4020'}}; c.alignment={horizontal:'center',vertical:'middle'}; c.border={bottom:{style:'medium',color:{argb:'FF6b7c5e'}},right:{style:'thin',color:{argb:'FF3a5a2a'}}}; });
};
const xlRow = (ws, vals, ri, even) => {
  const r = ws.getRow(ri); r.values = vals; r.height = 18;
  const bg = even ? 'FFF4F2EA' : 'FFFFFFFF';
  const bd = { top:{style:'hair',color:{argb:'FFCCCCCC'}}, bottom:{style:'hair',color:{argb:'FFCCCCCC'}}, left:{style:'thin',color:{argb:'FFCCCCCC'}}, right:{style:'thin',color:{argb:'FFCCCCCC'}} };
  r.eachCell(cell => { cell.font={name:'Arial',size:9}; cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}}; cell.border=bd; cell.alignment={vertical:'middle'}; });
  return r;
};
const xlSave = async (wb, name) => {
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), name);
};

// Word helpers
const brasaoImg = () => {
  const bin = atob(BRASAO_B64); const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return bytes;
};
const mkB = (t,sz=20) => new TextRun({text:t,bold:true,font:'Times New Roman',size:sz});
const mkN = (t,sz=20) => new TextRun({text:t,font:'Times New Roman',size:sz});
const mkCell = (text,width,isHdr=false) => {
  const cb={style:BorderStyle.SINGLE,size:1,color:'CCCCCC'};
  return new TableCell({ width:{size:width,type:WidthType.DXA}, borders:{top:cb,bottom:cb,left:cb,right:cb}, margins:{top:60,bottom:60,left:100,right:100}, children:[new Paragraph({children:[isHdr?mkB(text,17):mkN(text,17)],spacing:{after:0}})] });
};
const mkSec = txt => new Paragraph({ border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'444444',space:1}}, spacing:{before:160,after:100}, children:[mkB(txt,20)] });
const A4p = { page:{ size:{width:11906,height:16838}, margin:{top:1000,right:1000,bottom:1000,left:1000} } };
const mkHdr = (title, subtitle) => [
  new Paragraph({ alignment:AlignmentType.CENTER, children:[new ImageRun({data:brasaoImg(),transformation:{width:65,height:65},type:'jpg'})], spacing:{after:80} }),
  new Paragraph({ alignment:AlignmentType.CENTER, children:[mkB('MINISTERIO DA DEFESA - EXERCITO BRASILEIRO',20)], spacing:{after:30} }),
  new Paragraph({ alignment:AlignmentType.CENTER, border:{bottom:{style:BorderStyle.SINGLE,size:6,color:'2a4020',space:1}}, children:[mkB(title,22)], spacing:{before:80,after:120} }),
  new Paragraph({ alignment:AlignmentType.CENTER, children:[mkN(subtitle||`Gerado: ${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`)], spacing:{after:160} }),
];

const TABS = [
  { id: 'geral', label: '📊 Visão Geral' },
  { id: 'ranking', label: '🏆 Ranking' },
  { id: 'ausencia', label: '⏳ Ausências' },
  { id: 'conflitos', label: '⚠ Conflitos' },
  { id: 'historico', label: '📅 Histórico Global' },
];

export default function AdminRelatoriosPage() {
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [conflicts, setConflicts] = useState({ conflicts: [], consecutiveWarnings: [] });
  const [rankDays, setRankDays] = useState(30);
  const [allSchedules, setAllSchedules] = useState([]);
  const [histSearch, setHistSearch] = useState('');
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, rankRes, weeklyRes, conflRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get(`/stats/ranking?days=${rankDays}`),
        api.get('/stats/weekly?weeks=8'),
        api.get('/stats/conflicts'),
      ]);
      setDashData(dashRes.data);
      setRanking(rankRes.data);
      setWeekly(weeklyRes.data);
      setConflicts(conflRes.data);
    } catch {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }, [rankDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (histFrom) params.append('from', histFrom);
      if (histTo) params.append('to', histTo);
      params.append('limit', 200);
      const res = await api.get(`/schedules?${params}`);
      setAllSchedules(res.data);
    } catch {
      toast.error('Erro ao buscar histórico');
    }
  }, [histFrom, histTo]);

  useEffect(() => {
    if (activeTab === 'historico') fetchHistory();
  }, [activeTab, fetchHistory]);


  const [exporting, setExporting] = useState('');

  // === EXPORT GERAL EXCEL ===
  const exportGeralExcel = async () => {
    if(!dashData) return; setExporting('geral-xl');
    try {
      const wb = new ExcelJS.Workbook(); wb.creator='SIM';
      const ws1 = wb.addWorksheet('Resumo'); ws1.columns=[{width:36},{width:18}];
      xlTitle(ws1,'RELATORIO GERAL',`Gerado: ${new Date().toLocaleString('pt-BR')}`,2);
      xlHdr(ws1,['Indicador','Valor']);
      [[`Militares Ativos`,dashData.activeUsers??dashData.totalUsers],[`Total Escalas`,dashData.totalSchedules],[`Conflitos`,dashData.conflicts?.length||0],[`Sem servico +14d`,(dashData.waitingList||[]).filter(w=>w.daysSince>14).length]].forEach((r,i)=>xlRow(ws1,r,i+4,i%2===0));
      const ws2=wb.addWorksheet('Por Semana'); ws2.columns=[{width:12},{width:16},{width:16},{width:14}];
      xlTitle(ws2,'ESCALAS POR SEMANA (Ult. 8)',`Gerado: ${new Date().toLocaleDateString('pt-BR')}`,4);
      xlHdr(ws2,['Semana','Inicio','Fim','Escalas']);
      weekly.forEach((w,i)=>xlRow(ws2,[w.label,new Date(w.weekStart).toLocaleDateString('pt-BR'),new Date(w.weekEnd).toLocaleDateString('pt-BR'),w.count],i+4,i%2===0));
      ws1.views=[{state:'frozen',ySplit:3}]; ws2.views=[{state:'frozen',ySplit:3}];
      await xlSave(wb,`relatorio_geral_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Relatorio Excel exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT GERAL WORD ===
  const exportGeralWord = async () => {
    if(!dashData) return; setExporting('geral-w');
    try {
      const ch=[...mkHdr('RELATORIO GERAL DO SISTEMA')];
      ch.push(mkSec('RESUMO EXECUTIVO'));
      ch.push(new Table({width:{size:8640,type:WidthType.DXA},columnWidths:[5440,3200],rows:[
        new TableRow({children:[mkCell('Indicador',5440,true),mkCell('Valor',3200,true)]}),
        ...[['Militares Ativos',String(dashData.activeUsers??dashData.totalUsers)],['Total Escalas',String(dashData.totalSchedules)],['Conflitos Detectados',String(dashData.conflicts?.length||0)],['Sem servico +14d',String((dashData.waitingList||[]).filter(w=>w.daysSince>14).length)]].map(([k,v])=>new TableRow({children:[mkCell(k,5440),mkCell(v,3200)]})),
      ]}));
      ch.push(mkSec('ATIVIDADE SEMANAL'));
      weekly.forEach(w=>ch.push(new Paragraph({children:[mkB(`${w.label}: `,18),mkN(`${w.count} escalas`,18)],spacing:{after:40}})));
      if((dashData.waitingList||[]).length>0){
        ch.push(mkSec('MILITARES SEM SERVICO'));
        ch.push(new Table({width:{size:8640,type:WidthType.DXA},columnWidths:[2800,3000,1620,1220],rows:[
          new TableRow({children:[mkCell('Militar',2800,true),mkCell('Posto',3000,true),mkCell('Dias',1620,true),mkCell('Ultimo',1220,true)]}),
          ...(dashData.waitingList||[]).map(w=>new TableRow({children:[mkCell(w.user?.warName||'--',2800),mkCell(w.user?.rank||'--',3000),mkCell(w.daysSince===9999?'Nunca':`${w.daysSince}d`,1620),mkCell(w.lastDate?format(new Date(w.lastDate),'dd/MM/yyyy'):'--',1220)]})),
        ]}));
      }
      const doc=new Document({sections:[{properties:A4p,children:ch}]});
      saveAs(await Packer.toBlob(doc),`relatorio_geral_${new Date().toISOString().slice(0,10)}.docx`);
      toast.success('Relatorio Word exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT RANKING EXCEL ===
  const exportRankingExcel = async () => {
    setExporting('rank-xl');
    try {
      const wb=new ExcelJS.Workbook();
      const ws=wb.addWorksheet('Ranking');
      ws.columns=[{width:5},{width:20},{width:26},{width:14},{width:14},{width:16},{width:14},{width:10}];
      xlTitle(ws,`RANKING DE MILITARES (${rankDays===9999?'Total':rankDays+'d'})`,`Gerado: ${new Date().toLocaleString('pt-BR')}`,8);
      xlHdr(ws,['#','Nome de Guerra','Posto/Grad.','Serv. Periodo','Total','Ultimo Servico','Dias s/serv.','Status']);
      ranking.forEach((r,i)=>{
        const row=xlRow(ws,[i+1,r.user?.warName||'--',r.user?.rank||'--',r.recent,r.total,r.lastDate?format(new Date(r.lastDate),'dd/MM/yyyy'):'Nunca',r.daysSince===9999?'Nunca':r.daysSince+'d',r.user?.active?'Ativo':'Inativo'],i+4,i%2===0);
        row.getCell(1).font={name:'Arial',size:9,bold:true,color:{argb:i===0?'FFFFD700':i===1?'FFC0C0C0':i===2?'FFCD7F32':'FF555555'}};
        if(r.daysSince>21) row.getCell(7).font={name:'Arial',size:9,bold:true,color:{argb:'FFe74c3c'}};
        else if(r.daysSince>14) row.getCell(7).font={name:'Arial',size:9,color:{argb:'FFe6a23c'}};
      });
      const tot=ws.getRow(ranking.length+4);
      ws.mergeCells(`A${ranking.length+4}:H${ranking.length+4}`);
      tot.getCell(1).value=`Total: ${ranking.length} militares | Ativos: ${ranking.filter(r=>r.user?.active).length}`;
      tot.getCell(1).font={name:'Arial',size:9,bold:true}; tot.getCell(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE8E4D0'}}; tot.getCell(1).alignment={horizontal:'center'}; tot.getCell(1).border={top:{style:'medium',color:{argb:'FF2a4020'}}}; tot.height=20;
      ws.views=[{state:'frozen',ySplit:3}];
      await xlSave(wb,`ranking_${rankDays}d_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Ranking Excel exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT RANKING WORD ===
  const exportRankingWord = async () => {
    setExporting('rank-w');
    try {
      const ch=[...mkHdr(`RANKING DE MILITARES - ${rankDays===9999?'TOTAL':rankDays+' DIAS'}`)];
      ch.push(mkSec('CLASSIFICACAO GERAL'));
      ch.push(new Table({width:{size:10640,type:WidthType.DXA},columnWidths:[500,2800,2600,1200,1200,2340],rows:[
        new TableRow({children:[mkCell('#',500,true),mkCell('Nome de Guerra',2800,true),mkCell('Posto',2600,true),mkCell('Periodo',1200,true),mkCell('Total',1200,true),mkCell('Ultimo Servico',2340,true)]}),
        ...ranking.map((r,i)=>new TableRow({children:[mkCell(String(i+1),500),mkCell(r.user?.warName||'--',2800),mkCell(r.user?.rank||'--',2600),mkCell(String(r.recent),1200),mkCell(String(r.total),1200),mkCell(r.lastDate?format(new Date(r.lastDate),'dd/MM/yyyy'):'Nunca',2340)]})),
      ]}));
      const doc=new Document({sections:[{properties:A4p,children:ch}]});
      saveAs(await Packer.toBlob(doc),`ranking_${new Date().toISOString().slice(0,10)}.docx`);
      toast.success('Ranking Word exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT AUSENCIA EXCEL ===
  const exportAusenciaExcel = async () => {
    if(!dashData) return; setExporting('aus-xl');
    try {
      const wb=new ExcelJS.Workbook();
      const ws=wb.addWorksheet('Ausencias');
      ws.columns=[{width:20},{width:26},{width:14},{width:18},{width:16},{width:16}];
      xlTitle(ws,'RELATORIO DE AUSENCIAS',`Gerado: ${new Date().toLocaleString('pt-BR')}`,6);
      xlHdr(ws,['Nome de Guerra','Posto/Grad.','N Guerra','Dias s/servico','Ultimo Servico','Situacao']);
      const list=(dashData.waitingList||[]).slice().sort((a,b)=>b.daysSince-a.daysSince);
      list.forEach((w,i)=>{
        const row=xlRow(ws,[w.user?.warName||'--',w.user?.rank||'--',w.user?.warNumber||'--',w.daysSince===9999?'NUNCA':w.daysSince+'d',w.lastDate?format(new Date(w.lastDate),'dd/MM/yyyy'):'--',w.daysSince>21?'CRITICO':w.daysSince>14?'ATENCAO':'OK'],i+4,i%2===0);
        if(w.daysSince>21){row.getCell(4).font={name:'Arial',size:9,bold:true,color:{argb:'FFe74c3c'}};row.getCell(6).font={name:'Arial',size:9,bold:true,color:{argb:'FFe74c3c'}};}
        else if(w.daysSince>14){row.getCell(4).font={name:'Arial',size:9,color:{argb:'FFe6a23c'}};row.getCell(6).font={name:'Arial',size:9,color:{argb:'FFe6a23c'}};}
      });
      if(conflicts.consecutiveWarnings.length>0){
        const ws2=wb.addWorksheet('Consecutivos'); ws2.columns=[{width:20},{width:26},{width:16},{width:16}];
        xlTitle(ws2,'ALERTAS - DIAS CONSECUTIVOS',`Gerado: ${new Date().toLocaleDateString('pt-BR')}`,4);
        xlHdr(ws2,['Militar','Posto','Data 1','Data 2']);
        conflicts.consecutiveWarnings.forEach((w,i)=>xlRow(ws2,[w.user?.warName||'--',w.user?.rank||'--',format(new Date(w.prevDate),'dd/MM/yyyy'),format(new Date(w.date),'dd/MM/yyyy')],i+4,i%2===0));
      }
      ws.views=[{state:'frozen',ySplit:3}];
      await xlSave(wb,`ausencias_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Ausencias Excel exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT AUSENCIA WORD ===
  const exportAusenciaWord = async () => {
    if(!dashData) return; setExporting('aus-w');
    try {
      const ch=[...mkHdr('RELATORIO DE AUSENCIAS E ALERTAS')];
      ch.push(mkSec('MILITARES COM MAIOR PERIODO SEM SERVICO'));
      const list=(dashData.waitingList||[]).slice().sort((a,b)=>b.daysSince-a.daysSince);
      if(list.length>0) ch.push(new Table({width:{size:8640,type:WidthType.DXA},columnWidths:[2800,2800,1800,1240],rows:[
        new TableRow({children:[mkCell('Militar',2800,true),mkCell('Posto',2800,true),mkCell('Dias s/servico',1800,true),mkCell('Ultimo',1240,true)]}),
        ...list.map(w=>new TableRow({children:[mkCell(w.user?.warName||'--',2800),mkCell(w.user?.rank||'--',2800),mkCell(w.daysSince===9999?'NUNCA SERVIU':`${w.daysSince} dias`,1800),mkCell(w.lastDate?format(new Date(w.lastDate),'dd/MM/yyyy'):'--',1240)]})),
      ]}));
      if(conflicts.consecutiveWarnings.length>0){
        ch.push(mkSec('AVISOS - DIAS CONSECUTIVOS'));
        conflicts.consecutiveWarnings.forEach(w=>ch.push(new Paragraph({children:[mkN(`- ${w.user?.warName} (${w.user?.rank}): ${format(new Date(w.prevDate),'dd/MM')} e ${format(new Date(w.date),'dd/MM/yyyy')}`,18)],spacing:{after:40}})));
      }
      const alerta=list.filter(w=>w.daysSince>14).length;
      if(alerta>0) ch.push(new Paragraph({children:[mkB(`ATENCAO: ${alerta} militar(es) necessita(m) de escalacao urgente.`,18)],spacing:{before:120,after:60}}));
      const doc=new Document({sections:[{properties:A4p,children:ch}]});
      saveAs(await Packer.toBlob(doc),`ausencias_${new Date().toISOString().slice(0,10)}.docx`);
      toast.success('Ausencias Word exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT CONFLITOS EXCEL ===
  const exportConflitosExcel = async () => {
    setExporting('conf-xl');
    try {
      const wb=new ExcelJS.Workbook();
      const ws=wb.addWorksheet('Conflitos');
      ws.columns=[{width:14},{width:20},{width:24},{width:24},{width:20}];
      xlTitle(ws,'RELATORIO DE CONFLITOS DE ESCALA',`Total: ${conflicts.conflicts.length+conflicts.consecutiveWarnings.length} - Gerado: ${new Date().toLocaleString('pt-BR')}`,5);
      xlHdr(ws,['Data','Militar','Funcao 1','Funcao 2','Tipo']);
      let ri=4;
      conflicts.conflicts.forEach((c,i)=>{const row=xlRow(ws,[format(new Date(c.date),'dd/MM/yyyy'),c.user?.warName||'--',c.duty1||'--',c.duty2||'--','CONFLITO DIRETO'],ri++,i%2===0);row.eachCell(cell=>{cell.font={name:'Arial',size:9,bold:true,color:{argb:'FFe74c3c'}};});});
      conflicts.consecutiveWarnings.forEach((w,i)=>{const row=xlRow(ws,[format(new Date(w.date),'dd/MM/yyyy'),w.user?.warName||'--',format(new Date(w.prevDate),'dd/MM/yyyy'),'--','DIAS CONSECUTIVOS'],ri++,i%2===0);row.eachCell(cell=>{cell.font={name:'Arial',size:9,color:{argb:'FFe6a23c'}};});});
      if(ri===4){const r=ws.getRow(4);r.values=['--','--','--','--','NENHUM CONFLITO DETECTADO'];r.getCell(5).font={name:'Arial',size:9,bold:true,color:{argb:'FF27ae60'}};}
      ws.views=[{state:'frozen',ySplit:3}];
      await xlSave(wb,`conflitos_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Conflitos Excel exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT CONFLITOS WORD ===
  const exportConflitosWord = async () => {
    setExporting('conf-w');
    try {
      const ch=[...mkHdr('RELATORIO DE CONFLITOS DE ESCALA')];
      ch.push(new Paragraph({children:[mkN(`Total de ocorrencias: ${conflicts.conflicts.length+conflicts.consecutiveWarnings.length}`,18)],spacing:{after:120}}));
      if(conflicts.conflicts.length>0){
        ch.push(mkSec(`CONFLITOS DIRETOS (${conflicts.conflicts.length})`));
        ch.push(new Table({width:{size:8640,type:WidthType.DXA},columnWidths:[1600,2800,2240,2000],rows:[
          new TableRow({children:[mkCell('Data',1600,true),mkCell('Militar',2800,true),mkCell('Funcao 1',2240,true),mkCell('Funcao 2',2000,true)]}),
          ...conflicts.conflicts.map(c=>new TableRow({children:[mkCell(format(new Date(c.date),'dd/MM/yyyy'),1600),mkCell(`${c.user?.rank||''} ${c.user?.warName||'--'}`,2800),mkCell(c.duty1||'--',2240),mkCell(c.duty2||'--',2000)]})),
        ]}));
      }
      if(conflicts.consecutiveWarnings.length>0){
        ch.push(mkSec(`ALERTAS DIAS CONSECUTIVOS (${conflicts.consecutiveWarnings.length})`));
        conflicts.consecutiveWarnings.forEach(w=>ch.push(new Paragraph({children:[mkN(`- ${w.user?.rank||''} ${w.user?.warName||'--'}: ${format(new Date(w.prevDate),'dd/MM')} e ${format(new Date(w.date),'dd/MM/yyyy')}`,18)],spacing:{after:40}})));
      }
      if(conflicts.conflicts.length===0&&conflicts.consecutiveWarnings.length===0) ch.push(new Paragraph({children:[mkN('Nenhum conflito detectado no periodo analisado.',18)],spacing:{after:60}}));
      const doc=new Document({sections:[{properties:A4p,children:ch}]});
      saveAs(await Packer.toBlob(doc),`conflitos_${new Date().toISOString().slice(0,10)}.docx`);
      toast.success('Conflitos Word exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT HISTORICO EXCEL ===
  const exportHistoricoExcel = async () => {
    if(!filteredSchedules.length){toast.error('Nenhum dado');return;} setExporting('hist-xl');
    try {
      const wb=new ExcelJS.Workbook();
      const ws=wb.addWorksheet('Historico de Escalas');
      ws.columns=[{width:12},{width:16},{width:18},{width:28},{width:14},{width:24},{width:30}];
      xlTitle(ws,'HISTORICO DE ESCALAS DE SERVICO',`Periodo: ${histFrom||'inicio'} a ${histTo||'hoje'} - ${filteredSchedules.length} registros`,7);
      xlHdr(ws,['Data','Dia da Semana','Nome de Guerra','Nome Completo','Posto/Grad.','Funcao/Servico','Observacoes']);
      let ri=4;
      const DIAS=['Domingo','Segunda-Feira','Terca-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sabado'];
      filteredSchedules.forEach(s=>{
        s.soldiers.forEach((sol,i)=>{
          xlRow(ws,[format(new Date(s.date),'dd/MM/yyyy'),DIAS[new Date(s.date).getDay()],sol.user?.warName||'--',sol.user?.nomeCompleto||'--',sol.user?.rank||'--',sol.duty||'--',i===0?(s.notes||''):''],ri++,(ri-4)%2===0);
        });
      });
      ws.views=[{state:'frozen',ySplit:3}];
      await xlSave(wb,`historico_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Historico Excel exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  // === EXPORT HISTORICO WORD ===
  const exportHistoricoWord = async () => {
    if(!filteredSchedules.length){toast.error('Nenhum dado');return;} setExporting('hist-w');
    try {
      const ch=[...mkHdr('HISTORICO DE ESCALAS DE SERVICO',`Periodo: ${histFrom||'inicio'} a ${histTo||'hoje'} | ${filteredSchedules.length} registros`)];
      ch.push(mkSec('RELACAO DE ESCALAS REALIZADAS'));
      const rows=[new TableRow({children:[mkCell('Data',1400,true),mkCell('Militar',2600,true),mkCell('Posto',2200,true),mkCell('Servico',2440,true)]})];
      let count=0;
      filteredSchedules.forEach(s=>{
        s.soldiers.forEach(sol=>{
          if(count>=200)return;
          rows.push(new TableRow({children:[mkCell(format(new Date(s.date),'dd/MM/yyyy'),1400),mkCell(sol.user?.warName||'--',2600),mkCell(sol.user?.rank||'--',2200),mkCell(sol.duty||'--',2440)]}));
          count++;
        });
      });
      ch.push(new Table({width:{size:8640,type:WidthType.DXA},columnWidths:[1400,2600,2200,2440],rows}));
      if(filteredSchedules.length>200||count>=200) ch.push(new Paragraph({children:[new TextRun({text:'Nota: limitado a 200 registros. Use Excel para lista completa.',italics:true,font:'Times New Roman',size:16,color:'888888'})],spacing:{before:80}}));
      const doc=new Document({sections:[{properties:A4p,children:ch}]});
      saveAs(await Packer.toBlob(doc),`historico_${new Date().toISOString().slice(0,10)}.docx`);
      toast.success('Historico Word exportado!');
    } catch(e){console.error(e);toast.error('Erro');} finally{setExporting('');}
  };

  const BtnExp = ({label,onClick,id}) => <button className="btn btn-outline btn-sm" onClick={onClick} disabled={!!exporting} style={{fontSize:'0.58rem',padding:'4px 10px',opacity:exporting&&exporting!==id?0.5:1}}>{exporting===id?'Exportando...':label}</button>;

  const maxRanking = ranking[0]?.total || 1;
  const maxWeekly = Math.max(...weekly.map(w => w.count), 1);

  const filteredSchedules = allSchedules.filter(s => {
    if (!histSearch) return true;
    return s.soldiers.some(sol =>
      sol.user?.warName?.toLowerCase().includes(histSearch.toLowerCase())
    );
  });

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📈 <span>Relatórios</span> e Estatísticas</h1>
        <button className="btn btn-outline btn-sm" onClick={fetchAll}>↻ Atualizar</button>
      </div>

      {/* Tabs */}
      <div className="rel-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`rel-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.id === 'conflitos' && conflicts.conflicts.length > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 6, fontSize: '0.5rem' }}>
                {conflicts.conflicts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── GERAL ── */}
      {activeTab === 'geral' && dashData && (
        <div className="fade-in">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">👥</div>
              <div className="admin-stat-body">
                <span className="admin-stat-num">{dashData.activeUsers}</span>
                <span className="admin-stat-label">Militares Ativos</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">📅</div>
              <div className="admin-stat-body">
                <span className="admin-stat-num">{dashData.totalSchedules}</span>
                <span className="admin-stat-label">Total de Escalas</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">⚠</div>
              <div className="admin-stat-body">
                <span className="admin-stat-num" style={{ color: conflicts.conflicts.length > 0 ? '#e74c3c' : undefined }}>
                  {conflicts.conflicts.length}
                </span>
                <span className="admin-stat-label">Conflitos Detectados</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">⏳</div>
              <div className="admin-stat-body">
                <span className="admin-stat-num">
                  {dashData.waitingList.filter(w => w.daysSince > 14).length}
                </span>
                <span className="admin-stat-label">Sem Serviço +14 dias</span>
              </div>
            </div>
          </div>

          <div className="admin-grid-2">
            {/* Weekly chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📊 Escalas por Semana (Últimas 8)</h3>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {weekly.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', width: 44, flexShrink: 0 }}>
                      {w.label}
                    </span>
                    <div style={{ flex: 1, height: 14, background: 'var(--bg-dark)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round(w.count / maxWeekly * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent-dark), var(--accent))',
                        borderRadius: 2,
                        minWidth: w.count > 0 ? 4 : 0,
                        transition: 'width .4s ease',
                      }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', width: 20, textAlign: 'right' }}>
                      {w.count}
                    </span>
                  </div>
                ))}
                {weekly.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem dados</p>}
              </div>
            </div>

            {/* Ranking preview */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🥇 Top 5 — Mais Serviços (30 dias)</h3>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {dashData.ranking.slice(0, 5).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.9rem',
                      color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-muted)',
                      width: 20, flexShrink: 0
                    }}>
                      {['🥇', '🥈', '🥉', '4°', '5°'][i]}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                      {r.user?.warName || '—'}
                    </span>
                    <span className="badge badge-success">{r.count} serv.</span>
                  </div>
                ))}
                {dashData.ranking.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem dados ainda</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RANKING ── */}
      {activeTab === 'ranking' && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3 className="card-title">🏆 Ranking Completo de Militares</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Período:</span>
                <select
                  className="form-control"
                  style={{ width: 120, padding: '4px 8px', fontSize: '0.72rem' }}
                  value={rankDays}
                  onChange={e => setRankDays(Number(e.target.value))}
                >
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={90}>90 dias</option>
                  <option value={365}>1 ano</option>
                  <option value={9999}>Total</option>
                </select>
              </div>
            </div>
            <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Nome de Guerra</th>
                    <th style={thStyle}>Posto/Grad.</th>
                    <th style={thStyle}>Total Serviços</th>
                    <th style={thStyle}>Serviços (Período)</th>
                    <th style={thStyle}>Último Serviço</th>
                    <th style={thStyle}>Dias sem serv.</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => (
                    <tr key={r.user._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.85rem',
                          color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-muted)',
                          fontWeight: 700,
                        }}>
                          {i + 1}°
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                          {r.user.warName}
                        </strong>
                      </td>
                      <td style={tdStyle}>
                        <span className="soldier-rank-badge" style={{ fontSize: '0.58rem' }}>
                          {r.user.rank}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className="badge badge-success">{r.total}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 8, background: 'var(--bg-dark)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round(r.recent / (ranking[0]?.recent || 1) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{r.recent}</span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {r.lastDate ? format(new Date(r.lastDate), 'dd/MM/yyyy') : '—'}
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${r.daysSince > 14 ? 'badge-danger' : r.daysSince > 7 ? 'badge-warning' : 'badge-success'}`}>
                          {r.daysSince === 9999 ? 'Nunca' : `${r.daysSince}d`}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${r.user.active ? 'badge-success' : ''}`}
                          style={!r.user.active ? { background: '#333', color: '#666' } : {}}>
                          {r.user.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar chart */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">📊 Distribuição Visual de Serviços</h3></div>
            <div style={{ padding: '14px 16px' }}>
              {ranking.slice(0, 15).map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {r.user.warName}
                  </span>
                  <div style={{ flex: 1, height: 16, background: 'var(--bg-dark)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.round(r.total / maxRanking * 100)}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, var(--accent-dark), var(--accent))`,
                      borderRadius: 2,
                      minWidth: r.total > 0 ? 4 : 0,
                    }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>
                    {r.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AUSÊNCIAS ── */}
      {activeTab === 'ausencia' && dashData && (
        <div className="fade-in admin-grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">⏳ Há Mais Tempo Sem Serviço</h3>
            </div>
            <div>
              {dashData.waitingList.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                      {w.user.warName}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {w.user.rank} · Nº {w.user.warNumber}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      Último: {w.lastDate ? format(new Date(w.lastDate), 'dd/MM/yyyy') : 'Nunca serviu'}
                    </div>
                  </div>
                  <span className={`badge ${w.daysSince > 21 ? 'badge-danger' : w.daysSince > 14 ? 'badge-warning' : 'badge-success'}`}>
                    {w.daysSince === 9999 ? 'Nunca' : `${w.daysSince}d`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🚨 Alertas de Ausência</h3>
            </div>
            <div style={{ padding: 16 }}>
              {dashData.waitingList.filter(w => w.daysSince > 14).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <p className="empty-state-text">Todos serviram nos últimos 14 dias</p>
                </div>
              ) : (
                dashData.waitingList.filter(w => w.daysSince > 14).map((w, i) => (
                  <div key={i} className="alert-item" style={{
                    background: w.daysSince > 21 ? 'rgba(231,76,60,.12)' : 'rgba(230,162,60,.1)',
                    border: `1px solid ${w.daysSince > 21 ? '#c0392b' : '#e6a23c'}`,
                    borderRadius: 4,
                    padding: '8px 12px',
                    marginBottom: 8,
                    fontSize: '0.75rem',
                    color: w.daysSince > 21 ? '#e74c3c' : '#e6a23c',
                  }}>
                    {w.daysSince > 21 ? '🔴' : '🟡'} <strong>{w.user.warName}</strong> — {w.daysSince === 9999 ? 'nunca realizou serviço' : `${w.daysSince} dias sem serviço`}
                  </div>
                ))
              )}

              {/* Consecutive warnings */}
              {conflicts.consecutiveWarnings.length > 0 && (
                <>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--accent)', letterSpacing: '0.08em', marginTop: 16, marginBottom: 8 }}>
                    DIAS CONSECUTIVOS
                  </h4>
                  {conflicts.consecutiveWarnings.slice(0, 5).map((w, i) => (
                    <div key={i} style={{ background: 'rgba(230,162,60,.1)', border: '1px solid #e6a23c', borderRadius: 4, padding: '8px 12px', marginBottom: 6, fontSize: '0.75rem', color: '#e6a23c' }}>
                      🟡 <strong>{w.user?.warName}</strong> — {format(new Date(w.prevDate), 'dd/MM')} e {format(new Date(w.date), 'dd/MM/yyyy')} (dias seguidos)
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONFLITOS ── */}
      {activeTab === 'conflitos' && (
        <div className="fade-in">
          <div style={{display:'flex',gap:8,marginBottom:14,justifyContent:'flex-end'}}><BtnExp label="📊 Excel" onClick={exportConflitosExcel} id="conf-xl" /><BtnExp label="📄 Word" onClick={exportConflitosWord} id="conf-w" /></div>
          {conflicts.conflicts.length === 0 && conflicts.consecutiveWarnings.length === 0 ? (
            <div className="card">
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                  Nenhum conflito de serviço detectado
                </p>
              </div>
            </div>
          ) : (
            <div className="admin-grid-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title" style={{ color: '#e74c3c' }}>🔴 Conflitos Diretos</h3>
                  <span className="badge badge-danger">{conflicts.conflicts.length}</span>
                </div>
                <div style={{ padding: 16 }}>
                  {conflicts.conflicts.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Nenhum conflito direto</p>
                  ) : (
                    conflicts.conflicts.map((c, i) => (
                      <div key={i} style={{ background: 'rgba(231,76,60,.12)', border: '1px solid #c0392b', borderRadius: 4, padding: '10px 12px', marginBottom: 8, fontSize: '0.75rem', color: '#e74c3c' }}>
                        <strong>{format(new Date(c.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}</strong><br />
                        ⚠ {c.user?.warName} escalado em 2 posições: <em>{c.duty1}</em> e <em>{c.duty2}</em>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title" style={{ color: '#e6a23c' }}>🟡 Dias Consecutivos</h3>
                  <span className="badge badge-warning">{conflicts.consecutiveWarnings.length}</span>
                </div>
                <div style={{ padding: 16 }}>
                  {conflicts.consecutiveWarnings.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Nenhum caso de dias consecutivos</p>
                  ) : (
                    conflicts.consecutiveWarnings.map((w, i) => (
                      <div key={i} style={{ background: 'rgba(230,162,60,.1)', border: '1px solid #e6a23c', borderRadius: 4, padding: '10px 12px', marginBottom: 8, fontSize: '0.75rem', color: '#e6a23c' }}>
                        <strong>{w.user?.warName}</strong> — {w.user?.rank}<br />
                        Serviu em: {format(new Date(w.prevDate), 'dd/MM')} e {format(new Date(w.date), 'dd/MM/yyyy')} (consecutivos)
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTÓRICO GLOBAL ── */}
      {activeTab === 'historico' && (
        <div className="fade-in">
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
              <label className="form-label">Buscar militar</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nome de guerra..."
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">De</label>
              <input type="date" className="form-control" value={histFrom} onChange={e => setHistFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Até</label>
              <input type="date" className="form-control" value={histTo} onChange={e => setHistTo(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={fetchHistory}>🔍 Filtrar</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setHistSearch(''); setHistFrom(''); setHistTo(''); }}>✕ Limpar</button>
          </div>

          <div className="card">
            <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Dia da Semana</th>
                    <th style={thStyle}>Militares Escalados</th>
                    <th style={thStyle}>Funções</th>
                    <th style={thStyle}>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Nenhum registro encontrado</td></tr>
                  ) : (
                    filteredSchedules.map(s => (
                      <tr key={s._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                          {format(new Date(s.date), 'dd/MM/yyyy')}
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {format(new Date(s.date), "EEEE", { locale: ptBR })}
                        </td>
                        <td style={tdStyle}>
                          {s.soldiers.map((sol, i) => (
                            <div key={i}>
                              <span className="soldier-rank-badge" style={{ fontSize: '0.52rem' }}>{sol.user?.rank?.split(' ')[0]}</span>
                              {' '}<strong style={{ fontSize: '0.75rem' }}>{sol.user?.warName}</strong>
                            </div>
                          ))}
                        </td>
                        <td style={tdStyle}>
                          {s.soldiers.map((sol, i) => (
                            <div key={i} className="badge badge-info" style={{ marginBottom: 2, display: 'inline-block' }}>
                              {sol.duty}
                            </div>
                          ))}
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {s.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  background: 'var(--bg-dark)',
  fontFamily: 'var(--font-display)',
  fontSize: '0.58rem',
  color: 'var(--accent)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '8px 12px',
  verticalAlign: 'middle',
};
