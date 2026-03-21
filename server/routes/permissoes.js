/**
 * Rotas para gerenciar permissões de usuários no sistema de chamada.
 * Adicione ao server.js: app.use('/api/permissoes', require('./routes/permissoes'));
 *
 * Também é necessário adicionar ao modelo User:
 *   hasChamadaAccess: { type: Boolean, default: false }
 */

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/permissoes — listar todos os usuários com seus acessos
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({})
      .select('warNumber warName rank role hasChamadaAccess active')
      .sort({ warNumber: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
});

// PATCH /api/permissoes/:userId/chamada — toggle acesso à chamada
router.patch('/:userId/chamada', protect, adminOnly, async (req, res) => {
  try {
    const { hasChamadaAccess } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { hasChamadaAccess: Boolean(hasChamadaAccess) },
      { new: true }
    ).select('warNumber warName rank role hasChamadaAccess');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar permissão.' });
  }
});

module.exports = router;
