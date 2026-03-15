import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import './AIChatBubble.css';

/* ══════════════════════════════════════════════════════════════
   MARKDOWN RENDERER — blocos de código com botão Copiar React
   ══════════════════════════════════════════════════════════════ */
function MsgContent({ content, onCopy }) {
  const blocks = [];
  const regex  = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = regex.exec(content)) !== null) {
    if (m.index > last) blocks.push({ t: 'text', v: content.slice(last, m.index) });
    blocks.push({ t: 'code', lang: m[1] || 'txt', v: m[2].trim() });
    last = regex.lastIndex;
  }
  if (last < content.length) blocks.push({ t: 'text', v: content.slice(last) });

  return (
    <div className="aic-content">
      {blocks.map((b, i) =>
        b.t === 'code' ? (
          <div key={i} className="aic-code-wrap">
            <div className="aic-code-bar">
              <span className="aic-code-lang">{b.lang.toUpperCase()}</span>
              <CopyBtn text={b.v} onCopy={onCopy}/>
            </div>
            <pre className="aic-pre"><code>{b.v}</code></pre>
          </div>
        ) : (
          <span key={i} className="aic-text"
            dangerouslySetInnerHTML={{ __html: fmtTxt(b.v) }}
          />
        )
      )}
    </div>
  );
}

function CopyBtn({ text, onCopy }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className="aic-copy-btn" onClick={handle}>
      {copied ? '✓ Copiado!' : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copiar
        </>
      )}
    </button>
  );
}

function fmtTxt(t) {
  return t
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code class="aic-ic">$1</code>')
    .replace(/^### (.+)$/gm,'<b class="aic-h3">$1</b>')
    .replace(/^## (.+)$/gm,'<b class="aic-h2">$1</b>')
    .replace(/^# (.+)$/gm,'<b class="aic-h1">$1</b>')
    .replace(/^[-•] (.+)$/gm,'<span class="aic-li">· $1</span>')
    .replace(/\n/g,'<br>');
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
const WELCOME = {
  role: 'assistant',
  content: `Olá! Sou o **Assistente IA Militar** alimentado pelo **Gemini 2.5 Flash**.\n\nPosso ajudar com:\n- 📋 Documentos e textos militares oficiais\n- 💻 Código Node.js / React para o SIM\n- 🔍 Regulamentos e normas do EB\n- 🖼 Geração de imagens (modo IMG)\n\nComo posso ajudar?`,
};

const QUICK = [
  '📋 Gerar texto de ordem do dia',
  '💻 Código para campo no cadastro',
  '📅 Como funciona a escala automática?',
  '🔍 Regulamentos de serviço militar EB',
];

export default function AIChatBubble() {
  const { user } = useAuth();

  const [open,        setOpen]       = useState(false);
  const [fullscreen,  setFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen]= useState(true);
  const [pulse,       setPulse]      = useState(false);
  const [chats,       setChats]      = useState([]);
  const [currentId,   setCurrentId]  = useState(null);
  const [messages,    setMessages]   = useState([WELCOME]);
  const [input,       setInput]      = useState('');
  const [loading,     setLoading]    = useState(false);
  const [loadingChats,setLoadingChats]=useState(false);
  const [loadingChat, setLoadingChat]= useState(false);
  const [imgMode,     setImgMode]    = useState(false);
  const [useSearch,   setUseSearch]  = useState(true);
  const [useThinking, setUseThinking]= useState(true);
  const [status,      setStatus]     = useState(null);
  const [hasKey,      setHasKey]     = useState(true);
  const [confirmAll,  setConfirmAll] = useState(false);
  const [showQuick,   setShowQuick]  = useState(true);

  const endRef      = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [input]);

  useEffect(() => {
    if (!open) return;
    loadChats();
    api.get('/ai/status').then(r => { setStatus(r.data); setHasKey(r.data.hasKey); }).catch(()=>{});
    setTimeout(() => textareaRef.current?.focus(), 250);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const t = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 2200); }, 50000);
    return () => clearInterval(t);
  }, [open]);

  const saveMessages = useCallback(async (chatId, msgs) => {
    if (!chatId) return;
    try {
      await api.put(`/chats/${chatId}`, { messages: msgs });
      setChats(prev => prev.map(c => {
        if (c._id !== chatId) return c;
        const first = msgs.find(m => m.role === 'user');
        return { ...c, title: first ? first.content.slice(0,65)+(first.content.length>65?'…':'') : c.title, updatedAt: new Date() };
      }));
    } catch {}
  }, []);

  if (!user || user.role !== 'admin') return null;

  const loadChats = async () => {
    setLoadingChats(true);
    try { const r = await api.get('/chats'); setChats(r.data); } catch {}
    finally { setLoadingChats(false); }
  };

  const loadChat = async (id) => {
    if (id === currentId) return;
    setLoadingChat(true);
    try {
      const r = await api.get(`/chats/${id}`);
      setCurrentId(id);
      setMessages(r.data.messages?.length ? r.data.messages : [WELCOME]);
      setShowQuick(false); setInput('');
    } catch {}
    finally { setLoadingChat(false); }
  };

  const newChat = async () => {
    try {
      const r = await api.post('/chats', { title: 'Nova Conversa', messages: [] });
      setChats(prev => [r.data, ...prev]);
      setCurrentId(r.data._id);
      setMessages([WELCOME]); setShowQuick(true); setInput('');
    } catch {}
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/chats/${id}`);
      setChats(prev => prev.filter(c => c._id !== id));
      if (currentId === id) { setCurrentId(null); setMessages([WELCOME]); setShowQuick(true); }
    } catch {}
  };

  const deleteAll = async () => {
    try {
      await api.delete('/chats/all');
      setChats([]); setCurrentId(null); setMessages([WELCOME]); setShowQuick(true); setConfirmAll(false);
    } catch {}
  };

  const clearChat = async () => {
    if (currentId) {
      try { await api.put(`/chats/${currentId}`, { messages: [], title: 'Nova Conversa' }); } catch {}
      setChats(prev => prev.map(c => c._id === currentId ? { ...c, title: 'Nova Conversa' } : c));
    }
    setMessages([WELCOME]); setShowQuick(true);
  };

  const send = async (txt) => {
    const text = (txt || input).trim();
    if (!text || loading) return;
    setInput(''); setShowQuick(false);

    let chatId = currentId;
    if (!chatId) {
      try { const r = await api.post('/chats',{ title:'Nova Conversa',messages:[] }); chatId=r.data._id; setCurrentId(chatId); setChats(prev=>[r.data,...prev]); } catch { return; }
    }

    const userMsg = { role:'user', content:text };
    const base = messages.filter(m => m !== WELCOME);
    const newMsgs = [...base, userMsg];
    setMessages([WELCOME, ...newMsgs]);
    setLoading(true);

    try {
      if (imgMode) {
        const r = await api.post('/ai/image', { prompt:text });
        const imgMsg = { role:'assistant', content:r.data.description||'Imagem gerada!', imageBase64:r.data.imageBase64, imageMime:r.data.mimeType };
        const final = [...newMsgs, imgMsg];
        setMessages([WELCOME, ...final]);
        await saveMessages(chatId, final);
      } else {
        const apiMsgs = newMsgs.slice(-16).map(m => ({ role:m.role, content:m.content }));
        const r = await api.post('/ai/chat', { messages:apiMsgs, useSearch, useThinking });
        const aMsg = { role:'assistant', content:r.data.reply, thinking:r.data.thinking, searchUsed:r.data.searchUsed, searchQueries:r.data.searchQueries };
        const final = [...newMsgs, aMsg];
        setMessages([WELCOME, ...final]);
        await saveMessages(chatId, final);
        if (r.data.usage) setStatus(p => ({ ...p, ...r.data.usage }));
      }
    } catch (err) {
      const isKey = err.response?.data?.needsKey;
      if (isKey) setHasKey(false);
      const errMsg = { role:'assistant', content:err.response?.data?.message||'Erro ao contatar IA.', isError:true };
      setMessages(prev => [...prev, errMsg]);
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); return; } catch {}
    const el = document.createElement('textarea'); el.value=code;
    document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
  };

  const fmtDate = (d) => {
    const dt = new Date(d); const now = new Date();
    return (now-dt)<86400000 ? dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
  };

  const usagePct = status ? Math.min(100, Math.round((status.today/status.limit)*100)) : 0;

  return (
    <div className="aic-root">

      {open && (
        <div className={`aic-window ${fullscreen ? 'aic-fs' : ''}`}>

          {/* ── Topbar ── */}
          <div className="aic-topbar">
            <div className="aic-topbar-left">
              <button className="aic-tb-btn" onClick={() => setSidebarOpen(s=>!s)} title="Histórico">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="aic-brand">
                <span className="aic-brand-dot"/>
                <span className="aic-brand-name">IA MILITAR</span>
                <span className="aic-brand-model">Gemini 2.5 Flash</span>
              </div>
            </div>
            <div className="aic-topbar-right">
              {status && (
                <div className="aic-usage" title={`${status.remaining}/${status.limit} msgs restantes`}>
                  <div className="aic-usage-track">
                    <div className="aic-usage-fill" style={{width:usagePct+'%',background:usagePct>80?'#c0392b':usagePct>60?'#d4a017':'#5a7a52'}}/>
                  </div>
                  <span className="aic-usage-txt">{status.remaining}/{status.limit}</span>
                </div>
              )}
              <button className={`aic-toggle ${useSearch?'on':''}`} onClick={()=>setUseSearch(s=>!s)} title="Pesquisa Web">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>WEB
              </button>
              <button className={`aic-toggle ${useThinking?'on':''}`} onClick={()=>setUseThinking(t=>!t)} title="Raciocínio">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>THINK
              </button>
              <button className={`aic-toggle ${imgMode?'on':''}`} onClick={()=>setImgMode(m=>!m)} title="Imagem">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>IMG
              </button>
              <button className="aic-tb-btn" onClick={clearChat} title="Limpar chat">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
              <button className="aic-tb-btn" onClick={()=>setFullscreen(f=>!f)} title={fullscreen?'Sair tela cheia':'Tela cheia'}>
                {fullscreen
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/></svg>
                }
              </button>
              <button className="aic-tb-btn aic-close-btn" onClick={()=>setOpen(false)} title="Fechar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* ── Corpo ── */}
          <div className="aic-body">

            {/* ── Sidebar ── */}
            {sidebarOpen && (
              <aside className="aic-sidebar">
                <button className="aic-new-btn" onClick={newChat}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nova Conversa
                </button>
                <div className="aic-hist-label">HISTÓRICO</div>
                <div className="aic-hist-list">
                  {loadingChats ? (
                    <div className="aic-hist-loading"><span className="aic-spin-sm"/></div>
                  ) : chats.length===0 ? (
                    <p className="aic-hist-empty">Nenhuma conversa salva</p>
                  ) : chats.map(c => (
                    <div key={c._id} className={`aic-hist-item ${currentId===c._id?'active':''}`} onClick={()=>loadChat(c._id)}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" style={{flexShrink:0,marginTop:2}}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <div className="aic-hist-info">
                        <span className="aic-hist-title">{c.title}</span>
                        <span className="aic-hist-date">{fmtDate(c.updatedAt)}</span>
                      </div>
                      <button className="aic-hist-del" onClick={(e)=>deleteChat(c._id,e)} title="Apagar">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
                {chats.length>0 && (
                  <div className="aic-sidebar-footer">
                    {confirmAll ? (
                      <div className="aic-confirm-row">
                        <span>Apagar tudo?</span>
                        <button className="aic-btn-yes" onClick={deleteAll}>Sim</button>
                        <button className="aic-btn-no" onClick={()=>setConfirmAll(false)}>Não</button>
                      </div>
                    ) : (
                      <button className="aic-del-all" onClick={()=>setConfirmAll(true)}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        Apagar tudo
                      </button>
                    )}
                  </div>
                )}
              </aside>
            )}

            {/* ── Mensagens ── */}
            <div className="aic-msgs-wrap">
              <div className="aic-msgs">
                {loadingChat ? (
                  <div className="aic-loading-chat"><span className="aic-spin"/><span>Carregando…</span></div>
                ) : messages.map((msg,i) => (
                  <div key={i} className={`aic-msg aic-${msg.role} ${msg.isError?'aic-err':''}`}>
                    <div className="aic-avatar">{msg.role==='user'?'👤':'⬛'}</div>
                    <div className="aic-bubble">
                      <div className="aic-role">{msg.role==='user'?'VOCÊ':'IA MILITAR'}</div>
                      {msg.thinking && <span className="aic-badge aic-badge-think">🧠 Raciocinou antes de responder</span>}
                      {msg.searchUsed && msg.searchQueries?.length>0 && <span className="aic-badge aic-badge-search">🔍 {msg.searchQueries.slice(0,2).join(' · ')}</span>}
                      {msg.imageBase64 && (
                        <div className="aic-img-box">
                          <img src={`data:${msg.imageMime||'image/png'};base64,${msg.imageBase64}`} alt="IA gerou esta imagem" className="aic-img"/>
                          <a href={`data:${msg.imageMime||'image/png'};base64,${msg.imageBase64}`} download="imagem_ia.png" className="aic-img-dl">⬇ Baixar</a>
                        </div>
                      )}
                      <MsgContent content={msg.content} onCopy={copyCode}/>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="aic-msg aic-assistant">
                    <div className="aic-avatar">⬛</div>
                    <div className="aic-bubble">
                      <div className="aic-role">IA MILITAR</div>
                      <div className="aic-typing">
                        <span/><span/><span/>
                        <span className="aic-typing-lbl">{imgMode?'Gerando imagem…':useThinking?'Raciocinando…':'Respondendo…'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {showQuick && messages.length===1 && !loading && (
                  <div className="aic-quick">
                    {QUICK.map((q,i) => <button key={i} className="aic-quick-btn" onClick={()=>send(q)}>{q}</button>)}
                  </div>
                )}
                <div ref={endRef}/>
              </div>

              {imgMode && (
                <div className="aic-img-mode-banner">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  MODO IMAGEM ATIVO — descreva a imagem que quer gerar
                </div>
              )}

              <div className="aic-input-area">
                {!hasKey && (
                  <div className="aic-key-warn">
                    ⚠ Configure <code>GEMINI_API_KEY</code> no .env ·{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Obter grátis ↗</a>
                  </div>
                )}
                <div className="aic-input-row">
                  <textarea
                    ref={textareaRef}
                    className="aic-input"
                    value={input}
                    onChange={e=>setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={loading?'Aguarde…':'Mensagem… (Enter = enviar | Shift+Enter = quebra de linha)'}
                    rows={1}
                    disabled={loading}
                  />
                  <button className={`aic-send ${loading?'aic-send-loading':''}`} onClick={()=>send()} disabled={loading||!input.trim()}>
                    {loading
                      ? <span className="aic-spin-sm"/>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    }
                  </button>
                </div>
                <div className="aic-hint">
                  <span>Enter = enviar · Shift+Enter = nova linha</span>
                  <span>Google Gemini 2.5 Flash</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FAB ─── */}
      <button
        className={`aic-fab ${open?'aic-fab-open':''} ${pulse?'aic-fab-pulse':''}`}
        onClick={()=>setOpen(o=>!o)}
        title="Assistente IA Militar"
      >
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <span className="aic-fab-inner"><span className="aic-fab-icon">⬛</span><span className="aic-fab-lbl">IA</span></span>
        }
        {!open && messages.filter(m=>m.role==='assistant'&&m!==WELCOME).length>0 && (
          <span className="aic-notif">{messages.filter(m=>m.role==='assistant'&&m!==WELCOME).length}</span>
        )}
      </button>
    </div>
  );
}
