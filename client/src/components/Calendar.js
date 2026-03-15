import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './Calendar.css';

export default function Calendar({ schedules = [], onDayClick, selectedDate, highlightUserId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const getScheduleForDay = (day) => {
    return schedules.find((s) => isSameDay(new Date(s.date), day));
  };

  const hasUserDuty = (schedule) => {
    if (!highlightUserId || !schedule) return false;
    return schedule.soldiers.some(
      (s) => s.user?._id === highlightUserId || s.user === highlightUserId
    );
  };

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = new Date(day);
      const schedule = getScheduleForDay(cloneDay);
      const hasDuty = hasUserDuty(schedule);
      const inMonth = isSameMonth(day, monthStart);
      const isSelected = selectedDate && isSameDay(cloneDay, selectedDate);
      const todayDay = isToday(cloneDay);

      days.push(
        <div
          key={day.toString()}
          className={[
            'cal-day',
            !inMonth ? 'cal-day--out' : '',
            todayDay ? 'cal-day--today' : '',
            isSelected ? 'cal-day--selected' : '',
            schedule && inMonth ? 'cal-day--has-schedule' : '',
            hasDuty ? 'cal-day--my-duty' : '',
          ].join(' ')}
          onClick={() => inMonth && onDayClick && onDayClick(cloneDay, schedule)}
        >
          <span className="cal-day-number">{format(day, 'd')}</span>
          {schedule && inMonth && (
            <div className="cal-day-badges">
              {hasDuty ? (
                <span className="cal-badge cal-badge--mine">SERVIÇO</span>
              ) : (
                <span className="cal-badge cal-badge--busy">
                  {schedule.soldiers.length} SOLD.
                </span>
              )}
            </div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="cal-row">
        {days}
      </div>
    );
    days = [];
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          ‹
        </button>
        <h3 className="cal-title">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
        </h3>
        <button className="cal-nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          ›
        </button>
      </div>

      <div className="cal-weekdays">
        {weekDays.map((d) => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
      </div>

      <div className="cal-body">{rows}</div>

      <div className="cal-legend">
        <div className="cal-legend-item">
          <span className="cal-legend-dot cal-legend-dot--mine" />
          <span>Seu Serviço</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot cal-legend-dot--busy" />
          <span>Escala do Dia</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot cal-legend-dot--today" />
          <span>Hoje</span>
        </div>
      </div>
    </div>
  );
}
