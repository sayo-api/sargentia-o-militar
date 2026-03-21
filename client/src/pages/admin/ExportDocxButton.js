/**
 * ExportDocxButton.js
 * Botão para exportar a escala como .docx (Word).
 * Adicione este componente dentro do AdminSchedulePage, próximo ao cabeçalho.
 *
 * Uso:
 *   import ExportDocxButton from './ExportDocxButton';
 *   <ExportDocxButton month={currentMonth} year={currentYear} />
 *
 * Obs: A rota GET /api/planilha/export/docx?month=X&year=Y deve estar
 * registrada no server.js ANTES do /api/planilha geral.
 */

import React, { useState } from 'react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ExportDocxButton({ month, year }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/planilha/export/docx?month=${month}&year=${year}`, {
        responseType: 'blob',
      });

      const blob   = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url    = URL.createObjectURL(blob);
      const link   = document.createElement('a');
      link.href    = url;
      link.download = `escala-${String(month).padStart(2,'0')}-${year}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Documento Word gerado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar documento Word.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           8,
        background:    loading ? '#1e3a5f' : '#2563eb',
        color:         '#fff',
        border:        'none',
        borderRadius:  8,
        padding:       '9px 18px',
        fontSize:      '.88rem',
        fontWeight:    600,
        cursor:        loading ? 'default' : 'pointer',
        transition:    'background .15s',
        opacity:       loading ? .7 : 1,
      }}
    >
      {loading ? '⏳ Gerando...' : '📄 Exportar Word'}
    </button>
  );
}
