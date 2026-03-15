import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle, HeadingLevel,
  NumberingConfig, LevelFormat, IndentationLike } from 'docx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import './AdminPages.css';
import './responsive.css';

const BRASAO_B64 = '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';

const TEMPLATES = {
  blank: { name:'Em branco', html:'' },
  boletim: {
    name:'Boletim Interno',
    html:`<h1 style="text-align:center">ADITAMENTO AO BOLETIM INTERNO</h1>
<p style="text-align:center"><em>Brasília, [DATA]</em></p>
<p style="text-align:center">([DIA DA SEMANA])</p>
<hr>
<h2>1ª PARTE - SERVIÇOS DIÁRIOS</h2>
<p><strong>Data:</strong> [DATA]</p>
<table border="1" style="width:100%"><tr><th>Função</th><th>Militar</th></tr><tr><td>Sgt do Dia</td><td></td></tr><tr><td>Cb do Dia</td><td></td></tr><tr><td>Plantão</td><td></td></tr></table>
<h2>3ª PARTE - ASSUNTOS GERAIS</h2>
<p>De acordo com determinação do Chefe da Companhia, o Cb de Dia deverá recolher a etapa do café da manhã da Subunidade às 05:30 horas.</p>
<h2>4ª PARTE - JUSTIÇA E DISCIPLINA</h2>
<p>Justiça: S/A</p>
<p>Disciplina: S/A</p>`,
  },
  oficio: {
    name:'Ofício',
    html:`<p style="text-align:right">Brasília, [DATA]</p>
<p><strong>Ofício Nº [Nº]/[ANO]</strong></p>
<p>A Sua Excelência o Senhor<br>[DESTINATÁRIO]<br>[CARGO]</p>
<p style="text-indent:2em">Assunto: [ASSUNTO]</p>
<p style="text-indent:2em">Tenho a honra de dirigir-me a Vossa Excelência para [MOTIVO DO OFÍCIO].</p>
<p style="text-indent:2em">Aproveito a oportunidade para renovar a Vossa Excelência os protestos da mais alta consideração e estima.</p>
<p>Respeitosamente,</p>
<br><br>
<p>[NOME DO SIGNATÁRIO]<br>[POSTO/GRADUAÇÃO]<br>[CARGO]</p>`,
  },
  relatorio: {
    name:'Relatório',
    html:`<h1 style="text-align:center">RELATÓRIO</h1>
<h2>1. FINALIDADE</h2>
<p>[Descreva a finalidade deste relatório]</p>
<h2>2. REFERÊNCIA</h2>
<p>[Cite os documentos de referência]</p>
<h2>3. ANÁLISE</h2>
<p>[Desenvolva a análise]</p>
<h2>4. CONCLUSÃO</h2>
<p>[Apresente as conclusões]</p>
<h2>5. PROPOSTA DE SOLUÇÃO</h2>
<p>[Detalhe as propostas]</p>`,
  },
  ata: {
    name:'Ata de Reunião',
    html:`<h1 style="text-align:center">ATA DE REUNIÃO</h1>
<p><strong>Data:</strong> [DATA]</p>
<p><strong>Local:</strong> [LOCAL]</p>
<p><strong>Hora de início:</strong> [HORA]</p>
<p><strong>Participantes:</strong></p>
<ul><li>[NOME - POSTO/CARGO]</li></ul>
<h2>PAUTA</h2>
<ol><li>[ASSUNTO 1]</li><li>[ASSUNTO 2]</li></ol>
<h2>DELIBERAÇÕES</h2>
<p>[Descreva as deliberações]</p>
<p>Nada mais havendo a tratar, lavrou-se a presente ata que, após lida e aprovada, vai devidamente assinada.</p>`,
  },
};

const FONTS = ['Times New Roman','Arial','Calibri','Georgia','Verdana','Courier New'];

// Shared table border style
const _cbrd = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const BDS = { top: _cbrd, bottom: _cbrd, left: _cbrd, right: _cbrd };
const FONT_SIZES = [8,9,10,11,12,14,16,18,20,22,24,28,32,36,48,72];
const COLORS_BG = ['#ffffff','#f4f2ea','#fff9c4','#e8f5e9','#e3f2fd','#fce4ec','#1a2e12','#2a4020','#c0392b','#2980b9','#000000'];
const COLORS_TXT = ['#000000','#1a140a','#1a2e12','#c9a84c','#c0392b','#2980b9','#8e44ad','#ffffff','#555555','#e8e8e8'];

export default function AdminWordPage() {
  const editorRef = useRef(null);
  const [saved, setSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [showHeader, setShowHeader] = useState(true);
  const [docTitle, setDocTitle] = useState('DOCUMENTO OFICIAL');
  const [docUnidade, setDocUnidade] = useState('MINISTÉRIO DA DEFESA\nEXÉRCITO BRASILEIRO\nCOMANDO MILITAR DO PLANALTO');
  const [docLocal, setDocLocal] = useState('Brasília');
  const [docData, setDocData] = useState(new Date().toISOString().slice(0,10));
  const [docAssinante, setDocAssinante] = useState('');
  const [docCargo, setDocCargo] = useState('');
  const [fileName, setFileName] = useState('documento');
  const [activeTab, setActiveTab] = useState('editor');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutStep, setTutStep] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [currentFont, setCurrentFont] = useState('Times New Roman');
  const [currentSize, setCurrentSize] = useState(12);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [pageOrientation, setPageOrientation] = useState('portrait');

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    updateCounts();
    setSaved(false);
  }, []);

  const updateCounts = useCallback(() => {
    const text = editorRef.current?.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(text.length);
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '<p>Clique aqui e comece a digitar seu documento...</p>';
      updateCounts();
    }
    // Load autosave
    const saved = localStorage.getItem('word_editor_draft');
    if (saved && editorRef.current) {
      try {
        const data = JSON.parse(saved);
        if (data.html) editorRef.current.innerHTML = data.html;
        if (data.title) setDocTitle(data.title);
        if (data.assinante) setDocAssinante(data.assinante);
        if (data.cargo) setDocCargo(data.cargo);
        updateCounts();
      } catch {}
    }
  }, []);

  // Autosave every 30s
  useEffect(() => {
    const t = setInterval(() => {
      if (editorRef.current) {
        localStorage.setItem('word_editor_draft', JSON.stringify({
          html: editorRef.current.innerHTML,
          title: docTitle, assinante: docAssinante, cargo: docCargo,
          ts: Date.now(),
        }));
        setSaved(true);
      }
    }, 30000);
    return () => clearInterval(t);
  }, [docTitle, docAssinante, docCargo]);

  const insertTemplate = (key) => {
    const t = TEMPLATES[key];
    if (!t || !editorRef.current) return;
    if (t.html) editorRef.current.innerHTML = t.html;
    else editorRef.current.innerHTML = '<p></p>';
    updateCounts(); setSaved(false); setShowTemplates(false);
    toast.success('Template aplicado!');
  };

  const insertTable = () => {
    const rows = parseInt(prompt('Quantas linhas?', '3') || '3');
    const cols = parseInt(prompt('Quantas colunas?', '3') || '3');
    if (!rows || !cols) return;
    let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += r === 0
          ? '<th style="border:1px solid #999;padding:6px 10px;background:#2a4020;color:#fff;font-size:9pt">Cabeçalho</th>'
          : '<td style="border:1px solid #ccc;padding:6px 10px;font-size:9pt">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</table><p></p>';
    exec('insertHTML', html);
  };

  const insertBrasao = () => {
    exec('insertHTML', `<div style="text-align:center;margin:10px 0"><img src="data:image/jpeg;base64,${BRASAO_B64}" style="width:70px;height:70px;object-fit:contain" alt="Brasão"/></div><p></p>`);
  };

  const insertHr = () => exec('insertHTML', '<hr style="border:none;border-top:2px solid #2a4020;margin:14px 0"/><p></p>');
  const insertPageBreak = () => exec('insertHTML', '<div style="page-break-after:always;border-top:1px dashed #aaa;margin:14px 0;text-align:center;font-size:.65rem;color:#aaa">--- Quebra de Página ---</div><p></p>');

  const findReplace = () => {
    if (!findText || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const replaced = html.replace(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replaceText);
    editorRef.current.innerHTML = replaced;
    toast.success('Substituição concluída');
  };

  const setHeading = (level) => {
    exec('formatBlock', level === 0 ? 'p' : 'h' + level);
  };

  // ── EXPORT WORD ───────────────────────────────────────────────────────────────
  const exportWord = async () => {
    setExporting(true);
    try {
      if (!editorRef.current) return;
      const bin = atob(BRASAO_B64);
      const bytes = new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);

      const A4 = { page:{ size:{ width:11906, height: pageOrientation==='landscape'?11906:16838 }, margin:{ top:1134,right:1134,bottom:1134,left:1134 } } };

      const children = [];

      if (showHeader) {
        children.push(new Paragraph({ alignment:AlignmentType.CENTER, children:[new ImageRun({data:bytes,transformation:{width:70,height:70},type:'jpg'})], spacing:{after:80} }));
        docUnidade.split('\n').forEach(line => {
          children.push(new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({text:line,bold:true,font:'Times New Roman',size:22})], spacing:{after:30} }));
        });
        children.push(new Paragraph({
          alignment:AlignmentType.CENTER,
          border:{bottom:{style:BorderStyle.SINGLE,size:6,color:'2a4020',space:1}},
          children:[new TextRun({text:docTitle,bold:true,font:'Times New Roman',size:24})],
          spacing:{before:100,after:120},
        }));
        if (docLocal || docData) {
          const dateStr = docData ? new Date(docData+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '';
          children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`${docLocal}${dateStr?', '+dateStr:''}`,font:'Times New Roman',size:18,italics:true})],spacing:{after:140}}));
        }
      }

      // Parse HTML content
      const parser = new DOMParser();
      const dom = parser.parseFromString(editorRef.current.innerHTML, 'text/html');
      const nodeChildren = parseNodes(dom.body.childNodes, bytes);
      children.push(...nodeChildren);

      // Signature
      if (docAssinante) {
        children.push(new Paragraph({children:[],spacing:{after:600}}));
        children.push(new Paragraph({
          alignment:AlignmentType.CENTER,
          border:{top:{style:BorderStyle.SINGLE,size:4,color:'333333',space:1}},
          children:[new TextRun({text:docAssinante,bold:true,font:'Times New Roman',size:20})],
          spacing:{before:0,after:40},
        }));
        if (docCargo) children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:docCargo,italics:true,font:'Times New Roman',size:18})],spacing:{after:0}}));
      }

      const doc = new Document({ sections:[{ properties:A4, children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName||'documento'}_${new Date().toISOString().slice(0,10)}.docx`);
      setSaved(true);
      toast.success('✓ Word exportado com sucesso!');
    } catch(e) { console.error(e); toast.error('Erro ao exportar: ' + e.message); }
    finally { setExporting(false); }
  };

  function parseNodes(nodes, imgBytes) {
    const results = [];
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text.trim()) results.push(new Paragraph({children:[new TextRun({text,font:'Times New Roman',size:22})]}));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName?.toLowerCase();

      if (['p','div'].includes(tag)) {
        const runs = parseInlineNodes(node.childNodes);
        if (runs.length > 0 || node.innerHTML.trim() !== '') {
          const align = getAlign(node);
          results.push(new Paragraph({ alignment:align, children:runs.length?runs:[new TextRun('')], spacing:{after:60} }));
        } else {
          results.push(new Paragraph({children:[new TextRun('')],spacing:{after:60}}));
        }
      } else if (['h1','h2','h3','h4'].includes(tag)) {
        const lvl = parseInt(tag[1]);
        const runs = parseInlineNodes(node.childNodes);
        const sizeMap = {1:32,2:28,3:24,4:22};
        results.push(new Paragraph({
          alignment: getAlign(node),
          children: runs.length ? runs.map(r => ({ ...r, bold:true, size:sizeMap[lvl]||22 })) : [new TextRun({text:node.innerText,bold:true,font:'Times New Roman',size:sizeMap[lvl]||22})],
          spacing:{before:160,after:80},
          border: lvl<=2 ? {bottom:{style:BorderStyle.SINGLE,size:4,color:'2a4020',space:1}} : undefined,
        }));
      } else if (tag === 'table') {
        const docRows = [];
        node.querySelectorAll('tr').forEach(tr => {
          const cells = [];
          tr.querySelectorAll('th,td').forEach(td => {
            const isHdr = td.tagName.toLowerCase() === 'th';
            cells.push(new TableCell({
              width:{size:Math.floor(9000/tr.children.length),type:WidthType.DXA},
              borders: BDS, margins:{top:60,bottom:60,left:100,right:100},
              shading: isHdr ? {fill:'2a4020',type:'clear'} : undefined,
              children:[new Paragraph({children:[new TextRun({text:td.innerText||'',bold:isHdr,color:isHdr?'FFFFFF':undefined,font:'Times New Roman',size:18})],spacing:{after:0}})],
            }));
          });
          if (cells.length) docRows.push(new TableRow({children:cells}));
        });
        if (docRows.length) {
          const colCount = node.querySelector('tr')?.children.length || 1;
          results.push(new Table({width:{size:9000,type:WidthType.DXA},columnWidths:Array(colCount).fill(Math.floor(9000/colCount)),rows:docRows}));
          results.push(new Paragraph({children:[],spacing:{after:80}}));
        }
      } else if (tag === 'ul' || tag === 'ol') {
        node.querySelectorAll('li').forEach((li, idx) => {
          const bullet = tag === 'ul' ? '• ' : `${idx+1}. `;
          results.push(new Paragraph({children:[new TextRun({text:bullet+li.innerText,font:'Times New Roman',size:20})],spacing:{after:40},indent:{left:360}}));
        });
      } else if (tag === 'hr') {
        results.push(new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:6,color:'2a4020',space:1}},children:[],spacing:{before:100,after:100}}));
      } else if (tag === 'br') {
        results.push(new Paragraph({children:[],spacing:{after:0}}));
      } else if (node.childNodes.length) {
        results.push(...parseNodes(node.childNodes, imgBytes));
      }
    });
    return results;
  }

  function parseInlineNodes(nodes) {
    const runs = [];
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent) runs.push(new TextRun({text:node.textContent,font:'Times New Roman',size:22}));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName?.toLowerCase();
      const text = node.innerText || '';
      if (['strong','b'].includes(tag)) runs.push(new TextRun({text,bold:true,font:'Times New Roman',size:22}));
      else if (['em','i'].includes(tag)) runs.push(new TextRun({text,italics:true,font:'Times New Roman',size:22}));
      else if (tag === 'u') runs.push(new TextRun({text,underline:{},font:'Times New Roman',size:22}));
      else if (tag === 's') runs.push(new TextRun({text,strike:true,font:'Times New Roman',size:22}));
      else if (tag === 'span') {
        const style = node.style;
        runs.push(new TextRun({
          text, font: style.fontFamily?.replace(/['"]/g,'')||'Times New Roman',
          size: style.fontSize ? parseInt(style.fontSize)*2 : 22,
          bold: style.fontWeight==='bold'||style.fontWeight>='600',
          italics: style.fontStyle==='italic',
          color: style.color ? style.color.replace('#','') : undefined,
        }));
      } else if (node.childNodes.length) {
        runs.push(...parseInlineNodes(node.childNodes));
      } else if (text) {
        runs.push(new TextRun({text,font:'Times New Roman',size:22}));
      }
    });
    return runs;
  }

  function getAlign(node) {
    const ta = node.style?.textAlign || node.getAttribute?.('align') || '';
    if (ta==='center') return AlignmentType.CENTER;
    if (ta==='right') return AlignmentType.RIGHT;
    if (ta==='justify') return AlignmentType.BOTH;
    return AlignmentType.LEFT;
  }

  const TUTORIAL_STEPS = [
    { title:'✏️ Editor Avançado de Word', body:'Este editor funciona como o Microsoft Word diretamente no navegador. Clique na área de edição e comece a digitar. Todos os recursos de formatação estão na barra de ferramentas.', tip:'Ctrl+B = Negrito | Ctrl+I = Itálico | Ctrl+U = Sublinhado' },
    { title:'🎨 Formatação de Texto', body:'Selecione o texto e use a barra de ferramentas para: negrito, itálico, sublinhado, tachado, cor de texto, destaque, alinhamento e tamanho de fonte.', tip:'Primeiro selecione o texto, depois aplique a formatação' },
    { title:'📐 Parágrafos e Estilos', body:'Use o seletor de estilo (Normal, H1, H2...) para aplicar títulos e hierarquia ao documento. O recuo, espaçamento e listas ajudam a organizar o conteúdo.', tip:'H1 cria títulos grandes com linha divisória verde' },
    { title:'📊 Inserir Tabelas', body:'Clique em "Tabela" para inserir uma tabela interativa. O cabeçalho fica em verde militar automaticamente. Você pode editar diretamente na tabela.', tip:'Clique em qualquer célula da tabela para editar' },
    { title:'🎖 Brasão e Cabeçalho', body:'Na aba "Cabeçalho" configure a unidade, título, data e assinante. O Brasão de Armas da República aparece no topo do documento exportado.', tip:'Use "Inserir Brasão" para adicionar o brasão inline no texto também' },
    { title:'📋 Templates Prontos', body:'Clique em "Templates" para carregar modelos prontos: Boletim Interno, Ofício, Relatório e Ata de Reunião. Eles preenchem o editor com estrutura oficial.', tip:'Os textos em [COLCHETES] devem ser substituídos pelos dados reais' },
    { title:'📄 Exportar Word', body:'Clique em "📄 Exportar Word" para baixar o arquivo .docx. O documento exportado é idêntico ao que você vê, com brasão, tabelas, listas e formatação completa.', tip:'O arquivo exportado pode ser aberto no Word, Google Docs e LibreOffice' },
  ];

  return (
    <div className="page-container fade-in" style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      {/* TOP HEADER */}
      <div className="page-header" style={{ flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <input
            value={fileName}
            onChange={e=>setFileName(e.target.value)}
            style={{ background:'none',border:'none',borderBottom:'1px solid var(--border)',color:'var(--text-primary)',fontFamily:'var(--font-display)',fontSize:'1rem',letterSpacing:'0.06em',outline:'none',width:200,paddingBottom:2 }}
            title="Nome do arquivo"
          />
          <span style={{ fontSize:'.62rem',color:saved?'#27ae60':'#e6a23c',fontFamily:'var(--font-mono)' }}>
            {saved ? '● Salvo' : '● Não salvo'}
          </span>
        </div>
        <div style={{ display:'flex',gap:6,alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:'.6rem',color:'var(--text-muted)' }}>
            {wordCount} palavras · {charCount} chars
          </span>
          <select value={zoom} onChange={e=>setZoom(Number(e.target.value))}
            style={{ background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',padding:'3px 6px',fontSize:'.62rem',borderRadius:3 }}>
            {[75,90,100,125,150].map(z=><option key={z} value={z}>{z}%</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setShowTutorial(true);setTutStep(0);}}>❓ Ajuda</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowTemplates(true)}>📋 Templates</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowFindReplace(f=>!f)}>🔍 Localizar</button>
          <button className="btn btn-outline" onClick={()=>window.print()}>🖨 Imprimir</button>
          <button className="btn btn-primary" onClick={exportWord} disabled={exporting}>
            {exporting ? '⏳ Exportando...' : '📄 Exportar Word'}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex',gap:2,marginBottom:10,background:'var(--bg-dark)',border:'1px solid var(--border)',borderRadius:6,padding:3,width:'fit-content',flexShrink:0 }}>
        {[['editor','✏️ Editor'],['cabecalho','🎖 Cabeçalho'],['config','⚙️ Página']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:'6px 14px',borderRadius:4,border:'none',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:'.58rem',letterSpacing:'.07em',textTransform:'uppercase',transition:'all .15s',background:activeTab===id?'var(--accent)':'transparent',color:activeTab===id?'var(--bg-dark)':'var(--text-muted)',fontWeight:activeTab===id?700:'normal' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── EDITOR TAB ── */}
      {activeTab==='editor' && (
        <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
          {/* TOOLBAR */}
          <div style={{ background:'var(--bg-dark)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',marginBottom:8,display:'flex',gap:4,alignItems:'center',flexWrap:'wrap',flexShrink:0,overflowX:'auto',WebkitOverflowScrolling:'touch',paddingBottom:2 }}>
            {/* Paragraph style */}
            <select onChange={e=>setHeading(Number(e.target.value))} defaultValue="0"
              style={{ background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',padding:'3px 6px',fontSize:'.68rem',borderRadius:3,width:110 }}>
              <option value="0">Normal</option>
              {[1,2,3,4].map(h=><option key={h} value={h}>Título {h}</option>)}
            </select>

            {/* Font */}
            <select value={currentFont} onChange={e=>{setCurrentFont(e.target.value);exec('fontName',e.target.value);}}
              style={{ background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',padding:'3px 6px',fontSize:'.68rem',borderRadius:3,width:130 }}>
              {FONTS.map(f=><option key={f}>{f}</option>)}
            </select>

            {/* Font size */}
            <select value={currentSize} onChange={e=>{setCurrentSize(Number(e.target.value));exec('fontSize','3');}}
              style={{ background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',padding:'3px 6px',fontSize:'.68rem',borderRadius:3,width:56 }}>
              {FONT_SIZES.map(s=><option key={s}>{s}</option>)}
            </select>

            <div style={{ width:1,height:22,background:'var(--border)',margin:'0 3px' }} />

            {/* B I U S */}
            {[['B','bold',{fontWeight:700}],['I','italic',{fontStyle:'italic'}],['U','underline',{textDecoration:'underline'}],['S','strikeThrough',{textDecoration:'line-through'}]].map(([lbl,cmd,style])=>(
              <button key={cmd} onMouseDown={e=>{e.preventDefault();exec(cmd);}}
                style={{ padding:'3px 9px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontFamily:'var(--font-display)',fontSize:'.78rem',transition:'all .1s',...style }}
                title={`Ctrl+${lbl}`}>
                {lbl}
              </button>
            ))}

            <div style={{ width:1,height:22,background:'var(--border)',margin:'0 3px' }} />

            {/* Alignment */}
            {[['←','justifyLeft'],['↔','justifyFull'],['↔','justifyCenter'],['→','justifyRight']].map(([icon,cmd],i)=>(
              <button key={i} onMouseDown={e=>{e.preventDefault();exec(cmd);}}
                style={{ padding:'3px 8px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.85rem',transition:'all .1s' }}>
                {['←','◀▶','●','→'][i]}
              </button>
            ))}

            <div style={{ width:1,height:22,background:'var(--border)',margin:'0 3px' }} />

            {/* Lists */}
            <button onMouseDown={e=>{e.preventDefault();exec('insertUnorderedList');}} style={{ padding:'3px 8px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.75rem' }} title="Lista marcadores">• ≡</button>
            <button onMouseDown={e=>{e.preventDefault();exec('insertOrderedList');}} style={{ padding:'3px 8px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.75rem' }} title="Lista numerada">1. ≡</button>

            {/* Indent */}
            <button onMouseDown={e=>{e.preventDefault();exec('indent');}} style={{ padding:'3px 8px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.75rem' }} title="Aumentar recuo">→|</button>
            <button onMouseDown={e=>{e.preventDefault();exec('outdent');}} style={{ padding:'3px 8px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.75rem' }} title="Diminuir recuo">|←</button>

            <div style={{ width:1,height:22,background:'var(--border)',margin:'0 3px' }} />

            {/* Text color */}
            <div style={{ position:'relative' }}>
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>setShowColorPicker(p=>p==='text'?null:'text')}
                style={{ padding:'3px 9px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.65rem',fontFamily:'var(--font-display)' }}
                title="Cor do texto">
                A 🎨
              </button>
              {showColorPicker==='text' && (
                <div style={{ position:'absolute',top:'110%',left:0,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:4,padding:8,zIndex:100,display:'flex',flexWrap:'wrap',gap:4,width:132 }}>
                  {COLORS_TXT.map(c=>(
                    <div key={c} onClick={()=>{exec('foreColor',c);setShowColorPicker(null);}}
                      style={{ width:20,height:20,borderRadius:3,background:c,border:'1px solid #555',cursor:'pointer' }} />
                  ))}
                </div>
              )}
            </div>

            {/* Background color */}
            <div style={{ position:'relative' }}>
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>setShowColorPicker(p=>p==='bg'?null:'bg')}
                style={{ padding:'3px 9px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.65rem',fontFamily:'var(--font-display)' }}
                title="Cor de fundo">
                ▓ 🎨
              </button>
              {showColorPicker==='bg' && (
                <div style={{ position:'absolute',top:'110%',left:0,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:4,padding:8,zIndex:100,display:'flex',flexWrap:'wrap',gap:4,width:132 }}>
                  {COLORS_BG.map(c=>(
                    <div key={c} onClick={()=>{exec('hiliteColor',c);setShowColorPicker(null);}}
                      style={{ width:20,height:20,borderRadius:3,background:c,border:'1px solid #555',cursor:'pointer' }} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ width:1,height:22,background:'var(--border)',margin:'0 3px' }} />

            {/* Insert items */}
            <button onMouseDown={e=>{e.preventDefault();insertTable();}} style={{ padding:'3px 9px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.65rem',fontFamily:'var(--font-display)' }}>⊞ Tabela</button>
            <button onMouseDown={e=>{e.preventDefault();insertBrasao();}} style={{ padding:'3px 9px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.65rem',fontFamily:'var(--font-display)' }}>🎖 Brasão</button>
            <button onMouseDown={e=>{e.preventDefault();insertHr();}} style={{ padding:'3px 9px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.65rem',fontFamily:'var(--font-display)' }}>— Divisor</button>
            <button onMouseDown={e=>{e.preventDefault();insertPageBreak();}} style={{ padding:'3px 9px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.65rem',fontFamily:'var(--font-display)' }}>↵ Quebra</button>
            <button onMouseDown={e=>{e.preventDefault();exec('undo');}} style={{ padding:'3px 8px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.85rem' }} title="Desfazer Ctrl+Z">↩</button>
            <button onMouseDown={e=>{e.preventDefault();exec('redo');}} style={{ padding:'3px 8px',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-muted)',fontSize:'.85rem' }} title="Refazer Ctrl+Y">↪</button>
          </div>

          {/* Find & Replace */}
          {showFindReplace && (
            <div style={{ display:'flex',gap:8,alignItems:'center',padding:'8px 12px',background:'var(--bg-dark)',border:'1px solid var(--border)',borderRadius:4,marginBottom:8,flexShrink:0 }}>
              <span style={{ fontFamily:'var(--font-display)',fontSize:'.58rem',color:'var(--accent)',letterSpacing:'.07em',textTransform:'uppercase',flexShrink:0 }}>Localizar:</span>
              <input className="form-control" style={{ width:150,padding:'4px 8px',fontSize:'.78rem' }} value={findText} onChange={e=>setFindText(e.target.value)} placeholder="Texto a localizar" />
              <span style={{ fontFamily:'var(--font-display)',fontSize:'.58rem',color:'var(--accent)',letterSpacing:'.07em',textTransform:'uppercase',flexShrink:0 }}>Substituir por:</span>
              <input className="form-control" style={{ width:150,padding:'4px 8px',fontSize:'.78rem' }} value={replaceText} onChange={e=>setReplaceText(e.target.value)} placeholder="Substituição" />
              <button className="btn btn-primary btn-sm" onClick={findReplace}>Substituir Tudo</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowFindReplace(false)}>✕</button>
            </div>
          )}

          {/* A4 DOCUMENT AREA */}
          <div style={{ flex:1,overflow:'auto',background:'#888',padding:'12px',borderRadius:4,WebkitOverflowScrolling:'touch' }}
            onClick={()=>showColorPicker&&setShowColorPicker(null)}>
            {/* Page preview header */}
            {showHeader && (
              <div style={{ background:'white',width:Math.round(794*zoom/100),margin:'0 auto 0',borderRadius:'4px 4px 0 0',padding:'24px 32px 16px',transform:`scale(1)`,fontFamily:"'Times New Roman',serif",color:'#1a140a',boxShadow:'0 2px 8px rgba(0,0,0,.3)' }}>
                <div style={{ textAlign:'center',borderBottom:'2px solid #2a4020',paddingBottom:12,marginBottom:0 }}>
                  <img src={`data:image/jpeg;base64,${BRASAO_B64}`} alt="Brasão" style={{ width:60,height:60,objectFit:'contain',display:'block',margin:'0 auto 6px' }} />
                  {docUnidade.split('\n').map((l,i)=><div key={i} style={{ fontWeight:700,fontSize:i<2?'9.5pt':'9pt',letterSpacing:'.04em' }}>{l}</div>)}
                  <div style={{ fontSize:'11pt',fontWeight:900,marginTop:6,letterSpacing:'.07em' }}>{docTitle}</div>
                  {(docLocal||docData)&&<div style={{ fontSize:'8.5pt',marginTop:2,fontStyle:'italic' }}>{docLocal}{docData?', '+new Date(docData+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}):''}</div>}
                </div>
              </div>
            )}

            {/* Editable content area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onInput={() => { updateCounts(); setSaved(false); }}
              style={{
                background:'white',
                width:Math.round(794*zoom/100),
                margin: showHeader ? '0 auto 0' : '0 auto',
                padding:'24px 32px 40px',
                minHeight:Math.round(1123*zoom/100),
                fontFamily:`"Times New Roman",serif`,
                fontSize:'11pt',
                lineHeight:1.7,
                color:'#1a140a',
                outline:'none',
                boxShadow:'0 4px 16px rgba(0,0,0,.3)',
                borderRadius: showHeader ? '0 0 4px 4px' : 4,
              }}
              className="word-editor-body"
            />
            {docAssinante && (
              <div style={{ background:'white',width:Math.round(794*zoom/100),margin:'0 auto',padding:'0 32px 32px',borderRadius:'0 0 4px 4px',boxShadow:'0 4px 16px rgba(0,0,0,.3)',fontFamily:"'Times New Roman',serif",color:'#1a140a' }}>
                <div style={{ marginTop:50,textAlign:'center' }}>
                  <div style={{ width:200,height:1,background:'#333',margin:'0 auto 5px' }} />
                  <div style={{ fontWeight:700,fontSize:'9pt',textTransform:'uppercase',letterSpacing:'.04em' }}>{docAssinante}</div>
                  <div style={{ fontStyle:'italic',fontSize:'8.5pt',color:'#555' }}>{docCargo}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CABEÇALHO TAB ── */}
      {activeTab==='cabecalho' && (
        <div style={{ flex:1,overflow:'auto' }}>
          <div className="admin-grid-2" style={{ gap:16 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">🎖 Configurar Cabeçalho Oficial</h3></div>
              <div style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'10px 14px',background:'var(--bg-dark)',border:'1px solid var(--border)',borderRadius:4 }}>
                  <input type="checkbox" id="showHdr2" checked={showHeader} onChange={e=>setShowHeader(e.target.checked)} />
                  <label htmlFor="showHdr2" style={{ fontSize:'.78rem',color:'var(--text-secondary)',cursor:'pointer' }}>
                    Incluir cabeçalho com Brasão de Armas da República
                  </label>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                  <img src={`data:image/jpeg;base64,${BRASAO_B64}`} alt="Brasão" style={{ width:52,height:52,objectFit:'contain',border:'1px solid var(--border)',borderRadius:4,background:'#f0f0e8',padding:3 }} />
                  <span style={{ fontSize:'.72rem',color:'var(--text-muted)',fontStyle:'italic',flex:1 }}>Brasão de Armas da República Federativa do Brasil — documento oficial</span>
                </div>
                {[
                  ['Unidade (uma por linha)','docUnidade',docUnidade,v=>setDocUnidade(v),true,4],
                  ['Título do Documento','docTitle',docTitle,v=>setDocTitle(v),false,1],
                  ['Local','docLocal',docLocal,v=>setDocLocal(v),false,1],
                  ['Assinante (Nome - Posto)','docAss',docAssinante,v=>setDocAssinante(v),false,1],
                  ['Cargo / Função','docCargo',docCargo,v=>setDocCargo(v),false,1],
                ].map(([lbl,,val,setter,ta,rows])=>(
                  <div key={lbl} className="form-group" style={{ marginBottom:12 }}>
                    <label className="form-label">{lbl}</label>
                    {ta ? <textarea className="form-control" rows={rows} value={val} onChange={e=>setter(e.target.value)} /> : <input className="form-control" value={val} onChange={e=>setter(e.target.value)} />}
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input type="date" className="form-control" value={docData} onChange={e=>setDocData(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">👁 Preview do Cabeçalho</h3></div>
              <div style={{ padding:16,background:'#f4f1e8',borderRadius:4,margin:12,fontFamily:"'Times New Roman',serif",color:'#1a140a' }}>
                {showHeader ? (
                  <div style={{ textAlign:'center',borderBottom:'2px solid #2a4020',paddingBottom:12 }}>
                    <img src={`data:image/jpeg;base64,${BRASAO_B64}`} alt="Brasão" style={{ width:56,height:56,objectFit:'contain',display:'block',margin:'0 auto 6px' }} />
                    {docUnidade.split('\n').map((l,i)=><div key={i} style={{ fontWeight:700,fontSize:i<2?'9pt':'8.5pt',letterSpacing:'.04em' }}>{l}</div>)}
                    <div style={{ fontSize:'10pt',fontWeight:900,marginTop:5,letterSpacing:'.07em' }}>{docTitle}</div>
                    {(docLocal||docData)&&<div style={{ fontSize:'8pt',marginTop:2,fontStyle:'italic' }}>{docLocal}{docData?', '+new Date(docData+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}):''}</div>}
                  </div>
                ) : (
                  <div style={{ textAlign:'center',color:'#999',fontStyle:'italic',padding:20 }}>Cabeçalho desativado</div>
                )}
                {docAssinante&&<div style={{ marginTop:20,textAlign:'center' }}><div style={{ width:140,height:1,background:'#333',margin:'0 auto 4px' }} /><div style={{ fontWeight:700,fontSize:'8pt',textTransform:'uppercase' }}>{docAssinante}</div><div style={{ fontStyle:'italic',fontSize:'7.5pt',color:'#555' }}>{docCargo}</div></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIG TAB ── */}
      {activeTab==='config' && (
        <div style={{ flex:1,overflow:'auto' }}>
          <div className="card" style={{ maxWidth:480 }}>
            <div className="card-header"><h3 className="card-title">⚙️ Configurações de Página</h3></div>
            <div style={{ padding:'14px 16px' }}>
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">Orientação</label>
                <div style={{ display:'flex',gap:10 }}>
                  {[['portrait','📄 Retrato (A4)'],['landscape','📄 Paisagem']].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setPageOrientation(val)}
                      style={{ flex:1,padding:'8px',border:`1px solid ${pageOrientation===val?'var(--accent)':'var(--border)'}`,borderRadius:4,background:pageOrientation===val?'rgba(107,124,94,.2)':'var(--bg-card)',color:pageOrientation===val?'var(--accent)':'var(--text-muted)',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:'.62rem',letterSpacing:'.06em' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">Nome do Arquivo</label>
                <input className="form-control" value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="nome-do-arquivo" />
                <span style={{ fontSize:'.62rem',color:'var(--text-muted)',marginTop:3,display:'block' }}>Será salvo como: {fileName||'documento'}_{new Date().toISOString().slice(0,10)}.docx</span>
              </div>
              <div style={{ background:'var(--bg-dark)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 14px',marginTop:8 }}>
                <div style={{ fontFamily:'var(--font-display)',fontSize:'.6rem',color:'var(--accent)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:8 }}>Rascunho automático</div>
                <p style={{ fontSize:'.75rem',color:'var(--text-muted)',lineHeight:1.5 }}>O editor salva automaticamente a cada 30 segundos no navegador. O rascunho é restaurado ao reabrir a página.</p>
                <button className="btn btn-ghost btn-sm" style={{ marginTop:8 }} onClick={()=>{localStorage.removeItem('word_editor_draft');toast.success('Rascunho limpo');}}>
                  🗑 Limpar rascunho salvo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates modal */}
      {showTemplates && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ background:'var(--bg-card)',border:'1px solid var(--accent)',borderRadius:8,padding:24,maxWidth:500,width:'100%',margin:20 }}>
            <h3 style={{ fontFamily:'var(--font-display)',fontSize:'.9rem',color:'var(--accent)',marginBottom:16,letterSpacing:'.08em' }}>📋 Escolher Template</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              {Object.entries(TEMPLATES).map(([key,t])=>(
                <button key={key} onClick={()=>insertTemplate(key)}
                  style={{ padding:'14px 16px',border:'1px solid var(--border)',borderRadius:6,background:'var(--bg-dark)',color:'var(--text-secondary)',cursor:'pointer',textAlign:'left',fontFamily:'var(--font-display)',fontSize:'.65rem',letterSpacing:'.06em',textTransform:'uppercase',transition:'all .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  {key==='blank'?'📝':key==='boletim'?'📋':key==='oficio'?'📨':key==='relatorio'?'📊':'📝'} {t.name}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop:16 }} onClick={()=>setShowTemplates(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Tutorial */}
      {showTutorial && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ background:'var(--bg-card)',border:'1px solid var(--accent)',borderRadius:8,padding:28,maxWidth:400,width:'100%',margin:20,boxShadow:'0 8px 40px rgba(0,0,0,.6),0 0 28px rgba(107,124,94,.3)' }}>
            <div style={{ display:'flex',gap:4,marginBottom:12 }}>
              {TUTORIAL_STEPS.map((_,i)=>(
                <div key={i} onClick={()=>setTutStep(i)} style={{ width:8,height:8,borderRadius:'50%',background:i===tutStep?'var(--accent)':'var(--bg-dark)',border:'1px solid var(--border)',cursor:'pointer',transition:'background .2s' }} />
              ))}
            </div>
            <div style={{ fontFamily:'var(--font-display)',fontSize:'.55rem',color:'var(--text-muted)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8 }}>Passo {tutStep+1} de {TUTORIAL_STEPS.length}</div>
            <h3 style={{ fontFamily:'var(--font-display)',fontSize:'1.05rem',color:'var(--accent)',marginBottom:10,fontWeight:700 }}>{TUTORIAL_STEPS[tutStep].title}</h3>
            <p style={{ fontSize:'.82rem',color:'var(--text-secondary)',lineHeight:1.7,marginBottom:10 }}>{TUTORIAL_STEPS[tutStep].body}</p>
            {TUTORIAL_STEPS[tutStep].tip && (
              <div style={{ background:'rgba(107,124,94,.12)',border:'1px solid rgba(107,124,94,.3)',borderRadius:4,padding:'8px 12px',fontSize:'.72rem',color:'var(--accent)',marginBottom:16 }}>
                💡 {TUTORIAL_STEPS[tutStep].tip}
              </div>
            )}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowTutorial(false)}>Pular</button>
              <div style={{ display:'flex',gap:6 }}>
                {tutStep>0&&<button className="btn btn-g btn-sm" onClick={()=>setTutStep(t=>t-1)}>‹ Voltar</button>}
                <button className="btn btn-primary btn-sm" onClick={()=>tutStep===TUTORIAL_STEPS.length-1?setShowTutorial(false):setTutStep(t=>t+1)}>
                  {tutStep===TUTORIAL_STEPS.length-1?'✓ Concluir':'Próximo ›'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .word-editor-body p { margin: 0 0 8px; }
        @media (max-width: 768px) {
          .page-header { flex-wrap: wrap; gap: 8px; }
          .page-header > div:first-child { flex: 1 1 100%; }
          .page-header > div:last-child { flex-wrap: wrap; gap: 6px; }
        }
        .word-editor-body h1 { font-size:18pt;font-weight:bold;text-align:center;border-bottom:2px solid #2a4020;margin:14px 0 8px;padding-bottom:4px; }
        .word-editor-body h2 { font-size:14pt;font-weight:bold;border-bottom:1px solid #555;margin:12px 0 6px;padding-bottom:3px; }
        .word-editor-body h3 { font-size:12pt;font-weight:bold;margin:10px 0 5px; }
        .word-editor-body h4 { font-size:11pt;font-weight:bold;font-style:italic;margin:8px 0 4px; }
        .word-editor-body table { width:100%;border-collapse:collapse;margin:8px 0; }
        .word-editor-body th { background:#2a4020;color:#fff;padding:6px 10px;font-size:9pt;border:1px solid #999; }
        .word-editor-body td { border:1px solid #ccc;padding:6px 10px;font-size:9pt; }
        .word-editor-body ul,.word-editor-body ol { padding-left:24px;margin:6px 0; }
        .word-editor-body li { margin-bottom:3px; }
        .word-editor-body hr { border:none;border-top:2px solid #2a4020;margin:12px 0; }
        .word-editor-body img { max-width:100%;height:auto; }
        @media print {
          .page-header,.rel-tabs,.admin-grid-2 > div:first-child { display:none!important; }
          .word-editor-body { box-shadow:none!important; }
        }
      `}</style>
    </div>
  );
}
