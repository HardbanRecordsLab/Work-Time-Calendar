export function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

  const startTotalMins = startH * 60 + startM;
  const endTotalMins = endH * 60 + endM;
  
  if (endTotalMins < startTotalMins) {
    // Handling overnight shifts
    return (24 * 60 - startTotalMins + endTotalMins) / 60;
  }
  
  return (endTotalMins - startTotalMins) / 60;
}

export function formatHours(decimalHours: number): string {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getOvertime(hoursWorked: number, standardHours: number = 8): number {
  return Math.max(0, hoursWorked - standardHours);
}
