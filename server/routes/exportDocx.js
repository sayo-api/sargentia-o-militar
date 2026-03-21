/**
 * GET /api/planilha/export/docx?month=3&year=2026
 * Gera e faz download de um documento Word (.docx) com a escala militar.
 * Mostra o dia atual + próximos 6 dias em destaque, e a tabela completa do mês.
 *
 * Dependência: npm install docx
 */

const express     = require('express');
const router      = express.Router();
const EscalaPlanilha = require('../models/EscalaPlanilha');
const { protect } = require('../middleware/auth');

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  HeadingLevel, PageOrientation,
} = require('docx');

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getDayOfWeek(d, m, y) { return new Date(y, m - 1, d).getDay(); }
function daysInMonth(m, y)     { return new Date(y, m, 0).getDate(); }

function borderSet(color = '888888', size = 6) {
  const b = { style: BorderStyle.SINGLE, size, color };
  return { top: b, bottom: b, left: b, right: b };
}

function cellTxt(text, opts = {}) {
  const {
    bold = false, size = 16, color = '000000', align = AlignmentType.CENTER,
    bg = 'FFFFFF', colSpan, vAlign = VerticalAlign.CENTER, width,
  } = opts;
  const cellProps = {
    borders:  borderSet(),
    shading:  { fill: bg, type: ShadingType.CLEAR },
    verticalAlign: vAlign,
    margins:  { top: 60, bottom: 60, left: 80, right: 80 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text: String(text ?? ''), bold, size, color, font: 'Arial' })],
    })],
  };
  if (colSpan) cellProps.columnSpan = colSpan;
  if (width)   cellProps.width = { size: width, type: WidthType.DXA };
  return new TableCell(cellProps);
}

// ─── Gera tabela de dias destacados (próximos 7 dias) ────────────────────────
function buildHighlightTable(planilha, today, pageWidth) {
  const { month, year, duties, cells } = planilha;
  const cellMap = {};
  cells.forEach(c => { cellMap[`${c.day}-${c.dutyId}`] = c; });

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      days.push(d.getDate());
    }
  }
  if (!days.length) return null;

  const colW = Math.floor(pageWidth / (days.length + 1));
  const dutyW = colW + 200;
  const dayW  = Math.floor((pageWidth - dutyW) / days.length);

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cellTxt('FUNÇÃO / POSTO', { bold: true, size: 16, bg: '1a3a5c', color: 'FFFFFF', width: dutyW }),
      ...days.map(d => {
        const dow = getDayOfWeek(d, month, year);
        const isToday = d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
        return cellTxt(
          `${DIAS_SEMANA[dow]}\n${String(d).padStart(2,'0')}/${String(month).padStart(2,'0')}`,
          { bold: true, size: 15, bg: isToday ? 'f97316' : '2563eb', color: 'FFFFFF', width: dayW }
        );
      }),
    ],
  });

  const dutyRows = duties.map(duty => {
    return new TableRow({
      children: [
        cellTxt(duty.name, { bold: true, size: 15, bg: 'f1f5f9', align: AlignmentType.LEFT, width: dutyW }),
        ...days.map(d => {
          const c = cellMap[`${d}-${duty.id}`];
          if (!c || !c.user) return cellTxt('—', { size: 14, color: '9ca3af', width: dayW });
          const u = c.user;
          const name = u.warName || '?';
          const rank = u.rank ? `${u.rank} ` : '';
          const nr   = u.warNumber ? ` (${u.warNumber})` : '';
          return cellTxt(`${rank}${name}${nr}`, { size: 14, width: dayW });
        }),
      ],
    });
  });

  return new Table({
    width:        { size: pageWidth, type: WidthType.DXA },
    columnWidths: [dutyW, ...days.map(() => dayW)],
    rows:         [headerRow, ...dutyRows],
  });
}

// ─── Gera tabela mensal completa ──────────────────────────────────────────────
function buildMonthTable(planilha, pageWidth) {
  const { month, year, duties, cells } = planilha;
  const totalDays = daysInMonth(month, year);
  const cellMap   = {};
  cells.forEach(c => { cellMap[`${c.day}-${c.dutyId}`] = c; });

  // Colunas: Função (fixo) + dias do mês
  const dutyW = 1440; // ~1 inch
  const dayW  = Math.floor((pageWidth - dutyW) / totalDays);

  // Header row 1: day numbers
  const dayHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      cellTxt('FUNÇÃO', { bold: true, size: 13, bg: '1a3a5c', color: 'FFFFFF', width: dutyW }),
      ...Array.from({ length: totalDays }, (_, i) => {
        const d   = i + 1;
        const dow = getDayOfWeek(d, month, year);
        const isWkd = dow === 0 || dow === 6;
        return cellTxt(`${DIAS_SEMANA[dow]}\n${d}`, {
          bold: true, size: 11,
          bg: isWkd ? 'd1d5db' : '2563eb', color: isWkd ? '374151' : 'FFFFFF',
          width: dayW,
        });
      }),
    ],
  });

  const dutyRows = duties.map(duty => {
    return new TableRow({
      children: [
        cellTxt(duty.abbreviation || duty.name, { bold: true, size: 12, bg: 'f8fafc', align: AlignmentType.LEFT, width: dutyW }),
        ...Array.from({ length: totalDays }, (_, i) => {
          const d = i + 1;
          const c = cellMap[`${d}-${duty.id}`];
          if (!c || !c.user) return cellTxt('', { size: 10, width: dayW });
          const u = c.user;
          return cellTxt(u.warName || '?', { size: 10, width: dayW });
        }),
      ],
    });
  });

  return new Table({
    width:        { size: pageWidth, type: WidthType.DXA },
    columnWidths: [dutyW, ...Array.from({ length: totalDays }, () => dayW)],
    rows:         [dayHeaderRow, ...dutyRows],
  });
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────
router.get('/export/docx', protect, async (req, res) => {
  try {
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const planilha = await EscalaPlanilha.findOne({ month, year })
      .populate('cells.user', 'warNumber warName rank');

    if (!planilha) return res.status(404).json({ message: 'Escala não encontrada para este mês/ano.' });

    const today    = new Date();
    // Paisagem: A4 landscape
    const pageW    = 16838; // A4 height (usada como largura em paisagem)
    const marginH  = 720;   // 0.5 inch
    const contentW = pageW - marginH * 2;

    const highlightTable = buildHighlightTable(planilha, today, contentW);
    const monthTable     = buildMonthTable(planilha, contentW);

    const tituloLabel = planilha.title || `Escala ${MESES[month - 1]} ${year}`;
    const unidadeLabel = planilha.unit  ? `Unidade: ${planilha.unit}` : '';

    const children = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: tituloLabel.toUpperCase(), bold: true, size: 36, font: 'Arial', color: '1a3a5c' })],
      }),
    ];

    if (unidadeLabel) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: unidadeLabel, size: 22, font: 'Arial', color: '374151' })],
      }));
    }

    // Seção: próximos dias
    if (highlightTable) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 160 },
          children: [new TextRun({ text: '📅  ESCALA — PRÓXIMOS DIAS', bold: true, size: 24, font: 'Arial', color: '2563eb' })],
        }),
        highlightTable,
      );
    }

    // Seção: escala mensal completa
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 160 },
        children: [new TextRun({
          text: `📋  ESCALA COMPLETA — ${MESES[month - 1].toUpperCase()} ${year}`,
          bold: true, size: 24, font: 'Arial', color: '1a3a5c',
        })],
      }),
      monthTable,
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 320 },
        children: [new TextRun({
          text: `Gerado em: ${today.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}`,
          size: 16, italics: true, color: '9ca3af', font: 'Arial',
        })],
      }),
    );

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
            margin: { top: marginH, right: marginH, bottom: marginH, left: marginH },
          },
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `escala-${String(month).padStart(2,'0')}-${year}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Erro ao gerar DOCX:', err);
    res.status(500).json({ message: 'Erro ao gerar documento Word.' });
  }
});

module.exports = router;
