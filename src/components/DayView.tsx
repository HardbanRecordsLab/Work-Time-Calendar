import { format, addDays, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Moon, Sun, AlertCircle, FileText, FileSpreadsheet, Calendar as CalendarIcon, Clock, Edit3, Tag } from 'lucide-react';
import { getPolishHolidays, isWorkingDay } from '../lib/holidays';
import { calculateHours, getOvertime, formatHours } from '../lib/math';
import { WorkData, WorkEntry } from '../hooks/useStore';
import { cn } from '../lib/utils';
import { useMemo, useState } from 'react';
import { exportToCSV, exportToPDF } from '../lib/export';
import { downloadICS } from '../lib/calendar';
import { DayPicker } from 'react-day-picker';

const SUGGESTIONS = [
  "Spotkanie projektowe",
  "Praca zdalna",
  "Szkolenie",
  "Praca biurowa",
  "Analiza",
  "Kodowanie",
  "Planowanie sprintu",
  "Code review",
  "Debugowanie aplikacji"
];

export default function DayView({ 
  date, 
  onChangeDate, 
  data, 
  updateEntry 
}: { 
  date: Date; 
  onChangeDate: (d: Date) => void;
  data: WorkData;
  updateEntry: (dateStr: string, entry: Partial<WorkEntry>) => void;
}) {
  const [intervalMins, setIntervalMins] = useState<30 | 60>(60);
  
  const dateStr = format(date, 'yyyy-MM-dd');
  const entry = data[dateStr] || { startTime: '', endTime: '', notes: '', color: '' };
  
  const holidays = useMemo(() => getPolishHolidays(date.getFullYear()), [date]);
  const dayStatus = isWorkingDay(date, holidays);

  const hoursWorked = calculateHours(entry.startTime, entry.endTime);
  const overtime = getOvertime(hoursWorked);

  const totalBlocks = intervalMins === 60 ? 24 : 48;
  const timelineBlocks = Array.from({ length: totalBlocks }).map((_, i) => i);
  
  let startValue = -1;
  let endValue = -1;
  if (entry.startTime && entry.endTime) {
    const [sH, sM] = entry.startTime.split(':').map(Number);
    const [eH, eM] = entry.endTime.split(':').map(Number);
    if (!isNaN(sH) && !isNaN(eH)) {
      startValue = sH + sM / 60;
      endValue = eH + eM / 60;
      if (endValue < startValue) endValue += 24; // overnight
    }
  }

  const handleExportICS = () => {
    downloadICS([{ date, startTime: entry.startTime, endTime: entry.endTime, notes: entry.notes }], `praca_${format(date, 'yyyyMMdd')}.ics`);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Typ dnia', 'Rozpoczęcie', 'Zakończenie', 'Czas pracy', 'Nadgodziny', 'Notatki'];
    const rows = [[
      format(date, 'dd.MM.yyyy'),
      dayStatus.isWorkingDay ? 'Roboczy' : (dayStatus.holidayName || 'Weekend'),
      entry.startTime || '-',
      entry.endTime || '-',
      formatHours(hoursWorked),
      formatHours(overtime),
      entry.notes || ''
    ]];

    const filename = `raport_dzienny_${dateStr}.csv`;
    exportToCSV(filename, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Data', 'Typ dnia', 'Rozpoczęcie', 'Zakończenie', 'Czas pracy', 'Nadgodziny', 'Notatki'];
    const rows = [[
      format(date, 'dd.MM.yyyy'),
      dayStatus.isWorkingDay ? 'Roboczy' : (dayStatus.holidayName || 'Weekend'),
      entry.startTime || '-',
      entry.endTime || '-',
      formatHours(hoursWorked),
      formatHours(overtime),
      entry.notes || ''
    ]];

    const title = `Raport Dzienny - ${format(date, 'dd.MM.yyyy')}`;
    const filename = `raport_dzienny_${dateStr}.pdf`;
    exportToPDF(filename, title, headers, rows);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 gap-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-indigo-100 p-2.5 rounded-xl hidden sm:block">
             <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900 flex flex-wrap items-center gap-2">
              {format(date, 'dd.MM')} <span className="capitalize font-serif text-indigo-600">{format(date, 'EEEE', { locale: pl })}</span>
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {!dayStatus.isWorkingDay && (
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full border",
                  dayStatus.holidayName ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {dayStatus.holidayName || "Weekend"}
                </span>
              )}
              {dayStatus.isWorkingDay && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full">
                  Dzień Roboczy
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
             <button onClick={handleExportPDF} title="Eksportuj do PDF" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><FileText className="w-4 h-4 sm:w-5 sm:h-5" /></button>
             <button onClick={handleExportCSV} title="Eksportuj do CSV" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" /></button>
             <button onClick={handleExportICS} title="Dodaj do kalendarza (.ics)" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
            <button onClick={() => onChangeDate(subDays(date, 1))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => onChangeDate(addDays(date, 1))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-8 flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm order-1 lg:order-none">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Ewidencja Czasu
              </div>
              <h3 className="text-2xl font-serif tracking-tight text-slate-800">Zarejestruj godziny</h3>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="bg-slate-50 px-4 py-3 border border-slate-200 rounded-xl flex-1 md:flex-none">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 relative w-full text-left">START
                  <input 
                    type="time" 
                    value={entry.startTime} 
                    onChange={(e) => updateEntry(dateStr, { startTime: e.target.value })}
                    className="block w-full bg-transparent text-slate-900 font-mono text-xl sm:text-2xl focus:outline-none"
                  />
                </label>
              </div>
              <div className="bg-slate-50 px-4 py-3 border border-slate-200 rounded-xl flex-1 md:flex-none">
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 relative w-full text-left">KONIEC
                  <input 
                    type="time" 
                    value={entry.endTime} 
                    onChange={(e) => updateEntry(dateStr, { endTime: e.target.value })}
                    className="block w-full bg-transparent text-slate-900 font-mono text-xl sm:text-2xl focus:outline-none"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Timeline Visualizer */}
          <div className="mt-6 relative">
            <div className="flex justify-between items-end mb-3">
              <div className="flex justify-between text-[10px] sm:text-xs font-mono text-slate-400 selection:bg-transparent flex-1 mr-4">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
              <div className="flex border border-slate-200 rounded-md overflow-hidden text-[10px] font-bold uppercase tracking-widest bg-slate-50">
                <button 
                  onClick={() => setIntervalMins(60)} 
                  className={cn("px-2 py-1.5 transition-colors", intervalMins === 60 ? "bg-slate-700 text-white" : "hover:bg-slate-200 text-slate-500")}>
                  1h
                </button>
                <div className="w-[1px] bg-slate-200"></div>
                <button 
                  onClick={() => setIntervalMins(30)} 
                  className={cn("px-2 py-1.5 transition-colors", intervalMins === 30 ? "bg-slate-700 text-white" : "hover:bg-slate-200 text-slate-500")}>
                  30m
                </button>
              </div>
            </div>
            <div className="h-16 rounded-xl w-full bg-slate-50 border border-slate-200 timeline-grid relative flex overflow-hidden">
              {timelineBlocks.map((idx) => {
                let isActive = false;
                const blockStart = idx * (intervalMins / 60);
                const blockEnd = blockStart + (intervalMins / 60);

                if (startValue !== -1 && endValue !== -1) {
                  if (endValue > 24) {
                    if ((blockStart >= startValue && blockStart < endValue) || (blockStart < (endValue - 24))) {
                      isActive = true;
                    }
                  } else {
                    if (blockStart >= startValue && blockStart < endValue) {
                      isActive = true;
                    }
                  }
                }
                
                // visually mark overtime blocks (anything past 8 hours from start)
                const isOvertimeBlock = isActive && (blockStart >= startValue + 8);

                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex-1 border-r border-slate-200/50 last:border-r-0 relative transition-colors",
                      isActive ? (isOvertimeBlock ? "bg-emerald-500" : "bg-indigo-500 opacity-90") : ""
                    )}
                    title={`${Math.floor(blockStart)}:${(blockStart % 1 === 0.5 ? '30' : '00')}`}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex justify-between items-center">
               <div className="flex gap-6">
                 <div className="flex items-center gap-2">
                   <span className="w-3 h-3 rounded-sm bg-indigo-500 opacity-90"></span>
                   <span className="text-[10px] uppercase font-semibold text-slate-500">Czas Podstawowy</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                   <span className="text-[10px] uppercase font-semibold text-slate-500">Nadgodziny</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="mt-8 bg-indigo-50/50 rounded-xl p-5 sm:p-6 border border-indigo-100 text-indigo-900">
            <div className="flex flex-col lg:flex-row lg:items-baseline justify-between mb-4 gap-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-800 flex items-center gap-2"><Edit3 className="w-4 h-4"/> Notatki i zadania</h4>
              <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                {SUGGESTIONS.map(s => (
                  <button 
                    key={s} 
                    onClick={() => {
                        const current = entry.notes ? entry.notes + ', ' : '';
                        updateEntry(dateStr, { notes: current + s });
                    }}
                    className="text-[10px] uppercase font-semibold text-indigo-700 border border-indigo-200 bg-white rounded-full px-2.5 py-1 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors shadow-sm inline-flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" /> {s}
                  </button>
                ))}
              </div>
            </div>
            <textarea 
               value={entry.notes}
               onChange={(e) => updateEntry(dateStr, { notes: e.target.value })}
               placeholder="Wprowadź realizowane zadania..."
               className="w-full bg-white rounded-lg p-3 text-slate-800 min-h-[80px] resize-y border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-[13px] leading-relaxed italic placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-none">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-center">
             <DayPicker 
               mode="single" 
               selected={date} 
               onSelect={(d) => d && onChangeDate(d)} 
               locale={pl}
               captionLayout="dropdown"
               startMonth={new Date(2020, 0)}
               endMonth={new Date(2030, 11)}
               modifiers={{
                  emerald: (d) => data[format(d, 'yyyy-MM-dd')]?.color === 'emerald',
                  blue: (d) => data[format(d, 'yyyy-MM-dd')]?.color === 'blue',
                  amber: (d) => data[format(d, 'yyyy-MM-dd')]?.color === 'amber',
                  red: (d) => data[format(d, 'yyyy-MM-dd')]?.color === 'red',
               }}
               modifiersStyles={{
                  emerald: { borderBottom: '3px solid #10B981', fontWeight: 'bold' },
                  blue: { borderBottom: '3px solid #3B82F6', fontWeight: 'bold' },
                  amber: { borderBottom: '3px solid #F59E0B', fontWeight: 'bold' },
                  red: { borderBottom: '3px solid #EF4444', fontWeight: 'bold' },
               }}
               className="!m-0 font-sans text-sm"
             />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 block">Ocena Dnia / Intensywność</h4>
            <div className="flex gap-3">
               {[
                 { color: '#10B981', label: 'Bardzo Dobry', val: 'emerald', bg: 'bg-emerald-500' },
                 { color: '#3B82F6', label: 'Dobry', val: 'blue', bg: 'bg-blue-500' },
                 { color: '#F59E0B', label: 'Średni', val: 'amber', bg: 'bg-amber-500' },
                 { color: '#EF4444', label: 'Słaby', val: 'red', bg: 'bg-red-500' }
               ].map(c => (
                 <button
                    key={c.val}
                    onClick={() => updateEntry(dateStr, { color: entry.color === c.val ? undefined : c.val })}
                    className={cn(
                      "flex-1 h-10 rounded-lg transition-all",
                      entry.color === c.val ? "ring-2 ring-offset-2 ring-slate-800 scale-105" : "hover:scale-105 hover:shadow-md opacity-90",
                      c.bg
                    )}
                    title={c.label}
                 />
               ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10">Suma Dzienna</span>
            <div className="text-6xl font-serif mb-6 text-white tracking-tight relative z-10 font-light">
              {hoursWorked > 0 ? formatHours(hoursWorked).replace('h', '').replace('m', '') : '0.0'}
              <span className="text-2xl font-sans font-normal ml-2 text-slate-500">
                 h
              </span>
            </div>

            {overtime > 0 && (
              <div className="pt-6 border-t border-slate-800 relative z-10">
                <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Nadgodziny</span>
                <div className="text-4xl font-mono text-emerald-400 font-medium tracking-tight">
                  +{formatHours(overtime).replace('h', '').replace('m', '')}<span className="text-xl ml-1 text-emerald-600">h</span>
                </div>
              </div>
            )}
            
            <div className="absolute -bottom-10 -right-10 text-slate-800 opacity-50 z-0">
               <Clock className="w-48 h-48" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
