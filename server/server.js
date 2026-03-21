require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const https   = require('https');
const http    = require('http');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ══════════════════════════════════════════════════════════════
//  KEEPALIVE — Impede o Render de desligar o servidor gratuito
// ══════════════════════════════════════════════════════════════

app.get('/ping', (req, res) => {
  res.json({
    status:  'online',
    service: 'SIM — Sistema Interno Militar',
    ts:      new Date().toISOString(),
    uptime:  Math.round(process.uptime()) + 's',
  });
});

const KEEPALIVE_URL  = process.env.KEEPALIVE_URL || 'https://anyprem.store/ping';
const KEEPALIVE_MS   = 10 * 60 * 1000;
let   keepaliveTimer = null;
let   pingCount      = 0;

function doPing() {
  const url     = new URL(KEEPALIVE_URL);
  const lib     = url.protocol === 'https:' ? https : http;
  const startMs = Date.now();

  const req = lib.get(KEEPALIVE_URL, (res) => {
    pingCount++;
    const ms = Date.now() - startMs;
    console.log(`💓 Keepalive #${pingCount} → ${KEEPALIVE_URL} — ${res.statusCode} (${ms}ms)`);
    res.resume();
  });

  req.on('error', (err) => {
    console.warn(`⚠️  Keepalive falhou: ${err.message}`);
  });

  req.setTimeout(15000, () => {
    req.destroy();
    console.warn('⚠️  Keepalive timeout (15s)');
  });
}

function startKeepalive() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  Keepalive desativado em desenvolvimento');
    return;
  }
  setTimeout(() => {
    doPing();
    keepaliveTimer = setInterval(doPing, KEEPALIVE_MS);
    console.log(`💓 Keepalive ativo — ping a cada ${KEEPALIVE_MS / 60000} min → ${KEEPALIVE_URL}`);
  }, 30000);
}

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/schedules',  require('./routes/schedules'));
app.use('/api/planilha',   require('./routes/exportDocx'));  // ← Export DOCX (antes do planilha geral)
app.use('/api/planilha',   require('./routes/planilha'));    // ← Escala planilha militar
app.use('/api/notices',    require('./routes/notices'));
app.use('/api/boletins',   require('./routes/boletins'));
app.use('/api/stats',      require('./routes/stats'));
app.use('/api/rotina',     require('./routes/rotina'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/api/chats',      require('./routes/chats'));
// ── NOVOS MÓDULOS ──────────────────────────────────────────────
app.use('/api/chamada',    require('./routes/chamada'));     // ← Sistema de Chamada
app.use('/api/auditoria',  require('./routes/auditoria'));   // ← Auditoria TFM / Fardamento
app.use('/api/permissoes', require('./routes/permissoes'));  // ← Permissões de usuário
// ───────────────────────────────────────────────────────────────

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🎖️  SIM — Sistema Interno Militar`);
  console.log(`✅  Servidor rodando em http://localhost:${PORT}`);
  console.log(`🌍  Ambiente: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🖥️  Frontend React em http://localhost:3000\n`);
  }
  startKeepalive();
});
