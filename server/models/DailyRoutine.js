const mongoose = require('mongoose');
const itemSchema = new mongoose.Schema({
  hora:      { type: String, required: true },
  descricao: { type: String, required: true },
  tipo:      { type: String, enum:['formatura','alimentacao','servico','atividade','outro'], default:'outro' },
  ativo:     { type: Boolean, default: true },
}, { _id: false });
const dailyRoutineSchema = new mongoose.Schema({
  nome:      { type: String, default: 'Rotina Padrão' },
  itens:     { type: [itemSchema], default: [] },
  ativo:     { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('DailyRoutine', dailyRoutineSchema);
