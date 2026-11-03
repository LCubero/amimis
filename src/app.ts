import {
  computeBedtime,
  formatTime,
  labelRelativeDay,
  normalizeWakeTime,
  parseDuration,
  type Language,
} from "./time";
import { detectInitialLanguage, getCopy, saveLanguage } from "./i18n";

const FORM_STORAGE_KEY = "sleep-calculator:form-state-v1";
const THEME_STORAGE_KEY = "sleep-calculator:theme-v1";
const THEME_DARK = "dark";
const THEME_LIGHT = "light";
const THEME_COLOR = {
  dark: "#0e1419",
  light: "#f2f6fa",
} as const;

type Theme = keyof typeof THEME_COLOR;
type TimeFormat = "12" | "24";
type FormState = {
  wake: string;
  sleep: string;
  fmt: TimeFormat;
  remember: boolean;
};

function queryRequired<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element as T;
}

const wakeInput = queryRequired<HTMLInputElement>("#wake-time");
const durationInput = queryRequired<HTMLInputElement>("#sleep-duration");
const formatSelect = queryRequired<HTMLSelectElement>("#time-format");
const langSelect = queryRequired<HTMLSelectElement>("#lang-select");
const shortcutButtons = document.querySelectorAll<HTMLButtonElement>("[data-duration]");
const clearButton = queryRequired<HTMLButtonElement>("#clear-btn");
const resultCard = queryRequired<HTMLElement>(".result");
const resultMain = queryRequired<HTMLElement>("#result-main");
const resultMeta = queryRequired<HTMLElement>("#result-meta");
const resultLive = queryRequired<HTMLElement>("#result-live");
const durationError = queryRequired<HTMLElement>("#duration-error");
const rememberToggle = queryRequired<HTMLInputElement>("#remember-toggle");
const themeToggle = queryRequired<HTMLButtonElement>("#theme-toggle");
const themeToggleText = queryRequired<HTMLElement>("#theme-toggle-text");
const themeToggleIcon = queryRequired<HTMLElement>("#theme-toggle .theme-icon");
const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

let currentLanguage: Language = detectInitialLanguage();

function validWakeTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function clearUrlParams(): void {
  window.history.replaceState({}, "", window.location.pathname);
}

function restoreFormState(): FormState | null {
  try {
    const raw = window.localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as Partial<FormState>;
    if (!data || !data.remember) return null;

    return {
      wake: typeof data.wake === "string" ? data.wake : "",
      sleep: typeof data.sleep === "string" ? data.sleep : "",
      fmt: data.fmt === "24" ? "24" : "12",
      remember: true,
    };
  } catch {
    clearFormState();
    return null;
  }
}

function saveFormState(state: FormState): void {
  try {
    if (!state.remember) return;
    window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

function clearFormState(): void {
  try {
    window.localStorage.removeItem(FORM_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function restoreTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  } catch {
    return THEME_DARK;
  }
}

function saveTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures.
  }
}

function applyStaticCopy(): void {
  const copy = getCopy(currentLanguage);
  document.documentElement.lang = currentLanguage;
  document.title = copy.title;

  const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute("content", copy.description);

  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", copy.title);

  const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (ogDescription) ogDescription.setAttribute("content", copy.ogDescription);

  queryRequired<HTMLElement>("#title").textContent = copy.title;
  queryRequired<HTMLElement>("#intro").textContent = copy.intro;
  queryRequired<HTMLElement>("#wake-label").textContent = copy.wakeLabel;
  queryRequired<HTMLElement>("#wake-help").textContent = copy.wakeHelp;
  queryRequired<HTMLElement>("#options-label").textContent = copy.optionsLabel;
  queryRequired<HTMLElement>("#duration-label").textContent = copy.durationLabel;
  durationInput.placeholder = copy.durationPlaceholder;
  queryRequired<HTMLElement>("#duration-help").textContent = copy.durationHelp;
  queryRequired<HTMLElement>("#shortcuts-legend").textContent = copy.shortcutsLegend;
  queryRequired<HTMLElement>("#time-format-label").textContent = copy.formatLabel;
  queryRequired<HTMLOptionElement>("#time-format-12").textContent = copy.format12;
  queryRequired<HTMLOptionElement>("#time-format-24").textContent = copy.format24;
  queryRequired<HTMLElement>("#remember-label").textContent = copy.rememberLabel;
  clearButton.textContent = copy.clearButton;

  langSelect.setAttribute("aria-label", copy.languageLabel);
  langSelect.setAttribute("title", copy.languageLabel);

  setTheme(getCurrentTheme());
}

function setTheme(theme: Theme): void {
  const copy = getCopy(currentLanguage);
  const nextTheme = theme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  const isDark = nextTheme === THEME_DARK;
  const nextActionLabel = isDark ? copy.themeToLight : copy.themeToDark;
  const nextTooltip = isDark ? copy.themeTooltipLight : copy.themeTooltipDark;
  const icon = isDark ? "☀" : "☾";

  document.documentElement.setAttribute("data-theme", nextTheme);
  document.body.setAttribute("data-theme", nextTheme);
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", THEME_COLOR[nextTheme]);
  }

  themeToggle.setAttribute("aria-label", nextActionLabel);
  themeToggle.setAttribute("aria-pressed", isDark ? "false" : "true");
  themeToggle.setAttribute("data-tooltip", nextTooltip);
  themeToggle.setAttribute("title", nextActionLabel);
  themeToggleText.textContent = nextActionLabel;
  themeToggleIcon.textContent = icon;
}

function getCurrentTheme(): Theme {
  return document.body.getAttribute("data-theme") === THEME_LIGHT
    ? THEME_LIGHT
    : THEME_DARK;
}

function persistFormIfEnabled(): void {
  saveFormState({
    remember: rememberToggle.checked,
    wake: normalizeWakeTime(wakeInput.value) ?? "",
    sleep: durationInput.value.trim(),
    fmt: formatSelect.value === "24" ? "24" : "12",
  });
}

function pulseResult(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  resultCard.classList.remove("result-updated");
  void resultCard.offsetWidth;
  resultCard.classList.add("result-updated");
}

function setResult(mainText: string, metaText: string, announce = false): void {
  resultMain.textContent = mainText;
  resultMeta.textContent = metaText;
  if (announce) {
    resultLive.textContent = `${mainText} ${metaText}`;
  }
  pulseResult();
}

function setDurationValidity(isInvalid: boolean): void {
  if (isInvalid) durationInput.setAttribute("aria-invalid", "true");
  else durationInput.removeAttribute("aria-invalid");
}

function setWakeValidity(isInvalid: boolean): void {
  if (isInvalid) wakeInput.setAttribute("aria-invalid", "true");
  else wakeInput.removeAttribute("aria-invalid");
}

function updateShortcutSelection(durationRaw: string): void {
  const parsed = parseDuration(durationRaw, getCopy(currentLanguage).durationMessages);
  const selectedMinutes = parsed.ok ? parsed.minutes : null;

  shortcutButtons.forEach((button) => {
    const hours = Number(button.getAttribute("data-duration"));
    const buttonMinutes = Number.isFinite(hours) ? Math.round(hours * 60) : null;
    const isActive =
      selectedMinutes !== null &&
      buttonMinutes !== null &&
      buttonMinutes === selectedMinutes;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function updateUrlParams(wake: string, sleep: string, fmt: TimeFormat): void {
  const params = new URLSearchParams(window.location.search);
  if (wake) params.set("wake", wake);
  else params.delete("wake");

  if (sleep) params.set("sleep", sleep);
  else params.delete("sleep");

  params.set("fmt", fmt);
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

function render({ announce = false }: { announce?: boolean } = {}): void {
  const copy = getCopy(currentLanguage);
  const wakeValue = normalizeWakeTime(wakeInput.value) ?? "";
  const hasWakeInput = Boolean(wakeInput.value.trim());
  const durationValue = durationInput.value.trim();
  const use12h = formatSelect.value === "12";
  const fmt: TimeFormat = use12h ? "12" : "24";

  durationError.textContent = "";
  setWakeValidity(false);
  setDurationValidity(false);
  updateShortcutSelection(durationValue);

  if (!hasWakeInput || !durationValue) {
    setResult(copy.resultPromptMain, copy.resultPromptMeta, announce);
    updateUrlParams(wakeValue, durationValue, fmt);
    persistFormIfEnabled();
    return;
  }

  if (!wakeValue) {
    setWakeValidity(true);
    setResult(copy.invalidWakeMain, copy.invalidWakeMeta, announce);
    updateUrlParams(wakeValue, durationValue, fmt);
    persistFormIfEnabled();
    return;
  }

  const parsed = parseDuration(durationValue, copy.durationMessages);
  if (!parsed.ok) {
    setDurationValidity(true);
    durationError.textContent = parsed.error;
    setResult(copy.invalidDurationMain, copy.invalidDurationMeta, announce);
    updateUrlParams(wakeValue, durationValue, fmt);
    persistFormIfEnabled();
    return;
  }

  const { bedtimeMinutes, wakeMinutes, crossesMidnight } = computeBedtime(
    wakeValue,
    parsed.minutes,
  );

  const bedtimeText = formatTime(bedtimeMinutes, use12h, currentLanguage);
  const wakeText = formatTime(wakeMinutes, use12h, currentLanguage);
  const relativeLabel = labelRelativeDay(crossesMidnight, currentLanguage);

  setResult(
    copy.resultMain(bedtimeText),
    copy.resultMeta({
      normalized: parsed.normalized,
      bedtimeText,
      relativeLabel,
      wakeText,
    }),
    announce,
  );

  updateUrlParams(wakeValue, durationValue, fmt);
  persistFormIfEnabled();
}

function clearUiState(): void {
  const copy = getCopy(currentLanguage);
  wakeInput.value = "";
  durationInput.value = "";
  formatSelect.value = "12";
  rememberToggle.checked = false;
  durationError.textContent = "";

  resultCard.classList.remove("result-updated");
  setResult(copy.resultPromptMain, copy.resultPromptMeta, true);

  setWakeValidity(false);
  setDurationValidity(false);
  updateShortcutSelection("");
  clearFormState();
  clearUrlParams();
}

function hasFormData(): boolean {
  return Boolean(
    wakeInput.value ||
      durationInput.value.trim() ||
      formatSelect.value !== "12" ||
      rememberToggle.checked,
  );
}

function setupShortcuts(): void {
  shortcutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      durationInput.value = button.getAttribute("data-duration") ?? "";
      durationInput.focus();
      render({ announce: true });
    });
  });
}

function initializeFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const stored = restoreFormState();
  const wake = params.get("wake");
  const sleep = params.get("sleep");
  const fmt = params.get("fmt");
  const storedRemember = Boolean(stored);

  if (wake && validWakeTime(wake)) {
    wakeInput.value = wake;
  } else if (storedRemember && stored && stored.wake && validWakeTime(stored.wake)) {
    wakeInput.value = stored.wake;
  }

  if (sleep) {
    durationInput.value = sleep;
  } else if (storedRemember && stored) {
    durationInput.value = stored.sleep;
  }

  if (fmt === "12" || fmt === "24") {
    formatSelect.value = fmt;
  } else if (storedRemember && stored) {
    formatSelect.value = stored.fmt;
  } else {
    formatSelect.value = "12";
  }

  rememberToggle.checked = storedRemember;
  langSelect.value = currentLanguage;

  applyStaticCopy();
  setTheme(restoreTheme());
}

function setupEvents(): void {
  wakeInput.addEventListener("input", () => render());
  wakeInput.addEventListener("change", () => render({ announce: true }));

  durationInput.addEventListener("input", () => render());
  durationInput.addEventListener("change", () => render({ announce: true }));

  formatSelect.addEventListener("change", () => render({ announce: true }));

  langSelect.addEventListener("change", () => {
    currentLanguage = langSelect.value === "en" ? "en" : "es";
    saveLanguage(currentLanguage);
    applyStaticCopy();
    render({ announce: true });
  });

  clearButton.addEventListener("click", () => {
    if (hasFormData()) {
      const confirmed = window.confirm(getCopy(currentLanguage).clearConfirm);
      if (!confirmed) return;
    }
    clearUiState();
  });

  rememberToggle.addEventListener("change", () => {
    if (rememberToggle.checked) persistFormIfEnabled();
    else clearFormState();
  });

  themeToggle.addEventListener("click", () => {
    const next: Theme = getCurrentTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    setTheme(next);
    saveTheme(next);
  });
}

initializeFromUrl();
setupEvents();
setupShortcuts();
render({ announce: true });
