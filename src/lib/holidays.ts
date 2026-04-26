import { addDays, format, getYear } from 'date-fns';

function calculateEaster(year: number): Date {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);

  return new Date(year, month - 1, day);
}

export function getPolishHolidays(year: number): Record<string, string> {
  const easter = calculateEaster(year);
  const easterMonday = addDays(easter, 1);
  const pentecost = addDays(easter, 49); // Zielone Świątki
  const corpusChristi = addDays(easter, 60); // Boże Ciało

  const holidays: Record<string, string> = {
    [`${year}-01-01`]: 'Nowy Rok',
    [`${year}-01-06`]: 'Trzech Króli',
    [`${year}-05-01`]: 'Święto Pracy',
    [`${year}-05-03`]: 'Święto Konstytucji 3 Maja',
    [`${year}-08-15`]: 'Wniebowzięcie NMP',
    [`${year}-11-01`]: 'Wszystkich Świętych',
    [`${year}-11-11`]: 'Święto Niepodległości',
    [`${year}-12-25`]: 'Boże Narodzenie (1. dzień)',
    [`${year}-12-26`]: 'Boże Narodzenie (2. dzień)',
  };

  holidays[format(easter, 'yyyy-MM-dd')] = 'Wielkanoc';
  holidays[format(easterMonday, 'yyyy-MM-dd')] = 'Poniedziałek Wielkanocny';
  holidays[format(pentecost, 'yyyy-MM-dd')] = 'Zielone Świątki';
  holidays[format(corpusChristi, 'yyyy-MM-dd')] = 'Boże Ciało';

  return holidays;
}

export function isWorkingDay(date: Date, holidays: Record<string, string>): { isWorkingDay: boolean; holidayName?: string; isWeekend: boolean } {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dateString = format(date, 'yyyy-MM-dd');
  const holidayName = holidays[dateString];

  if (holidayName) {
    return { isWorkingDay: false, holidayName, isWeekend };
  }

  return { isWorkingDay: !isWeekend, isWeekend };
}
