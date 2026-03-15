const express = require('express');
const router = express.Router();
const DailyRoutine = require('../models/DailyRoutine');
const DailyOrder = require('../models/DailyOrder');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const { protect, adminOnly } = require('../middleware/auth');

const DEFAULT_ROTINA = [
  { hora:'05:30', descricao:'Cabo de Dia recolhe etapa do café da manhã da Subunidade', tipo:'servico', ativo:true },
  { hora:'06:00', descricao:'Alvorada — Toque de alvorada', tipo:'formatura', ativo:true },
  { hora:'06:30', descricao:'Café da manhã', tipo:'alimentacao', ativo:true },
  { hora:'07:00', descricao:'Formatura — Contagem do efetivo', tipo:'formatura', ativo:true },
  { hora:'07:30', descricao:'Início das atividades', tipo:'atividade', ativo:true },
  { hora:'11:30', descricao:'Almoço', tipo:'alimentacao', ativo:true },
  { hora:'13:30', descricao:'Retorno das atividades', tipo:'atividade', ativo:true },
  { hora:'17:00', descricao:'Formatura de encerramento — Contagem do efetivo', tipo:'formatura', ativo:true },
  { hora:'17:30', descricao:'Dispensa da tropa', tipo:'outro', ativo:true },
  { hora:'22:00', descricao:'Recolher — Silêncio no quartel', tipo:'outro', ativo:true },
];

// GET rotina config
router.get('/config', protect, async (req, res) => {
  try {
    let rotina = await DailyRoutine.findOne({ ativo: true }).sort({ updatedAt: -1 });
    if (!rotina) {
      rotina = await DailyRoutine.create({ nome:'Rotina Padrão', itens: DEFAULT_ROTINA });
    }
    res.json(rotina);
  } catch(err) { console.error(err); res.status(500).json({ message: 'Erro ao carregar rotina.' }); }
});

// PUT update rotina
router.put('/config', protect, adminOnly, async (req, res) => {
  try {
    const { itens, nome } = req.body;
    let rotina = await DailyRoutine.findOne({ ativo: true });
    if (!rotina) rotina = new DailyRoutine({ nome: 'Rotina Padrão', itens: DEFAULT_ROTINA });
    if (itens) rotina.itens = itens;
    if (nome) rotina.nome = nome;
    rotina.updatedBy = req.user._id;
    await rotina.save();
    res.json(rotina);
  } catch(err) { console.error(err); res.status(500).json({ message: 'Erro ao salvar rotina.' }); }
});

// GET all ordens
router.get('/ordens', protect, adminOnly, async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = {};
    if (from) query.data = { ...query.data, $gte: new Date(from) };
    if (to) query.data = { ...query.data, $lte: new Date(to) };
    const ordens = await DailyOrder.find(query).populate('createdBy','warName').sort({ data: -1 }).limit(50);
    res.json(ordens);
  } catch { res.status(500).json({ message: 'Erro.' }); }
});

// GET one ordem
router.get('/ordens/:id', protect, adminOnly, async (req, res) => {
  try {
    const o = await DailyOrder.findById(req.params.id).populate('createdBy','warName');
    if (!o) return res.status(404).json({ message: 'Não encontrada.' });
    res.json(o);
  } catch { res.status(500).json({ message: 'Erro.' }); }
});

// POST create ordem
router.post('/ordens', protect, adminOnly, async (req, res) => {
  try {
    const { data, titulo, unidade, textos, assinante, cargo, publicado } = req.body;
    const ordem = await DailyOrder.create({
      data: data ? new Date(data) : new Date(),
      titulo: titulo || 'ORDEM DO DIA',
      unidade: unidade || '',
      textos: textos || [],
      assinante: assinante || '',
      cargo: cargo || '',
      publicado: !!publicado,
      createdBy: req.user._id,
    });
    res.status(201).json(ordem);
  } catch(err) { console.error(err); res.status(500).json({ message: 'Erro ao criar ordem.' }); }
});

// PUT update ordem
router.put('/ordens/:id', protect, adminOnly, async (req, res) => {
  try {
    const ordem = await DailyOrder.findById(req.params.id);
    if (!ordem) return res.status(404).json({ message: 'Não encontrada.' });
    const fields = ['data','titulo','unidade','textos','assinante','cargo','publicado'];
    fields.forEach(f => { if (req.body[f] !== undefined) ordem[f] = req.body[f]; });
    await ordem.save();
    res.json(ordem);
  } catch { res.status(500).json({ message: 'Erro ao atualizar.' }); }
});

// DELETE ordem
router.delete('/ordens/:id', protect, adminOnly, async (req, res) => {
  try {
    await DailyOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removida.' });
  } catch { res.status(500).json({ message: 'Erro.' }); }
});

// GET parte do dia (auto-generate document data)
router.get('/parte-do-dia', protect, adminOnly, async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
    const date = new Date(dateStr + 'T12:00:00');

    const [schedule, ausentes] = await Promise.all([
      Schedule.findOne({
        date: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt:  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        },
      }).populate('soldiers.user', 'warName rank nomeCompleto warNumber'),
      User.find({ role:'soldier', $or:[{ situacao:{$ne:'Ativo'} }, { active:false }] })
          .select('warName rank situacao active'),
    ]);

    const DIAS_PT = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];
    const MESES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const diaSemana = DIAS_PT[date.getDay()];
    const dataFmt = `${String(date.getDate()).padStart(2,'0')} de ${MESES_PT[date.getMonth()]} de ${date.getFullYear()}`;

    res.json({ date: dateStr, diaSemana, dataFmt, schedule, ausentes });
  } catch(err) { console.error(err); res.status(500).json({ message: 'Erro ao gerar parte do dia.' }); }
});

module.exports = router;
