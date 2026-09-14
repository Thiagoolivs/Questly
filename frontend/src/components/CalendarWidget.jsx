import { useState, useMemo } from 'react'
import Icon from './Icon.jsx'

export default function CalendarWidget({ onDateSelect, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const days = useMemo(() => {
    const list = []
    for (let i = 0; i < firstDayIndex; i++) list.push(null)
    for (let i = 1; i <= daysInMonth; i++) list.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i))
    return list
  }, [currentMonth, daysInMonth, firstDayIndex])

  const isSameDay = (d1, d2) => {
    return d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
  }

  const isToday = (d) => isSameDay(d, new Date())
  const isSelected = (d) => isSameDay(d, selectedDate)

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <button className="icon-btn ghost" onClick={prevMonth}><Icon name="chevron-left" size={18} /></button>
        <div className="calendar-title">
          {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
        <button className="icon-btn ghost" onClick={nextMonth}><Icon name="chevron-right" size={18} /></button>
      </div>
      <div className="calendar-grid">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="calendar-day-header muted xsmall">{d}</div>
        ))}
        {days.map((day, i) => (
          <div key={i} className="calendar-cell">
            {day && (
              <button
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
                onClick={() => onDateSelect(day)}
              >
                {day.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
