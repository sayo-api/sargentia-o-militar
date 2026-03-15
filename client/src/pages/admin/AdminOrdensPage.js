import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminPages.css';
import './responsive.css';

const TEMPLATES = [
  { id: 'cafe', label: 'Café da Manhã', texto: (hora, nome) => `De acordo com determinação do Chefe da Companhia, o Cb de Dia deverá recolher a etapa do café da manhã da Subunidade às ${hora||'05:30'} horas.` },
  { id: 'sod', label: 'SOD', texto: (hora, nome) => `O ${nome||'NOME DO MILITAR'} apresentar-se-á ao Cb de Dia às ${hora||'06:45'} horas para cumprir o serviço de SOD (Sentinela de Oficial de Dia).` },
  { id: 'revista', label: 'Revista de Armamento', texto: () => 'O Sargento de Dia deverá realizar a revista de armamento às 07:00 horas, verificando o estado de conservação e funcionamento de todas as armas da guarda.' },
  { id: 'formatura', label: 'Formatura', texto: (hora) => `Fica determinado que a formatura de encerramento das atividades do dia realizar-se-á às ${hora||'17:00'} horas, na praça de armas, com a presença obrigatória de todo o efetivo.` },
  { id: 'escala', label: 'Escala de Serviço', texto: (hora, nome) => `A escala de serviço para o dia está organizada conforme determinado neste boletim. O ${nome||'Sargento de Dia'} é responsável pelo cumprimento da presente ordem.` },
  { id: 'missao', label: 'Missão Especial', texto: (hora, nome) => `Em cumprimento à missão determinada pelo Comando, o ${nome||'efetivo designado'} deverá estar em condições de executar as atividades a partir das ${hora||'08:00'} horas.` },
  { id: 'alerta', label: 'Alerta / Emergência', texto: () => 'O efetivo de serviço deverá manter-se em estado de alerta redobrado durante o período estabelecido, comunicando imediatamente qualquer ocorrência ao Oficial de Dia.' },
  { id: 'manutencao', label: 'Manutenção', texto: () => 'Fica determinado que a manutenção dos equipamentos e instalações deverá ser realizada conforme cronograma, sendo o Sargento de Dia responsável pela supervisão das atividades.' },
];

export default function AdminOrdensPage() {
  const [ordens, setOrdens]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [editing, setEditing] = useState(null);// null = new
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm]       = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    titulo: 'ORDEM DO DIA',
    unidade: '1º REGIMENTO DE CAVALARIA DE GUARDAS\nDRAGÕES DA INDEPENDÊNCIA',
    textos: [],
    assinante: '',
    cargo: '',
    publicado: false,
  });
  const [novoTexto, setNovoTexto] = useState('');
  const [tmplHora, setTmplHora]   = useState('');
  const [tmplNome, setTmplNome]   = useState('');
  const [users, setUsers]         = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const [ordRes, userRes] = await Promise.all([api.get('/rotina/ordens'), api.get('/users')]);
      setOrdens(ordRes.data); setUsers(userRes.data);
    } catch { toast.error('Erro ao carregar ordens'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const saveOrdem = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/rotina/ordens/${editing._id}`, form);
        toast.success('Ordem atualizada!');
      } else {
        await api.post('/rotina/ordens', form);
        toast.success('Ordem criada!');
      }
      setShowEditor(false); fetch();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const deleteOrdem = async (id) => {
    if (!window.confirm('Excluir esta ordem?')) return;
    try { await api.delete(`/rotina/ordens/${id}`); fetch(); toast.success('Excluída'); }
    catch { toast.error('Erro'); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ data: format(new Date(), 'yyyy-MM-dd'), titulo: 'ORDEM DO DIA', unidade: '1º REGIMENTO DE CAVALARIA DE GUARDAS\nDRAGÕES DA INDEPENDÊNCIA', textos: [], assinante: '', cargo: '', publicado: false });
    setShowEditor(true);
  };

  const openEdit = (o) => {
    setEditing(o);
    setForm({ data: format(new Date(o.data), 'yyyy-MM-dd'), titulo: o.titulo, unidade: o.unidade || '', textos: o.textos || [], assinante: o.assinante || '', cargo: o.cargo || '', publicado: o.publicado });
    setShowEditor(true);
  };

  const addTexto = () => {
    if (!novoTexto.trim()) return;
    setForm(p => ({ ...p, textos: [...p.textos, novoTexto.trim()] }));
    setNovoTexto('');
  };

  const addTemplate = (tmpl) => {
    const texto = tmpl.texto(tmplHora, tmplNome);
    setForm(p => ({ ...p, textos: [...p.textos, texto] }));
    toast.success('Texto adicionado!');
  };

  const removeTexto = (i) => setForm(p => ({ ...p, textos: p.textos.filter((_, idx) => idx !== i) }));
  const moveTexto = (i, dir) => {
    const arr = [...form.textos];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setForm(p => ({ ...p, textos: arr }));
  };

  const openPreview = (o) => { setPreviewData(o); setPreviewOpen(true); };

  const DIAS_PT = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📋 <span>Ordens</span> do Dia</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Nova Ordem</button>
      </div>

      {/* List */}
      {!showEditor ? (
        <div className="card">
          {ordens.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">Nenhuma ordem criada ainda</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>Criar primeira ordem</button>
            </div>
          ) : (
            <div>
              {ordens.map(o => (
                <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 6, background: 'var(--bg-dark)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--accent)', lineHeight: 1 }}>
                      {format(new Date(o.data), 'dd')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {format(new Date(o.data), 'MMM', { locale: ptBR })}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--text-primary)', letterSpacing: '0.06em' }}>{o.titulo}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {DIAS_PT[new Date(o.data).getDay()]} · {o.textos?.length || 0} item(s) · por {o.createdBy?.warName || 'Admin'}
                    </div>
                  </div>
                  <span className={`badge ${o.publicado ? 'badge-success' : 'badge-gray'}`}>
                    {o.publicado ? '✓ Publicado' : 'Rascunho'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openPreview(o)}>👁 Ver</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(o)}>✏ Editar</button>
                    <button className="btn btn-danger btn-xs" onClick={() => deleteOrdem(o._id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Editor */
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEditor(false)}>‹ Voltar</button>
            <button className="btn btn-primary" onClick={saveOrdem} disabled={saving} style={{ marginLeft: 'auto' }}>
              {saving ? 'Salvando...' : '💾 Salvar Ordem'}
            </button>
          </div>

          <div className="admin-grid-2" style={{ gap: 16, alignItems: 'flex-start' }}>
            <div>
              {/* Config */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-header"><h3 className="card-title">⚙ Configuração</h3></div>
                <div style={{ padding: '14px 16px' }}>
                  <div className="rg-2" style={{marginBottom:12}}>
                    <div className="form-group">
                      <label className="form-label">Data</label>
                      <input type="date" className="form-control" value={form.data} onChange={e => f('data', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Título</label>
                      <input className="form-control" value={form.titulo} onChange={e => f('titulo', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Unidade</label>
                    <textarea className="form-control" rows={3} value={form.unidade} onChange={e => f('unidade', e.target.value)} />
                  </div>
                  <div className="rg-2">
                    <div className="form-group">
                      <label className="form-label">Assinante</label>
                      <input className="form-control" value={form.assinante} onChange={e => f('assinante', e.target.value)} placeholder="Ex: DANILO MACHADO - CAP" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cargo</label>
                      <input className="form-control" value={form.cargo} onChange={e => f('cargo', e.target.value)} placeholder="Chefe da Companhia" />
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="pub" checked={form.publicado} onChange={e => f('publicado', e.target.checked)} />
                    <label htmlFor="pub" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Publicar (visível aos soldados)</label>
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div className="card">
                <div className="card-header"><h3 className="card-title">⚡ Textos Automáticos</h3></div>
                <div style={{ padding: '12px 16px' }}>
                  <div className="rg-2" style={{marginBottom:12}}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Hora (para templates)</label>
                      <input type="time" className="form-control" value={tmplHora} onChange={e => setTmplHora(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Militar (para templates)</label>
                      <input className="form-control" list="mil-list" value={tmplNome} onChange={e => setTmplNome(e.target.value)} placeholder="Nome de guerra..." />
                      <datalist id="mil-list">{users.map(u => <option key={u._id} value={`${u.rank.split(' ')[0]} ${u.warName}`} />)}</datalist>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TEMPLATES.map(t => (
                      <button key={t.id} className="btn btn-ghost btn-sm" onClick={() => addTemplate(t)}
                        style={{ fontSize: '0.58rem', padding: '4px 10px' }}>
                        + {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Texts editor */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📝 Itens da Ordem ({form.textos.length})</h3>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {/* Add custom text */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <textarea className="form-control" value={novoTexto} onChange={e => setNovoTexto(e.target.value)}
                    rows={3} placeholder="Escreva um texto personalizado..." style={{ flex: 1, fontSize: '0.78rem' }} />
                  <button className="btn btn-primary btn-sm" onClick={addTexto} style={{ alignSelf: 'flex-end' }}>+ Add</button>
                </div>

                {/* Text list */}
                {form.textos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Use os templates acima ou escreva textos personalizados
                  </div>
                ) : (
                  form.textos.map((t, i) => (
                    <div key={i} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px', marginBottom: 8, position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)' }}>Item {i + 1}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => moveTexto(i, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>↑</button>
                          <button onClick={() => moveTexto(i, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>↓</button>
                          <button onClick={() => removeTexto(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.85rem' }}>✕</button>
                        </div>
                      </div>
                      <textarea
                        className="form-control"
                        value={t}
                        onChange={e => { const arr = [...form.textos]; arr[i] = e.target.value; setForm(p => ({ ...p, textos: arr })); }}
                        rows={3}
                        style={{ fontSize: '0.78rem', background: 'transparent', border: 'none', padding: 0, color: 'var(--text-secondary)', resize: 'none' }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewOpen && previewData && (
        <div className="modal-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{previewData.titulo}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨 Imprimir</button>
                <button className="modal-close" onClick={() => setPreviewOpen(false)}>✕</button>
              </div>
            </div>
            <div id="ordem-print" style={{ padding: '24px 32px', background: '#f4f1e8', color: '#1a140a', fontFamily: "'Times New Roman', serif" }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #2a4020', paddingBottom: 16, marginBottom: 16 }}>
                {(previewData.unidade || '').split('\n').map((l, i) => (
                  <div key={i} style={{ fontWeight: 700, fontSize: i === 0 ? '11pt' : '10pt', letterSpacing: '0.05em' }}>{l}</div>
                ))}
                <div style={{ fontSize: '13pt', fontWeight: 900, letterSpacing: '0.08em', marginTop: 8 }}>{previewData.titulo}</div>
                <div style={{ fontSize: '9pt', marginTop: 4, fontStyle: 'italic' }}>
                  {DIAS_PT[new Date(previewData.data).getDay()]}, {format(new Date(previewData.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
              <div>
                {(previewData.textos || []).map((t, i) => (
                  <div key={i} style={{ marginBottom: 14, textAlign: 'justify', lineHeight: 1.7 }}>
                    <strong style={{ fontFamily: 'Arial', fontSize: '8pt' }}>{String(i + 1).padStart(2, '0')}.</strong>{' '}
                    <span style={{ fontSize: '10pt' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 60, textAlign: 'center' }}>
                <div style={{ width: 200, height: 1, background: '#333', margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 700, fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{previewData.assinante}</div>
                <div style={{ fontStyle: 'italic', fontSize: '8.5pt', color: '#555' }}>{previewData.cargo}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DIAS_PT = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];
