import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";

export function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

export function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(value: string) {
  return parseISO(value);
}

export function monthTitle(month: Date) {
  return format(month, "yyyy년 M월", { locale: ko });
}

export function dayLabel(date: Date) {
  return format(date, "d");
}

export function weekdayLabel(date: Date) {
  return format(date, "EEE", { locale: ko });
}

export function getMonthGrid(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  let cursor = start;

  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
}

export function getMonthBounds(month: Date) {
  return {
    start: dateKey(startOfMonth(month)),
    end: dateKey(endOfMonth(month)),
  };
}

export function isCurrentMonth(day: Date, month: Date) {
  return isSameMonth(day, month);
}

export function isToday(day: Date) {
  return isSameDay(day, new Date());
}
