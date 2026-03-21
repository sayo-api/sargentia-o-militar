/**
 * PermissoesPage.js
 * Página administrativa para controlar quais usuários têm acesso ao sistema de chamada.
 * Adicione esta rota no App.js/Router: <Route path="/admin/permissoes" element={<PermissoesPage />} />
 *
 * Somente admins devem conseguir acessar esta página.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function PermissoesPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [search,  setSearch]  = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/permissoes');
      setUsers(res.data);
    } catch (err) {
      toast.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleChamada = async (user) => {
    setSaving(user._id);
    try {
      const res = await api.patch(`/permissoes/${user._id}/chamada`, {
        hasChamadaAccess: !user.hasChamadaAccess,
      });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, ...res.data } : u));
      toast.success(`${user.warName}: acesso à chamada ${res.data.hasChamadaAccess ? 'LIBERADO' : 'REMOVIDO'}.`);
    } catch (err) {
      toast.error('Erro ao atualizar permissão.');
    } finally {
      setSaving(null);
    }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    return (
      u.warName?.toLowerCase().includes(search.toLowerCase()) ||
      String(u.warNumber).includes(search) ||
      u.rank?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div style={{ padding: '24px 16px', maxWidth: 700, margin: '0 auto', color: '#f1f5f9' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>
        🔐 Permissões — Sistema de Chamada
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: '.9rem' }}>
        Defina quais usuários têm acesso ao módulo de Chamada e Auditoria.
        Administradores já têm acesso por padrão.
      </p>

      <input
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 8, color: '#f1f5f9', padding: '10px 14px',
          fontSize: '.9rem', marginBottom: 16,
        }}
        placeholder="🔍  Buscar por nome, número ou posto..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Carregando...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(u => (
          <div key={u._id} style={{
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '.95rem' }}>
                {u.warName}
                {u.role === 'admin' && (
                  <span style={{ marginLeft: 8, fontSize: '.7rem', background: '#1e3a5f', color: '#60a5fa', padding: '2px 6px', borderRadius: 4 }}>
                    Admin
                  </span>
                )}
              </div>
              <div style={{ fontSize: '.78rem', color: '#94a3b8' }}>
                {u.rank} · Nr. {u.warNumber}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '.8rem', color: u.hasChamadaAccess ? '#4ade80' : '#94a3b8' }}>
                {u.role === 'admin' ? '✔ Admin (sempre)' : u.hasChamadaAccess ? '✔ Com acesso' : '✘ Sem acesso'}
              </span>
              {u.role !== 'admin' && (
                <button
                  disabled={saving === u._id}
                  onClick={() => toggleChamada(u)}
                  style={{
                    background:    u.hasChamadaAccess ? '#450a0a' : '#052e16',
                    color:         u.hasChamadaAccess ? '#fca5a5' : '#4ade80',
                    border:        `1px solid ${u.hasChamadaAccess ? '#7f1d1d' : '#166534'}`,
                    borderRadius:  8, padding: '7px 14px',
                    fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
                    opacity: saving === u._id ? .6 : 1,
                  }}
                >
                  {saving === u._id ? '...' : u.hasChamadaAccess ? 'Remover acesso' : 'Dar acesso'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
