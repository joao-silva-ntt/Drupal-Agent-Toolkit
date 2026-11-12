# Accessibility Techniques Reference

Source: W3C WAI WCAG 2.2 Techniques, ARIA Authoring Practices Guide

Techniques here are organized by category. Each entry maps to one or more WCAG criteria.

---

## HTML Techniques

### Document structure

```html
<!-- Always set the page language (3.1.1 A) -->
<html lang="en">

<!-- Language of a different-language passage (3.1.2 AA) -->
<p>The French phrase is <span lang="fr">bonjour</span>.</p>

<!-- Descriptive, unique page title (2.4.2 A) -->
<title>Shopping Cart (3 items) — Acme Store</title>

<!-- Skip navigation link (2.4.1 A) — must be first focusable element -->
<a href="#main-content" class="skip-link">Skip to main content</a>
...
<main id="main-content">...</main>

<!-- One <h1> per page; don't skip heading levels -->
<h1>Page title</h1>
  <h2>Section</h2>
    <h3>Subsection</h3>
```

### Images

```html
<!-- Informative image: describe content/function (1.1.1 A) -->
<img src="warning.svg" alt="Warning: session will expire in 5 minutes" />

<!-- Decorative image: empty alt, no title (1.1.1 A) -->
<img src="divider.png" alt="" />

<!-- Complex image: short alt + long description -->
<img src="chart.png"
     alt="Q3 revenue chart"
     aria-describedby="chart-desc" />
<p id="chart-desc">Bar chart showing Q3 revenue of $4.2M, 12% increase from Q2...</p>

<!-- Functional image (in a link/button): describe the destination/action -->
<a href="/home"><img src="logo.png" alt="Acme Inc — Go to home page" /></a>
```

### Links

```html
<!-- Descriptive link text (2.4.4 A) -->
<!-- Bad: -->
<a href="/report.pdf">Click here</a>
<!-- Good: -->
<a href="/report.pdf">Download Q3 Annual Report (PDF, 2.4MB)</a>

<!-- When link text is short but context makes it clear, that's OK too: -->
<p>
  Read our <a href="/privacy">privacy policy</a> for more information.
</p>

<!-- Open in new tab: warn users (user expectation) -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  Example website <span class="sr-only">(opens in new tab)</span>
</a>
```

### Lists

```html
<!-- Use proper list markup for lists (1.3.1 A) -->
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>

<!-- Navigation menu is a list -->
<nav aria-label="Main">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
  </ul>
</nav>
```

### Tables

```html
<!-- Data table: use <th> for headers (1.3.1 A) -->
<table>
  <caption>Monthly sales by region</caption>
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">January</th>
      <th scope="col">February</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">North</th>
      <td>$12,000</td>
      <td>$14,500</td>
    </tr>
  </tbody>
</table>
```

Do **not** use tables for layout.

### Forms

```html
<!-- Associate label with input (1.3.1 A, 3.3.2 A) -->
<label for="email">Email address <span aria-hidden="true">*</span></label>
<input id="email" name="email" type="email" required
       aria-required="true"
       aria-describedby="email-hint email-error" />
<span id="email-hint">We'll never share your email.</span>
<span id="email-error" role="alert" hidden>
  Please enter a valid email address.
</span>

<!-- Group related fields (1.3.1 A) -->
<fieldset>
  <legend>Shipping address</legend>
  <label for="street">Street</label>
  <input id="street" type="text" />
  <label for="city">City</label>
  <input id="city" type="text" />
</fieldset>

<!-- Required fields: indicate clearly in text (not just color) (1.4.1 A, 3.3.2 A) -->
<p>Fields marked <span aria-hidden="true">*</span> <span class="sr-only">with an asterisk</span> are required.</p>

<!-- Autocomplete for personal data (1.3.5 AA) -->
<input type="text" name="name" autocomplete="name" />
<input type="email" name="email" autocomplete="email" />
<input type="tel" name="phone" autocomplete="tel" />
<input type="text" name="cc-number" autocomplete="cc-number" />
```

### Error handling

```html
<!-- After form validation failure: -->
<!-- 1. Move focus to error summary (3.3.1 A) -->
<!-- 2. List all errors as links to the relevant fields -->
<div id="error-summary" tabindex="-1" role="alert">
  <h2>Please correct 2 errors:</h2>
  <ul>
    <li><a href="#email">Email: enter a valid address</a></li>
    <li><a href="#phone">Phone: enter a 10-digit number</a></li>
  </ul>
</div>

<!-- Inline field error (3.3.1 A, 3.3.3 AA) -->
<label for="email">Email</label>
<input id="email" type="email" aria-invalid="true" aria-describedby="email-err" />
<span id="email-err" role="alert">Enter a valid email address (e.g. name@example.com)</span>
```

---

## CSS Techniques

### Color contrast (1.4.3 AA)

Minimum ratios:
- Normal text (< 18pt / < 14pt bold): **4.5:1**
- Large text (≥ 18pt / ≥ 14pt bold): **3:1**
- UI components, graphical objects, focus indicators (1.4.11): **3:1**
- Enhanced (1.4.6 AAA): 7:1 normal / 4.5:1 large

Tools: WebAIM Contrast Checker, browser DevTools accessibility inspector.

### Focus styles (2.4.7 AA, 2.4.13 AA)

```css
/* Never do this without a replacement: */
/* :focus { outline: none; } */

/* Provide a clear, high-contrast focus style */
:focus-visible {
  outline: 2px solid #0050b3;
  outline-offset: 2px;
}

/* For 2.4.13 AA compliance: focus indicator must be at least 2px and 3:1 contrast */
:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 3px;
}
```

### Reflow (1.4.10 AA)

```css
/* Use responsive units so content reflows at 320px width */
body { font-size: 1rem; }
.container { max-width: 100%; }

/* Avoid fixed widths that cause horizontal scroll */
/* Bad: */
.sidebar { width: 300px; }
/* Better: */
.sidebar { width: min(300px, 100%); }
```

### Text spacing (1.4.12 AA)

Ensure no content or functionality is lost when the user overrides:

```css
/* Don't use fixed heights on text containers */
/* Bad: */
.card { height: 80px; overflow: hidden; }
/* Better: */
.card { min-height: 80px; }
```

### Use of color (1.4.1 A)

```css
/* Don't rely on color alone — add other indicators */
/* Bad: errors shown only in red */
.error { color: red; }

/* Good: error uses color + icon + border */
.error {
  color: #d0021b;
  border-left: 4px solid #d0021b;
}
.error::before {
  content: "⚠ "; /* or use an SVG icon */
}
```

### Hide content accessibly

```css
/* Screen-reader-only utility class: visually hidden but in accessibility tree */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Don't use visibility:hidden or display:none — these hide from AT too */
/* Use sr-only when you need text for AT but not sighted users */
```

### Animation (2.3.3 AAA, and 2.3.1 A for flashing)

```css
/* Respect prefers-reduced-motion (2.3.3 AAA) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## JavaScript Techniques

### Keyboard interaction

```js
// Make a custom button keyboard-accessible (prefer <button> instead)
element.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    activateButton(element);
  }
});

// Roving tabindex pattern (for widget groups like tabs, toolbar, radiogroup)
function setActiveItem(items, newActive) {
  items.forEach(item => {
    item.tabIndex = item === newActive ? 0 : -1;
  });
  newActive.focus();
}
```

### Focus management

```js
// Open modal: save trigger, move focus to dialog
function openModal(trigger, dialog) {
  lastFocusTrigger = trigger;
  dialog.removeAttribute('hidden');
  const firstFocusable = dialog.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}

// Close modal: return focus to trigger
function closeModal(dialog) {
  dialog.setAttribute('hidden', '');
  lastFocusTrigger?.focus();
}

// Trap focus inside modal
dialog.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
  )];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
});

// SPA route change: move focus to main heading or <main>
router.on('navigate', () => {
  const heading = document.querySelector('h1') ?? document.querySelector('main');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus();
  }
});
```

### Dynamic content / live regions

```js
// Inject into a pre-existing live region (don't toggle display)
function announce(message, politeness = 'polite') {
  const region = document.querySelector(
    politeness === 'assertive' ? '[role="alert"]' : '[role="status"]'
  );
  region.textContent = '';        // clear first
  requestAnimationFrame(() => {  // then set in next frame
    region.textContent = message;
  });
}

// Usage
announce('Your changes have been saved.');
announce('Error: could not save changes.', 'assertive');
```

### Form validation

```js
// On submit, collect errors and move focus to summary
form.addEventListener('submit', (e) => {
  const errors = validateForm(form);
  if (errors.length) {
    e.preventDefault();
    renderErrorSummary(errors); // populate #error-summary
    document.getElementById('error-summary').focus();
  }
});

// Mark invalid fields
function markInvalid(input, message) {
  input.setAttribute('aria-invalid', 'true');
  const errorEl = document.getElementById(input.getAttribute('aria-errormessage'));
  if (errorEl) errorEl.textContent = message;
}
```

---

## ARIA Techniques (supplementary)

### Notifications without focus move

```html
<!-- Add to page once, near top of body; update content via JS -->
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only" id="status-region"></div>
<div role="alert" aria-live="assertive" aria-atomic="true" class="sr-only" id="alert-region"></div>
```

### Expandable widgets (2.4.3, 4.1.2)

Always reflect state in `aria-expanded`. Put it on the **trigger**, not the content.

```html
<button aria-expanded="false" aria-controls="menu-list" id="menu-btn">
  Menu
</button>
<ul id="menu-list" hidden role="list">
  ...
</ul>
```

```js
btn.addEventListener('click', () => {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!expanded));
  menu.hidden = expanded;
  if (!expanded) menu.querySelector('a, button')?.focus();
});
```

### Progress indication (4.1.3 AA)

```html
<div role="progressbar"
     aria-valuenow="60"
     aria-valuemin="0"
     aria-valuemax="100"
     aria-label="Upload progress">
  60%
</div>

<!-- Indeterminate -->
<div role="progressbar" aria-label="Loading" aria-valuetext="Loading..."></div>
```

---

## Testing checklist

Quick manual checks to run before any automated tool:

1. **Tab through the page** — can you reach every interactive element? Is focus always visible?
2. **Use Enter/Space** on all buttons/links — do they activate?
3. **Open any modal/dialog** — is focus trapped? Does Escape close it?
4. **Zoom to 200%** — does any content disappear or overlap?
5. **Check page at 320px width** — no horizontal scrollbar on main content?
6. **Disable CSS** — does reading order and structure still make sense?
7. **Run with a screen reader** — NVDA+Firefox or VoiceOver+Safari for sanity check.
8. **Run axe DevTools / WAVE** — catch the automated-detectable 30–40% of issues.
