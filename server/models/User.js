const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const RANKS = [
  'Recruta','Soldado','Cabo',
  '3º Sargento','2º Sargento','1º Sargento','Subtenente',
  'Aspirante a Oficial','2º Tenente','1º Tenente','Capitão',
  'Major','Tenente-Coronel','Coronel',
  'General-de-Brigada','General-de-Divisão','General-de-Exército','General do Exército',
];

const SITUACOES = ['Ativo','Licença Médica','Hospital','Missão','Férias','Descanso','Licença Especial','Inativo'];

const userSchema = new mongoose.Schema({
  warNumber:   { type: String, required: true, unique: true, trim: true },
  warName:     { type: String, required: true, trim: true, uppercase: true },
  nomeCompleto:{ type: String, trim: true, default: '' },
  password:    { type: String, default: null },
  rank:        { type: String, enum: RANKS, default: 'Soldado' },
  role:        { type: String, enum: ['admin','soldier'], default: 'soldier' },
  isFirstLogin:{ type: Boolean, default: true },
  avatar:      { type: String, default: null },
  active:      { type: Boolean, default: true },
  // Novos campos de sargentia digital
  pelotao:     { type: String, default: '' },
  companhia:   { type: String, default: '' },
  funcao:      { type: String, default: '' },
  situacao:    { type: String, enum: SITUACOES, default: 'Ativo' },
  telefone:    { type: String, default: '' },
  observacoes: { type: String, default: '' },
  // ── Permissões de acesso aos módulos ──────────────────────────────────────
  hasChamadaAccess:   { type: Boolean, default: false }, // acesso ao sistema de chamada / auditoria
  hasRelatorioAccess: { type: Boolean, default: false }, // acesso ao painel de relatórios
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.methods.matchPassword = async function(p) { return bcrypt.compare(p, this.password); };

module.exports = mongoose.model('User', userSchema);
module.exports.RANKS = RANKS;
module.exports.SITUACOES = SITUACOES;
