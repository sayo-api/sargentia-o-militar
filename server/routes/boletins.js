const express = require('express');
const router = express.Router();
const Boletim = require('../models/Boletim');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/boletins — listar todos
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const boletins = await Boletim.find()
      .populate('createdBy', 'warName rank')
      .sort({ emitidoEm: -1 })
      .select('-dias -positions'); // resumo na lista
    res.json(boletins);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao listar boletins.' });
  }
});

// GET /api/boletins/:id — detalhe completo
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const b = await Boletim.findById(req.params.id).populate('createdBy', 'warName rank');
    if (!b) return res.status(404).json({ message: 'Boletim não encontrado.' });
    res.json(b);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar boletim.' });
  }
});

// POST /api/boletins — criar
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const b = await Boletim.create(data);
    res.status(201).json(b);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erro ao criar boletim.' });
  }
});

// PUT /api/boletins/:id — atualizar
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const b = await Boletim.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!b) return res.status(404).json({ message: 'Boletim não encontrado.' });
    res.json(b);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao atualizar boletim.' });
  }
});

// DELETE /api/boletins/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Boletim.findByIdAndDelete(req.params.id);
    res.json({ message: 'Boletim removido.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao remover boletim.' });
  }
});

module.exports = router;
