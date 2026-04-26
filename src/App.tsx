import React, { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, CalendarDays, CalendarRange, Columns, Settings, Clock, Download } from 'lucide-react';
import DayView from './components/DayView';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import YearView from './components/YearView';
import { useStore } from './hooks/useStore';
import { usePWAInstall } from './hooks/usePWAInstall';
import { cn } from './lib/utils';

export type ViewType = 'day' | 'week' | 'month' | 'year';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data, updateEntry, clearEntry, isLoaded } = useStore();
  const { isInstallable, promptInstall } = usePWAInstall();

  if (!isLoaded) return null; // Or a simple loader

  const renderView = () => {
    switch (currentView) {
      case 'day': return <DayView date={selectedDate} onChangeDate={setSelectedDate} data={data} updateEntry={updateEntry} />;
      case 'week': return <WeekView date={selectedDate} onChangeDate={setSelectedDate} data={data} updateEntry={updateEntry} />;
      case 'month': return <MonthView date={selectedDate} onChangeDate={setSelectedDate} data={data} />;
      case 'year': return <YearView date={selectedDate} onChangeDate={setSelectedDate} data={data} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center font-serif font-black text-lg sm:text-xl tracking-tight text-indigo-600 shrink-0">
            <Clock className="w-5 h-5 text-indigo-600 mb-0.5 hidden sm:block mr-2" />
            <span>TimeTracker.</span>
          </div>
          
          <div className="flex items-center justify-end w-full sm:w-auto overflow-hidden">
            <div className="flex gap-1 sm:gap-6 overflow-x-auto no-scrollbar justify-start sm:justify-end mr-4">
              <NavButton active={currentView === 'day'} onClick={() => setCurrentView('day')} label="Dzień" />
              <NavButton active={currentView === 'week'} onClick={() => setCurrentView('week')} label="Tydzień" />
              <NavButton active={currentView === 'month'} onClick={() => setCurrentView('month')} label="Miesiąc" />
              <NavButton active={currentView === 'year'} onClick={() => setCurrentView('year')} label="Rok" />
            </div>
            {isInstallable && (
              <button 
                onClick={promptInstall}
                className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" /> Zainstaluj App
              </button>
            )}
            {isInstallable && (
              <button 
                onClick={promptInstall}
                className="sm:hidden flex items-center justify-center bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:py-10 print:p-0 print:max-w-none">
        {renderView()}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 sm:px-3 py-5 text-[10px] sm:text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap",
        active ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
      )}
    >
      {label}
    </button>
  );
}
