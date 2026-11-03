async (page) => {
  const context = await page.context().browser().newContext({ locale: "en-US" });
  const app = await context.newPage();
  const url = new URL(page.url());
  url.search = "?wake=07%3A30&sleep=7.5&fmt=12";
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  try {
    await app.goto(url.href);
    const wake = app.locator("#wake-time");
    await wake.fill("07:30");
    await wake.focus();
    await wake.press("End");
    await wake.press("Backspace");
    check(await wake.inputValue() === "07:3", "Backspace must delete one minute digit, not clear the time");
    if (await wake.getAttribute("type") === "text") {
      for (const expected of ["07:", "07", "0", ""]) {
        await wake.press("Backspace");
        check(await wake.inputValue() === expected, `Backspace did not produce: ${expected}`);
      }
      const openOptions = async () => {
        const options = app.locator("#calculator-options");
        if (await options.count() && !await options.evaluate((element) => element.open)) {
          await options.locator("summary").click();
        }
      };
      await openOptions();
      await app.locator("#time-format").selectOption("24");
      for (const [input, bedtime, canonical] of [
        ["07:30", "00:00", "07:30"], ["7:30 AM", "00:00", "07:30"],
        ["7:30 pm", "12:00", "19:30"], ["12:00 AM", "16:30", "00:00"],
        ["12:00 PM", "04:30", "12:00"],
      ]) {
        await wake.fill(input);
        check((await app.locator("#result-main").innerText()).includes(bedtime), `Calculation failed for ${input}`);
        check(new URL(app.url()).searchParams.get("wake") === canonical, `URL not canonical for ${input}`);
      }
      for (const invalid of ["25:00", "7:99", "0:30 AM", "13:30 PM", "07:"]) {
        await wake.fill(invalid);
        check(await wake.getAttribute("aria-invalid") === "true", `Invalid time accepted: ${invalid}`);
        check(await wake.inputValue() === invalid, `Editing value overwritten: ${invalid}`);
      }
      await wake.fill("07:30");
      await app.locator("#remember-toggle").check();
      await app.goto(url.origin + url.pathname);
      check(await wake.inputValue() === "07:30", "Canonical saved time no longer restores");
      await openOptions();
      await app.locator("#remember-toggle").uncheck();
      await app.locator("#time-format").selectOption("12");
    }
    await app.locator("#lang-select").selectOption("es");
    await wake.fill("07:00");
    await app.locator('[data-duration="7.5"]').click();
    for (const [fmt, main, meta] of [
      ["12", "Duérmete a las 11:30 p. m.", "Si quieres dormir 7h 30m, debes dormirte a las 11:30 p. m. esta noche para levantarte mañana a las 7:00 a. m."],
      ["24", "Duérmete a las 23:30.", "Si quieres dormir 7h 30m, debes dormirte a las 23:30 esta noche para levantarte mañana a las 7:00."],
    ]) {
      const options = app.locator("#calculator-options");
      if (!await options.evaluate((element) => element.open)) await options.locator("summary").click();
      await app.locator("#time-format").selectOption(fmt);
      check(await app.locator("#result-main").innerText() === main, `Spanish result (${fmt}h) is "${await app.locator("#result-main").innerText()}"`);
      check(await app.locator("#result-meta").innerText() === meta, `Spanish detail (${fmt}h) is "${await app.locator("#result-meta").innerText()}"`);
    }
    check(await app.locator("#duration-label").innerText() === "Duración de sueño (horas)", "Spanish duration label lacks accents");
    check(await app.locator("#shortcuts-legend").innerText() === "Atajos de duración", "Spanish shortcuts legend lacks accents");
    await app.locator("#sleep-duration").fill("abc");
    check(await app.locator("#duration-error").innerText() === "Formato inválido. Usa por ejemplo 7.5, 7:30 o 7h 30m.", "Spanish format error lacks accents");
    check(await app.locator("#result-main").innerText() === "Duración inválida.", "Spanish invalid-duration result lacks accents");
    await app.locator("#time-format").selectOption("12");
    for (const language of ["en", "es"]) {
      await app.locator("#lang-select").selectOption(language);
      for (const theme of ["dark", "light"]) {
        if (await app.locator("body").getAttribute("data-theme") !== theme) await app.locator("#theme-toggle").click();
        for (const [width, height] of [[320, 667], [375, 812], [390, 844]]) {
          await app.setViewportSize({ width, height });
          await wake.fill("07:30");
          await app.locator('[data-duration="7.5"]').click();
          const options = app.locator("#calculator-options");
          if (await options.count() && await options.evaluate((element) => element.open)) await options.locator("summary").click();
          const layout = await app.evaluate(() => ({
            bottom: document.querySelector(".result").getBoundingClientRect().bottom,
            height: document.querySelector(".result").getBoundingClientRect().height,
            overflow: document.documentElement.scrollWidth > innerWidth,
            font: parseFloat(getComputedStyle(document.querySelector("#result-main")).fontSize),
          }));
          check(!layout.overflow, `Horizontal overflow ${language}/${theme}/${width}`);
          check(layout.bottom <= height, `Result below viewport: ${language}/${theme}/${width}, bottom ${layout.bottom}, viewport ${height}`);
          check(layout.height <= 180, `Result is not compact: ${language}/${theme}/${width}, ${layout.height}px`);
          check(layout.font >= 18 && layout.font <= 22, `Mobile result font not compact/readable: ${layout.font}px`);
          await app.screenshot({ path: `.playwright-cli/mobile-${language}-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
        }
      }
    }
    if (failures.length) throw new Error(failures.join("\n"));
    return "PASS: character-by-character time deletion, 12h/24h input, validation, canonical URLs/storage, and compact results inside 12 mobile viewports/themes/languages.";
  } finally {
    await context.close();
  }
}
