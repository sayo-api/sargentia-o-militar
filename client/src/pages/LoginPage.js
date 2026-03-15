import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function LoginPage() {
  const { login, setPassword } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ warNumber: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [firstLogin, setFirstLogin] = useState(null);
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirm: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.warNumber, form.password);
      if (result.firstLogin) {
        setFirstLogin(result);
        toast('Primeiro acesso — crie sua senha', { icon: '🔐' });
      } else {
        toast.success('Acesso autorizado');
        navigate(result.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPasswordForm.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPasswordForm.password !== newPasswordForm.confirm) {
      toast.error('As senhas não conferem');
      return;
    }
    setLoading(true);
    try {
      const user = await setPassword(firstLogin.warNumber, newPasswordForm.password);
      toast.success('Senha definida! Bem-vindo, ' + firstLogin.warName);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao definir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page camo-bg">
      <div className="scanlines" />
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <Link to="/" className="auth-back">← Voltar</Link>
          <div className="auth-logo">✦</div>
          <h1 className="auth-title">
            {firstLogin ? 'Definir Senha' : 'Acesso ao Sistema'}
          </h1>
          <p className="auth-subtitle">
            {firstLogin
              ? `Bem-vindo, ${firstLogin.warName}. Crie sua senha de acesso.`
              : 'Digite suas credenciais para continuar'}
          </p>
        </div>

        {/* Form */}
        {!firstLogin ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Número de Guerra</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: 5004"
                value={form.warNumber}
                onChange={(e) => setForm({ ...form, warNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <span className="form-hint">No primeiro acesso, deixe em branco</span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Identificar-se'}
            </button>

            <div className="auth-links">
              <Link to="/registrar-admin" className="auth-link">
                Registrar Administrador
              </Link>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSetPassword}>
            <div className="auth-info-box">
              <div className="info-row">
                <span className="info-label">Nome de Guerra</span>
                <span className="info-value">{firstLogin.warName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Número de Guerra</span>
                <span className="info-value">{firstLogin.warNumber}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nova Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={newPasswordForm.password}
                onChange={(e) => setNewPasswordForm({ ...newPasswordForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="Repita a senha"
                value={newPasswordForm.confirm}
                onChange={(e) => setNewPasswordForm({ ...newPasswordForm, confirm: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Confirmar e Acessar'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span className="auth-classified">SISTEMA CLASSIFICADO — ACESSO MONITORADO</span>
        </div>
      </div>
    </div>
  );
}
