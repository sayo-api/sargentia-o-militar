const express = require('express');
const router  = express.Router();
const Chat    = require('../models/Chat');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/chats — lista conversas (sem mensagens completas, só meta)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chats/:id — conversa completa
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ message: 'Não encontrado.' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chats — cria nova
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, messages } = req.body;
    const chat = await Chat.create({ user: req.user._id, title: title || 'Nova Conversa', messages: messages || [] });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/chats/:id — salva mensagens / atualiza título
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { messages, title } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ message: 'Não encontrado.' });
    if (messages !== undefined) chat.messages = messages;
    if (title)                  chat.title    = title;
    await chat.save();         // pre-save auto-title roda aqui
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/chats/all — apaga todas do usuário
router.delete('/all', protect, adminOnly, async (req, res) => {
  try {
    const r = await Chat.deleteMany({ user: req.user._id });
    res.json({ deleted: r.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/chats/:id — apaga uma
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ message: 'Não encontrado.' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
