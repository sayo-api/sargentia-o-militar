import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import './AdminPages.css';
import './responsive.css';

const BRASAO_URL = '/brasao.png'; // fallback

export default function AdminEfetivoPage() {
  const [date, setDate]     = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [assinante, setAssinante] = useState('');
  const [cargo, setCargo]   = useState('');
  const [unidade, setUnidade] = useState('MINISTÉRIO DA DEFESA\nEXÉRCITO BRASILEIRO\nCOMANDO MILITAR DO PLANALTO\n1º REGIMENTO DE CAVALARIA DE GUARDAS\nDRAGÕES DA INDEPENDÊNCIA');
  const [nrDoc, setNrDoc]   = useState('');
  const [efetivo, setEfetivo] = useState(null);
  const [brasaoB64, setBrasaoB64] = useState('');

  // Brasão embedded directly
  useEffect(() => {
    setBrasaoB64('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');
  }, []);

  const fetchParte = useCallback(async () => {
    setLoading(true);
    try {
      const [parteRes, efRes] = await Promise.all([
        api.get(`/rotina/parte-do-dia?date=${date}`),
        api.get('/users/efetivo'),
      ]);
      setData(parteRes.data);
      setEfetivo(efRes.data);
    } catch { toast.error('Erro ao carregar parte do dia'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { fetchParte(); }, [fetchParte]);

  const SIT_COLORS = {
    'Ativo':'#27ae60','Licença Médica':'#e67e22','Hospital':'#c0392b',
    'Missão':'#2980b9','Férias':'#8e44ad','Descanso':'#7f8c8d',
    'Licença Especial':'#d35400','Inativo':'#555',
  };

  const exportWord = async () => {
    if (!data) return;
    try {
      const bold = (t, sz = 20) => new TextRun({ text: t, bold: true, font: 'Times New Roman', size: sz });
      const norm = (t, sz = 20) => new TextRun({ text: t, font: 'Times New Roman', size: sz });
      const italic = (t, sz = 18) => new TextRun({ text: t, italics: true, font: 'Times New Roman', size: sz, color: '555555' });

      const children = [];

      // Brasão
      if (brasaoB64) {
        const binary = atob(brasaoB64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ data: bytes, transformation: { width: 70, height: 70 }, type: 'jpg' })],
          spacing: { after: 80 },
        }));
      }

      // Header
      unidade.split('\n').forEach(line => {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [bold(line, 20)],
          spacing: { after: 30 },
        }));
      });

      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2a4020', space: 1 } },
        children: [bold(`PARTE DO DIA${nrDoc ? ' Nº ' + nrDoc : ''}`, 22)],
        spacing: { before: 120, after: 160 },
      }));

      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [norm(`${data.diaSemana}, ${data.dataFmt.toUpperCase()}`)],
        spacing: { after: 160 },
      }));

      // 1 - EFETIVO
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '444444', space: 1 } },
        children: [bold('1ª PARTE — EFETIVO DO DIA', 20)],
        spacing: { before: 120, after: 100 },
      }));

      const ef = efetivo || {};
      const tblCellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
      const borders = { top: tblCellBorder, bottom: tblCellBorder, left: tblCellBorder, right: tblCellBorder };
      const mkCell = (text, width, isHeader = false) => new TableCell({
        width: { size: width, type: WidthType.DXA }, borders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({
          children: isHeader ? [bold(text, 18)] : [norm(text, 18)],
          alignment: AlignmentType.CENTER, spacing: { after: 0 },
        })],
      });

      const efetivoRows = [
        new TableRow({ children: ['TOTAL','PRESENTES','AUSENTES','HOSPITAL','MISSÃO'].map((h, i) => mkCell(h, [1500,1800,1800,1800,1800][i], true)) }),
        new TableRow({ children: [
          String(ef.total || 0), String(ef.ativos || 0), String(ef.ausentes || 0),
          String((ef.breakdown || []).find(b => b._id === 'Hospital')?.count || 0),
          String((ef.breakdown || []).find(b => b._id === 'Missão')?.count || 0),
        ].map((v, i) => mkCell(v, [1500,1800,1800,1800,1800][i])) }),
      ];
      children.push(new Table({ width: { size: 8700, type: WidthType.DXA }, columnWidths: [1500,1800,1800,1800,1800], rows: efetivoRows }));
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

      // Ausentes
      if ((data.ausentes || []).length > 0) {
        children.push(new Paragraph({ children: [bold('Militares Ausentes:', 18)], spacing: { before: 60, after: 60 } }));
        data.ausentes.forEach(a => {
          children.push(new Paragraph({
            children: [norm(`• ${a.rank} ${a.warName} — ${a.situacao}`, 18)],
            spacing: { after: 30 },
          }));
        });
        children.push(new Paragraph({ children: [], spacing: { after: 80 } }));
      }

      // 2 - ESCALA
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '444444', space: 1 } },
        children: [bold('2ª PARTE — SERVIÇOS DO DIA', 20)],
        spacing: { before: 160, after: 100 },
      }));

      if (data.schedule && data.schedule.soldiers.length > 0) {
        const schedRows = [
          new TableRow({ children: [mkCell('FUNÇÃO / SERVIÇO', 3200, true), mkCell('MILITAR', 5500, true)] }),
          ...data.schedule.soldiers.map(s => new TableRow({
            children: [mkCell(s.duty || 'Serviço', 3200), mkCell(`${s.user?.rank || ''} ${s.user?.warName || '—'}`, 5500)],
          })),
        ];
        children.push(new Table({ width: { size: 8700, type: WidthType.DXA }, columnWidths: [3200, 5500], rows: schedRows }));
        if (data.schedule.notes) {
          children.push(new Paragraph({ children: [italic(`Obs: ${data.schedule.notes}`)], spacing: { before: 60 } }));
        }
      } else {
        children.push(new Paragraph({ children: [italic('Sem escalas definidas para este dia.')], spacing: { after: 60 } }));
      }

      // Signature
      children.push(new Paragraph({ children: [], spacing: { after: 600 } }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '333333', space: 1 } },
        children: [bold(assinante || 'ASSINANTE', 20)],
        spacing: { before: 0, after: 40 },
      }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: cargo || 'Cargo / Função', italics: true, font: 'Times New Roman', size: 18 })],
      }));

      const doc = new Document({
        sections: [{
          properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `parte_do_dia_${date}.docx`);
      toast.success('✓ Documento Word gerado!');
    } catch (err) { console.error(err); toast.error('Erro ao gerar Word'); }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📋 <span>Parte</span> do Dia</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" className="form-control" style={{ width: 160 }} value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn btn-outline" onClick={exportWord} disabled={!data || loading}>📄 Exportar Word</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨 Imprimir</button>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gap: 16, alignItems: 'flex-start' }}>
        {/* Config */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header"><h3 className="card-title">⚙ Dados do Documento</h3></div>
            <div style={{ padding: '14px 16px' }}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Unidade</label>
                <textarea className="form-control" rows={4} value={unidade} onChange={e => setUnidade(e.target.value)} />
              </div>
              <div className="rg-2" style={{marginBottom:10}}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nº Documento</label>
                  <input className="form-control" value={nrDoc} onChange={e => setNrDoc(e.target.value)} placeholder="Ex: 049" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Assinante</label>
                <input className="form-control" value={assinante} onChange={e => setAssinante(e.target.value)} placeholder="NOME - POSTO" />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input className="form-control" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Cargo / Função" />
              </div>
            </div>
          </div>

          {/* Efetivo summary */}
          {efetivo && (
            <div className="card">
              <div className="card-header"><h3 className="card-title">📊 Resumo do Efetivo</h3></div>
              <div style={{ padding: '14px 16px' }}>
                <div className="rg-2" style={{marginBottom:12}}>
                  {[['Total',efetivo.total,'#6b7c5e'],['Ativos',efetivo.ativos,'#27ae60'],['Ausentes',efetivo.ausentes,'#e67e22']].map(([l,v,c]) => (
                    <div key={l} style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-dark)', borderRadius: 4, border: `1px solid ${c}33` }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: c, lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                    </div>
                  ))}
                </div>
                {(efetivo.breakdown || []).filter(b => b._id !== 'Ativo').map(b => (
                  <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.78rem', color: SIT_COLORS[b._id] || 'var(--text-muted)' }}>{b._id}</span>
                    <span className="badge badge-gray">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview document */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">👁 Prévia — Parte do Dia</h3>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Idêntico ao documento impresso</span>
          </div>
          {loading ? (
            <div className="loading-center" style={{ padding: 40 }}><div className="spinner" /></div>
          ) : !data ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><p className="empty-state-text">Selecione uma data</p></div>
          ) : (
            <div style={{ padding: 20, background: '#f4f1e8', borderRadius: 4, margin: 12, fontFamily: "'Times New Roman', serif", color: '#1a140a' }} id="parte-print">
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #2a4020', paddingBottom: 12, marginBottom: 12 }}>
                {unidade.split('\n').map((l, i) => (
                  <div key={i} style={{ fontWeight: 700, fontSize: i < 2 ? '9.5pt' : '9pt', letterSpacing: '0.04em' }}>{l}</div>
                ))}
                <div style={{ fontSize: '11pt', fontWeight: 900, marginTop: 6, letterSpacing: '0.07em' }}>
                  PARTE DO DIA{nrDoc ? ` Nº ${nrDoc}` : ''}
                </div>
                <div style={{ fontSize: '8.5pt', marginTop: 3, fontStyle: 'italic' }}>
                  {data.diaSemana}, {data.dataFmt}
                </div>
              </div>

              {/* Efetivo table */}
              <div style={{ fontSize: '8.5pt', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #555', paddingBottom: 3 }}>
                1ª PARTE — EFETIVO DO DIA
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', marginBottom: 10 }}>
                <thead>
                  <tr>{['Total','Presentes','Ausentes','Hospital','Missão'].map(h => (
                    <th key={h} style={{ background: '#2a4020', color: '#fff', padding: '4px 6px', fontSize: '7.5pt', textAlign: 'center' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  <tr>{[
                    efetivo?.total||0, efetivo?.ativos||0, efetivo?.ausentes||0,
                    (efetivo?.breakdown||[]).find(b=>b._id==='Hospital')?.count||0,
                    (efetivo?.breakdown||[]).find(b=>b._id==='Missão')?.count||0,
                  ].map((v,i) => (
                    <td key={i} style={{ padding: '4px 6px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700, fontSize: '9pt' }}>{v}</td>
                  ))}</tr>
                </tbody>
              </table>

              {/* Ausentes */}
              {(data.ausentes || []).length > 0 && (
                <div style={{ marginBottom: 10, fontSize: '8pt' }}>
                  <strong>Militares Ausentes:</strong>
                  <div style={{ marginTop: 3 }}>
                    {data.ausentes.map((a, i) => (
                      <span key={i} style={{ display: 'inline-block', margin: '2px 4px', padding: '1px 6px', borderRadius: 10, background: (SIT_COLORS[a.situacao]||'#555')+'22', border: `1px solid ${SIT_COLORS[a.situacao]||'#555'}66`, color: SIT_COLORS[a.situacao]||'#555', fontSize: '7.5pt' }}>
                        {a.rank.split(' ')[0]} {a.warName} — {a.situacao}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div style={{ fontSize: '8.5pt', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #555', paddingBottom: 3, marginTop: 12 }}>
                2ª PARTE — SERVIÇOS DO DIA
              </div>
              {data.schedule && data.schedule.soldiers.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', marginBottom: 6 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#2a4020', color: '#fff', padding: '4px 8px', width: '35%', textAlign: 'left' }}>Função</th>
                      <th style={{ background: '#2a4020', color: '#fff', padding: '4px 8px', textAlign: 'left' }}>Militar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schedule.soldiers.map((s, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f0ede0' : '#fff' }}>
                        <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontWeight: 700 }}>{s.duty}</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #ddd' }}>{s.user?.rank} {s.user?.warName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: '8pt', fontStyle: 'italic', color: '#888', marginBottom: 10 }}>Sem escalas definidas para este dia.</p>
              )}

              {/* Signature */}
              <div style={{ marginTop: 50, textAlign: 'center' }}>
                <div style={{ width: 200, height: 1, background: '#333', margin: '0 auto 5px' }} />
                <div style={{ fontWeight: 700, fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{assinante || 'ASSINANTE'}</div>
                <div style={{ fontStyle: 'italic', fontSize: '8pt', color: '#555' }}>{cargo || 'Cargo / Função'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SIT_COLORS = {
  'Ativo':'#27ae60','Licença Médica':'#e67e22','Hospital':'#c0392b',
  'Missão':'#2980b9','Férias':'#8e44ad','Descanso':'#7f8c8d',
  'Licença Especial':'#d35400','Inativo':'#555',
};
