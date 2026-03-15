require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/boletins', require('./routes/boletins'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/rotina', require('./routes/rotina'));
app.use('/api/ai',     require('./routes/ai'));
app.use('/api/chats',  require('./routes/chats'));

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
});
