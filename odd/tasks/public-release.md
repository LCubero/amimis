# Public release preparation
Resolve the open roadmap items, refresh the repository for public visibility, and leave deploy and APK for later user-led steps.
Branch: `chore/public-release` from `6ab4428`; small reviewable commits; push, visibility change, deploy and merge remain user decisions.

## Specs

- S1 — RH-W-0001 resolution: "ese 0001 ya estaba resuelto era mi extension de darkreader. solucionado". Close it in the roadmap and remove the open known-issue wording from docs.
- S2 — RH-W-0002: "0002 eso hazlo". Revalidate the dependency advisories, apply the smallest fix, and keep typecheck, build and the four browser scripts passing.
- S3 — Repository review: "revisar el repo ver como venismo si todo ok". Run the project checks and confirm nothing private or secret would become public.
- S4 — Docs: "actualizar docu, el readme". Keep README in Spanish and update docs alongside behavior.
- S5 — Screenshots: "unas cuantas al final, para el repo con 1 o 3 y de esas 3 hago 1, tu relax, si puedes si no lo hago yo". Add 1 to 3 screenshots at the end of the README.
- S6 — License: "que me recomiendas, a mi me da igual, mientras pueda usarla quiza en futuro para publicar el app  de mobiles y que tenga algun ingreso, publi o algo. yo feliz". Recommended and applied: MIT for the app.
- S7 — Public GitHub: "poner ghithub publico con licencia". Changing visibility is a publication step; ask before running it.
- S8 — Deploy: "esto cuando llegue el momento mi rey, y yo te tengo todo tu relax me dices y te indico, cuando ya se vaya a hacer". Deferred until the user gives the deploy steps.
- S10 — Spanish copy fix approved: "dale dale". Restore accents/ñ in Spanish UI text and avoid the doubled period after "a. m."/"p. m.".
- S9 — APK: "luego ver lo del apk". Deferred; not part of this change.

## Tasks

- T1 [S1,S4] route=inline status=done commit=12edf0c — Close RH-W-0001 and update the docs that mention it.
- T2 [S2,S3] route=inline status=done commit=8ec4a83 — Fix the dependency advisories and rerun all checks.
- T3 [S3] route=inline status=done commit=none (read-only audit) — Run a secret/private-state audit of tracked files and history.
- T4 [S4,S6] route=inline status=done commit=e7a6dc4 — Add the MIT LICENSE and update the license references.
- T5 [S4,S5] route=inline status=done commit=a85d2e3 — Refresh the README and add screenshots.
- T9 [S10] route=inline status=done commit=97dc6d7 — RED observed (Duermete/manana/p. m..), GREEN after fix; all four browser scripts pass.
- T6 [S7] route=user-gate status=pending commit= — Push and make the repository public after explicit confirmation.
- T7 [S8] route=deferred status=pending commit= — Deploy once the user provides the steps.
- T8 [S9] route=deferred status=pending commit= — APK exploration later.

## Log

L1 — Original request: "ese 0001 ya estaba resuelto era mi extension de darkreader. solucionado
0002 eso hazlo ya que es revisar el repo ver como venismo si todo ok xq quiero, actualizar docu, el readme, screenshots, poner ghithub publico con licencia,  deployar para actualizar la página online, luego ver lo del apk"
L2 — Answers: license "que me recomiendas, a mi me da igual, mientras pueda usarla quiza en futuro para publicar el app  de mobiles y que tenga algun ingreso, publi o algo. yo feliz"; deploy "esto cuando llegue el momento mi rey, y yo te tengo todo tu relax me dices y te indico, cuando ya se vaya a hacer"; screenshots "unas cuantas al final, para el repo con 1 o 3 y de esas 3 hago 1, tu relax, si puedes si no lo hago yo".
L3 — Evidence: GitHub repo LCubero/amimis is PRIVATE with homepage https://ld9.dev/amimis/ (Cloudflare). npm audit: 6 vulnerabilities (1 low, 5 high) in vite 7.3.1, postcss, source-map-js and others; vite 7.3.7 is in range.
L4 — T2: npm audit fix changed only package-lock.json (vite 7.3.7, postcss 8.5.32, source-map-js 1.2.2); audit 0 vulnerabilities; typecheck, build and the four browser scripts PASS. First background run hung because the wait loop polled 127.0.0.1 while Vite listened on localhost (::1); stopped and rerun bounded.
L5 — T3: 12 commits scanned; no tokens, keys or .env. Historic .agents/.claude third-party skills and a harmless .claude/settings.local.json were removed in 3b67f51; no history rewrite needed.
L6 — User approved the Spanish copy fix: "dale dale".
