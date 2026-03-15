const mongoose = require('mongoose');
const dailyOrderSchema = new mongoose.Schema({
  data:      { type: Date, required: true },
  titulo:    { type: String, default: 'ORDEM DO DIA' },
  unidade:   { type: String, default: '' },
  textos:    { type: [String], default: [] },
  assinante: { type: String, default: '' },
  cargo:     { type: String, default: '' },
  publicado: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
dailyOrderSchema.index({ data: -1 });
module.exports = mongoose.model('DailyOrder', dailyOrderSchema);
