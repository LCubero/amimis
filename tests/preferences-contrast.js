async (page) => {
  // Run with: playwright-cli -s=amimis run-code --filename=tests/preferences-contrast.js
  const context = await page.context().browser().newContext({ locale: "en-US", colorScheme: "light" });
  const baseUrl = new URL(page.url());
  baseUrl.search = "";
  baseUrl.hash = "";
  let app = await context.newPage();
  const failures = [];
  const measurements = [];
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  const openOptions = async () => {
    const options = app.locator("#calculator-options");
    if (!await options.evaluate((element) => element.open)) await options.locator("summary").click();
  };

  const measure = async (state) => {
    const results = await app.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const rgba = (color) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].map((value, index) => index === 3 ? value / 255 : value);
      };
      const over = (front, back) => [
        ...front.slice(0, 3).map((channel, index) => channel * front[3] + back[index] * (1 - front[3])), 1,
      ];
      const backgrounds = (element) => {
        if (!element) return [[255, 255, 255, 1]];
        const style = getComputedStyle(element);
        const color = rgba(style.backgroundColor);
        let samples = color[3] === 1 ? [color] : backgrounds(element.parentElement).map((back) => over(color, back));
        const stops = style.backgroundImage.match(/color\(srgb[^)]+\)|rgba?\([^)]+\)/g);
        if (stops) samples = stops.flatMap((stop) => samples.map((back) => over(rgba(stop), back)));
        return samples;
      };
      const luminance = (color) => color.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      const ratio = (a, b) => {
        const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (values[0] + 0.05) / (values[1] + 0.05);
      };
      const results = [];
      const record = (name, color, samples, minimum) => results.push({
        name,
        ratio: Math.min(...samples.map((background) => ratio(over(rgba(color), background), background))),
        minimum,
      });
      const selectors = [
        "#title", "#intro", "#wake-label", "#duration-label", "#duration-help", "#duration-error",
        "#shortcuts-legend", "#time-format-label", "#remember-label", "#wake-time", "#sleep-duration",
        "#time-format", "#lang-toggle button", "#theme-toggle", "#clear-btn", "#result-main", "#result-meta",
        "#signature-link", "#options-label", ".shortcuts button",
      ];
      for (const selector of selectors) {
        for (const element of document.querySelectorAll(selector)) {
          if (!element.getClientRects().length) continue;
          record(selector, getComputedStyle(element).color, backgrounds(element), 4.5);
        }
      }
      for (const input of document.querySelectorAll("#wake-time, #sleep-duration")) {
        record(`placeholder: ${input.id}`, getComputedStyle(input, "::placeholder").color, backgrounds(input), 4.5);
      }
      for (const element of document.querySelectorAll("input:not([type=checkbox]), select, button")) {
        if (!element.getClientRects().length) continue;
        const style = getComputedStyle(element);
        // Filled selected chips use their background, not their border, as the boundary.
        const boundary = element.matches(".is-active") ? style.backgroundColor : style.borderTopColor;
        record(`control boundary: ${element.id || element.textContent.trim()}`, boundary, backgrounds(element.parentElement), 3);
        if (element.matches(":focus-visible")) {
          record(`focus: ${element.id}`, style.outlineColor, backgrounds(element.parentElement), 3);
        }
      }
      return results;
    });
    measurements.push(...results.map((result) => ({ state, ...result })));
    failures.push(...results.filter((result) => result.ratio < result.minimum).map((result) =>
      `${state}: ${result.name} = ${result.ratio.toFixed(2)}:1 (requires ${result.minimum}:1)`));
  };

  try {
    await app.goto(baseUrl.href);
    for (const language of ["es", "en"]) {
      for (const theme of ["light", "dark"]) {
        await app.locator(`[data-lang="${language}"]`).click();
        if (await app.locator("body").getAttribute("data-theme") !== theme) {
          await app.locator("#theme-toggle").click();
        }
        check(!await app.locator("#remember-toggle").isChecked(), "Preferences should not require remembering form values");
        await app.reload();
        check(await app.locator("html").getAttribute("lang") === language, `Language lost on reload: ${language}`);
        check(await app.locator(`[data-lang="${language}"]`).getAttribute("aria-pressed") === "true", "Language toggle out of sync");
        check(await app.locator("body").getAttribute("data-theme") === theme, `Theme lost on reload: ${theme}`);
        check(await app.locator("html").getAttribute("data-theme") === theme, "Root theme out of sync");
        await app.locator("#wake-time").fill("07:00");
        await app.locator('[data-duration="8"]').click();
        await openOptions();
        app.once("dialog", (dialog) => dialog.accept());
        await app.locator("#clear-btn").click();
        await app.close();
        app = await context.newPage();
        await app.goto(baseUrl.href);
        check(await app.locator("html").getAttribute("lang") === language, "Clear/reopening tab lost language");
        check(await app.locator("body").getAttribute("data-theme") === theme, "Clear/reopening tab lost theme");
        check(await app.locator("#wake-time").inputValue() === "", "Form values persisted without remember");
      }
    }

    // Disable transitions so measurements and captures describe settled UI states.
    await app.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of ["dark", "light"]) {
      if (await app.locator("body").getAttribute("data-theme") !== theme) {
        await app.locator("#theme-toggle").click();
      }
      for (const width of [375, 1280]) {
        await app.setViewportSize({ width, height: 1000 });
        await openOptions();
        await app.locator("#wake-time").fill("07:00");
        await app.locator('[data-duration="8"]').click();
        await app.locator("#wake-time").focus();
        await measure(`${theme}/${width}/selected+focus`);
        await app.locator("#clear-btn").hover();
        await measure(`${theme}/${width}/hover`);
        await app.locator("#sleep-duration").fill("invalid");
        await measure(`${theme}/${width}/error`);
        await app.screenshot({ path: `.playwright-cli/contrast-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
      }
    }
    console.log(JSON.stringify({ measurements, failures }));
    check(failures.length === 0, failures.join("\n"));
    return `PASS: ES/EN and light/dark preferences survive reload, clear and reopening tabs without remembering form values; ${measurements.length} contrast measurements pass (text 4.5:1, boundaries/focus 3:1).`;
  } finally {
    await context.close();
  }
}
