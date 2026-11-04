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
const wakePickerToggle = queryRequired<HTMLButtonElement>("#wake-picker-toggle");
const wakeOptions = queryRequired<HTMLUListElement>("#wake-options");
const wakePicker = queryRequired<HTMLElement>(".wake-picker");
const wakeSlots = Array.from({ length: 96 }, (_, index) => {
  const minutes = index * 15;
  const value = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const option = document.createElement("li");
  option.id = `wake-option-${value.replace(":", "")}`;
  option.dataset.value = value;
  option.setAttribute("role", "option");
  wakeOptions.append(option);
  return option;
});
let activeWakeSlot = 28;

function refreshWakeOptions(): void {
  const copy = getCopy(currentLanguage);
  wakePickerToggle.setAttribute("aria-label", copy.wakePickerLabel);
  wakeOptions.setAttribute("aria-label", copy.wakeOptionsLabel);
  const value = normalizeWakeTime(wakeInput.value);
  wakeSlots.forEach((option, index) => {
    option.textContent = formatTime(index * 15, formatSelect.value === "12", currentLanguage);
    option.setAttribute("aria-selected", String(option.dataset.value === value));
  });
}

function activateWakeSlot(index: number): void {
  wakeSlots[activeWakeSlot].classList.remove("is-active");
  activeWakeSlot = Math.max(0, Math.min(95, index));
  const option = wakeSlots[activeWakeSlot];
  option.classList.add("is-active");
  wakeInput.setAttribute("aria-activedescendant", option.id);
  option.scrollIntoView({ block: "nearest" });
}

function closeWakePicker(): void {
  wakeOptions.hidden = true;
  wakeInput.setAttribute("aria-expanded", "false");
  wakePickerToggle.setAttribute("aria-expanded", "false");
  wakeInput.removeAttribute("aria-activedescendant");
}

function openWakePicker(): void {
  refreshWakeOptions();
  wakeOptions.hidden = false;
  wakeInput.setAttribute("aria-expanded", "true");
  wakePickerToggle.setAttribute("aria-expanded", "true");
  const value = normalizeWakeTime(wakeInput.value);
  const minutes = value ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : 420;
  activateWakeSlot(Math.floor(minutes / 15));
}

function selectWakeSlot(index: number, pointer: boolean): void {
  wakeInput.value = wakeSlots[index].dataset.value!;
  wakeInput.dispatchEvent(new Event("change", { bubbles: true }));
  closeWakePicker();
  if (pointer) wakePickerToggle.focus();
  else wakeInput.focus();
}

const durationInput = queryRequired<HTMLInputElement>("#sleep-duration");
const formatSelect = queryRequired<HTMLSelectElement>("#time-format");
const langToggle = queryRequired<HTMLElement>("#lang-toggle");
const languageButtons = langToggle.querySelectorAll<HTMLButtonElement>("[data-lang]");
const shortcutButtons = document.querySelectorAll<HTMLButtonElement>("[data-duration]");
const cyclesInfoToggle = queryRequired<HTMLButtonElement>("#cycles-info-toggle");
const cyclesInfo = queryRequired<HTMLElement>("#cycles-info");
const clearFieldsButton = queryRequired<HTMLButtonElement>("#clear-fields-btn");

function closeCyclesInfo(): void {
  cyclesInfoToggle.setAttribute("aria-expanded", "false");
  cyclesInfoToggle.classList.add("is-dismissed");
}

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
  wakeInput.placeholder = copy.wakePlaceholder;
  queryRequired<HTMLElement>("#duration-help").textContent = copy.durationHelp;
  queryRequired<HTMLElement>("#shortcuts-label").textContent = copy.shortcutsLegend;
  cyclesInfoToggle.setAttribute("aria-label", copy.cyclesInfoLabel);
  cyclesInfo.querySelector("p")!.textContent = copy.cyclesInfo;
  clearFieldsButton.textContent = copy.clearFields;
  clearFieldsButton.setAttribute("aria-label", copy.clearFieldsLabel);
  queryRequired<HTMLElement>("#time-format-label").textContent = copy.formatLabel;
  queryRequired<HTMLOptionElement>("#time-format-12").textContent = copy.format12;
  queryRequired<HTMLOptionElement>("#time-format-24").textContent = copy.format24;
  queryRequired<HTMLElement>("#remember-label").textContent = copy.rememberLabel;
  clearButton.textContent = copy.clearButton;

  langToggle.setAttribute("aria-label", copy.languageLabel);
  langToggle.setAttribute("title", copy.languageLabel);
  languageButtons.forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.lang === currentLanguage ? "true" : "false");
  });

  refreshWakeOptions();
  setTheme(getCurrentTheme());
}

function setTheme(theme: Theme): void {
  const copy = getCopy(currentLanguage);
  const nextTheme = theme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  const isDark = nextTheme === THEME_DARK;
  const nextActionLabel = isDark ? copy.themeToLight : copy.themeToDark;
  const nextTooltip = isDark ? copy.themeTooltipLight : copy.themeTooltipDark;
  const icon = isDark ? "sun" : "moon";

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
  themeToggleIcon.dataset.icon = icon;
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
  closeWakePicker();
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

  applyStaticCopy();
  setTheme(restoreTheme());
}

function setupEvents(): void {
  cyclesInfoToggle.addEventListener("click", () => {
    if (cyclesInfoToggle.getAttribute("aria-expanded") === "true") closeCyclesInfo();
    else {
      cyclesInfoToggle.classList.remove("is-dismissed");
      cyclesInfoToggle.setAttribute("aria-expanded", "true");
    }
  });
  for (const event of ["mouseenter", "focus"]) {
    cyclesInfoToggle.addEventListener(event, () => cyclesInfoToggle.classList.remove("is-dismissed"));
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCyclesInfo();
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && !cyclesInfoToggle.contains(event.target) && !cyclesInfo.contains(event.target)) closeCyclesInfo();
  });
  clearFieldsButton.addEventListener("click", () => {
    closeWakePicker();
    wakeInput.value = "";
    durationInput.value = "";
    render({ announce: true });
    wakeInput.focus();
  });
  wakePickerToggle.addEventListener("click", () => {
    if (wakeOptions.hidden) openWakePicker();
    else closeWakePicker();
  });
  wakeOptions.addEventListener("pointerdown", (event) => event.preventDefault());
  wakeSlots.forEach((option, index) => {
    option.addEventListener("click", () => selectWakeSlot(index, true));
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && !wakePicker.contains(event.target)) closeWakePicker();
  });
  wakeInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || (event.key === "ArrowUp" && !wakeOptions.hidden)) {
      event.preventDefault();
      if (wakeOptions.hidden) openWakePicker();
      else activateWakeSlot(activeWakeSlot + (event.key === "ArrowDown" ? 1 : -1));
    } else if (!wakeOptions.hidden && event.key === "Enter") {
      event.preventDefault();
      selectWakeSlot(activeWakeSlot, false);
    } else if (!wakeOptions.hidden && (event.key === "Escape" || event.key === "Tab")) {
      if (event.key === "Escape") event.preventDefault();
      closeWakePicker();
    }
  });
  wakeInput.addEventListener("input", () => {
    render();
    refreshWakeOptions();
  });
  wakeInput.addEventListener("change", () => render({ announce: true }));

  durationInput.addEventListener("input", () => render());
  durationInput.addEventListener("change", () => render({ announce: true }));

  formatSelect.addEventListener("change", () => {
    refreshWakeOptions();
    render({ announce: true });
  });

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentLanguage = button.dataset.lang === "en" ? "en" : "es";
      saveLanguage(currentLanguage);
      applyStaticCopy();
      render({ announce: true });
    });
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
