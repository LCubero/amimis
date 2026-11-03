export type Language = "es" | "en";

const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 12 * 60;

export type DurationMessages = {
  required: string;
  invalidFormat: string;
  range: string;
};

export type DurationParseResult =
  | { ok: true; minutes: number; normalized: string }
  | { ok: false; error: string };

const DEFAULT_DURATION_MESSAGES: DurationMessages = {
  required: "Introduce una duracion de sueno.",
  invalidFormat: "Formato invalido. Usa por ejemplo 7.5, 7:30 o 7h 30m.",
  range: "La duracion debe estar entre 0.25h y 12h.",
};

function normalizeMinutes(totalMinutes: number): number {
  return ((totalMinutes % 1440) + 1440) % 1440;
}

function resolveLocale(language?: Language): string {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";

  if (typeof navigator !== "undefined") {
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      return navigator.languages[0];
    }
    if (typeof navigator.language === "string" && navigator.language) {
      return navigator.language;
    }
  }
  return "es-ES";
}

function parseWakeTimeToMinutes(wakeTime: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(wakeTime);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function durationMinutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

export function parseDuration(
  input: string,
  messages: DurationMessages = DEFAULT_DURATION_MESSAGES,
): DurationParseResult {
  if (typeof input !== "string" || input.trim() === "") {
    return { ok: false, error: messages.required };
  }

  const raw = input.trim().toLowerCase().replace(",", ".").replace(/\s+/g, " ");
  let minutes: number | null = null;

  const decimalMatch = /^(\d+(?:\.\d+)?)$/.exec(raw);
  if (decimalMatch) {
    minutes = Math.round(Number(decimalMatch[1]) * 60);
  }

  const clockMatch = /^(\d{1,2}):([0-5]\d)$/.exec(raw);
  if (minutes === null && clockMatch) {
    minutes = Number(clockMatch[1]) * 60 + Number(clockMatch[2]);
  }

  const halfPhrase =
    /^(\d+)\s*(h|hora|horas|hour|hours|hr|hrs)\s*(y\s*media|and\s*a\s*half)$/.exec(raw);
  if (minutes === null && halfPhrase) {
    minutes = Number(halfPhrase[1]) * 60 + 30;
  }

  if (minutes === null) {
    const hoursMatch = /(\d+(?:\.\d+)?)\s*(h|hora|horas|hour|hours|hr|hrs)\b/.exec(raw);
    const minsMatch =
      /(\d+)\s*(m|min|mins|minuto|minutos|minute|minutes)\b/.exec(raw);
    if (hoursMatch || minsMatch) {
      const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
      const mins = minsMatch ? Number(minsMatch[1]) : 0;
      minutes = Math.round(hours * 60 + mins);
    }
  }

  if (!Number.isFinite(minutes) || minutes === null) {
    return {
      ok: false,
      error: messages.invalidFormat,
    };
  }

  if (minutes < MIN_DURATION_MINUTES || minutes > MAX_DURATION_MINUTES) {
    return {
      ok: false,
      error: messages.range,
    };
  }

  return { ok: true, minutes, normalized: durationMinutesToLabel(minutes) };
}

export function normalizeWakeTime(input: string): string | null {
  const match = /^(\d{1,2}):([0-5]\d)(?:\s*(am|pm))?$/i.exec(input.trim());
  if (!match) return null;

  let hours = Number(match[1]);
  const period = match[3]?.toLowerCase();
  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (period === "pm" ? 12 : 0);
  } else if (hours > 23) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

export function computeBedtime(
  wakeTime: string,
  durationMinutes: number,
): { bedtimeMinutes: number; wakeMinutes: number; crossesMidnight: boolean } {
  const wakeMinutes = parseWakeTimeToMinutes(wakeTime);
  if (wakeMinutes === null) {
    throw new Error("wakeTime must use HH:MM (24h) format.");
  }
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < MIN_DURATION_MINUTES ||
    durationMinutes > MAX_DURATION_MINUTES
  ) {
    throw new Error("durationMinutes is out of supported range.");
  }

  const bedtimeMinutes = normalizeMinutes(wakeMinutes - durationMinutes);
  const crossesMidnight = bedtimeMinutes > wakeMinutes;

  return { bedtimeMinutes, wakeMinutes, crossesMidnight };
}

export function formatTime(totalMinutes: number, use12h: boolean, language?: Language): string {
  const normalized = normalizeMinutes(totalMinutes);
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const formatter = new Intl.DateTimeFormat(resolveLocale(language), {
    hour: "numeric",
    minute: "2-digit",
    hour12: use12h,
    timeZone: "UTC",
  });
  const sampleDate = new Date(Date.UTC(2020, 0, 1, hours24, mins));
  return formatter.format(sampleDate);
}

export function labelRelativeDay(crossesMidnight: boolean, language: Language): string {
  if (language === "en") {
    return crossesMidnight ? "tonight" : "tomorrow";
  }
  return crossesMidnight ? "esta noche" : "manana";
}
