const express = require('express');
const router  = express.Router();
const Chamada = require('../models/Chamada');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

function chamadaAccess(req, res, next) {
  if (req.user.role === 'admin' || req.user.hasChamadaAccess) return next();
  return res.status(403).json({ message: 'Acesso negado: sem permissão para chamada.' });
}

const POPULATE = { path: 'soldiers.user', select: 'warNumber warName rank' };

// ─── GET /api/chamada ─────────────────────────────────────────────────────────
router.get('/', protect, chamadaAccess, async (req, res) => {
  try {
    const { limit = 60, page = 1, date } = req.query;
    const query = {};
    if (date) {
      const d     = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      query.date  = { $gte: start, $lte: end };
    }
    const list = await Chamada.find(query)
      .populate(POPULATE)
      .populate('createdBy', 'warName warNumber rank')
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar chamadas.' });
  }
});

// ⚠️  ROTAS ESTÁTICAS ANTES DE /:id  ⚠️
// ─── GET /api/chamada/stats/soldado/:userId ───────────────────────────────────
router.get('/stats/soldado/:userId', protect, chamadaAccess, async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await Chamada.find({
      'soldiers.user': userId,
      status: { $in: ['enviada', 'reaberta'] },
    }).sort({ date: -1 });

    const stats = { totalChamadas: list.length, faltas: 0, atrasos: 0, presencas: 0, historico: [] };
    list.forEach(c => {
      const s = c.soldiers.find(s => s.user.toString() === userId);
      if (!s) return;
      if (s.presente === false) stats.faltas++;
      else if (s.presente === true) { stats.presencas++; if (s.atrasado) stats.atrasos++; }
      stats.historico.push({
        date: c.date, turno: c.turno,
        presente: s.presente, atrasado: s.atrasado,
        horarioChegada: s.horarioChegada, observacao: s.observacao,
      });
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar stats do soldado.' });
  }
});

// ─── GET /api/chamada/:id ─────────────────────────────────────────────────────
router.get('/:id', protect, chamadaAccess, async (req, res) => {
  try {
    const chamada = await Chamada.findById(req.params.id)
      .populate(POPULATE)
      .populate('createdBy', 'warName warNumber rank');
    if (!chamada) return res.status(404).json({ message: 'Chamada não encontrada.' });
    res.json(chamada);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar chamada.' });
  }
});

// ─── POST /api/chamada — iniciar nova chamada ─────────────────────────────────
router.post('/', protect, chamadaAccess, async (req, res) => {
  try {
    const { date, turno, observacaoGeral } = req.body;

    // Busca TODOS os usuários cadastrados ordenados por número de guerra
    const allUsers = await User.find({}).select('_id warNumber warName rank').sort({ warNumber: 1 });

    const dateObj = new Date(date || Date.now());
    const start   = new Date(dateObj); start.setHours(0, 0, 0, 0);
    const end     = new Date(dateObj); end.setHours(23, 59, 59, 999);

    const existing = await Chamada.findOne({ date: { $gte: start, $lte: end }, turno: turno || 'geral' });
    if (existing) {
      await existing.populate(POPULATE);
      return res.status(409).json({ message: 'Já existe chamada para este dia/turno.', chamada: existing });
    }

    const chamada = new Chamada({
      date:            dateObj,
      turno:           turno || 'geral',
      status:          'aberta',
      createdBy:       req.user._id,
      observacaoGeral: observacaoGeral || '',
      soldiers:        allUsers.map(s => ({
        user: s._id, presente: null, atrasado: false, horarioChegada: '', observacao: '',
      })),
    });

    await chamada.save();
    await chamada.populate(POPULATE);
    res.status(201).json(chamada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao iniciar chamada.' });
  }
});

// ─── PATCH /api/chamada/:id ───────────────────────────────────────────────────
router.patch('/:id', protect, chamadaAccess, async (req, res) => {
  try {
    const chamada = await Chamada.findById(req.params.id);
    if (!chamada) return res.status(404).json({ message: 'Chamada não encontrada.' });
    if (chamada.status === 'enviada')
      return res.status(400).json({ message: 'Chamada já enviada. Use reabrir primeiro.' });

    const { soldiers, observacaoGeral } = req.body;
    if (soldiers) {
      soldiers.forEach(upd => {
        const idx = chamada.soldiers.findIndex(s => s.user.toString() === upd.userId);
        if (idx === -1) return;
        if (upd.presente       !== undefined) chamada.soldiers[idx].presente       = upd.presente;
        if (upd.atrasado       !== undefined) chamada.soldiers[idx].atrasado       = upd.atrasado;
        if (upd.horarioChegada !== undefined) chamada.soldiers[idx].horarioChegada = upd.horarioChegada;
        if (upd.observacao     !== undefined) chamada.soldiers[idx].observacao     = upd.observacao;
      });
    }
    if (observacaoGeral !== undefined) chamada.observacaoGeral = observacaoGeral;

    await chamada.save();
    await chamada.populate(POPULATE);
    res.json(chamada);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar chamada.' });
  }
});

// ─── POST /api/chamada/:id/enviar ─────────────────────────────────────────────
router.post('/:id/enviar', protect, chamadaAccess, async (req, res) => {
  try {
    const chamada = await Chamada.findById(req.params.id);
    if (!chamada) return res.status(404).json({ message: 'Chamada não encontrada.' });
    chamada.status = 'enviada'; chamada.enviadoEm = new Date();
    await chamada.save(); await chamada.populate(POPULATE);
    res.json(chamada);
  } catch (err) { res.status(500).json({ message: 'Erro ao enviar chamada.' }); }
});

// ─── POST /api/chamada/:id/reabrir ────────────────────────────────────────────
router.post('/:id/reabrir', protect, chamadaAccess, async (req, res) => {
  try {
    const chamada = await Chamada.findById(req.params.id);
    if (!chamada) return res.status(404).json({ message: 'Chamada não encontrada.' });
    chamada.status = 'reaberta'; chamada.reabertoEm = new Date();
    await chamada.save(); await chamada.populate(POPULATE);
    res.json(chamada);
  } catch (err) { res.status(500).json({ message: 'Erro ao reabrir chamada.' }); }
});

module.exports = router;
