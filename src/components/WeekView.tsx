import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calculator, Sun, Cloud, Star, Calendar as CalendarIcon, Clock, Activity } from 'lucide-react';
import { getPolishHolidays, isWorkingDay } from '../lib/holidays';
import { calculateHours, formatHours } from '../lib/math';
import { WorkData, WorkEntry } from '../hooks/useStore';
import { cn } from '../lib/utils';
import { useMemo } from 'react';
import { downloadICS } from '../lib/calendar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function WeekView({ 
  date, 
  onChangeDate, 
  data,
  updateEntry
}: { 
  date: Date; 
  onChangeDate: (d: Date) => void;
  data: WorkData;
  updateEntry?: (dateStr: string, entry: Partial<WorkEntry>) => void;
}) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  
  const holidays = useMemo(() => getPolishHolidays(weekStart.getFullYear()), [weekStart]);
  
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  let totalHours = 0;
  let workDaysCount = 0;
  let freeDaysCount = 0;
  let maxHours = 0;
  let minHours = Infinity;

  const chartData = days.map(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const entry = data[dStr];
    const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
    
    return {
      day: format(d, 'EEEEEE', { locale: pl }).toUpperCase(),
      dateStr: format(d, 'dd.MM'),
      hours: hrs
    };
  });

  days.forEach(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const entry = data[dStr];
    
    const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
    totalHours += hrs;

    if (hrs > 0) {
      if (hrs > maxHours) maxHours = hrs;
      if (hrs < minHours) minHours = hrs;
      workDaysCount++;
    } else {
      freeDaysCount++; // Consider 0 hours a free day visually
    }
  });

  if (minHours === Infinity) minHours = 0;
  const avgHours = workDaysCount > 0 ? totalHours / workDaysCount : 0;

  const handleExportICS = () => {
    const events = days.map(d => {
      const entry = data[format(d, 'yyyy-MM-dd')];
      if (!entry) return null;
      return {
        date: d,
        startTime: entry.startTime,
        endTime: entry.endTime,
        notes: entry.notes
      };
    }).filter(Boolean) as any[];
    
    downloadICS(events, `praca_tydzien_${format(weekStart, 'yyyy_ww')}.ics`);
  };

  const weekNoteKey = `week-${weekStartStr}`;
  const weekNote = data[weekNoteKey]?.notes || '';

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 gap-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-2.5 rounded-xl hidden sm:block">
             <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900 capitalize">
               Tydzień {format(weekStart, 'w', { locale: pl })}
            </h2>
            <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
               {format(weekStart, 'dd MMM')} – {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: pl })}
            </p>
          </div>
        </div>
        <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
            <button onClick={handleExportICS} title="Dodaj do kalendarza (.ics)" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
            <button onClick={() => onChangeDate(subWeeks(date, 1))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => onChangeDate(addWeeks(date, 1))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Panel */}
        <div className="lg:col-span-8 space-y-6 flex flex-col order-1">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Przegląd Tygodnia</h3>
            </div>
            
            <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[300px]">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                   <th className="py-2 sm:py-3 px-4 sm:px-6 font-semibold">Dzień</th>
                   <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold">Status</th>
                   <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold whitespace-nowrap">Od - Do</th>
                   <th className="py-2 sm:py-3 px-4 sm:px-6 text-right font-semibold">Godziny</th>
                </tr>
              </thead>
              <tbody className="text-[13px] sm:text-sm font-sans divide-y divide-slate-100">
                {days.map((d) => {
                  const dStr = format(d, 'yyyy-MM-dd');
                  const entry = data[dStr];
                  const status = isWorkingDay(d, holidays);
                  const isToday = isSameDay(d, new Date());
                  const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;

                  return (
                    <tr 
                      key={dStr} 
                      className={cn(
                        "transition-colors hover:bg-slate-50 cursor-pointer",
                        !status.isWorkingDay && "bg-slate-50/50 text-slate-500",
                        isToday && "bg-indigo-50/50 font-medium"
                      )}
                      onClick={() => onChangeDate(d)}
                    >
                      <td className="py-2 sm:py-3 px-4 sm:px-6 flex items-center whitespace-nowrap">
                         <span className="font-mono text-[10px] sm:text-[11px] text-slate-500 mr-2 sm:mr-3">{format(d, 'dd.MM')}</span>
                         <span className={cn("capitalize text-slate-900", !status.isWorkingDay && "text-slate-500")}>{format(d, 'EEEE', { locale: pl }).substring(0, 2)}</span>
                         {entry?.color && (
                            <span 
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ml-2 sm:ml-3" 
                              style={{ backgroundColor: entry.color === 'emerald' ? '#10B981' : entry.color === 'blue' ? '#3B82F6' : entry.color === 'amber' ? '#F59E0B' : '#EF4444' }}
                            />
                         )}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                         {!status.isWorkingDay ? (
                           <span className={cn(
                             "inline-flex items-center justify-center", 
                             status.holidayName ? "text-rose-500" : "text-slate-400"
                           )} title={status.holidayName || "Weekend"}>
                             {status.holidayName ? <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" /> : <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                           </span>
                         ) : (
                           <span className="inline-flex items-center justify-center text-slate-400" title="Dzień roboczy">
                             <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                           </span>
                         )}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center whitespace-nowrap font-mono text-[11px] sm:text-xs text-slate-500">
                         {entry?.startTime || '-'} – {entry?.endTime || '-'}
                      </td>
                      <td className="py-2 sm:py-3 px-4 sm:px-6 text-right font-mono text-slate-700">
                        {hrs > 0 ? (hrs % 1 === 0 ? `${hrs}.0` : hrs.toFixed(1)) : '-'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50/80">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold font-sans text-[10px] sm:text-xs uppercase tracking-widest text-slate-600">Suma</td>
                  <td className="text-center">-</td>
                  <td className="text-center text-slate-400">-</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-right font-mono font-bold text-base sm:text-l text-slate-800">{totalHours > 0 ? totalHours.toFixed(1) : '-'}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Wnioski tygodniowe / Planowanie</h4>
             <textarea 
               value={weekNote}
               onChange={(e) => updateEntry?.(weekNoteKey, { notes: e.target.value })}
               placeholder="Zapisz swoje wnioski z mijającego tygodnia..."
               className="w-full bg-white text-slate-800 min-h-[80px] sm:min-h-[100px] resize-y focus:outline-none text-[13px] italic placeholder-slate-400 leading-relaxed border border-slate-200 focus:ring-2 focus:ring-indigo-300 p-3 rounded-lg shadow-inner transition-all"
             />
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2">
           <div className="bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 shadow-sm rounded-2xl relative overflow-hidden">
             
             <div className="mb-6 relative z-10">
               <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Przepracowane w tyg.</span>
               <div className="text-5xl sm:text-6xl font-serif text-slate-900 tracking-tight">
                 {totalHours.toFixed(1)}<span className="text-xl sm:text-2xl font-sans text-slate-400 ml-1">h</span>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 relative z-10 mb-4">
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Śr. dzienna</span>
                  <div className="text-lg sm:text-xl font-mono font-medium text-slate-700">{avgHours.toFixed(1)} h</div>
                </div>
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Praca / Wolne</span>
                  <div className="text-lg sm:text-xl font-mono font-medium text-slate-700">{workDaysCount} <span className="text-slate-400">/</span> {freeDaysCount}</div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 relative z-10">
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Min. w tyg.</span>
                  <div className="text-lg sm:text-xl font-mono font-medium text-emerald-600">{maxHours > 0 ? minHours.toFixed(1) : '-'} h</div>
                </div>
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Max. w tyg.</span>
                  <div className="text-lg sm:text-xl font-mono font-medium text-indigo-600">{maxHours > 0 ? maxHours.toFixed(1) : '-'} h</div>
                </div>
             </div>
             
             <div className="absolute -bottom-10 -right-10 text-slate-50 opacity-50 z-0">
               <Clock className="w-48 h-48 sm:w-56 sm:h-56" />
             </div>
           </div>
           
           <div className="bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-sm w-full h-[200px] sm:h-[240px]">
             <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" /> Aktywność
             </h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip 
                     cursor={{ fill: '#F1F5F9' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="hours" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>
    </div>
  );
}
