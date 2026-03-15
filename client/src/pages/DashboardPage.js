import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Calendar from '../components/Calendar';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { api } from '../context/AuthContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedRes, noticeRes] = await Promise.all([
        api.get(`/schedules?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
        api.get('/notices'),
      ]);
      setSchedules(schedRes.data);
      setNotices(noticeRes.data.slice(0, 5));
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const myDuties = schedules.filter((s) =>
    s.soldiers.some((sol) => sol.user?._id === user?._id || sol.user === user?._id)
  );

  const handleDayClick = (day, schedule) => {
    setSelectedDay(day);
    setSelectedSchedule(schedule || null);
  };

  const RANK_ORDER = ['Recruta','Soldado','Cabo','3º Sargento','2º Sargento','1º Sargento','Subtenente','Aspirante a Oficial','2º Tenente','1º Tenente','Capitão','Major','Tenente-Coronel','Coronel'];

  if (loading) return (
    <div className="loading-center"><div className="spinner" /></div>
  );

  return (
    <div className="page-container fade-in">
      {/* Welcome header */}
      <div className="dashboard-welcome">
        <div className="welcome-left">
          <div className="welcome-rank-badge">{user?.rank}</div>
          <div>
            <h1 className="welcome-name">{user?.warName}</h1>
            <p className="welcome-sub">
              Nº de Guerra: <strong>{user?.warNumber}</strong> ·{' '}
              {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="welcome-stats">
          <div className="stat-card">
            <span className="stat-value">{myDuties.length}</span>
            <span className="stat-label">Serviços no Mês</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{notices.length}</span>
            <span className="stat-label">Avisos Ativos</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Calendar */}
        <div className="dashboard-calendar-col">
          <div className="section-header">
            <h2 className="section-title">📅 Escala do Mês</h2>
            <span className="section-sub">
              {format(now, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
            </span>
          </div>

          <Calendar
            schedules={schedules}
            onDayClick={handleDayClick}
            selectedDate={selectedDay}
            highlightUserId={user?._id}
          />

          {/* Selected day detail */}
          {selectedDay && (
            <div className="day-detail card fade-in" style={{ marginTop: 16 }}>
              <div className="card-header">
                <span className="card-title">
                  {format(selectedDay, "EEEE, dd/MM", { locale: ptBR }).toUpperCase()}
                </span>
                {selectedSchedule && (
                  <span className="badge badge-success">Escala Definida</span>
                )}
              </div>

              {selectedSchedule ? (
                <div>
                  {selectedSchedule.notes && (
                    <p className="day-notes">{selectedSchedule.notes}</p>
                  )}
                  <div className="soldiers-list">
                    {selectedSchedule.soldiers.map((s, i) => {
                      const isMe = s.user?._id === user?._id;
                      return (
                        <div key={i} className={`soldier-item ${isMe ? 'soldier-item--me' : ''}`}>
                          <div className="soldier-rank-badge">{s.user?.rank?.split(' ')[0] || 'SD'}</div>
                          <div className="soldier-info">
                            <span className="soldier-name">{s.user?.warName || 'Soldado'}</span>
                            <span className="soldier-duty">{s.duty}</span>
                          </div>
                          {isMe && <span className="badge badge-success">VOCÊ</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="empty-day-text">Nenhuma escala para este dia</p>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="dashboard-side-col">
          {/* Next duties */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3 className="card-title">⚔ Próximos Serviços</h3>
            </div>
            {myDuties.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <div className="empty-state-icon">📅</div>
                <p className="empty-state-text">Sem serviços escalados</p>
              </div>
            ) : (
              <div className="duties-list">
                {myDuties.slice(0, 6).map((s) => {
                  const dutyDate = new Date(s.date);
                  const isPast = dutyDate < now;
                  const isToday = isSameDay(dutyDate, now);
                  const mySlot = s.soldiers.find((sol) => sol.user?._id === user?._id);
                  return (
                    <div
                      key={s._id}
                      className={`duty-item ${isPast ? 'duty-item--past' : ''} ${isToday ? 'duty-item--today' : ''}`}
                    >
                      <div className="duty-date">
                        <span className="duty-day">{format(dutyDate, 'dd')}</span>
                        <span className="duty-month">{format(dutyDate, 'MMM', { locale: ptBR }).toUpperCase()}</span>
                      </div>
                      <div className="duty-info">
                        <span className="duty-weekday">
                          {format(dutyDate, 'EEEE', { locale: ptBR })}
                        </span>
                        <span className="duty-type">{mySlot?.duty || 'Serviço'}</span>
                      </div>
                      {isToday && <span className="badge badge-urgente" style={{ fontSize: '0.6rem' }}>HOJE</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notices */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📋 Últimos Avisos</h3>
              <Link to="/avisos" className="btn btn-ghost btn-sm">Ver todos</Link>
            </div>
            {notices.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-text">Nenhum aviso</p>
              </div>
            ) : (
              <div className="notices-preview">
                {notices.map((n) => (
                  <Link key={n._id} to={`/avisos/${n._id}`} className="notice-preview-item">
                    <div className="notice-preview-header">
                      <span className={`badge badge-${n.priority}`}>{n.priority}</span>
                      {n.pinned && <span className="badge badge-info">FIXADO</span>}
                    </div>
                    <p className="notice-preview-title">{n.title}</p>
                    <span className="notice-preview-date">
                      {format(new Date(n.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
