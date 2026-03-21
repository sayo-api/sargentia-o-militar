const express = require('express');
const router = express.Router();
const EscalaPlanilha = require('../models/EscalaPlanilha');
const { protect, adminOnly } = require('../middleware/auth');

const POPULATE_CELLS = 'cells.user';
const POPULATE_FIELDS = 'warNumber warName rank';

// Helper: populate planilha
async function populatePlanilha(planilha) {
  await planilha.populate(POPULATE_CELLS, POPULATE_FIELDS);
  await planilha.populate('cycleTemplate.user', POPULATE_FIELDS);
  return planilha;
}

// GET /api/planilha?month=3&year=2026
router.get('/', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const planilha = await EscalaPlanilha.findOne(query);
    if (!planilha) return res.json(null);

    await populatePlanilha(planilha);
    res.json(planilha);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar planilha.' });
  }
});

// POST /api/planilha — create or full-replace
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { month, year, title, unit, cycleLength, cycleStartDay, duties, statusColors, cells, cycleTemplate } = req.body;

    let planilha = await EscalaPlanilha.findOne({ month, year });

    if (planilha) {
      if (title !== undefined) planilha.title = title;
      if (unit !== undefined) planilha.unit = unit;
      if (cycleLength !== undefined) planilha.cycleLength = cycleLength;
      if (cycleStartDay !== undefined) planilha.cycleStartDay = cycleStartDay;
      if (duties !== undefined) planilha.duties = duties;
      if (statusColors !== undefined) planilha.statusColors = new Map(Object.entries(statusColors));
      if (cells !== undefined) planilha.cells = cells;
      if (cycleTemplate !== undefined) planilha.cycleTemplate = cycleTemplate;
      planilha.updatedBy = req.user._id;
    } else {
      planilha = new EscalaPlanilha({
        month, year, title, unit, cycleLength, cycleStartDay,
        duties: duties || [],
        statusColors: statusColors ? new Map(Object.entries(statusColors)) : undefined,
        cells: cells || [],
        cycleTemplate: cycleTemplate || [],
        createdBy: req.user._id,
      });
    }

    await planilha.save();
    await populatePlanilha(planilha);
    res.json(planilha);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao salvar planilha.' });
  }
});

// PATCH /api/planilha/:id/cells — update cells array only
router.patch('/:id/cells', protect, adminOnly, async (req, res) => {
  try {
    const { cells } = req.body;
    const planilha = await EscalaPlanilha.findById(req.params.id);
    if (!planilha) return res.status(404).json({ message: 'Planilha não encontrada.' });

    planilha.cells = cells;
    planilha.updatedBy = req.user._id;
    await planilha.save();
    await populatePlanilha(planilha);
    res.json(planilha);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar células.' });
  }
});

// PATCH /api/planilha/:id/cycle — update cycle template only
router.patch('/:id/cycle', protect, adminOnly, async (req, res) => {
  try {
    const { cycleTemplate, cycleLength, cycleStartDay } = req.body;
    const planilha = await EscalaPlanilha.findById(req.params.id);
    if (!planilha) return res.status(404).json({ message: 'Planilha não encontrada.' });

    if (cycleTemplate !== undefined) planilha.cycleTemplate = cycleTemplate;
    if (cycleLength !== undefined) planilha.cycleLength = cycleLength;
    if (cycleStartDay !== undefined) planilha.cycleStartDay = cycleStartDay;
    planilha.updatedBy = req.user._id;
    await planilha.save();
    await populatePlanilha(planilha);
    res.json(planilha);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar ciclo.' });
  }
});

// DELETE /api/planilha/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await EscalaPlanilha.findByIdAndDelete(req.params.id);
    res.json({ message: 'Planilha removida.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover planilha.' });
  }
});

module.exports = router;
