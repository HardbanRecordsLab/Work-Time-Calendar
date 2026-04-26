import { format } from 'date-fns';

export interface CalendarEvent {
  date: Date;
  startTime: string;
  endTime: string;
  notes: string;
}

export function downloadICS(events: CalendarEvent[], filename: string) {
  const validEvents = events.filter(e => e.startTime && e.endTime);
  if (validEvents.length === 0) {
    alert("Brak danych do wyeksportowania do kalendarza.");
    return;
  }

  const formatICSDate = (d: Date) => {
    return format(d, "yyyyMMdd'T'HHmmss");
  };

  const vEvents = validEvents.map(e => {
    const startDate = new Date(e.date);
    const [startH, startM] = e.startTime.split(':').map(Number);
    startDate.setHours(startH, startM, 0);

    const endDate = new Date(e.date);
    const [endH, endM] = e.endTime.split(':').map(Number);
    endDate.setHours(endH, endM, 0);

    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    return [
      'BEGIN:VEVENT',
      `DTSTAMP:${formatICSDate(new Date())}Z`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:Praca`,
      `DESCRIPTION:${(e.notes || '').replace(/\r?\n/g, '\\n')}`,
      'END:VEVENT'
    ].join('\r\n');
  });

  const icsBody = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Work Hours Tracker//PL',
    ...vEvents,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsBody], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
