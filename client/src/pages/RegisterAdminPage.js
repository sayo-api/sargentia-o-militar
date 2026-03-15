import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function RegisterAdminPage() {
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ warNumber: '', warName: '', password: '', adminToken: '' });
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Senha deve ter mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      await registerAdmin(form);
      toast.success('Administrador registrado com sucesso');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page camo-bg">
      <div className="scanlines" />
      <div className="corner corner-tl" /><div className="corner corner-tr" />
      <div className="corner corner-bl" /><div className="corner corner-br" />

      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-back">← Voltar</Link>
          <div className="auth-logo" style={{ background: 'rgba(192,57,43,0.15)', borderColor: '#c0392b', color: '#e74c3c' }}>⬡</div>
          <h1 className="auth-title">Registro de Administrador</h1>
          <p className="auth-subtitle">Requer token de autorização especial</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Número de Guerra</label>
            <input type="text" className="form-control" placeholder="Ex: 0001"
              value={form.warNumber} onChange={e => setForm({ ...form, warNumber: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Nome de Guerra</label>
            <input type="text" className="form-control" placeholder="Ex: PEREIRA MATOS"
              value={form.warName} onChange={e => setForm({ ...form, warName: e.target.value.toUpperCase() })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input type="password" className="form-control" placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Token de Administrador</label>
            <div className="input-with-toggle">
              <input
                type={showToken ? 'text' : 'password'}
                className="form-control"
                placeholder="Código secreto do administrador"
                value={form.adminToken}
                onChange={e => setForm({ ...form, adminToken: e.target.value })}
                required
              />
              <button type="button" className="toggle-btn" onClick={() => setShowToken(!showToken)}>
                {showToken ? '🙈' : '👁'}
              </button>
            </div>
            <span className="form-hint">Token fornecido pela unidade</span>
          </div>

          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            ⚠ Este registro cria uma conta com privilégios totais de administrador.
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Registrar Administrador'}
          </button>

          <div className="auth-links">
            <Link to="/login" className="auth-link">Já tem conta? Fazer login</Link>
          </div>
        </form>

        <div className="auth-footer">
          <span className="auth-classified">SISTEMA CLASSIFICADO — ACESSO MONITORADO</span>
        </div>
      </div>
    </div>
  );
}
