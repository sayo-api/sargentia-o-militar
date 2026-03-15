const mongoose = require('mongoose');

const posicaoSchema = new mongoose.Schema({
  id:    { type: String, required: true },
  label: { type: String, required: true },
  multi: { type: Boolean, default: false },
});

const diaSchema = new mongoose.Schema({
  data:    { type: Date, required: true },
  posicoes: { type: Map, of: String, default: {} },
});

const boletimSchema = new mongoose.Schema({
  // Identificação
  boletimNum:     { type: String, default: '' },
  boletimRef:     { type: String, default: '' },
  boletimRefData: { type: Date },
  emitidoEm:      { type: Date, required: true },
  local:          { type: String, default: 'Brasília' },

  // Unidade
  unidade:       { type: String, default: '1º REGIMENTO DE CAVALARIA DE GUARDAS\nDRAGÕES DA INDEPENDÊNCIA' },
  unidadeAbrev:  { type: String, default: '1º RCG' },

  // Assinatura
  assinante: { type: String, default: '' },
  cargo:     { type: String, default: '' },

  // 3ª parte
  sodHora:      { type: String, default: '06:45' },
  sodNome:      { type: String, default: '' },
  fraseCafe:    { type: String, default: '' },
  frasesExtras: { type: String, default: '' },

  // 4ª parte
  justica:    { type: String, default: 'S/A' },
  disciplina: { type: String, default: 'S/A' },

  // Posições e dias
  positions: [posicaoSchema],
  dias:      [diaSchema],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Boletim', boletimSchema);
