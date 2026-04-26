import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, BarChart3, Download, FileText, FileSpreadsheet, Calendar as CalendarIcon, Clock, TrendingUp, Star, Cloud, Sun } from 'lucide-react';
import { getPolishHolidays, isWorkingDay } from '../lib/holidays';
import { calculateHours, formatHours } from '../lib/math';
import { WorkData } from '../hooks/useStore';
import { cn } from '../lib/utils';
import { useMemo } from 'react';
import { exportToCSV, exportToPDF } from '../lib/export';
import { downloadICS } from '../lib/calendar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

export default function MonthView({ 
  date, 
  onChangeDate, 
  data 
}: { 
  date: Date; 
  onChangeDate: (d: Date) => void;
  data: WorkData;
}) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  
  const holidays = useMemo(() => getPolishHolidays(monthStart.getFullYear()), [monthStart]);
  
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  let totalHours = 0;
  let workDaysCount = 0;
  let freeDaysCount = 0;

  const chartData = daysInMonth.map(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const status = isWorkingDay(d, holidays);
    const entry = data[dStr];
    
    const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
    
    return {
      date: format(d, 'dd.MM'),
      hours: hrs,
      isWorkDay: status.isWorkingDay
    };
  });

  daysInMonth.forEach(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const entry = data[dStr];
    const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
    totalHours += hrs;

    if (hrs > 0) {
      workDaysCount++;
    } else {
      freeDaysCount++;
    }
  });

  const avgHours = workDaysCount > 0 ? totalHours / workDaysCount : 0;

  // Expected working hours (approximate 8h per working day)
  let expectedWorkingDays = 0;
  daysInMonth.forEach(d => {
    if (isWorkingDay(d, holidays).isWorkingDay) expectedWorkingDays++;
  });
  const expectedTotalHours = expectedWorkingDays * 8;
  const balance = totalHours - expectedTotalHours;
  const percentComplete = expectedTotalHours > 0 ? Math.round((totalHours / expectedTotalHours) * 100) : 0;

  const handleExportCSV = () => {
    const headers = ['Data', 'Status', 'Rozpoczęcie', 'Zakończenie', 'Godziny', 'Bilans', 'Notatki'];
    const rows = daysInMonth.map(d => {
      const dStr = format(d, 'yyyy-MM-dd');
      const entry = data[dStr];
      const status = isWorkingDay(d, holidays);
      const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
      const dailyBalance = hrs - (status.isWorkingDay ? 8 : 0);
      
      return [
        format(d, 'dd.MM.yyyy'),
        status.isWorkingDay ? 'Roboczy' : (status.holidayName || 'Weekend'),
        entry?.startTime || '-',
        entry?.endTime || '-',
        hrs.toFixed(1),
        dailyBalance.toFixed(1),
        entry?.notes || ''
      ];
    });

    const filename = `raport_${format(monthStart, 'MM_yyyy')}.csv`;
    exportToCSV(filename, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Data', 'Status', 'Rozpoczęcie', 'Zakończenie', 'Godziny', 'Bilans', 'Notatki'];
    const rows = daysInMonth.map(d => {
      const dStr = format(d, 'yyyy-MM-dd');
      const entry = data[dStr];
      const status = isWorkingDay(d, holidays);
      const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
      const dailyBalance = hrs - (status.isWorkingDay ? 8 : 0);
      
      return [
        format(d, 'dd.MM.yyyy'),
        status.isWorkingDay ? 'Roboczy' : (status.holidayName || 'Weekend'),
        entry?.startTime || '-',
        entry?.endTime || '-',
        hrs.toFixed(1),
        dailyBalance > 0 ? `+${dailyBalance.toFixed(1)}` : dailyBalance.toFixed(1),
        entry?.notes || ''
      ];
    });

    const title = `Raport Miesieczny - ${format(monthStart, 'MM/yyyy')}`;
    const filename = `raport_${format(monthStart, 'MM_yyyy')}.pdf`;
    exportToPDF(filename, title, headers, rows);
  };

  const handleExportICS = () => {
    const events = daysInMonth.map(d => {
      const entry = data[format(d, 'yyyy-MM-dd')];
      if (!entry) return null;
      return {
        date: d,
        startTime: entry.startTime,
        endTime: entry.endTime,
        notes: entry.notes
      };
    }).filter(Boolean) as any[];
    
    downloadICS(events, `praca_miesiac_${format(monthStart, 'yyyy_MM')}.ics`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 gap-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-2.5 rounded-xl hidden sm:block">
             <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900 capitalize">
               {format(monthStart, 'MMMM yyyy', { locale: pl })}
            </h2>
            <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
               Miesięczny Bilans: {expectedTotalHours}h
            </p>
          </div>
        </div>
        <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
            <button onClick={handleExportPDF} title="Eksportuj do PDF" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><FileText className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={handleExportCSV} title="Eksportuj do CSV" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={handleExportICS} title="Dodaj do kalendarza (.ics)" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
            <button onClick={() => onChangeDate(subMonths(date, 1))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => onChangeDate(addMonths(date, 1))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2">
           <div className="bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 shadow-sm rounded-2xl relative overflow-hidden">
             
             <div className="mb-6 relative z-10">
               <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Przepracowane wymiar</span>
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
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Dni (praca/wolne)</span>
                  <div className="text-lg sm:text-xl font-mono font-medium text-slate-700">{workDaysCount} <span className="text-slate-400">/</span> {freeDaysCount}</div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 relative z-10">
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Bilans (Norma)</span>
                  <div className={cn(
                    "text-lg sm:text-xl font-mono font-medium",
                    balance > 0 ? "text-emerald-500" : balance < 0 ? "text-rose-500" : "text-slate-500"
                  )}>
                    {balance > 0 ? '+' : ''}{balance.toFixed(1)} h
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Cel normy mies.</span>
                  <div className="text-lg sm:text-xl font-mono font-medium text-slate-700">{percentComplete}%</div>
                </div>
             </div>
             
             <div className="absolute -bottom-10 -right-10 text-slate-50 opacity-50 z-0">
               <Clock className="w-48 h-48 sm:w-56 sm:h-56" />
             </div>
           </div>
           
           <div className="bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-sm w-full h-[200px] sm:h-[240px]">
             <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> Rozkład w miesiącu
             </h3>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} minTickGap={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip 
                     cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-8 flex flex-col order-1">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <BarChart3 className="w-4 h-4" /> Zestawienie Dzienne
               </h3>
            </div>
            
            <div className="overflow-x-auto flex-1 h-[600px]">
            <table className="w-full text-left border-collapse min-w-[320px]">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                   <th className="py-2 sm:py-3 px-4 sm:px-6 font-semibold">Dzień</th>
                   <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold">Status</th>
                   <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold whitespace-nowrap">Od - Do</th>
                   <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold">Godziny</th>
                   <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold">Bilans Dz.</th>
                   <th className="py-2 sm:py-3 px-4 sm:px-6 hidden sm:table-cell font-semibold">Notatki</th>
                </tr>
              </thead>
              <tbody className="text-[13px] sm:text-sm font-sans divide-y divide-slate-100">
                {daysInMonth.map((d) => {
                  const dStr = format(d, 'yyyy-MM-dd');
                  const entry = data[dStr];
                  const status = isWorkingDay(d, holidays);
                  const isToday = isSameDay(d, new Date());
                  const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
                  const dailyBalance = hrs - (status.isWorkingDay ? 8 : 0);

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
                        <span className={cn("capitalize text-slate-900", !status.isWorkingDay && "text-slate-500")}>{format(d, 'eee', { locale: pl })}</span>
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
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-right font-mono text-slate-700">
                         {hrs > 0 ? hrs.toFixed(1) : '0.0'}
                      </td>
                      <td className={cn(
                        "py-2 sm:py-3 px-2 sm:px-4 text-right font-mono text-[10px] sm:text-[11px] font-bold",
                        dailyBalance > 0 ? "text-emerald-600" : dailyBalance < 0 ? "text-rose-500" : "text-slate-400 font-normal"
                      )}>
                         {dailyBalance > 0 ? '+' : ''}{dailyBalance !== 0 ? dailyBalance.toFixed(1) : '-'}
                      </td>
                      <td className="py-2 sm:py-3 px-4 sm:px-6 text-[10px] sm:text-xs text-slate-500 truncate max-w-[100px] sm:max-w-[120px] hidden sm:table-cell" title={entry?.notes}>
                        {entry?.notes || ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
