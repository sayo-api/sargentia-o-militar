import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle, ShadingType,
  VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import './AdminBoletimPage.css';
import './responsive.css';

const BRASAO_B64 = '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';
const BRASAO_DATA_URL = 'data:image/jpeg;base64,' + BRASAO_B64;

const DEFAULT_POSITIONS = [
  { id: 'sgt_dia',     label: 'Sgt do Dia',         multi: false },
  { id: 'cb_gda',      label: 'Cb Gda',              multi: false },
  { id: 'cb_dia',      label: 'Cb do Dia',           multi: false },
  { id: 'cb_hipismo',  label: 'Cb Hipismo',          multi: false },
  { id: 'plantao',     label: 'Plantão',             multi: true  },
  { id: 'esf_vet',     label: 'Esf Vet',             multi: false },
  { id: 'perm_equo',   label: 'Perm. Equoterapia',   multi: false },
  { id: 'partao_b',    label: 'Partão B',            multi: false },
  { id: 'pel_higiene', label: 'Pelotão De Higiene',  multi: true  },
];

const WEEKDAY_PT = {
  0:'DOMINGO', 1:'SEGUNDA-FEIRA', 2:'TERÇA-FEIRA',
  3:'QUARTA-FEIRA', 4:'QUINTA-FEIRA', 5:'SEXTA-FEIRA', 6:'SÁBADO',
};

const todayStr = () => format(new Date(), 'yyyy-MM-dd');
const tomorrowStr = () => format(addDays(new Date(), 1), 'yyyy-MM-dd');
const ptDate = iso => format(parseISO(iso), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR }).toUpperCase();

const DEFAULT_CONFIG = {
  boletimNum: '', boletimRef: '', boletimRefData: todayStr(),
  emitidoEm: todayStr(), local: 'Brasília',
  unidade: '1º REGIMENTO DE CAVALARIA DE GUARDAS\nDRAGÕES DA INDEPENDÊNCIA',
  unidadeAbrev: '1º RCG',
  assinante: 'DANILO AUGUSTO FERREIRA MACHADO - CAP CAV',
  cargo: 'Chefe do Centro Hípico Dragões da Independência',
  sodHora: '06:45', sodNome: '',
  fraseCafe: 'De acordo com determinação do Ch CHDI, o CB de dia deverá recolher a etapa do café da manhã da SU às 05:30H',
  frasesExtras: '', justica: 'S/A', disciplina: 'S/A',
};

// Inject responsive styles
if (typeof document !== 'undefined' && !document.getElementById('boletim-resp')) {
  const s = document.createElement('style');
  s.id = 'boletim-resp';
  s.textContent = `
    @media (max-width: 768px) {
      .boletim-panel { padding: 10px !important; }
      .boletim-config-grid { grid-template-columns: 1fr !important; }
      .boletim-preview { font-size: 11px; padding: 12px !important; }
      .posicoes-grid { grid-template-columns: 1fr !important; }
      .pos-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
    }
  `;
  document.head.appendChild(s);
}

export default function AdminBoletimPage() {
  const [users, setUsers]       = useState([]);
  const [boletins, setBoletins] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState('lista');
  const [editingId, setEditingId] = useState(null); // null = novo

  const [config, setConfig]       = useState(DEFAULT_CONFIG);
  const [brasaoPos, setBrasaoPos] = useState('center'); // left | center | right
  const [brasaoSize, setBrasaoSize] = useState(80); // px
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [dias, setDias]           = useState([{ data: tomorrowStr(), posicoes: {} }]);
  const [newPosLabel, setNewPosLabel] = useState('');
  const [newPosMulti, setNewPosMulti] = useState(false);

  // ── carregar dados ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/boletins')])
      .then(([u, b]) => { setUsers(u.data); setBoletins(b.data); })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  const refreshBoletins = () =>
    api.get('/boletins').then(r => setBoletins(r.data));

  // ── abrir novo boletim ──────────────────────────────────────────────────────
  const openNew = () => {
    setEditingId(null);
    setConfig(DEFAULT_CONFIG);
    setPositions(DEFAULT_POSITIONS);
    setDias([{ data: tomorrowStr(), posicoes: {} }]);
    setActiveTab('config');
  };

  // ── carregar boletim existente ──────────────────────────────────────────────
  const openEdit = async (id) => {
    try {
      const { data: b } = await api.get(`/boletins/${id}`);
      setEditingId(id);
      setConfig({
        boletimNum:     b.boletimNum     || '',
        boletimRef:     b.boletimRef     || '',
        boletimRefData: b.boletimRefData ? format(new Date(b.boletimRefData), 'yyyy-MM-dd') : todayStr(),
        emitidoEm:      b.emitidoEm      ? format(new Date(b.emitidoEm), 'yyyy-MM-dd') : todayStr(),
        local:          b.local          || 'Brasília',
        unidade:        b.unidade        || DEFAULT_CONFIG.unidade,
        unidadeAbrev:   b.unidadeAbrev   || '1º RCG',
        assinante:      b.assinante      || '',
        cargo:          b.cargo          || '',
        sodHora:        b.sodHora        || '06:45',
        sodNome:        b.sodNome        || '',
        fraseCafe:      b.fraseCafe      || DEFAULT_CONFIG.fraseCafe,
        frasesExtras:   b.frasesExtras   || '',
        justica:        b.justica        || 'S/A',
        disciplina:     b.disciplina     || 'S/A',
      });
      setPositions(b.positions?.length ? b.positions : DEFAULT_POSITIONS);
      setDias(b.dias?.map(d => ({
        data: format(new Date(d.data), 'yyyy-MM-dd'),
        posicoes: d.posicoes instanceof Map
          ? Object.fromEntries(d.posicoes)
          : (typeof d.posicoes === 'object' ? d.posicoes : {}),
      })) || [{ data: tomorrowStr(), posicoes: {} }]);
      setActiveTab('config');
    } catch { toast.error('Erro ao carregar boletim'); }
  };

  // ── salvar no MongoDB ───────────────────────────────────────────────────────
  const saveBoletim = async () => {
    setSaving(true);
    try {
      const payload = {
        ...config,
        emitidoEm:      new Date(config.emitidoEm),
        boletimRefData: config.boletimRefData ? new Date(config.boletimRefData) : undefined,
        positions,
        dias: dias.map(d => ({
          data:     new Date(d.data),
          posicoes: d.posicoes,
        })),
      };
      if (editingId) {
        await api.put(`/boletins/${editingId}`, payload);
        toast.success('Boletim atualizado!');
      } else {
        const { data } = await api.post('/boletins', payload);
        setEditingId(data._id);
        toast.success('Boletim salvo no banco de dados!');
      }
      await refreshBoletins();
    } catch { toast.error('Erro ao salvar boletim'); }
    finally { setSaving(false); }
  };

  const deleteBoletim = async (id) => {
    if (!window.confirm('Excluir este boletim?')) return;
    try {
      await api.delete(`/boletins/${id}`);
      toast.success('Boletim excluído');
      await refreshBoletins();
    } catch { toast.error('Erro ao excluir'); }
  };

  // ── mutações dias ───────────────────────────────────────────────────────────
  const addDia = () => {
    const last = dias[dias.length - 1]?.data || todayStr();
    setDias(p => [...p, { data: format(addDays(parseISO(last), 1), 'yyyy-MM-dd'), posicoes: {} }]);
  };
  const removeDia = i => setDias(p => p.filter((_, idx) => idx !== i));
  const setDiaDate = (i, v) => setDias(p => p.map((d, idx) => idx === i ? { ...d, data: v } : d));
  const setPosicao = (dIdx, posId, val) =>
    setDias(p => p.map((d, i) =>
      i === dIdx ? { ...d, posicoes: { ...d.posicoes, [posId]: val } } : d));

  // ── mutações posições ───────────────────────────────────────────────────────
  const addPosition = () => {
    if (!newPosLabel.trim()) return;
    const id = `pos_${Date.now()}`;
    setPositions(p => [...p, { id, label: newPosLabel.trim(), multi: newPosMulti }]);
    setNewPosLabel('');
  };
  const removePosition = id => setPositions(p => p.filter(pos => pos.id !== id));
  const movePos = (id, dir) => {
    const idx = positions.findIndex(p => p.id === id);
    const arr = [...positions];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setPositions(arr);
  };

  // ── título dinâmico ─────────────────────────────────────────────────────────
  const getTitulo = () => {
    if (!dias.length) return 'ESCALA DE SERVIÇO';
    const nomes = dias.map(d => WEEKDAY_PT[parseISO(d.data).getDay()]);
    if (nomes.length === 1) return `ESCALA DE SERVIÇO PARA ${nomes[0]}`;
    return `ESCALA DE SERVIÇO PARA ${nomes.slice(0, -1).join(', ')} E ${nomes[nomes.length - 1]}`;
  };

  // ── Export Word (.docx) ──────────────────────────────────────────────────────
  const exportWord = async () => {
    try {
      // Convert base64 to Uint8Array for ImageRun
      const b64 = BRASAO_B64;
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const sizePx = brasaoSize;
      const sizeEmu = Math.round(sizePx * 9144); // 1px = 9144 EMU

      const imgRun = new ImageRun({
        data: bytes,
        transformation: { width: sizePx, height: sizePx },
        type: 'jpg',
      });

      const bold = (text) => new TextRun({ text, bold: true, font: 'Times New Roman', size: 22 });
      const normal = (text) => new TextRun({ text, font: 'Times New Roman', size: 22 });
      const small = (text) => new TextRun({ text, font: 'Times New Roman', size: 18 });

      const headerAlign = brasaoPos === 'left' ? AlignmentType.LEFT : brasaoPos === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER;

      const makeHr = () => new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2a4020', space: 1 } },
        spacing: { before: 120, after: 120 },
        children: [],
      });

      const makeSection = (title) => new Paragraph({
        alignment: AlignmentType.LEFT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '444444', space: 1 } },
        spacing: { before: 200, after: 120 },
        children: [bold(title)],
      });

      const children = [];

      // Ref sheet
      children.push(new Paragraph({ alignment: AlignmentType.LEFT, children: [small('- F1 01 -')], spacing: { after: 60 } }));
      if (config.boletimRef) {
        children.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [small(`(Adt ao Bol Int Nr ${config.boletimRef} de ${format(parseISO(config.boletimRefData), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}, do ${config.unidadeAbrev})`)],
          spacing: { after: 80 },
        }));
      }

      // Brasão
      children.push(new Paragraph({
        alignment: headerAlign,
        children: [imgRun],
        spacing: { before: 80, after: 80 },
      }));

      // Header text
      const headerLines = [
        'MINISTÉRIO DA DEFESA', 'EXÉRCITO BRASILEIRO', 'COMANDO MILITAR DO PLANALTO',
        ...config.unidade.split('\n'),
      ];
      headerLines.forEach(line => {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [bold(line)],
          spacing: { after: 40 },
        }));
      });
      if (config.boletimNum) {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [bold(`ADITAMENTO AO BOLETIM INTERNO Nr ${config.boletimNum}`)],
          spacing: { after: 40 },
        }));
      }
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [normal(`${config.local}, ${format(parseISO(config.emitidoEm), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`)],
        spacing: { after: 20 },
      }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [normal(`(${WEEKDAY_PT[parseISO(config.emitidoEm).getDay()]})`)],
        spacing: { after: 100 },
      }));

      children.push(makeHr());

      // Título
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [bold(getTitulo())],
        spacing: { before: 120, after: 120 },
      }));

      children.push(makeHr());
      children.push(makeSection('1ª PARTE - SERVIÇOS DIÁRIOS'));

      // Dias
      dias.forEach(dia => {
        children.push(new Paragraph({
          children: [bold(`${ptDate(dia.data)}   (${WEEKDAY_PT[parseISO(dia.data).getDay()]})`)],
          spacing: { before: 140, after: 80 },
          shading: { fill: 'E8E4D0', type: ShadingType.CLEAR },
        }));

        const tableWidth = 8640; // ~6 inches
        const col1 = 2700;
        const col2 = tableWidth - col1;

        const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
        const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

        const tblRows = positions.map(pos => new TableRow({
          children: [
            new TableCell({
              width: { size: col1, type: WidthType.DXA },
              borders,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [bold(pos.label)], spacing: { after: 0 } })],
            }),
            new TableCell({
              width: { size: col2, type: WidthType.DXA },
              borders,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({
                children: [normal(dia.posicoes[pos.id] || '—')],
                spacing: { after: 0 },
              })],
            }),
          ],
        }));

        children.push(new Table({
          width: { size: tableWidth, type: WidthType.DXA },
          columnWidths: [col1, col2],
          rows: tblRows,
        }));
        children.push(new Paragraph({ children: [], spacing: { after: 80 } }));
      });

      // 3ª Parte
      children.push(makeSection('3ª PARTE - ASSUNTOS GERAIS E ADMINISTRATIVOS'));
      if (config.sodNome) {
        children.push(new Paragraph({
          children: [bold(`SOD (${config.sodHora}): `), normal(`Se apresentando ao Cb de Dia: ${config.sodNome}`)],
          spacing: { after: 80 },
        }));
      }
      if (config.fraseCafe) {
        children.push(new Paragraph({ children: [normal(config.fraseCafe)], spacing: { after: 80 } }));
      }
      if (config.frasesExtras) {
        config.frasesExtras.split('\n').forEach(l => {
          if (l.trim()) children.push(new Paragraph({ children: [normal(l)], spacing: { after: 60 } }));
        });
      }

      // 4ª Parte
      children.push(makeSection('4ª PARTE - JUSTIÇA E DISCIPLINA'));
      children.push(new Paragraph({ children: [normal(`Justiça: ${config.justica}`)], spacing: { after: 60 } }));
      children.push(new Paragraph({ children: [normal(`Disciplina: ${config.disciplina}`)], spacing: { after: 200 } }));

      // Assinatura
      children.push(new Paragraph({ children: [], spacing: { after: 600 } }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '333333', space: 1 } },
        children: [bold(config.assinante)],
        spacing: { before: 0, after: 40 },
      }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: config.cargo, italics: true, font: 'Times New Roman', size: 20 })],
        spacing: { after: 0 },
      }));

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // A4
              margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~2cm
            },
          },
          children,
        }],
      });

      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, `Boletim_${format(parseISO(dias[0]?.data || todayStr()), 'dd-MM-yyyy')}.docx`);
      toast.success('✓ Word gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar Word: ' + (err.message || 'verifique o console'));
    }
  };

  // ── Export Excel ─────────────────────────────────────────────────────────────
  const BRASAO_BASE64 = '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';

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema Militar';
    const ws = wb.addWorksheet('Boletim');

    // Configurar largura das colunas
    ws.columns = [
      { width: 36 },
      { width: 76 },
    ];

    // ── Inserir brasão ────────────────────────────────────────────────────
    const imageId = wb.addImage({
      base64: BRASAO_BASE64,
      extension: 'jpeg',
    });

    // Adicionar linha para o brasão com altura suficiente
    const imgRow = ws.addRow(['']);
    imgRow.height = 90;

    // Posicionar brasão (linha 1, célula A, tamanho 80x80)
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 90, height: 90 },
    });

    // ── Helper para adicionar linhas ──────────────────────────────────────
    const styleHeader = (row, bold = false, center = false) => {
      row.eachCell(cell => {
        cell.font = { name: 'Arial', size: 11, bold };
        if (center) cell.alignment = { horizontal: 'center', wrapText: true };
      });
    };

    const addRow = (a, b = '', merge = false, bold = false) => {
      const r = ws.addRow([a, b]);
      r.height = 16;
      if (merge) ws.mergeCells(r.number, 1, r.number, 2);
      styleHeader(r, bold, merge);
      return r;
    };

    // ── Linha de referência F1 ────────────────────────────────────────────
    addRow('- F1 01 -', '', true);
    if (config.boletimRef) {
      addRow(
        `(Adt ao Bol Int Nr ${config.boletimRef} de ${format(parseISO(config.boletimRefData), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}, do ${config.unidadeAbrev})`,
        '', true
      );
    }
    addRow('');

    // ── Cabeçalho institucional ──────────────────────────────────────────
    ['MINISTÉRIO DA DEFESA', 'EXÉRCITO BRASILEIRO', 'COMANDO MILITAR DO PLANALTO',
      ...config.unidade.split('\n')].forEach(l => addRow(l, '', true, true));

    if (config.boletimNum) {
      addRow(`ADITAMENTO AO BOLETIM INTERNO Nr ${config.boletimNum}`, '', true, true);
    }
    addRow(`${config.local}, ${format(parseISO(config.emitidoEm), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, '', true);
    addRow(`(${WEEKDAY_PT[parseISO(config.emitidoEm).getDay()]})`, '', true);
    addRow('');

    // ── Título da escala ─────────────────────────────────────────────────
    const tituloRow = addRow(getTitulo(), '', true, true);
    tituloRow.getCell(1).font = { name: 'Arial', size: 12, bold: true };
    addRow('');

    // ── 1ª Parte ─────────────────────────────────────────────────────────
    addRow('1ª PARTE - SERVIÇOS DIÁRIOS', '', true, true);
    addRow('');

    dias.forEach(dia => {
      const dateRow = addRow(
        `${ptDate(dia.data)}   (${WEEKDAY_PT[parseISO(dia.data).getDay()]})`,
        '', true, true
      );
      dateRow.getCell(1).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };

      positions.forEach(pos => {
        const r = ws.addRow([pos.label, dia.posicoes[pos.id] || '']);
        r.height = 16;
        r.getCell(1).font = { name: 'Arial', size: 10, bold: true };
        r.getCell(2).font = { name: 'Arial', size: 10 };
        // Borda inferior leve
        r.eachCell(cell => {
          cell.border = {
            bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } },
          };
        });
      });
      addRow('');
    });

    // ── 3ª Parte ─────────────────────────────────────────────────────────
    addRow('3ª PARTE - ASSUNTOS GERAIS E ADMINISTRATIVOS', '', true, true);
    addRow('');
    if (config.sodNome) {
      addRow(`SOD (${config.sodHora}): Se apresentando ao Cb de Dia: ${config.sodNome}`, '', true);
    }
    if (config.fraseCafe) addRow(config.fraseCafe, '', true);
    if (config.frasesExtras) {
      config.frasesExtras.split('\n').forEach(l => { if (l.trim()) addRow(l, '', true); });
    }
    addRow('');

    // ── 4ª Parte ─────────────────────────────────────────────────────────
    addRow('4ª PARTE - JUSTIÇA E DISCIPLINA', '', true, true);
    addRow('');
    addRow(`Justiça: ${config.justica}`, '', true);
    addRow(`Disciplina: ${config.disciplina}`, '', true);
    addRow(''); addRow(''); addRow('');

    // ── Assinatura ───────────────────────────────────────────────────────
    const assinanteRow = addRow(config.assinante, '', true, true);
    assinanteRow.getCell(1).alignment = { horizontal: 'center' };
    const cargoRow = addRow(config.cargo, '', true);
    cargoRow.getCell(1).alignment = { horizontal: 'center' };

    // ── Gerar e baixar arquivo ────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Boletim_${format(parseISO(dias[0]?.data || todayStr()), 'dd-MM-yyyy')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Planilha exportada com brasão!');
  };

  const userSuggestions = users.map(u =>
    `${u.rank.replace(/[ºª]/g, '').split(' ')[0]} ${u.warName}`);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📄 <span>Boletins</span> de Escala</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Boletim</button>
      </div>

      {/* ══ TABS ══════════════════════════════════════════════════════════════ */}
      <div className="boletim-tabs">
        {[
          { id: 'lista',   label: '📂 Salvos'          },
          { id: 'config',  label: '⚙ Configurar'       },
          { id: 'editar',  label: '✏ Preencher Escala'  },
          { id: 'preview', label: '👁 Visualizar'        },
        ].map(t => (
          <button key={t.id}
            className={`boletim-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB LISTA ═════════════════════════════════════════════════════════ */}
      {activeTab === 'lista' && (
        <div className="boletim-panel fade-in">
          {boletins.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <p className="empty-state-text">Nenhum boletim salvo ainda</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>
                Criar primeiro boletim
              </button>
            </div>
          ) : (
            <div className="boletim-lista">
              {boletins.map(b => (
                <div key={b._id} className="boletim-lista-card">
                  <div className="blc-icon">📄</div>
                  <div className="blc-info">
                    <span className="blc-titulo">
                      {b.boletimNum ? `Boletim Nr ${b.boletimNum}` : 'Boletim sem número'}
                    </span>
                    <span className="blc-data">
                      Emitido em: {format(new Date(b.emitidoEm), "dd/MM/yyyy")}
                      {b.createdBy && ` · por ${b.createdBy.warName}`}
                    </span>
                    <span className="blc-criado">
                      Salvo em: {format(new Date(b.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                  <div className="blc-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(b._id)}>
                      ✏ Editar
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteBoletim(b._id)}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB CONFIG ════════════════════════════════════════════════════════ */}
      {activeTab === 'config' && (
        <div className="boletim-panel fade-in">
          {editingId && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              ✅ Editando boletim salvo — clique em "Salvar" para atualizar no banco de dados
            </div>
          )}
          <div className="boletim-config-grid">

            {/* Coluna esquerda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-header"><h3 className="card-title">📋 Identificação</h3></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Nr deste Aditamento</label>
                    <input type="text" className="form-control" placeholder="Ex: 049"
                      value={config.boletimNum} onChange={e => setConfig({ ...config, boletimNum: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Emissão</label>
                    <input type="date" className="form-control"
                      value={config.emitidoEm} onChange={e => setConfig({ ...config, emitidoEm: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ref. Boletim Base (Nr)</label>
                    <input type="text" className="form-control" placeholder="Ex: 049"
                      value={config.boletimRef} onChange={e => setConfig({ ...config, boletimRef: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data do Boletim Base</label>
                    <input type="date" className="form-control"
                      value={config.boletimRefData} onChange={e => setConfig({ ...config, boletimRefData: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Nome da Unidade</label>
                    <textarea className="form-control" style={{ minHeight: 60 }}
                      value={config.unidade} onChange={e => setConfig({ ...config, unidade: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Abreviatura</label>
                    <input type="text" className="form-control"
                      value={config.unidadeAbrev} onChange={e => setConfig({ ...config, unidadeAbrev: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Local</label>
                  <input type="text" className="form-control"
                    value={config.local} onChange={e => setConfig({ ...config, local: e.target.value })} />
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3 className="card-title">📝 3ª Parte — Assuntos Gerais</h3></div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Hora SOD</label>
                    <input type="text" className="form-control" placeholder="06:45"
                      value={config.sodHora} onChange={e => setConfig({ ...config, sodHora: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SOD — nome do militar</label>
                    <input type="text" className="form-control" placeholder="Ex: SD MOREIRA"
                      value={config.sodNome} onChange={e => setConfig({ ...config, sodNome: e.target.value })}
                      list="sod-list" />
                    <datalist id="sod-list">{userSuggestions.map((s, i) => <option key={i} value={s} />)}</datalist>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Frase padrão — Café da manhã</label>
                  <textarea className="form-control" style={{ minHeight: 56 }}
                    value={config.fraseCafe} onChange={e => setConfig({ ...config, fraseCafe: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Outras observações (uma por linha)</label>
                  <textarea className="form-control" style={{ minHeight: 50 }}
                    value={config.frasesExtras} onChange={e => setConfig({ ...config, frasesExtras: e.target.value })} />
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3 className="card-title">⚖ 4ª Parte — Justiça e Disciplina</h3></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Justiça</label>
                    <input type="text" className="form-control" value={config.justica}
                      onChange={e => setConfig({ ...config, justica: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Disciplina</label>
                    <input type="text" className="form-control" value={config.disciplina}
                      onChange={e => setConfig({ ...config, disciplina: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-header"><h3 className="card-title">✍ Assinatura</h3></div>
                <div className="form-group">
                  <label className="form-label">Nome completo e posto</label>
                  <input type="text" className="form-control"
                    value={config.assinante} onChange={e => setConfig({ ...config, assinante: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Função</label>
                  <input type="text" className="form-control"
                    value={config.cargo} onChange={e => setConfig({ ...config, cargo: e.target.value })} />
                </div>
              </div>

              <div className="card" style={{ flex: 1 }}>
                <div className="card-header">
                  <h3 className="card-title">📌 Posições da Escala</h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {positions.length} posições
                  </span>
                </div>
                <div className="positions-list">
                  {positions.map((pos, i) => (
                    <div key={pos.id} className="position-item">
                      <span className="position-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="position-name">{pos.label}</span>
                      {pos.multi && <span className="badge badge-info" style={{ fontSize: '0.52rem' }}>múlt.</span>}
                      <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 5px' }} onClick={() => movePos(pos.id, -1)}>↑</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 5px' }} onClick={() => movePos(pos.id, 1)}>↓</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 5px', color: 'var(--danger)' }} onClick={() => removePosition(pos.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                  <input type="text" className="form-control" placeholder="Nova posição..."
                    value={newPosLabel} onChange={e => setNewPosLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPosition()} />
                  <label style={{ display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={newPosMulti} onChange={e => setNewPosMulti(e.target.checked)} />
                    Múlt.
                  </label>
                  <button className="btn btn-outline btn-sm" onClick={addPosition} style={{ whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveBoletim} disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</> : '💾 Salvar no Banco'}
                </button>
                <button className="btn btn-outline" onClick={() => setActiveTab('editar')}>
                  Preencher Escala →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB EDITAR ════════════════════════════════════════════════════════ */}
      {activeTab === 'editar' && (
        <div className="boletim-panel fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {dias.length} dia(s) · comece digitando ou selecione da lista
            </span>
            <button className="btn btn-outline btn-sm" onClick={addDia}>+ Adicionar Dia</button>
          </div>

          {dias.map((dia, dIdx) => (
            <div key={dIdx} className="dia-card card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="date" className="form-control"
                    style={{ width: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                    value={dia.data} onChange={e => setDiaDate(dIdx, e.target.value)} />
                  <span className="badge badge-success">{WEEKDAY_PT[parseISO(dia.data).getDay()]}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {ptDate(dia.data)}
                  </span>
                </div>
                {dias.length > 1 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => removeDia(dIdx)}
                    style={{ color: 'var(--danger)' }}>🗑 Remover</button>
                )}
              </div>
              <div className="posicoes-grid">
                {positions.map(pos => (
                  <div key={pos.id} className="posicao-row">
                    <div className="posicao-label-wrap">
                      <span className="posicao-label">{pos.label}</span>
                      {pos.multi && <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--accent)', marginTop: 2 }}>vírgula p/ múltiplos</span>}
                    </div>
                    <input type="text" className="form-control"
                      placeholder={pos.multi ? 'SD SILVA, SD COSTA, CB LIMA' : '3º SGT CANTANHEDE'}
                      value={dia.posicoes[pos.id] || ''}
                      onChange={e => setPosicao(dIdx, pos.id, e.target.value)}
                      list={`ul-${dIdx}-${pos.id}`} />
                    <datalist id={`ul-${dIdx}-${pos.id}`}>
                      {userSuggestions.map((s, i) => <option key={i} value={s} />)}
                    </datalist>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={saveBoletim} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</> : '💾 Salvar'}
            </button>
            <button className="btn btn-outline" onClick={() => setActiveTab('preview')}>👁 Visualizar →</button>
            <button className="btn btn-primary" onClick={exportWord}>📄 Baixar Word</button>
            <button className="btn btn-primary" onClick={exportExcel}>📊 Baixar Excel</button>
          </div>
        </div>
      )}

      {/* ══ TAB PREVIEW ═══════════════════════════════════════════════════════ */}
      {activeTab === 'preview' && (
        <div className="boletim-panel fade-in">
          {/* Preview toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Brasão position */}
              <div style={{ display:'flex',alignItems:'center',gap:6,background:'var(--bg-dark)',border:'1px solid var(--border)',borderRadius:4,padding:'4px 10px' }}>
                <span style={{ fontFamily:'var(--font-display)',fontSize:'0.54rem',color:'var(--text-muted)',letterSpacing:'0.07em',textTransform:'uppercase' }}>Brasão:</span>
                {['left','center','right'].map(p => (
                  <button key={p} onClick={() => setBrasaoPos(p)}
                    style={{ padding:'3px 8px',border:'1px solid',borderRadius:3,cursor:'pointer',fontFamily:'var(--font-display)',fontSize:'0.52rem',letterSpacing:'0.05em',transition:'all .15s',
                      borderColor: brasaoPos===p ? 'var(--accent)' : 'var(--border)',
                      background: brasaoPos===p ? 'var(--accent)' : 'transparent',
                      color: brasaoPos===p ? 'var(--bg-dark)' : 'var(--text-muted)',
                      fontWeight: brasaoPos===p ? 700 : 'normal' }}>
                    {p==='left'?'◀ Esq':p==='center'?'● Centro':'▶ Dir'}
                  </button>
                ))}
              </div>
              {/* Brasão size */}
              <div style={{ display:'flex',alignItems:'center',gap:6,background:'var(--bg-dark)',border:'1px solid var(--border)',borderRadius:4,padding:'4px 10px' }}>
                <span style={{ fontFamily:'var(--font-display)',fontSize:'0.54rem',color:'var(--text-muted)',letterSpacing:'0.07em',textTransform:'uppercase' }}>Tamanho:</span>
                <input type="range" min="40" max="140" value={brasaoSize}
                  onChange={e => setBrasaoSize(Number(e.target.value))}
                  style={{ width:70,cursor:'pointer' }} />
                <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.62rem',color:'var(--text-muted)',width:32 }}>{brasaoSize}px</span>
              </div>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('editar')}>✏ Editar</button>
              <button className="btn btn-outline btn-sm" onClick={saveBoletim} disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salvar'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={exportWord}>📄 Baixar Word</button>
              <button className="btn btn-primary btn-sm" onClick={exportExcel}>📊 Baixar Excel</button>
            </div>
          </div>

          {/* ═══ DOCUMENTO ═══════════════════════════════════════════════════ */}
          <div className="boletim-preview">

            {/* Ref da folha */}
            <div className="bp-folha-ref">
              <div>- F1 01 -</div>
              {config.boletimRef && (
                <div>(Adt ao Bol Int Nr {config.boletimRef} de {format(parseISO(config.boletimRefData), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}, do {config.unidadeAbrev})</div>
              )}
            </div>

            {/* Brasão */}
            <div className="bp-brasao-wrap" style={{ textAlign: brasaoPos === 'left' ? 'left' : brasaoPos === 'right' ? 'right' : 'center' }}>
              <img
                src={BRASAO_DATA_URL}
                alt="Brasão da República Federativa do Brasil"
                style={{ width: brasaoSize, height: brasaoSize, objectFit: 'contain', display: 'inline-block' }}
              />
            </div>

            {/* Cabeçalho */}
            <div className="bp-header-text">
              <p>MINISTÉRIO DA DEFESA</p>
              <p>EXÉRCITO BRASILEIRO</p>
              <p>COMANDO MILITAR DO PLANALTO</p>
              {config.unidade.split('\n').map((l, i) => <p key={i}>{l}</p>)}
              {config.boletimNum && <p className="bp-bold-line">ADITAMENTO AO BOLETIM INTERNO Nr {config.boletimNum}</p>}
              <p className="bp-normal-line">{config.local}, {format(parseISO(config.emitidoEm), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p className="bp-normal-line">({WEEKDAY_PT[parseISO(config.emitidoEm).getDay()]})</p>
            </div>

            {/* Título */}
            <div className="bp-titulo-box">
              <strong>{getTitulo()}</strong>
            </div>

            <p className="bp-parte-header">1ª PARTE - SERVIÇOS DIÁRIOS</p>

            {/* Dias */}
            {dias.map((dia, i) => (
              <div key={i} className="bp-dia-block">
                <div className="bp-dia-date-row">
                  {ptDate(dia.data)}&nbsp;&nbsp;&nbsp;({WEEKDAY_PT[parseISO(dia.data).getDay()]})
                </div>
                <table className="bp-table">
                  <tbody>
                    {positions.map(pos => (
                      <tr key={pos.id}>
                        <td className="bp-td-pos">{pos.label}</td>
                        <td className="bp-td-val">
                          {dia.posicoes[pos.id]
                            ? <strong>{dia.posicoes[pos.id]}</strong>
                            : <span className="bp-empty">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* 3ª Parte */}
            <p className="bp-parte-header" style={{ marginTop: 22 }}>3ª PARTE - ASSUNTOS GERAIS E ADMINISTRATIVOS</p>
            {config.sodNome && (
              <p className="bp-obs"><strong>SOD ({config.sodHora}):</strong> Se apresentando ao Cb de Dia: <strong>{config.sodNome}</strong></p>
            )}
            {config.fraseCafe && <p className="bp-obs">{config.fraseCafe}</p>}
            {config.frasesExtras && config.frasesExtras.split('\n').map((l, i) =>
              l.trim() ? <p key={i} className="bp-obs">{l}</p> : null)}

            {/* 4ª Parte */}
            <p className="bp-parte-header" style={{ marginTop: 18 }}>4ª PARTE - JUSTIÇA E DISCIPLINA</p>
            <div className="bp-jd">
              <p>Justiça: {config.justica}</p>
              <p>Disciplina: {config.disciplina}</p>
            </div>

            {/* Assinatura */}
            <div className="bp-assinatura">
              <div className="bp-linha-assinatura" />
              <p className="bp-assinante-nome">{config.assinante}</p>
              <p className="bp-assinante-cargo">{config.cargo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
