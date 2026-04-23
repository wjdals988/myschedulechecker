import { addDays } from "date-fns";
import KoreanLunarCalendar from "korean-lunar-calendar";
import { dateKey, parseDateKey } from "@/lib/dates";

export type KoreanHolidayInfo = {
  name: string;
  names: string[];
  isSubstitute: boolean;
};

type SubstituteRule = "none" | "satOrSun" | "sunOnly";

type HolidayGroup = {
  id: string;
  dates: string[];
  labelsByDate: Record<string, string>;
  substituteLabel: string;
  substituteRule: SubstituteRule;
};

const yearCache = new Map<number, Record<string, KoreanHolidayInfo>>();

function fixedDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lunarDateKey(year: number, month: number, day: number) {
  const calendar = new KoreanLunarCalendar();
  const success = calendar.setLunarDate(year, month, day, false);

  if (!success) {
    throw new Error(`음력 날짜를 변환할 수 없습니다: ${year}-${month}-${day}`);
  }

  const solar = calendar.getSolarCalendar();
  return fixedDateKey(solar.year, solar.month, solar.day);
}

function isSaturday(value: string) {
  return parseDateKey(value).getDay() === 6;
}

function isSunday(value: string) {
  return parseDateKey(value).getDay() === 0;
}

function isWeekend(value: string) {
  const day = parseDateKey(value).getDay();
  return day === 0 || day === 6;
}

function qualifiesWeekend(value: string, rule: SubstituteRule) {
  if (rule === "satOrSun") {
    return isWeekend(value);
  }

  if (rule === "sunOnly") {
    return isSunday(value);
  }

  return false;
}

function addHolidayEntry(
  holidayMap: Map<string, KoreanHolidayInfo>,
  targetDate: string,
  holidayName: string,
  isSubstitute = false,
) {
  const current = holidayMap.get(targetDate);

  if (!current) {
    holidayMap.set(targetDate, {
      name: holidayName,
      names: [holidayName],
      isSubstitute,
    });
    return;
  }

  if (current.names.includes(holidayName)) {
    holidayMap.set(targetDate, {
      ...current,
      isSubstitute: current.isSubstitute || isSubstitute,
    });
    return;
  }

  const names = [...current.names, holidayName];
  holidayMap.set(targetDate, {
    name: names.join(" · "),
    names,
    isSubstitute: current.isSubstitute || isSubstitute,
  });
}

function buildHolidayGroups(year: number) {
  const groups: HolidayGroup[] = [];

  function pushSingleDayHoliday(
    id: string,
    name: string,
    month: number,
    day: number,
    substituteRule: SubstituteRule = "none",
  ) {
    const targetDate = fixedDateKey(year, month, day);

    groups.push({
      id,
      dates: [targetDate],
      labelsByDate: {
        [targetDate]: name,
      },
      substituteLabel: name,
      substituteRule,
    });
  }

  pushSingleDayHoliday(`new-year-${year}`, "신정", 1, 1);

  if (year >= 2026) {
    pushSingleDayHoliday(`labor-day-${year}`, "노동절", 5, 1);
  }

  pushSingleDayHoliday(`independence-${year}`, "3·1절", 3, 1, "satOrSun");
  pushSingleDayHoliday(`children-${year}`, "어린이날", 5, 5, "satOrSun");
  pushSingleDayHoliday(`memorial-${year}`, "현충일", 6, 6);

  if (year >= 2026) {
    pushSingleDayHoliday(`constitution-${year}`, "제헌절", 7, 17, "satOrSun");
  }

  pushSingleDayHoliday(`liberation-${year}`, "광복절", 8, 15, "satOrSun");
  pushSingleDayHoliday(`foundation-${year}`, "개천절", 10, 3, "satOrSun");
  pushSingleDayHoliday(`hangeul-${year}`, "한글날", 10, 9, "satOrSun");
  pushSingleDayHoliday(`christmas-${year}`, "기독탄신일", 12, 25, "satOrSun");

  const buddhaDay = lunarDateKey(year, 4, 8);
  groups.push({
    id: `buddha-${year}`,
    dates: [buddhaDay],
    labelsByDate: {
      [buddhaDay]: "부처님오신날",
    },
    substituteLabel: "부처님오신날",
    substituteRule: "satOrSun",
  });

  const seollal = lunarDateKey(year, 1, 1);
  const seollalDate = parseDateKey(seollal);
  const seollalEve = dateKey(addDays(seollalDate, -1));
  const seollalNext = dateKey(addDays(seollalDate, 1));
  groups.push({
    id: `seollal-${year}`,
    dates: [seollalEve, seollal, seollalNext],
    labelsByDate: {
      [seollalEve]: "설날 연휴",
      [seollal]: "설날",
      [seollalNext]: "설날 연휴",
    },
    substituteLabel: "설날",
    substituteRule: "sunOnly",
  });

  const chuseok = lunarDateKey(year, 8, 15);
  const chuseokDate = parseDateKey(chuseok);
  const chuseokEve = dateKey(addDays(chuseokDate, -1));
  const chuseokNext = dateKey(addDays(chuseokDate, 1));
  groups.push({
    id: `chuseok-${year}`,
    dates: [chuseokEve, chuseok, chuseokNext],
    labelsByDate: {
      [chuseokEve]: "추석 연휴",
      [chuseok]: "추석",
      [chuseokNext]: "추석 연휴",
    },
    substituteLabel: "추석",
    substituteRule: "sunOnly",
  });

  return groups;
}

function findNextSubstituteDate(afterDate: string, occupiedDates: Set<string>) {
  let cursor = addDays(parseDateKey(afterDate), 1);

  while (true) {
    const key = dateKey(cursor);

    if (!occupiedDates.has(key) && !isSaturday(key) && !isSunday(key)) {
      return key;
    }

    cursor = addDays(cursor, 1);
  }
}

export function getKoreanHolidayMap(year: number) {
  const cached = yearCache.get(year);

  if (cached) {
    return cached;
  }

  const groups = buildHolidayGroups(year);
  const holidayMap = new Map<string, KoreanHolidayInfo>();

  groups.forEach((group) => {
    group.dates.forEach((targetDate) => {
      addHolidayEntry(holidayMap, targetDate, group.labelsByDate[targetDate]);
    });
  });

  const eligibleGroups = groups.filter((group) => group.substituteRule !== "none");
  const eligibleGroupByDate = new Map<string, string[]>();
  const groupById = new Map(groups.map((group) => [group.id, group]));

  eligibleGroups.forEach((group) => {
    group.dates.forEach((targetDate) => {
      eligibleGroupByDate.set(targetDate, [...(eligibleGroupByDate.get(targetDate) ?? []), group.id]);
    });
  });

  const substituteTriggers = new Map<string, { startDate: string; labels: string[] }>();

  eligibleGroups.forEach((group) => {
    const hasWeekendTrigger = group.dates.some((targetDate) => qualifiesWeekend(targetDate, group.substituteRule));

    if (hasWeekendTrigger) {
      substituteTriggers.set(`group:${group.id}`, {
        startDate: group.dates[group.dates.length - 1] ?? group.dates[0]!,
        labels: [group.substituteLabel],
      });
      return;
    }

    const overlapDates = group.dates.filter((targetDate) => {
      return !isWeekend(targetDate) && (eligibleGroupByDate.get(targetDate)?.length ?? 0) > 1;
    });

    if (overlapDates.length === 0) {
      return;
    }

    const overlappingGroupIds = Array.from(
      new Set(overlapDates.flatMap((targetDate) => eligibleGroupByDate.get(targetDate) ?? [])),
    );
    const labels = overlappingGroupIds
      .map((groupId) => groupById.get(groupId)?.substituteLabel)
      .filter((value): value is string => Boolean(value));
    const key = `overlap:${overlapDates.join(",")}`;
    const startDate = overlapDates[overlapDates.length - 1] ?? group.dates[group.dates.length - 1]!;

    substituteTriggers.set(key, {
      startDate,
      labels: Array.from(new Set(labels)),
    });
  });

  const occupiedDates = new Set(holidayMap.keys());

  Array.from(substituteTriggers.values())
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .forEach((trigger) => {
      const substituteDate = findNextSubstituteDate(trigger.startDate, occupiedDates);
      const substituteName = `${trigger.labels.join(" · ")} 대체공휴일`;

      addHolidayEntry(holidayMap, substituteDate, substituteName, true);
      occupiedDates.add(substituteDate);
    });

  const result = Object.fromEntries(holidayMap.entries());
  yearCache.set(year, result);
  return result;
}

export function getKoreanHolidayMapForDates(targetDates: string[]) {
  const years = Array.from(
    new Set(targetDates.map((targetDate) => parseDateKey(targetDate).getFullYear())),
  );

  return years.reduce<Record<string, KoreanHolidayInfo>>((acc, year) => {
    return {
      ...acc,
      ...getKoreanHolidayMap(year),
    };
  }, {});
}

export function getKoreanHoliday(targetDate: string) {
  return getKoreanHolidayMap(parseDateKey(targetDate).getFullYear())[targetDate];
}
