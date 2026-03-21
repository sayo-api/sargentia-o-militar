const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route POST /api/auth/register-admin
// @desc Register admin account with token
router.post('/register-admin', async (req, res) => {
  try {
    const { warNumber, warName, password, adminToken } = req.body;

    if (adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ message: 'Token de administrador inválido.' });
    }

    const exists = await User.findOne({ warNumber });
    if (exists) {
      return res.status(400).json({ message: 'Número de guerra já cadastrado.' });
    }

    const user = await User.create({
      warNumber,
      warName: warName.toUpperCase(),
      password,
      role: 'admin',
      rank: 'Capitão',
      isFirstLogin: false,
    });

    res.status(201).json({
      _id: user._id,
      warNumber: user.warNumber,
      warName: user.warName,
      role: user.role,
      rank: user.rank,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

// @route POST /api/auth/login
// @desc Login user
router.post('/login', async (req, res) => {
  try {
    const { warNumber, password } = req.body;

    const user = await User.findOne({ warNumber });
    if (!user) {
      return res.status(401).json({ message: 'Número de guerra não encontrado.' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Conta desativada. Contate o administrador.' });
    }

    // First login - no password set yet
    if (user.isFirstLogin || !user.password) {
      return res.status(200).json({
        firstLogin: true,
        warNumber: user.warNumber,
        warName: user.warName,
        message: 'Primeiro acesso detectado. Por favor, crie sua senha.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    res.json({
      _id: user._id,
      warNumber: user.warNumber,
      warName: user.warName,
      role: user.role,
      rank: user.rank,
      isFirstLogin: false,
      hasChamadaAccess:   user.hasChamadaAccess   || false,
      hasRelatorioAccess: user.hasRelatorioAccess || false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

// @route POST /api/auth/set-password
// @desc Set password on first login
router.post('/set-password', async (req, res) => {
  try {
    const { warNumber, password } = req.body;

    const user = await User.findOne({ warNumber });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (!user.isFirstLogin && user.password) {
      return res.status(400).json({ message: 'Senha já definida anteriormente.' });
    }

    user.password = password;
    user.isFirstLogin = false;
    await user.save();

    res.json({
      _id: user._id,
      warNumber: user.warNumber,
      warName: user.warName,
      role: user.role,
      rank: user.rank,
      isFirstLogin: false,
      hasChamadaAccess:   user.hasChamadaAccess   || false,
      hasRelatorioAccess: user.hasRelatorioAccess || false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

// @route GET /api/auth/me
// @desc Get current user
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
