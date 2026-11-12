---
name: atomic-design
argument-hint: "Describe the component hierarchy or reuse/composition problem (atom/molecule/organism/template/page)"
description: >
  Methodology and best practices for organising UI components using the Atomic Design system
  (atoms, molecules, organisms, templates, pages). Use this skill when the request is about
  component hierarchy decisions, reuse-first decomposition, design-system structure, or choosing
  the right atomic level for a UI change. For Drupal, apply Atomic Design
  through the component system already used by the project.
  Trigger phrases: "atomic design", "atoms", "molecules", "organisms", "templates", "pages",
  "component hierarchy", "design system structure", "component library", "Brad Frost",
  "component composition", "ui architecture", "create component", "new component", "add component",
  "implement design", "figma", "frontend component", "sdc", "twig component", "paragraph type",
  "drupal frontend".
---

# Atomic Design Workflow

Before substantial project work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json`; use them to identify the actual theme, component
system, paths, and commands. Do not assume SDC is installed or preferred.

# Atomic Design

Brad Frost's methodology that decomposes UIs into five hierarchical levels for consistent, reusable component libraries.

In this codebase, apply these principles to Drupal SDC components under `web/themes/custom/[theme_name]/components/`.
For detailed SDC metadata and Twig-runtime constraints, pair this skill with `drupal-sdc-components`
and `drupal-sdc-styleguide-safe`.

## Do Not Use When

- The task is a small in-place style or copy edit that does not involve component decomposition or hierarchy decisions.
- The request is purely operational (build/deploy/config import) with no UI architecture concern.
- A narrower domain skill should lead (for example `drupal-search-ui-ajax` for Select2 AJAX regressions).

---

## ⚠️ Reuse First — Always

Before creating any component, scan the existing codebase for a matching one:

1. Search `atoms/`, `molecules/`, `organisms/` for a component that already does the job (exact match or close enough to extend).
2. If one exists, **use or extend it** — do not duplicate it.
3. If a similar one exists but needs a new variant, **add the variant** to the existing component via an input/prop.
4. Only create a new component when nothing suitable exists.

This applies at every level. A new organism that needs a button must use the existing `Button` atom, not inline a `<button>` with ad-hoc styles.

---

## The Five Levels

### 1. Atoms
Smallest, indivisible UI units with no dependencies on other components.

**Rules:**
- Fully self-contained — no stores, APIs, or context.
- Accept only primitive props (strings, numbers, booleans, callbacks).
- Fully accessible (ARIA roles, keyboard navigation, focus management).
- No layout side-effects (no `margin`, no `position: absolute` that bleeds outside).
- Style via design tokens only — never hard-code colours or spacing values.
- `Button` atoms must default `type` to `"button"` to prevent accidental form submissions.
- Links with `target="_blank"` must include `rel="noopener noreferrer"`.

#### Standard Atom Catalogue

These atoms must exist in every design system. Check for them first; create them if missing.

| Atom | Notes |
|------|-------|
| `Heading` | Renders `h1`–`h6`; accepts `level` + `size` as separate inputs so visual size and semantic level can differ. |
| `Title` | Short single-line label used inside cards, modals, sections. Usually `<p>` or `<span>`. |
| `Description` | Body/supporting text block. Handles multi-line, wrapping. |
| `Button` | Variants: `primary`, `secondary`, `ghost`, `danger`. States: `disabled`, `loading`. Default `type="button"`. |
| `Link` | Wraps `<a>`; inputs for `href`, `target`, `rel`. Forces `rel="noopener noreferrer"` when `target="_blank"`. |
| `Icon` | Renders an SVG icon by name/path. Accepts `size` and `color` (via token). Always `aria-hidden` when decorative; requires `aria-label` when standalone. |
| `Badge` | Small status or count indicator. Variants: `neutral`, `success`, `warning`, `error`. |
| `Tag` | Dismissible or static label chip. Accepts `label` and optional `onDismiss`. |
| `Input` | Text input. Inputs: `type`, `placeholder`, `disabled`, `error`, `value`. Does **not** include its own label — pair with `Label` in a `FormField` molecule. |
| `Label` | `<label>` element associated via `for`/`htmlFor`. |
| `Checkbox` | Controlled; emits change event. Indeterminate state supported. |
| `Radio` | Always used in a group; parent organism/molecule manages group state. |
| `ProgressBar` | Accepts `value` (0–100) and optional `label`. Uses `role="progressbar"` and `aria-valuenow`. |
| `Spinner` | Indeterminate loading indicator. `aria-label` required. |
| `Avatar` | Image or initials fallback. Accepts `src`, `alt`, `size`. |

### 2. Molecules
Simple, purposeful combinations of atoms that form one functional unit.

**Rules:**
- Composed of atoms (and other molecules only when necessary).
- Single responsibility — one job per molecule.
- May receive callbacks but must not own side-effectful logic (no API calls, no routing).
- Prefer controlled components; lift state to the parent.

#### Standard Molecule Catalogue

These molecules cover the most common UI patterns. Reuse before creating new ones.

| Molecule | Atoms used | Notes |
|----------|-----------|-------|
| `SearchBar` | `Input` + `Button` + `Icon` | Emits `search` event; parent handles filtering. |
| `FormField` | `Label` + `Input` + `Description` + error `Description` | Wires `for`/`id`; shows validation message. |
| `Accordion` | `Heading`/`Button` + `Icon` (chevron) | Controlled open/close state lifted to parent. Each panel is a separate instance. |
| `Dropdown` | `Button` + list of `Link`/`Button` items + `Icon` | Manages open state internally; closes on outside click or Escape. Accessible via `role="menu"` / `role="menuitem"`. |
| `FilterChip` | `Tag` + `Icon` | A selectable tag for filter UI. Emits `select`/`deselect`. |
| `FilterBar` | Multiple `FilterChip` + optional `Button` (clear) | Group of filters; parent manages active state. |
| `AvatarWithName` | `Avatar` + `Title` + optional `Description` | User identity block. |
| `Pagination` | `Button` (prev/next) + page number `Button`s | Emits `pageChange`; parent owns current page. |
| `Breadcrumb` | `Link` items + `Icon` (separator) | Renders `nav` + `aria-label="Breadcrumb"` + `aria-current="page"` on last item. |
| `Tooltip` | Wraps any atom; shows `Description` on hover/focus | Positioned via CSS; no JS layout library needed. |

### 3. Organisms
Complex, standalone UI sections assembled from molecules and atoms.

**Examples:** `Header` (Logo + NavLinks + SearchBar + Avatar), `ProductCard` (Image + Title + Price + Button), `DataTable`, `FilterPanel` (FilterBar + results count)

**Rules:**
- May connect to context (theme, i18n, auth) but must not call APIs directly.
- Responsible for layout of their children.
- Must be independently testable in isolation (e.g., Storybook with mocked context).

### 4. Templates
Page-level skeletons that define structure without real content.

**Examples:** `DashboardTemplate`, `AuthTemplate`, `ListDetailTemplate`

**Rules:**
- Receive slot props or children — never hard-code content.
- Define grid, spacing, and responsive breakpoints.
- Must not import business logic, stores, or API clients.

### 5. Pages
Template instances wired to real data and state/API layers.

**Examples:** `DashboardPage`, `LoginPage`, `ProductDetailPage`

**Rules:**
- Only level allowed to call APIs, access global stores, or read route params.
- Keep thin: fetch → transform → pass to template.

---

## Dependency Rule

```
Pages → Templates → Organisms → Molecules → Atoms
```

Lower levels must **never** import higher levels.

---

## Folder Structure

```
web/themes/custom/[theme_name]/components/
  atoms/
    button/
      button.component.yml
      button.twig
      button.css
  molecules/
    form-field/
      form-field.component.yml
      form-field.twig
      form-field.css
  organisms/
  templates/
```

Use stack-appropriate discovery/export conventions:
- Drupal SDC: keep metadata, Twig, and assets in the component directory.
- Framework codebases: use the local component export/discovery convention (barrels where applicable).

---

## Key Rules Summary

| Topic | Rule |
|-------|------|
| Reuse | Search existing components before creating. Extend via variant inputs before splitting. |
| Naming | Atoms: `PascalCase` noun. Templates: `+ Template`. Pages: `+ Page`. |
| Tokens | Use CSS custom properties (`var(--color-primary)`), never raw values. |
| Accessibility | WCAG 2.2 AA minimum; focus traps in organisms (modals, drawers). |
| Testing | Prefer role/accessible-name assertions over class names. |
| Storybook | `title` mirrors hierarchy: `Atoms/Button`, `Molecules/SearchBar`, etc. |

---

## Common Mistakes to Avoid

| Mistake | Correct approach |
|---------|-----------------|
| Creating a component that already exists | Search first; reuse or extend |
| API call inside an atom or molecule | Move to a page-level hook; pass data as props |
| Organism imports from a page | Never — atoms/molecules/organisms must not know about pages |
| Single mega-component | Decompose: identify the atom → molecule → organism boundary |
| Hard-coded colours / spacing | Use design tokens (`var(--color-primary)`) |
| Inline `<button>` in a molecule/organism | Use the `Button` atom |
| Missing component discoverability wiring | Follow stack conventions (SDC metadata for Drupal, exports/barrels where relevant) |
| Template that fetches its own data | Templates are layout only; pages provide data |
| Skipping tests for molecules | Every molecule and above needs automated coverage appropriate to the stack |

---

## Checklist for a New Component

- [ ] Searched for an existing component to reuse or extend
- [ ] Identified the correct level (atom / molecule / organism / template / page)
- [ ] Placed in the correct folder
- [ ] Uses design tokens for all visual values
- [ ] No upward imports (atoms don't import molecules, etc.)
- [ ] Fully accessible (ARIA, keyboard, focus)
- [ ] Has render + interaction coverage via the stack's test tooling
- [ ] Registered/discoverable via the stack's component mechanism
