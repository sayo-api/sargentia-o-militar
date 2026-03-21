/**
 * PermissoesPage.js — OBSOLETO
 *
 * O gerenciamento de permissões foi INTEGRADO ao AdminRelatoriosPage.
 * As permissões de acesso (hasChamadaAccess) agora são definidas no
 * modal de criação/edição do militar em /admin/relatorios → aba Militares.
 *
 * Caso ainda esteja usando esta rota diretamente, redirecione para /admin/relatorios
 */

import React, { useEffect } from 'react';

export default function PermissoesPage() {
  useEffect(() => {
    // Redirecionar automaticamente para a página de relatórios
    if (typeof window !== 'undefined') {
      window.location.replace('/admin/relatorios');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080f07',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#c9a227',
      fontFamily: 'monospace',
      fontSize: '.9rem',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{fontSize:'2rem'}}>🎖️</div>
      <div>Redirecionando para Central de Operações...</div>
      <div style={{color:'#6a8a60',fontSize:'.78rem'}}>
        As permissões são gerenciadas em /admin/relatorios → aba Militares
      </div>
    </div>
  );
}
