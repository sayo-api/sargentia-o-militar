const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { situacao, pelotao, companhia, search } = req.query;
    let query = { role: 'soldier' };
    if (situacao) query.situacao = situacao;
    if (pelotao) query.pelotao = pelotao;
    if (companhia) query.companhia = companhia;
    if (search) query.$or = [
      { warName: new RegExp(search, 'i') },
      { nomeCompleto: new RegExp(search, 'i') },
      { warNumber: new RegExp(search, 'i') },
    ];
    const users = await User.find(query).select('-password').sort({ rank: 1, warName: 1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Erro ao buscar usuários.' }); }
});

router.get('/efetivo', protect, adminOnly, async (req, res) => {
  try {
    const total    = await User.countDocuments({ role: 'soldier' });
    // Support both old docs (no situacao) and new docs
    const ativos   = await User.countDocuments({ role: 'soldier', active: true, $or:[{situacao:'Ativo'},{situacao:{$exists:false}},{situacao:null}] });
    const ausentes = await User.countDocuments({ role: 'soldier', situacao: { $in:['Licença Médica','Hospital','Missão','Férias','Descanso','Licença Especial','Inativo'] } });
    const breakdown = await User.aggregate([
      { $match: { role: 'soldier' } },
      { $addFields: { sit: { $ifNull: ['$situacao', 'Ativo'] } } },
      { $group: { _id: '$sit', count: { $sum: 1 } } },
    ]);
    const porPelotao = await User.aggregate([
      { $match: { role: 'soldier' } },
      { $group: { _id: { $ifNull: ['$pelotao','(Sem pelotão)'] }, count: { $sum: 1 } } },
    ]);
    res.json({ total, ativos, ausentes, breakdown, porPelotao });
  } catch(err) { console.error('efetivo error:', err); res.status(500).json({ message: 'Erro ao buscar efetivo.', detail: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { warNumber, warName, nomeCompleto, rank, pelotao, companhia, funcao, situacao, telefone, observacoes, hasChamadaAccess, hasRelatorioAccess } = req.body;
    const exists = await User.findOne({ warNumber });
    if (exists) return res.status(400).json({ message: 'Número de guerra já cadastrado.' });
    const user = await User.create({
      warNumber, rank,
      warName: warName.toUpperCase(),
      nomeCompleto: nomeCompleto || '',
      pelotao: pelotao || '', companhia: companhia || '',
      funcao: funcao || '', situacao: situacao || 'Ativo',
      telefone: telefone || '', observacoes: observacoes || '',
      hasChamadaAccess:   Boolean(hasChamadaAccess),
      hasRelatorioAccess: Boolean(hasRelatorioAccess),
      role: 'soldier', isFirstLogin: true, password: null,
    });
    res.status(201).json(user);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao criar usuário.' }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const fields = ['warName','nomeCompleto','rank','active','pelotao','companhia','funcao','situacao','telefone','observacoes','hasChamadaAccess','hasRelatorioAccess'];
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Não encontrado.' });
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        user[f] = f === 'warName' ? req.body[f].toUpperCase() : req.body[f];
      }
    });
    // Admin sempre tem acesso total
    if (user.role === 'admin') {
      user.hasChamadaAccess   = true;
      user.hasRelatorioAccess = true;
    }
    await user.save();
    res.json(user);
  } catch { res.status(500).json({ message: 'Erro ao atualizar.' }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removido.' });
  } catch { res.status(500).json({ message: 'Erro.' }); }
});

router.post('/:id/reset-password', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Não encontrado.' });
    user.password = null; user.isFirstLogin = true;
    await user.save();
    res.json({ message: 'Senha resetada.' });
  } catch { res.status(500).json({ message: 'Erro.' }); }
});

module.exports = router;
