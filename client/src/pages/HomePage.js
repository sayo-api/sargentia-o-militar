import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page camo-bg">
      {/* Scanline overlay */}
      <div className="scanlines" />

      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* Content */}
      <div className="home-content">
        {/* Header badge */}
        <div className="home-badge">
          <span className="home-badge-line" />
          <span className="home-badge-text">SISTEMA CLASSIFICADO — ACESSO RESTRITO</span>
          <span className="home-badge-line" />
        </div>

        {/* Emblem */}
        <div className="home-emblem">
          <div className="emblem-outer">
            <div className="emblem-inner">
              <div className="emblem-star">★</div>
              <div className="emblem-ring" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="home-title">
          <span className="home-title-line">Sistema</span>
          <span className="home-title-line home-title-accent">Interno</span>
          <span className="home-title-line">Militar</span>
        </h1>

        {/* Subtitle */}
        <p className="home-subtitle">
          Gestão Operacional de Efetivo · Escalas · Avisos Militares
        </p>

        {/* Divider */}
        <div className="home-divider">
          <span className="divider-line" />
          <span className="divider-icon">◈</span>
          <span className="divider-line" />
        </div>

        {/* Actions */}
        <div className="home-actions">
          <Link to="/login" className="home-btn home-btn-primary">
            <span className="btn-bracket">[</span>
            <span>Acessar o Sistema</span>
            <span className="btn-bracket">]</span>
          </Link>
          <Link to="/registrar-admin" className="home-btn home-btn-secondary">
            <span>Registrar Administrador</span>
          </Link>
        </div>

        {/* Classification footer */}
        <div className="home-footer">
          <div className="classification-bar">
            <span>CONFIDENCIAL</span>
            <span className="sep">·</span>
            <span>USO INTERNO</span>
            <span className="sep">·</span>
            <span>NÃO DIVULGAR</span>
          </div>
          <p className="home-footer-text">
            Acesso não autorizado é passível de sanções disciplinares e legais.
          </p>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      {/* Side labels */}
      <div className="side-label side-label-left">SIM · v2.0 · OPERACIONAL</div>
      <div className="side-label side-label-right">FORÇAS ARMADAS · BRASIL</div>
    </div>
  );
}
