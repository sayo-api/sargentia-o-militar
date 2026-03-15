# 🎖️ SIM — Sistema Interno Militar

Sistema completo de gestão militar com escalas de serviço, avisos e controle de efetivo.

---

## 📦 Estrutura do Projeto

```
military-system/
├── package.json          ← Scripts de build (raiz)
├── .env.example          ← Variáveis de ambiente (copie para .env)
├── server/
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Schedule.js
│   │   └── Notice.js
│   └── routes/
│       ├── auth.js
│       ├── users.js
│       ├── schedules.js
│       └── notices.js
└── client/               ← App React
    ├── package.json
    └── src/
        ├── context/AuthContext.js
        ├── components/
        │   ├── Layout.js / .css
        │   └── Calendar.js / .css
        └── pages/
            ├── HomePage, LoginPage, RegisterAdminPage
            ├── DashboardPage, NoticesPage, NoticeDetailPage
            └── admin/
                ├── AdminDashboardPage
                ├── AdminUsersPage
                ├── AdminSchedulePage
                └── AdminNoticesPage
```

---

## ⚙️ Configuração

### 1. Pré-requisitos

- Node.js 16+
- Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratuito)
- Conta no [Cloudinary](https://cloudinary.com) (gratuito)

### 2. Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```env
PORT=5000
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/military_system
JWT_SECRET=chave_secreta_longa_e_aleatoria_aqui
ADMIN_TOKEN=TOKEN_SECRETO_DO_ADMIN_2024
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

> ⚠️ **ADMIN_TOKEN**: Este é o código que somente o administrador conhece.
> Quem registrar uma conta de admin precisará informar este token.
> Escolha um valor forte e guarde com segurança.

### 3. Instalação e Build (Produção)

```bash
npm run build
```

Este comando:
1. Instala dependências do servidor
2. Instala dependências do React
3. Faz o build do frontend

### 4. Iniciar em Produção

```bash
npm start
```

O servidor serve o frontend em `http://localhost:5000`

### 5. Desenvolvimento Local

Opção A — Tudo de uma vez (na pasta raiz):
```bash
npm run dev
```

Terminal 2 (frontend):
```bash
cd client && npm start
```

Frontend estará em `http://localhost:3000` e o proxy aponta para o backend em `5000`.

---

## 🚀 Como usar

### Primeiro Acesso

1. Acesse o sistema e clique em **Registrar Administrador**
2. Preencha: número de guerra, nome de guerra, senha e o `ADMIN_TOKEN` do `.env`
3. Faça login normalmente

### Criar Conta de Soldado (Admin)

1. Acesse **Painel → Usuários → Novo Militar**
2. Informe: número de guerra, nome de guerra e patente
3. Compartilhe o número de guerra com o soldado
4. No primeiro login, o soldado criará sua própria senha

### Fluxo do Soldado

1. Acessa `/login`
2. Informa o número de guerra (sem senha no primeiro acesso)
3. Sistema detecta primeiro acesso → pede para criar senha
4. Na próxima vez, usa número de guerra + senha criada

### Criar Escala

1. Admin → **Escalas** → clica em um dia no calendário
2. Seleciona os militares
3. Define o tipo de serviço para cada um
4. Clica em **Salvar Escala**

### Publicar Aviso

1. Admin → **Avisos → Novo Aviso**
2. Preenche título, conteúdo, prioridade
3. Opcionalmente anexa: imagens, vídeos, GIFs, PDFs, planilhas
4. Publica

---

## 🎨 Tecnologias

| Camada      | Tecnologia                      |
|-------------|----------------------------------|
| Frontend    | React 18, React Router v6        |
| Estilo      | CSS puro, Oswald + Share Tech Mono |
| Backend     | Node.js, Express                 |
| Banco       | MongoDB + Mongoose               |
| Auth        | JWT + bcrypt                     |
| Uploads     | Cloudinary + multer              |
| Notificações| react-hot-toast                  |
| Datas       | date-fns (pt-BR)                 |

---

## 🔒 Patentes disponíveis

Recruta, Soldado, Cabo, 3º Sargento, 2º Sargento, 1º Sargento, Subtenente,
Aspirante a Oficial, 2º Tenente, 1º Tenente, Capitão, Major, Tenente-Coronel,
Coronel, General-de-Brigada, General-de-Divisão, General-de-Exército

---

## 🌐 Deploy (Render / Railway / Heroku)

1. Suba o projeto para um repositório Git
2. Crie um serviço Web apontando para a raiz
3. Build command: `npm run build`
4. Start command: `npm start`
5. Adicione as variáveis de ambiente no painel do host

---

## 📞 Suporte

Arquivo `.env` é obrigatório para o sistema funcionar.
Não commite o `.env` no repositório — use `.env.example` como referência.
