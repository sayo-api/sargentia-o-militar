/**
 * ═══════════════════════════════════════════════════════════════════
 *  MIGRATION — Adicionar campo hasChamadaAccess ao modelo User
 * ═══════════════════════════════════════════════════════════════════
 *
 * Abra o arquivo server/models/User.js e adicione este campo
 * ao seu UserSchema (dentro do objeto de campos existentes):
 *
 *   hasChamadaAccess: { type: Boolean, default: false },
 *
 * Exemplo — antes:
 *   const userSchema = new mongoose.Schema({
 *     warName:   { type: String, required: true },
 *     warNumber: { type: Number },
 *     rank:      { type: String },
 *     role:      { type: String, enum: ['admin','user'], default: 'user' },
 *     // ...outros campos
 *   });
 *
 * Exemplo — depois:
 *   const userSchema = new mongoose.Schema({
 *     warName:   { type: String, required: true },
 *     warNumber: { type: Number },
 *     rank:      { type: String },
 *     role:      { type: String, enum: ['admin','user'], default: 'user' },
 *     hasChamadaAccess: { type: Boolean, default: false },   ← NOVO
 *     // ...outros campos
 *   });
 *
 * Como o Mongoose usa o padrão "schema-first" e o MongoDB é schemaless,
 * não é necessário rodar nenhuma migration de banco de dados.
 * Usuários existentes automaticamente terão hasChamadaAccess: false
 * (pois o default é false e o campo está ausente nos docs antigos).
 *
 * ─── npm install docx ───────────────────────────────────────────────
 * Para a geração do Word (.docx) funcionar, instale a dependência:
 *   cd server && npm install docx
 *
 * ═══════════════════════════════════════════════════════════════════
 *  ROTAS NO App.js/Router — adicionar as novas páginas
 * ═══════════════════════════════════════════════════════════════════
 *
 * Importe e adicione estas rotas no seu React Router:
 *
 *   import ChamadaPage       from './pages/chamada/ChamadaPage';
 *   import AuditoriaPage     from './pages/chamada/AuditoriaPage';
 *   import StatusSoldadosPage from './pages/chamada/StatusSoldadosPage';
 *   import PermissoesPage    from './pages/admin/PermissoesPage';
 *
 *   // Dentro do Switch/Routes:
 *   <Route path="/chamada"         element={<RequireChamadaAccess><ChamadaPage /></RequireChamadaAccess>} />
 *   <Route path="/auditoria"       element={<RequireChamadaAccess><AuditoriaPage /></RequireChamadaAccess>} />
 *   <Route path="/status-soldados" element={<RequireChamadaAccess><StatusSoldadosPage /></RequireChamadaAccess>} />
 *   <Route path="/admin/permissoes" element={<RequireAdmin><PermissoesPage /></RequireAdmin>} />
 *
 * ─── Componente RequireChamadaAccess ────────────────────────────────
 * Crie um wrapper que verifica user.hasChamadaAccess || user.role === 'admin':
 *
 *   function RequireChamadaAccess({ children }) {
 *     const { user } = useAuth();
 *     if (!user) return <Navigate to="/login" />;
 *     if (user.role !== 'admin' && !user.hasChamadaAccess) return <Navigate to="/" />;
 *     return children;
 *   }
 *
 * ─── Botão exportar Word na escala ──────────────────────────────────
 * No AdminSchedulePage.js, importe e adicione o ExportDocxButton:
 *
 *   import ExportDocxButton from './ExportDocxButton';
 *
 *   // No JSX, dentro da barra de controles do cabeçalho da escala:
 *   <ExportDocxButton month={currentMonth} year={currentYear} />
 *
 * ═══════════════════════════════════════════════════════════════════
 */

module.exports = {}; // arquivo apenas de documentação
