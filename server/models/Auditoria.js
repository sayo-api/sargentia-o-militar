const mongoose = require('mongoose');

const itemAuditoriaSchema = new mongoose.Schema({
  padrao: { type: Boolean, default: null }, // null = não avaliado, true = padrão, false = fora do padrão
  observacao: { type: String, default: '' },
}, { _id: false });

const tfmSchema = new mongoose.Schema({
  blusa:  { type: itemAuditoriaSchema, default: () => ({}) },
  short:  { type: itemAuditoriaSchema, default: () => ({}) },
  meia:   { type: itemAuditoriaSchema, default: () => ({}) },
  tenis:  { type: itemAuditoriaSchema, default: () => ({}) },
}, { _id: false });

const soldadoAuditoriaSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cabelo:  { type: itemAuditoriaSchema, default: () => ({}) },
  barba:   { type: itemAuditoriaSchema, default: () => ({}) },
  cuturno: { type: itemAuditoriaSchema, default: () => ({}) },
  tfm:     { type: tfmSchema, default: () => ({}) },
}, { _id: false });

const auditoriaSchema = new mongoose.Schema({
  chamadaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chamada', required: true },
  date:      { type: Date, required: true },
  status:    { type: String, enum: ['aberta', 'enviada', 'reaberta'], default: 'aberta' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enviadoEm: { type: Date, default: null },
  items:     [soldadoAuditoriaSchema],
}, { timestamps: true });

auditoriaSchema.index({ chamadaId: 1 });
auditoriaSchema.index({ date: -1 });

module.exports = mongoose.model('Auditoria', auditoriaSchema);
