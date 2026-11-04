import type { DurationMessages, Language } from "./time";

export type AppCopy = {
  title: string;
  description: string;
  ogDescription: string;
  intro: string;
  wakeLabel: string;
  wakePickerLabel: string;
  wakeOptionsLabel: string;
  wakeHelp: string;
  optionsLabel: string;
  languageLabel: string;
  durationLabel: string;
  wakePlaceholder: string;
  durationHelp: string;
  shortcutsLegend: string;
  formatLabel: string;
  format12: string;
  format24: string;
  rememberLabel: string;
  clearButton: string;
  resultPromptMain: string;
  resultPromptMeta: string;
  invalidWakeMain: string;
  invalidWakeMeta: string;
  invalidDurationMain: string;
  invalidDurationMeta: string;
  resultMain: (bedtimeText: string) => string;
  resultMeta: (params: {
    normalized: string;
    bedtimeText: string;
    relativeLabel: string;
    wakeText: string;
  }) => string;
  clearConfirm: string;
  themeToLight: string;
  themeToDark: string;
  themeTooltipLight: string;
  themeTooltipDark: string;
  durationMessages: DurationMessages;
};

export const LANGUAGE_STORAGE_KEY = "sleep-calculator:lang-v1";

// Spanish 12h times end in "a. m." / "p. m.", so avoid a doubled period.
const endSentence = (text: string): string => (text.endsWith(".") ? text : `${text}.`);

const COPY: Record<Language, AppCopy> = {
  es: {
    title: "Calculadora de hora de dormir",
    description:
      "Calcula a qué hora dormirte para despertar mañana a la hora deseada.",
    ogDescription:
      "Introduce tu hora de despertar y cuántas horas quieres dormir.",
    intro:
      "Elige tu hora de despertar y cuánto quieres dormir para obtener la hora recomendada para acostarte.",
    wakeLabel: "Hora de despertar",
    wakePickerLabel: "Elegir hora de la lista",
    wakeOptionsLabel: "Horas sugeridas",
    wakeHelp: "Usa 24 horas (07:30) o AM/PM (7:30 AM). Puedes borrar cada carácter.",
    optionsLabel: "Opciones",
    languageLabel: "Idioma",
    durationLabel: "Duración de sueño (horas)",
    wakePlaceholder: "Selecciona la hora",
    durationHelp: "Ej.: 7.5, 7:30 o 7h 30m.",
    shortcutsLegend: "Atajos de duración",
    formatLabel: "Formato de hora",
    format12: "12h",
    format24: "24h",
    rememberLabel: "Recordar tus valores",
    clearButton: "Limpiar",
    resultPromptMain: "Completa los campos para calcular.",
    resultPromptMeta:
      "Completa la hora de despertar y la duración para ver la recomendación.",
    invalidWakeMain: "Hora inválida.",
    invalidWakeMeta:
      "Corrige la hora de despertar para poder calcular la recomendación.",
    invalidDurationMain: "Duración inválida.",
    invalidDurationMeta:
      "Corrige la duración para calcular la hora recomendada para dormir.",
    resultMain: (bedtimeText) => endSentence(`Duérmete a las ${bedtimeText}`),
    resultMeta: ({ normalized, bedtimeText, relativeLabel, wakeText }) =>
      endSentence(`Si quieres dormir ${normalized}, debes dormirte a las ${bedtimeText} ${relativeLabel} para levantarte mañana a las ${wakeText}`),
    clearConfirm:
      "Se limpiarán los valores guardados y el resultado. ¿Quieres continuar?",
    themeToLight: "Cambiar a modo claro",
    themeToDark: "Cambiar a modo oscuro",
    themeTooltipLight: "Modo claro",
    themeTooltipDark: "Modo oscuro",
    durationMessages: {
      required: "Introduce una duración de sueño.",
      invalidFormat: "Formato inválido. Usa por ejemplo 7.5, 7:30 o 7h 30m.",
      range: "La duración debe estar entre 0.25h y 12h.",
    },
  },
  en: {
    title: "Sleep Time Calculator",
    description:
      "Calculate when to go to bed to wake up at your desired time tomorrow.",
    ogDescription: "Enter your wake-up time and desired sleep duration.",
    intro:
      "Choose your wake-up time and sleep duration to get a recommended bedtime.",
    wakeLabel: "Wake-up time",
    wakePickerLabel: "Choose time from list",
    wakeOptionsLabel: "Suggested times",
    wakeHelp: "Use 24-hour time (07:30) or AM/PM (7:30 AM). Each character can be deleted.",
    optionsLabel: "Options",
    languageLabel: "Language",
    durationLabel: "Sleep duration (hours)",
    wakePlaceholder: "Select time",
    durationHelp: "E.g. 7.5, 7:30 or 7h 30m.",
    shortcutsLegend: "Duration shortcuts",
    formatLabel: "Time format",
    format12: "12h",
    format24: "24h",
    rememberLabel: "Remember your values",
    clearButton: "Clear",
    resultPromptMain: "Fill in the fields to calculate.",
    resultPromptMeta:
      "Set wake-up time and sleep duration to see the recommendation.",
    invalidWakeMain: "Invalid wake-up time.",
    invalidWakeMeta: "Fix the wake-up time to calculate your recommendation.",
    invalidDurationMain: "Invalid duration.",
    invalidDurationMeta: "Fix the duration to calculate your recommended bedtime.",
    resultMain: (bedtimeText) => `Go to bed at ${bedtimeText}.`,
    resultMeta: ({ normalized, bedtimeText, relativeLabel, wakeText }) =>
      `If you want to sleep ${normalized}, you should go to bed at ${bedtimeText} ${relativeLabel} to wake up at ${wakeText}.`,
    clearConfirm: "This will clear saved values and result. Continue?",
    themeToLight: "Switch to light mode",
    themeToDark: "Switch to dark mode",
    themeTooltipLight: "Light mode",
    themeTooltipDark: "Dark mode",
    durationMessages: {
      required: "Enter a sleep duration.",
      invalidFormat: "Invalid format. Use 7.5, 7:30, or 7h 30m.",
      range: "Duration must be between 0.25h and 12h.",
    },
  },
};

export function getCopy(language: Language): AppCopy {
  return COPY[language];
}

export function detectInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "es") {
      return stored;
    }
  } catch {
    // Ignore storage failures.
  }

  const userLang = navigator.language.toLowerCase();
  return userLang.startsWith("es") ? "es" : "en";
}

export function saveLanguage(language: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures.
  }
}
