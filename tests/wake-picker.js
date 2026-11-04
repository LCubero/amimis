async (page) => {
  const context = await page.context().browser().newContext({ locale: "es-ES" });
  const app = await context.newPage();
  const failures = [];
  const errors = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  app.on("pageerror", error => errors.push(error.message));
  try {
    const url = new URL(page.url());
    url.search = "?wake=07:00&sleep=8&fmt=12";
    await app.goto(url.href);
    const wake = app.locator("#wake-time");
    const toggle = app.locator("#wake-picker-toggle");
    const list = app.locator("#wake-options");
    const open = async () => {
      await toggle.click();
      check(await list.isVisible(), "List not visible");
      check(await wake.getAttribute("aria-expanded") === "true" && await toggle.getAttribute("aria-expanded") === "true", "Expanded states");
    };
    await open();
    check(await list.locator('[role="option"]').count() === 96, "96 slots");
    check(await wake.getAttribute("aria-activedescendant") === "wake-option-0700", "Initial active slot");
    check(await list.locator('[aria-selected="true"]').count() === 1, "Exact selection");
    const before = await app.locator("#result-main").innerText();
    await list.locator('[data-value="07:30"]').click();
    check(await wake.inputValue() === "07:30" && !await list.isVisible(), "Pointer selection");
    check(await toggle.evaluate(el => el === document.activeElement), "Pointer focus must avoid keyboard");
    check(await wake.getAttribute("aria-expanded") === "false" && await toggle.getAttribute("aria-expanded") === "false", "Closed states");
    check(await app.locator("#result-main").innerText() !== before && new URL(app.url()).searchParams.get("wake") === "07:30", "Committed result and URL");
    await app.evaluate(() => { window.pickerSubmits = 0; document.querySelector("form").addEventListener("submit", e => { e.preventDefault(); window.pickerSubmits++; }); });
    await wake.press("ArrowDown");
    check(await list.isVisible(), "Keyboard opens");
    const active = await wake.getAttribute("aria-activedescendant");
    await wake.press("ArrowDown");
    check(await wake.getAttribute("aria-activedescendant") !== active, "Arrow moves");
    await wake.press("Enter");
    check(await wake.inputValue() === "07:45" && !await list.isVisible(), "Keyboard selection");
    check(await wake.evaluate(el => el === document.activeElement), "Keyboard focus");
    check(await app.evaluate(() => window.pickerSubmits) === 0, "Enter submitted form");
    for (const dismiss of [async () => wake.press("Escape"), async () => app.locator("#title").click(), async () => wake.press("Tab")]) {
      await wake.press("ArrowDown");
      await dismiss();
      check(!await list.isVisible() && await wake.inputValue() === "07:45", "Dismiss changed value or stayed open");
    }
    await wake.fill("7:10");
    check(!await list.isVisible() && new URL(app.url()).searchParams.get("wake") === "07:10", "Typing preservation");
    await open();
    check(await wake.getAttribute("aria-activedescendant") === "wake-option-0700" && await list.locator('[aria-selected="true"]').count() === 0, "Floor slot without selection");
    await wake.press("Escape");
    await app.locator("#calculator-options summary").click();
    const oldLabel = await list.locator('[data-value="07:30"]').textContent();
    await app.locator("#time-format").selectOption("24");
    check(await list.locator('[data-value="07:30"]').textContent() !== oldLabel, "Format refresh");
    await app.locator('[data-lang="en"]').click();
    check(await toggle.getAttribute("aria-label") === "Choose time from list" && await list.getAttribute("aria-label") === "Suggested times", "English labels");
    const box = await toggle.boundingBox();
    check(box.width >= 44 && box.height >= 44, "44px toggle");
    await app.setViewportSize({ width: 320, height: 667 });
    for (const theme of ["dark", "light"]) {
      if (await app.locator("body").getAttribute("data-theme") !== theme) await app.locator("#theme-toggle").click();
      await open();
      check(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow ${theme}`);
      await wake.press("Escape");
    }
    check(errors.length === 0, errors.join("\n"));
    if (failures.length) throw new Error(failures.join("\n"));
    return "PASS: wake picker pointer/keyboard, free typing, canonical updates, labels, touch targets and both mobile themes; no page errors.";
  } finally {
    await context.close();
  }
}
