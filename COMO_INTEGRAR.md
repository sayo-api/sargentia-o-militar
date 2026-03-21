# Como integrar — escala-v5

## 1. Instalar dependência Word (se ainda não fez)

```bash
cd server && npm install docx
```

## 2. Adicionar campo ao modelo User (server/models/User.js)

Dentro do `userSchema`, adicione:

```js
hasChamadaAccess: { type: Boolean, default: false },
```

## 3. Registrar rotas no server.js

As novas rotas já estão no `server.js` desta versão. Certifique-se de que estão na ordem correta:

```js
app.use('/api/planilha',   require('./routes/exportDocx')); // ANTES do planilha geral
app.use('/api/planilha',   require('./routes/planilha'));
app.use('/api/chamada',    require('./routes/chamada'));
app.use('/api/auditoria',  require('./routes/auditoria'));
app.use('/api/permissoes', require('./routes/permissoes'));
```

## 4. Adicionar rotas no React Router (App.js ou Routes.js)

```jsx
import AdminRelatoriosPage from './pages/admin/AdminRelatoriosPage';
import ChamadaPage         from './pages/chamada/ChamadaPage';
import AuditoriaPage       from './pages/chamada/AuditoriaPage';

// Dentro do seu <Routes> / <Switch>:

// Página de relatórios (só admin)
<Route path="/admin/relatorios" element={
  <RequireAdmin><AdminRelatoriosPage /></RequireAdmin>
} />

// Sistema de chamada (admin OU hasChamadaAccess)
<Route path="/chamada"   element={<RequireChamadaAccess><ChamadaPage /></RequireChamadaAccess>} />
<Route path="/auditoria" element={<RequireChamadaAccess><AuditoriaPage /></RequireChamadaAccess>} />
```

### Componente RequireChamadaAccess

```jsx
function RequireChamadaAccess({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin' && !user.hasChamadaAccess) return <Navigate to="/" />;
  return children;
}
```

## 5. O que cada arquivo faz

| Arquivo | Onde usar |
|---------|-----------|
| `pages/admin/AdminRelatoriosPage.js` | Rota `/admin/relatorios` — 3 abas: Militares, Relatório Geral, Chamadas |
| `pages/admin/AdminRelatorios.css`    | Importado automaticamente pelo AdminRelatoriosPage |
| `pages/admin/AdminSchedulePage.js`   | Rota `/admin/escala` — escala mensal, sem as abas removidas |
| `pages/chamada/ChamadaPage.js`       | Rota `/chamada` — fazer chamada, marcar presença |
| `pages/chamada/AuditoriaPage.js`     | Rota `/auditoria` — auditar fardamento/TFM |
| `pages/chamada/Chamada.css`          | Importado pelos arquivos de chamada/auditoria |
| `server/routes/chamada.js`           | API chamada (BUG CORRIGIDO: stats antes de /:id) |
| `server/routes/auditoria.js`         | API auditoria (BUG CORRIGIDO: stats antes de /:id) |
| `server/routes/exportDocx.js`        | API download Word da escala |
| `server/routes/permissoes.js`        | API gerenciar hasChamadaAccess |

## 6. Bugs corrigidos nesta versão

- ✅ Soldados não apareciam na lista da chamada
  - Causa: rota `/stats/soldado/:userId` ficava DEPOIS de `/:id` e era capturada errada pelo Express
  - Fix: movida para ANTES de `/:id` em chamada.js e auditoria.js

- ✅ Lista de soldados vazia no modal de escala
  - Causa: `uRes.data || []` não tratava resposta `{ users: [...] }`
  - Fix: `uRes.data?.users || uRes.data || []`

- ✅ Abas "Militares" e "Chamadas" removidas da Escala
  - Agora ficam exclusivamente em `/admin/relatorios`
