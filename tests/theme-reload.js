async (page) => {
  const url = new URL(page.url());
  url.search = "";
  const results = [];
  const palette = {
    light: { background: "rgb(242, 246, 250)", text: "rgb(28, 37, 47)", card: "rgb(255, 255, 255)", icon: "moon", visibleIcon: "moon", glyph: "" },
    dark: { background: "rgb(14, 20, 25)", text: "rgb(228, 237, 245)", card: "rgb(22, 32, 40)", icon: "sun", visibleIcon: "sun", glyph: "" },
  };
  for (const system of ["dark", "light"]) {
    const context = await page.context().browser().newContext({ colorScheme: system });
    const app = await context.newPage();
    try {
      await app.goto(url.href);
      for (const selected of ["light", "dark"]) {
        if (await app.locator("body").getAttribute("data-theme") !== selected) await app.locator("#theme-toggle").click();
        for (const stage of ["before reload", "after reload"]) {
          if (stage === "after reload") await app.reload();
          const actual = await app.evaluate(() => ({
            rootTheme: document.documentElement.dataset.theme,
            bodyTheme: document.body.dataset.theme,
            background: getComputedStyle(document.body).backgroundColor,
            text: getComputedStyle(document.body).color,
            card: getComputedStyle(document.querySelector("form")).backgroundColor,
            colorScheme: getComputedStyle(document.documentElement).colorScheme,
            icon: document.querySelector(".theme-icon").dataset.icon,
            visibleIcon: [...document.querySelectorAll(".theme-icon svg")]
              .filter((svg) => svg.getClientRects().length > 0)
              .map((svg) => svg.dataset.icon)
              .join(","),
            glyph: document.querySelector(".theme-icon").textContent.trim(),
          }));
          for (const [key, expected] of Object.entries({ ...palette[selected], rootTheme: selected, bodyTheme: selected, colorScheme: selected })) {
            if (actual[key] !== expected) throw new Error(`${system}/${selected}/${stage}: ${key} is ${actual[key]}, expected ${expected}`);
          }
          results.push({ system, selected, stage, ...actual });
        }
        await app.screenshot({ path: `.playwright-cli/theme-${system}-${selected}-reload.png`, fullPage: true, animations: "disabled" });
      }
    } finally {
      await context.close();
    }
  }
  return { verdict: "PASS: actual light/dark palettes remain consistent across reload with both system preferences in clean Chromium.", results };
}
