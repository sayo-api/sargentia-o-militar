/**
 * server/routes/permissoes.js
 *
 * GET    /api/permissoes              — lista todos os usuários com permissões
 * PATCH  /api/permissoes/:id/chamada  — toggle hasChamadaAccess
 * PATCH  /api/permissoes/:id/relatorio— toggle hasRelatorioAccess
 * POST   /api/permissoes/usuario      — criar novo militar
 * PUT    /api/permissoes/usuario/:id  — editar militar (dados + senha + permissões)
 * DELETE /api/permissoes/usuario/:id  — excluir militar
 *
 * Campos necessários no modelo User:
 *   hasChamadaAccess:   { type: Boolean, default: false }
 *   hasRelatorioAccess: { type: Boolean, default: false }
 */

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// ─── Campos selecionados em todas as respostas ────────────────────────────────
const SELECT = 'warNumber warName rank role hasChamadaAccess hasRelatorioAccess active';

// ─── GET /api/permissoes — lista todos os militares ───────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({})
      .select(SELECT)
      .sort({ warNumber: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
});

// ─── PATCH /api/permissoes/:id/chamada ────────────────────────────────────────
router.patch('/:userId/chamada', protect, adminOnly, async (req, res) => {
  try {
    const { hasChamadaAccess } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { hasChamadaAccess: Boolean(hasChamadaAccess) },
      { new: true }
    ).select(SELECT);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar permissão.' });
  }
});

// ─── PATCH /api/permissoes/:id/relatorio ─────────────────────────────────────
router.patch('/:userId/relatorio', protect, adminOnly, async (req, res) => {
  try {
    const { hasRelatorioAccess } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { hasRelatorioAccess: Boolean(hasRelatorioAccess) },
      { new: true }
    ).select(SELECT);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar permissão.' });
  }
});

// ─── POST /api/permissoes/usuario — criar novo militar ────────────────────────
router.post('/usuario', protect, adminOnly, async (req, res) => {
  try {
    const {
      warName, warNumber, rank, role,
      hasChamadaAccess, hasRelatorioAccess, password,
    } = req.body;

    if (!warName || !warNumber || !password) {
      return res.status(400).json({ message: 'warName, warNumber e password são obrigatórios.' });
    }

    // Verificar duplicata de warNumber
    const exists = await User.findOne({ warNumber: Number(warNumber) });
    if (exists) {
      return res.status(400).json({ message: `Nr. de guerra ${warNumber} já está cadastrado.` });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      warName:            String(warName).trim().toUpperCase(),
      warNumber:          Number(warNumber),
      rank:               rank || '',
      role:               role === 'admin' ? 'admin' : 'user',
      hasChamadaAccess:   role === 'admin' ? true : Boolean(hasChamadaAccess),
      hasRelatorioAccess: role === 'admin' ? true : Boolean(hasRelatorioAccess),
      password:           hashed,
    });

    res.status(201).json({
      _id:                user._id,
      warName:            user.warName,
      warNumber:          user.warNumber,
      rank:               user.rank,
      role:               user.role,
      hasChamadaAccess:   user.hasChamadaAccess,
      hasRelatorioAccess: user.hasRelatorioAccess,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Número de guerra já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao criar usuário.', error: err.message });
  }
});

// ─── PUT /api/permissoes/usuario/:id — editar militar ────────────────────────
router.put('/usuario/:userId', protect, adminOnly, async (req, res) => {
  try {
    const {
      warName, warNumber, rank, role,
      hasChamadaAccess, hasRelatorioAccess, password,
    } = req.body;

    // Verificar duplicata de warNumber (excluindo o próprio usuário)
    if (warNumber) {
      const dup = await User.findOne({
        warNumber: Number(warNumber),
        _id: { $ne: req.params.userId },
      });
      if (dup) {
        return res.status(400).json({ message: `Nr. de guerra ${warNumber} já pertence a ${dup.warName}.` });
      }
    }

    const updates = {};
    if (warName   !== undefined) updates.warName   = String(warName).trim().toUpperCase();
    if (warNumber !== undefined) updates.warNumber = Number(warNumber);
    if (rank      !== undefined) updates.rank      = rank;
    if (role      !== undefined) updates.role      = role === 'admin' ? 'admin' : 'user';

    // Admin sempre tem acesso total
    const isAdmin = (role || 'user') === 'admin';
    if (hasChamadaAccess   !== undefined) updates.hasChamadaAccess   = isAdmin ? true : Boolean(hasChamadaAccess);
    if (hasRelatorioAccess !== undefined) updates.hasRelatorioAccess = isAdmin ? true : Boolean(hasRelatorioAccess);

    // Senha opcional
    if (password && password.trim()) {
      updates.password = await bcrypt.hash(password.trim(), 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true }
    ).select(SELECT);

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Número de guerra já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao atualizar usuário.', error: err.message });
  }
});

// ─── DELETE /api/permissoes/usuario/:id — excluir militar ────────────────────
router.delete('/usuario/:userId', protect, adminOnly, async (req, res) => {
  try {
    // Impedir auto-exclusão
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Você não pode excluir sua própria conta.' });
    }
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json({ message: `${user.warName} removido com sucesso.` });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir usuário.' });
  }
});

module.exports = router;
