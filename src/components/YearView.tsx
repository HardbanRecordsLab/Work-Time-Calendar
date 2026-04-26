import { format, addYears, subYears, eachMonthOfInterval, startOfYear, endOfYear, eachDayOfInterval, isSameMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp, Download, FileText, FileSpreadsheet, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { getPolishHolidays, isWorkingDay } from '../lib/holidays';
import { calculateHours, formatHours } from '../lib/math';
import { WorkData } from '../hooks/useStore';
import { cn } from '../lib/utils';
import { useMemo } from 'react';
import { exportToCSV, exportToPDF } from '../lib/export';
import { downloadICS } from '../lib/calendar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function YearView({ 
  date, 
  onChangeDate, 
  data 
}: { 
  date: Date; 
  onChangeDate: (d: Date) => void;
  data: WorkData;
}) {
  const yearStart = startOfYear(date);
  const yearEnd = endOfYear(yearStart);
  
  const holidays = useMemo(() => getPolishHolidays(yearStart.getFullYear()), [yearStart]);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  let totalYearHours = 0;
  let maxMonthHours = 0;
  let mostProductiveMonth = '';
  let expectedYearHours = 0;
  let totalWorkDaysCount = 0;
  let totalFreeDaysCount = 0;

  const monthStats = months.map(m => {
    const monthDays = allDays.filter(d => isSameMonth(d, m));
    let monthHours = 0;
    let workDaysCount = 0;
    
    monthDays.forEach(d => {
      const isWorkDay = isWorkingDay(d, holidays).isWorkingDay;
      if (isWorkDay) expectedYearHours += 8;

      const dStr = format(d, 'yyyy-MM-dd');
      const entry = data[dStr];
      const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
      
      monthHours += hrs;

      if (hrs > 0) {
        totalWorkDaysCount++;
        workDaysCount++;
      } else {
        totalFreeDaysCount++;
      }
    });

    if (monthHours > maxMonthHours) {
      maxMonthHours = monthHours;
      mostProductiveMonth = format(m, 'MMMM', { locale: pl });
    }

    return { 
      monthDate: m, 
      hours: monthHours,
      avgDailyHours: workDaysCount > 0 ? monthHours / workDaysCount : 0,
      name: format(m, 'MMM', { locale: pl })
    };
  });

  const dayOfWeekStats = useMemo(() => {
    const stats = [1, 2, 3, 4, 5, 6, 0].map(day => {
      const daysOfThisType = allDays.filter(d => d.getDay() === day);
      let totalHrs = 0;
      let workDaysCount = 0;
      daysOfThisType.forEach(d => {
        const entry = data[format(d, 'yyyy-MM-dd')];
        const hrs = entry ? calculateHours(entry.startTime, entry.endTime) : 0;
        totalHrs += hrs;
        if (hrs > 0) workDaysCount++;
      });
      const refDate = new Date(2024, 0, day === 0 ? 7 : day);
      return {
        dayIndex: day,
        name: format(refDate, 'EEEE', { locale: pl }).slice(0, 3),
        fullName: format(refDate, 'EEEE', { locale: pl }),
        totalHours: totalHrs,
        avgHours: workDaysCount > 0 ? totalHrs / workDaysCount : 0,
        workDaysCount
      };
    });
    return stats;
  }, [allDays, data]);

  const busiestDay = [...dayOfWeekStats].sort((a, b) => b.totalHours - a.totalHours)[0];

  allDays.forEach(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const entry = data[dStr];
    totalYearHours += entry ? calculateHours(entry.startTime, entry.endTime) : 0;
  });

  const avgMonthHours = totalYearHours / 12;

  const handleExportCSV = () => {
    const headers = ['Miesiąc', 'Godziny', 'Średnia dzienna'];
    const rows = monthStats.map(stat => {
      const daysInMonth = allDays.filter(d => isSameMonth(d, stat.monthDate));
      const workDays = daysInMonth.filter(d => data[format(d, 'yyyy-MM-dd')] && calculateHours(data[format(d, 'yyyy-MM-dd')].startTime, data[format(d, 'yyyy-MM-dd')].endTime) > 0).length;
      
      return [
        format(stat.monthDate, 'MMMM yyyy', { locale: pl }),
        stat.hours.toFixed(1),
        workDays > 0 ? (stat.hours / workDays).toFixed(1) : '0.0'
      ];
    });

    const filename = `raport_roczny_${format(yearStart, 'yyyy')}.csv`;
    exportToCSV(filename, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Miesiąc', 'Godziny', 'Srednia dzienna'];
    const rows = monthStats.map(stat => {
      const daysInMonth = allDays.filter(d => isSameMonth(d, stat.monthDate));
      const workDays = daysInMonth.filter(d => data[format(d, 'yyyy-MM-dd')] && calculateHours(data[format(d, 'yyyy-MM-dd')].startTime, data[format(d, 'yyyy-MM-dd')].endTime) > 0).length;
      
      return [
        format(stat.monthDate, 'MMMM yyyy', { locale: pl }),
        stat.hours.toFixed(1),
        workDays > 0 ? (stat.hours / workDays).toFixed(1) : '0.0'
      ];
    });

    const title = `Raport Roczny - ${format(yearStart, 'yyyy')}`;
    const filename = `raport_roczny_${format(yearStart, 'yyyy')}.pdf`;
    exportToPDF(filename, title, headers, rows);
  };

  const handleExportICS = () => {
    const events = allDays.map(d => {
      const entry = data[format(d, 'yyyy-MM-dd')];
      if (!entry) return null;
      return {
        date: d,
        startTime: entry.startTime,
        endTime: entry.endTime,
        notes: entry.notes
      };
    }).filter(Boolean) as any[];
    
    downloadICS(events, `praca_rok_${format(yearStart, 'yyyy')}.ics`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 gap-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-2.5 rounded-xl hidden sm:block">
             <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900">
              Rok {format(yearStart, 'yyyy')}
            </h2>
            <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
               Roczne zestawienie pracy
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
            <button onClick={() => onChangeDate(subYears(date, 1))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => onChangeDate(addYears(date, 1))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-8 flex flex-col gap-6 order-1">
          <div className="bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-sm w-full h-[240px] sm:h-[320px]">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> Trend godzinny roczny (<span className="text-slate-400 font-normal">Suma</span> / <span className="text-emerald-500 font-normal">Średnia dzienna</span>)
             </h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} />
                  <Tooltip 
                     cursor={{ fill: '#F1F5F9' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                     formatter={(value: number, name: string) => [
                       `${value.toFixed(1)}h`, 
                       name === 'hours' ? 'Suma' : 'Średnia dzienna'
                     ]}
                  />
                  <Bar yAxisId="left" dataKey="hours" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="right" dataKey="avgDailyHours" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
             </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
             {monthStats.map((stat, i) => {
               const percentage = maxMonthHours > 0 ? (stat.hours / maxMonthHours) * 100 : 0;
               return (
                 <div 
                   key={i} 
                   onClick={() => onChangeDate(stat.monthDate)}
                   className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
                 >
                   <h3 className="text-xs sm:text-sm font-semibold capitalize text-slate-600 mb-2 sm:mb-3 group-hover:text-indigo-600 transition-colors">{format(stat.monthDate, 'MMMM', { locale: pl }).slice(0,3)}<span className="hidden sm:inline">{format(stat.monthDate, 'MMMM', { locale: pl }).slice(3)}</span></h3>
                   
                   <div className="flex items-baseline mb-3 sm:mb-4 text-slate-900 gap-1">
                     <span className="text-2xl sm:text-3xl font-serif tracking-tight">{stat.hours > 0 ? stat.hours.toFixed(1) : '0.0'}</span>
                     <span className="text-xs sm:text-sm text-slate-400 font-sans">h</span>
                   </div>

                   <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                     <div 
                       className={cn(
                         "h-full transition-all duration-1000 rounded-full",
                         stat.hours === maxMonthHours && stat.hours > 0 ? "bg-indigo-500" : "bg-slate-300"
                       )}
                       style={{ width: `${Math.max(percentage, 5)}%` }}
                     />
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2">
           <div className="bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 shadow-sm rounded-2xl relative overflow-hidden">
             
             <div className="mb-6 relative z-10">
               <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Łącznie godzin (Rok)</span>
               <div className="text-5xl sm:text-6xl font-serif text-slate-900 tracking-tight">
                 {totalYearHours.toFixed(1)}<span className="text-xl sm:text-2xl font-sans text-slate-400 ml-1">h</span>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 relative z-10">
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Śr. miesięczna</span>
                  <div className="text-lg sm:text-xl font-mono font-medium text-slate-700">{avgMonthHours.toFixed(1)} h</div>
                </div>
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Praca / Wolne</span>
                  <div className="text-lg sm:text-xl font-mono font-medium text-slate-700">{totalWorkDaysCount} <span className="text-slate-400">/</span> {totalFreeDaysCount}</div>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 mt-6 relative z-10">
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Najlepszy miesiąc</span>
                  <div className="text-lg sm:text-xl font-serif capitalize text-indigo-600 font-semibold">
                     {mostProductiveMonth || '-'}
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Najlepszy dzień tyg.</span>
                  <div className="text-lg sm:text-xl font-serif capitalize text-indigo-600 font-semibold truncate">
                     {busiestDay.totalHours > 0 ? busiestDay.fullName : '-'}
                  </div>
                </div>
             </div>
             
             <div className="absolute -bottom-10 -right-10 text-slate-50 opacity-50 z-0">
               <Clock className="w-48 h-48 sm:w-56 sm:h-56" />
             </div>
           </div>

           <div className="bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-sm w-full h-[240px] flex flex-col relative z-20">
             <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-500" /> Najbardziej aktywne dni
             </h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} className="capitalize" width={40} />
                  <Tooltip 
                     cursor={{ fill: '#F1F5F9' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                     formatter={(value: number) => [`${value.toFixed(1)}h`, 'Suma godzin']}
                  />
                  <Bar dataKey="totalHours" fill="#6366F1" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>
    </div>
  );
}
