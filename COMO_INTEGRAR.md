# Como integrar — escala-v6 (rotas atualizadas)

## Novas páginas e rotas

| Página | Rota | Quem acessa |
|--------|------|-------------|
| `AdminUsuariosPage`   | `/admin/usuarios`  | Admin |
| `AdminRelatoriosPage` | `/admin/relatorios`| Admin ou `hasRelatorioAccess` |

### AdminUsuariosPage — `/admin/usuarios`
- Gerenciar efetivo: criar, editar, excluir militares
- Modal com toggle **hasChamadaAccess** (acesso ao sistema de chamada)
- Modal com toggle **hasRelatorioAccess** (acesso ao painel de relatórios)
- Filtro por tipo de acesso

### AdminRelatoriosPage — `/admin/relatorios` (somente leitura)
- **📅 Chamadas do Dia** — navegar dia a dia (◄ ►), ver chamadas enviadas, lista de presença, baixar Word
- **📊 Efetivo Geral** — tabela consolidada de faltas/atrasos/irregularidades
- **👤 Por Militar** — buscar e ver histórico completo de qualquer soldado

---

## Campos no modelo User (server/models/User.js)

```js
hasChamadaAccess:   { type: Boolean, default: false },
hasRelatorioAccess: { type: Boolean, default: false },
```

## Rotas no React Router

```jsx
import AdminUsuariosPage   from './pages/admin/AdminUsuariosPage';
import AdminRelatoriosPage from './pages/admin/AdminRelatoriosPage';
import ChamadaPage         from './pages/chamada/ChamadaPage';
import AuditoriaPage       from './pages/chamada/AuditoriaPage';

<Route path="/admin/usuarios"  element={<RequireAdmin><AdminUsuariosPage /></RequireAdmin>} />
<Route path="/admin/relatorios" element={<RequireRelatorio><AdminRelatoriosPage /></RequireRelatorio>} />
<Route path="/chamada"   element={<RequireChamada><ChamadaPage /></RequireChamada>} />
<Route path="/auditoria" element={<RequireChamada><AuditoriaPage /></RequireChamada>} />
```

```jsx
function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function RequireRelatorio({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin' && !user.hasRelatorioAccess) return <Navigate to="/" />;
  return children;
}

function RequireChamada({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin' && !user.hasChamadaAccess) return <Navigate to="/" />;
  return children;
}
```

## API: rota PUT /api/users/:id deve aceitar os novos campos

```js
const { warName, warNumber, rank, role, hasChamadaAccess, hasRelatorioAccess, password } = req.body;
const updates = { warName, warNumber, rank, role, hasChamadaAccess, hasRelatorioAccess };
if (password) updates.password = await bcrypt.hash(password, 10);
```

## Campos TFM configuráveis (AuditoriaPage)
- Botão **⚙️ Campos TFM** na página de auditoria
- Salvo em `localStorage` com chave `sim_tfm_fields`
