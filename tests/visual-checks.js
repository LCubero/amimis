async (page) => {
  // Run with: playwright-cli -s=amimis run-code --filename=tests/visual-checks.js
  // The caller must first open the local app. Tests use a fresh storage context.
  const context = await page.context().browser().newContext({ locale: "es-ES" });
  const app = await context.newPage();
  const errors = [];
  app.on("pageerror", (error) => errors.push(error.message));
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const openOptions = async () => {
    const options = app.locator("#calculator-options");
    if (!await options.evaluate((element) => element.open)) await options.locator("summary").click();
  };
  const baseUrl = new URL(page.url());
  baseUrl.search = "";
  baseUrl.hash = "";

  try {
    await app.goto(baseUrl.href);
    await openOptions();
    await app.locator("#lang-select").selectOption("es");
    await app.locator("#wake-time").fill("07:00");
    await app.locator("#sleep-duration").fill("7.5");
    await app.locator("#time-format").selectOption("24");
    check((await app.locator("#result-main").innerText()).includes("23:30"), "Bedtime calculation changed");
    check(new URL(app.url()).searchParams.get("sleep") === "7.5", "URL sync changed");

    await app.locator("#time-format").selectOption("12");
    check((await app.locator("#result-main").innerText()).includes("11:30"), "12-hour format changed");
    for (const duration of ["7,5", "7:30", "7h 30m"]) {
      await app.locator("#sleep-duration").fill(duration);
      check((await app.locator("#result-main").innerText()).includes("11:30"), `Parsing changed: ${duration}`);
    }
    await app.locator("#sleep-duration").fill("invalid");
    check(await app.locator("#sleep-duration").getAttribute("aria-invalid") === "true", "Invalid input not identified");
    check((await app.locator("#duration-error").innerText()).length > 0, "Missing validation message");
    await app.locator('[data-duration="8"]').click();
    check(await app.locator("#sleep-duration").inputValue() === "8", "Shortcut changed");
    check(await app.locator('[data-duration="8"]').getAttribute("aria-pressed") === "true", "Shortcut selection missing");
    check(await app.locator("#sleep-duration").getAttribute("aria-invalid") === null, "Validation did not reset");

    await app.locator("#remember-toggle").check();
    await app.reload();
    check(await app.locator("#remember-toggle").isChecked(), "Remember setting not restored");
    await app.goto(baseUrl.href);
    check(await app.locator("#wake-time").inputValue() === "07:00", "Wake time not restored without URL");
    check(await app.locator("#sleep-duration").inputValue() === "8", "Duration not restored without URL");
    await app.locator("#lang-select").selectOption("en");
    await app.reload();
    check(await app.locator("html").getAttribute("lang") === "en", "Language not persisted");
    check(await app.locator("#title").innerText() === "Sleep Time Calculator", "English heading changed");

    for (const theme of ["dark", "light"]) {
      if (await app.locator("body").getAttribute("data-theme") !== theme) {
        await app.locator("#theme-toggle").click();
      }
      await app.reload();
      check(await app.locator("body").getAttribute("data-theme") === theme, "Theme not persisted");
      await openOptions();
      for (const width of [320, 375, 768, 1280, 1920]) {
        await app.setViewportSize({ width, height: 1000 });
        const layout = await app.evaluate(() => {
          const controls = [...document.querySelectorAll("button, select, input:not([type=checkbox])")];
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            small: controls.filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.width < 44 || rect.height < 44;
            }).map((element) => element.id || element.textContent.trim()),
          };
        });
        check(!layout.overflow, `Horizontal overflow: ${theme}, ${width}px`);
        check(layout.small.length === 0, `Touch targets below 44px: ${theme}, ${width}px: ${layout.small.join(", ")}`);
        if ([375, 1280].includes(width)) {
          await app.screenshot({ path: `.playwright-cli/after-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
        }
      }
    }

    await app.locator("#wake-time").focus();
    const focusStyle = await app.locator("#wake-time").evaluate((element) => getComputedStyle(element).outlineStyle);
    check(focusStyle !== "none", "Missing keyboard focus indication");
    await app.emulateMedia({ reducedMotion: "reduce" });
    const transition = await app.locator(".result").evaluate((element) => getComputedStyle(element).transitionDuration);
    check(transition.split(",").every((duration) => parseFloat(duration) === 0), "Reduced motion not respected");

    const cancelClear = (dialog) => dialog.dismiss();
    app.once("dialog", cancelClear);
    await app.locator("#clear-btn").click();
    check(await app.locator("#sleep-duration").inputValue() === "8", "Cancel clear changed values");
    app.once("dialog", (dialog) => dialog.accept());
    await app.locator("#clear-btn").click();
    check(await app.locator("#wake-time").inputValue() === "", "Clear did not reset wake time");
    check(await app.locator("#sleep-duration").inputValue() === "", "Clear did not reset duration");
    check(!await app.locator("#remember-toggle").isChecked(), "Clear did not reset remember setting");
    check(new URL(app.url()).search === "", "Clear did not reset URL");
    await app.reload();
    check(await app.locator("#wake-time").inputValue() === "", "Clear did not remove saved values");
    check(errors.length === 0, `Browser errors: ${errors.join("; ")}`);
    return "PASS: calculations, formats, validation, shortcuts, URL, persistence, ES/EN, themes, clear, focus, reduced motion, and 10 responsive layouts.";
  } finally {
    await context.close();
  }
}
