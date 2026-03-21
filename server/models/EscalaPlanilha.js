const mongoose = require('mongoose');

const dutySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  abbreviation: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { _id: false });

const statusColorSchema = new mongoose.Schema({
  label: { type: String },
  bgColor: { type: String },
  textColor: { type: String },
}, { _id: false });

const cellSchema = new mongoose.Schema({
  day: { type: Number, required: true },          // 1-31 day of month
  dutyId: { type: String, required: true },        // which duty/post
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, default: 'ativo' },      // ativo|baixado|folga|ferias|hospitalar|desertor|luto|ausente
  reason: { type: String, default: '' },           // motivo do afastamento
  notes: { type: String, default: '' },
  customColor: { type: String, default: '' },
}, { _id: false });

// Cycle template: for each duty, which user on each day of the cycle
const cycleAssignmentSchema = new mongoose.Schema({
  dutyId: { type: String, required: true },
  cycleDay: { type: Number, required: true },      // 1 to cycleLength
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: false });

const escalaPlanilhaSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  unit: { type: String, default: '' },
  month: { type: Number, required: true },         // 1-12
  year: { type: Number, required: true },
  cycleLength: { type: Number, default: 8 },
  cycleStartDay: { type: Number, default: 1 },     // which day of month the cycle starts

  duties: [dutySchema],

  statusColors: {
    type: Map,
    of: statusColorSchema,
    default: () => new Map([
      ['ativo',       { label: 'Ativo / Serviço',      bgColor: '#22c55e', textColor: '#ffffff' }],
      ['baixado',     { label: 'Baixado',               bgColor: '#ef4444', textColor: '#ffffff' }],
      ['folga',       { label: 'Folga / Dispensa',      bgColor: '#f59e0b', textColor: '#ffffff' }],
      ['ferias',      { label: 'Férias',                bgColor: '#3b82f6', textColor: '#ffffff' }],
      ['hospitalar',  { label: 'Internação Hospitalar', bgColor: '#ec4899', textColor: '#ffffff' }],
      ['desertor',    { label: 'Desertor',              bgColor: '#1f2937', textColor: '#ffffff' }],
      ['luto',        { label: 'Luto',                  bgColor: '#6b7280', textColor: '#ffffff' }],
      ['ausente',     { label: 'Ausente s/ justif.',    bgColor: '#f97316', textColor: '#ffffff' }],
      ['missao',      { label: 'Missão Especial',       bgColor: '#7c3aed', textColor: '#ffffff' }],
    ]),
  },

  cells: [cellSchema],
  cycleTemplate: [cycleAssignmentSchema],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

escalaPlanilhaSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('EscalaPlanilha', escalaPlanilhaSchema);
