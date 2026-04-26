import { useState, useEffect } from 'react';

export interface WorkEntry {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  notes: string;
  color?: string; // For productivity/intensity
}

export type WorkData = Record<string, WorkEntry>; // key is yyyy-MM-dd

export function useStore() {
  const [data, setData] = useState<WorkData>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('work-tracker-data');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('work-tracker-data', JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateEntry = (date: string, entry: Partial<WorkEntry>) => {
    setData((prev) => {
      const current = prev[date] || { startTime: '', endTime: '', notes: '' };
      return {
        ...prev,
        [date]: { ...current, ...entry }
      };
    });
  };

  const clearEntry = (date: string) => {
     setData((prev) => {
       const newData = { ...prev };
       delete newData[date];
       return newData;
     });
  };

  return { data, updateEntry, clearEntry, isLoaded };
}
