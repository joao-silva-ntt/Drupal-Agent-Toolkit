# Accessibility Audit Checklist

Source: W3C WAI Easy Checks, WCAG 2.2

Use this for a first-pass page audit. It doesn't replace a full WCAG evaluation but quickly surfaces
the most common barriers.

---

## Before you start

**Tools to have open:**
- Browser DevTools (F12) with Accessibility inspector
- [axe DevTools](https://www.deque.com/axe/devtools/) browser extension (free tier is sufficient to start)
- [WAVE](https://wave.webaim.org/) — paste in a URL for a visual report
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- A keyboard (no mouse)

**Understand the scope:** Are you auditing against AA (the usual target) or a different level?

---

## 1. Page title (WCAG 2.4.2 — A)

**Check:** Does the browser tab show a meaningful, unique title for this page?

- Describes the page content specifically
- Different from other pages on the site
- "Front-loaded": important info first, site name last

**Good:** `Shopping Cart (3 items) — Acme Store`<br>
**Bad:** `Acme Store — Welcome`

---

## 2. Image alt text (WCAG 1.1.1 — A)

**Check:** Every image has an `alt` attribute; the value is appropriate.

| Image type | Correct alt |
|---|---|
| Informative | Describes what the image shows or communicates |
| Functional (in a link/button) | Describes the action/destination |
| Decorative | `alt=""` (empty) |
| Complex (chart, diagram) | Short alt + longer description nearby |
| Image of text | Repeat the text in alt |

**How to check:** In DevTools, find `<img>` tags. Or in WAVE, look for red "missing alt text" icons.

---

## 3. Headings (WCAG 1.3.1 — A, 2.4.6 — AA)

**Check:** Headings create a logical, hierarchical outline.

- One `<h1>` per page, reflecting the main topic
- Heading levels don't skip (e.g., don't jump from `<h2>` to `<h4>`)
- Headings describe the content that follows — not just decorative
- Visual heading = actual heading element (not a styled `<div>`)

**How to check:** Browser extensions like WAVE or HeadingsMap show the outline.

---

## 4. Color contrast (WCAG 1.4.3 — AA)

**Check:** Text is readable against its background.

| Text size | Required ratio (AA) |
|---|---|
| Normal text (< 18pt / < 14pt bold) | 4.5:1 |
| Large text (≥ 18pt or ≥ 14pt bold) | 3:1 |
| UI components, focus indicators | 3:1 (1.4.11) |

**How to check:** Use WebAIM Contrast Checker or DevTools color picker. axe catches most contrast failures automatically.

---

## 5. Resize text (WCAG 1.4.4 — AA)

**Check:** Zoom to 200% — does content reflow? Is anything truncated, overlapping, or missing?

- No horizontal scrollbar on main content (WCAG 1.4.10)
- Text is still readable; nothing gets cut off
- Interactive elements still usable

**How to check:** `Ctrl/Cmd +` until 200%. Or set browser text size to "Largest".

---

## 6. Keyboard access (WCAG 2.1.1 — A)

**Check:** Every interactive element reachable and operable by keyboard alone.

1. Press `Tab` to step through the page — every button, link, form field, and custom widget should receive focus.
2. Press `Enter` on links, `Enter` or `Space` on buttons — do they activate?
3. No keyboard traps — pressing `Tab` repeatedly eventually leaves every component.
4. Tab order follows a logical visual/reading order.

**Red flags:** Custom `<div>` or `<span>` elements acting as buttons/links without `tabindex="0"` and keyboard handlers. Focus jumping unexpectedly.

---

## 7. Focus visibility (WCAG 2.4.7 — AA, 2.4.13 — AA)

**Check:** When you Tab through the page, can you always see where focus is?

- Focus ring is clearly visible against the background
- No `outline: none` without a proper visible replacement
- Focus indicator has ≥ 2px width and ≥ 3:1 contrast (2.4.13)

**Red flag:** After tabbing, you lose track of focus entirely.

---

## 8. Forms, labels, and errors (WCAG 1.3.1, 3.3.1, 3.3.2 — A)

**Check:** Every form input has a visible, programmatically associated label.

- `<label for="id">` paired with `<input id="id">`
- OR `aria-label` / `aria-labelledby` on the input
- Placeholder text alone is NOT a label
- Related fields grouped with `<fieldset>` + `<legend>`

**Errors:**
- Error messages in text (not just color or icon)
- `aria-invalid="true"` on invalid fields
- Error messages linked via `aria-describedby`
- Error summary with links to each affected field

---

## 9. Language of page (WCAG 3.1.1 — A)

**Check:** `<html>` has a `lang` attribute with the correct language code.

```html
<html lang="en">      <!-- English -->
<html lang="fr">      <!-- French -->
<html lang="pt-BR">   <!-- Brazilian Portuguese -->
```

Also check: foreign-language passages in the page have `lang` on their element (3.1.2 AA).

---

## 10. Page structure / landmarks (WCAG 1.3.1 — A, 2.4.1 — A)

**Check:** Page uses semantic landmarks.

- `<main>` wraps the primary content
- `<nav>` for navigation menus (label multiple navs with `aria-label`)
- `<header>` / `<footer>` for site header/footer
- Skip navigation link as the first focusable element
- `<h1>` matches page title

---

## 11. Moving / flashing content (WCAG 2.2.2 — A, 2.3.1 — A)

**Check:**

- Any auto-playing animation that lasts > 5 seconds has pause/stop controls
- Nothing flashes more than 3 times per second
- Carousels/sliders have accessible play/pause controls

---

## 12. Video / audio (WCAG 1.2.x)

| Media type | Requirement | Level |
|---|---|---|
| Pre-recorded video with audio | Captions | A |
| Pre-recorded video | Audio description or text alt | A |
| Pre-recorded audio-only | Transcript | A |
| Live video with audio | Live captions | AA |
| Pre-recorded video | Audio description | AA |

---

## 13. Run automated tools

After manual checks, run:

1. **axe DevTools** (browser extension) — catches ~30-40% of WCAG issues automatically. Zero false positives.
2. **WAVE** (wave.webaim.org or extension) — visual overlay, good for spotting structural issues.
3. **Lighthouse** (Chrome DevTools > Lighthouse tab) — accessibility score + list of issues.

Automated tools only catch a fraction of issues. Always combine with manual keyboard testing and
ideally some screen reader testing.

---

## Quick screen reader testing

| Platform | Screen reader | Browser |
|---|---|---|
| Windows | NVDA (free) | Firefox |
| Windows | JAWS | Chrome or Edge |
| macOS / iOS | VoiceOver (built-in) | Safari |
| Android | TalkBack (built-in) | Chrome |

**Minimal test:** Tab through the page listening to what is announced. Every element should have a meaningful name. Forms should announce labels. Errors should be readable. Images should have descriptions.

---

## Conformance levels: quick guide

| Target | When |
|---|---|
| Level A | Absolute minimum; nothing should be below this |
| Level AA | Standard target for most websites and legal compliance |
| Level AAA | Where feasible; not required for whole sites |

Legal requirements vary by jurisdiction, sector, and applicable standard;
verify the rule that applies to the site rather than treating this checklist as
legal advice. Use the project profile for its conformance target.
