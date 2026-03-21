const express    = require('express');
const router     = express.Router();
const Auditoria  = require('../models/Auditoria');
const Chamada    = require('../models/Chamada');
const { protect } = require('../middleware/auth');

function chamadaAccess(req, res, next) {
  if (req.user.role === 'admin' || req.user.hasChamadaAccess) return next();
  return res.status(403).json({ message: 'Acesso negado: sem permissão para auditoria.' });
}

const POPULATE = { path: 'items.user', select: 'warNumber warName rank' };

// ─── GET /api/auditoria?chamadaId=... ─────────────────────────────────────────
router.get('/', protect, chamadaAccess, async (req, res) => {
  try {
    const { chamadaId, date } = req.query;
    const query = {};
    if (chamadaId) query.chamadaId = chamadaId;
    if (date) {
      const d = new Date(date);
      query.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
    const auditorias = await Auditoria.find(query)
      .populate(POPULATE)
      .populate('createdBy', 'warName warNumber rank')
      .sort({ date: -1 });
    res.json(auditorias);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar auditorias.' });
  }
});

// ─── GET /api/auditoria/:id ───────────────────────────────────────────────────
// ⚠️  ROTA ESTÁTICA ANTES DE /:id  ⚠️
// ─── GET /api/auditoria/stats/soldado/:userId ─────────────────────────────────
router.get('/stats/soldado/:userId', protect, chamadaAccess, async (req, res) => {
  try {
    const { userId } = req.params;
    const auditorias = await Auditoria.find({
      'items.user': userId,
      status: { $in: ['enviada', 'reaberta'] },
    }).sort({ date: -1 });

    const stats = {
      totalAuditorias: auditorias.length,
      cabeloForaPadrao: 0, barbaForaPadrao: 0, cuturnoForaPadrao: 0,
      tfm: { blusa: 0, short: 0, meia: 0, tenis: 0 },
      historico: [],
    };
    auditorias.forEach(a => {
      const item = a.items.find(i => i.user.toString() === userId);
      if (!item) return;
      if (item.cabelo?.padrao  === false) stats.cabeloForaPadrao++;
      if (item.barba?.padrao   === false) stats.barbaForaPadrao++;
      if (item.cuturno?.padrao === false) stats.cuturnoForaPadrao++;
      if (item.tfm?.blusa?.padrao  === false) stats.tfm.blusa++;
      if (item.tfm?.short?.padrao  === false) stats.tfm.short++;
      if (item.tfm?.meia?.padrao   === false) stats.tfm.meia++;
      if (item.tfm?.tenis?.padrao  === false) stats.tfm.tenis++;
      stats.historico.push({ date: a.date, cabelo: item.cabelo, barba: item.barba, cuturno: item.cuturno, tfm: item.tfm });
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar stats de auditoria.' });
  }
});

// ─── GET /api/auditoria/:id ───────────────────────────────────────────────────
router.get('/:id', protect, chamadaAccess, async (req, res) => {
  try {
    const auditoria = await Auditoria.findById(req.params.id)
      .populate(POPULATE)
      .populate('createdBy', 'warName warNumber rank');
    if (!auditoria) return res.status(404).json({ message: 'Auditoria não encontrada.' });
    res.json(auditoria);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar auditoria.' });
  }
});

// ─── POST /api/auditoria — criar ou atualizar auditoria de uma chamada ────────
router.post('/', protect, chamadaAccess, async (req, res) => {
  try {
    const { chamadaId, items } = req.body;
    if (!chamadaId) return res.status(400).json({ message: 'chamadaId é obrigatório.' });

    const chamada = await Chamada.findById(chamadaId);
    if (!chamada) return res.status(404).json({ message: 'Chamada não encontrada.' });

    let auditoria = await Auditoria.findOne({ chamadaId });

    if (auditoria) {
      if (auditoria.status === 'enviada') {
        return res.status(400).json({ message: 'Auditoria já enviada. Use reabrir primeiro.' });
      }
      if (items) auditoria.items = items;
    } else {
      // Criar nova auditoria com todos os soldados da chamada
      const defaultItems = chamada.soldiers.map(s => ({
        user:    s.user,
        cabelo:  { padrao: null, observacao: '' },
        barba:   { padrao: null, observacao: '' },
        cuturno: { padrao: null, observacao: '' },
        tfm: {
          blusa:  { padrao: null, observacao: '' },
          short:  { padrao: null, observacao: '' },
          meia:   { padrao: null, observacao: '' },
          tenis:  { padrao: null, observacao: '' },
        },
      }));

      auditoria = new Auditoria({
        chamadaId,
        date:      chamada.date,
        status:    'aberta',
        createdBy: req.user._id,
        items:     items || defaultItems,
      });
    }

    await auditoria.save();
    await auditoria.populate(POPULATE);
    res.json(auditoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao salvar auditoria.' });
  }
});

// ─── PATCH /api/auditoria/:id — atualizar itens ───────────────────────────────
router.patch('/:id', protect, chamadaAccess, async (req, res) => {
  try {
    const auditoria = await Auditoria.findById(req.params.id);
    if (!auditoria) return res.status(404).json({ message: 'Auditoria não encontrada.' });
    if (auditoria.status === 'enviada') {
      return res.status(400).json({ message: 'Auditoria enviada. Use reabrir primeiro.' });
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'items é obrigatório.' });

    // Merge items - atualiza campo a campo para não sobrescrever dados não enviados
    items.forEach(update => {
      const idx = auditoria.items.findIndex(i => i.user.toString() === update.userId);
      if (idx === -1) return;
      const item = auditoria.items[idx];
      const fields = ['cabelo', 'barba', 'cuturno'];
      fields.forEach(f => {
        if (update[f] !== undefined) item[f] = update[f];
      });
      if (update.tfm) {
        const tfmFields = ['blusa', 'short', 'meia', 'tenis'];
        tfmFields.forEach(f => {
          if (update.tfm[f] !== undefined) item.tfm[f] = update.tfm[f];
        });
      }
    });

    await auditoria.save();
    await auditoria.populate(POPULATE);
    res.json(auditoria);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar auditoria.' });
  }
});

// ─── POST /api/auditoria/:id/enviar ──────────────────────────────────────────
router.post('/:id/enviar', protect, chamadaAccess, async (req, res) => {
  try {
    const auditoria = await Auditoria.findById(req.params.id);
    if (!auditoria) return res.status(404).json({ message: 'Auditoria não encontrada.' });
    auditoria.status    = 'enviada';
    auditoria.enviadoEm = new Date();
    await auditoria.save();
    await auditoria.populate(POPULATE);
    res.json(auditoria);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao enviar auditoria.' });
  }
});

// ─── POST /api/auditoria/:id/reabrir ─────────────────────────────────────────
router.post('/:id/reabrir', protect, chamadaAccess, async (req, res) => {
  try {
    const auditoria = await Auditoria.findById(req.params.id);
    if (!auditoria) return res.status(404).json({ message: 'Auditoria não encontrada.' });
    auditoria.status    = 'reaberta';
    auditoria.reabertoEm = new Date();
    await auditoria.save();
    await auditoria.populate(POPULATE);
    res.json(auditoria);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao reabrir auditoria.' });
  }
});

module.exports = router;
