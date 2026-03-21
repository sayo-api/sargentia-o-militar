const mongoose = require('mongoose');

const soldadoChamadaSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  presente: { type: Boolean, default: null }, // null = não marcado ainda
  atrasado: { type: Boolean, default: false },
  horarioChegada: { type: String, default: '' }, // ex: "08:15"
  observacao: { type: String, default: '' },
}, { _id: false });

const chamadaSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  turno: { type: String, enum: ['manha', 'tarde', 'noite', 'geral'], default: 'geral' },
  status: { type: String, enum: ['aberta', 'enviada', 'reaberta'], default: 'aberta' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enviadoEm: { type: Date, default: null },
  reabertoEm: { type: Date, default: null },
  soldiers: [soldadoChamadaSchema],
  observacaoGeral: { type: String, default: '' },
}, { timestamps: true });

// Index for fast lookup by date
chamadaSchema.index({ date: -1 });
chamadaSchema.index({ date: 1, turno: 1 }, { unique: true });

module.exports = mongoose.model('Chamada', chamadaSchema);
